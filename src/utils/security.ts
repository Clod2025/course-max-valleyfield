import { supabase } from '@/integrations/supabase/client';

type SessionData = Record<string, unknown>;

class SecureSessionManager {
  private storageKey: string;
  private encryptionKey: CryptoKey | null = null;

  constructor(storageKey = 'coursemax_secure_session') {
    this.storageKey = storageKey;
  }

  private async getKey(): Promise<CryptoKey> {
    if (this.encryptionKey) return this.encryptionKey;

    const rawKey = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(import.meta.env.VITE_SECURITY_SECRET || 'coursemax-secret'),
    );

    this.encryptionKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );

    return this.encryptionKey;
  }

  private async encrypt(data: string): Promise<string> {
    const key = await this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    const cipherText = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    const buffer = new Uint8Array(iv.byteLength + cipherText.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(cipherText), iv.byteLength);

    return btoa(String.fromCharCode(...buffer));
  }

  private async decrypt(payload: string): Promise<string | null> {
    try {
      const key = await this.getKey();
      const buffer = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
      const iv = buffer.slice(0, 12);
      const cipherText = buffer.slice(12);

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherText);
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('SecureSessionManager decrypt error', error);
      }
      return null;
    }
  }

  async set(data: SessionData): Promise<void> {
    const payload = JSON.stringify({
      data,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });

    const encrypted = await this.encrypt(payload);
    localStorage.setItem(this.storageKey, encrypted);
  }

  async get<T = SessionData>(): Promise<T | null> {
    const payload = localStorage.getItem(this.storageKey);
    if (!payload) return null;

    const decrypted = await this.decrypt(payload);
    if (!decrypted) return null;

    try {
      const parsed = JSON.parse(decrypted) as { data: T; userAgent: string };
      const currentUA = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
      if (parsed.userAgent !== currentUA) {
        await this.clear();
        return null;
      }

      return parsed.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('SecureSessionManager parse error', error);
      }
      return null;
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }
}

export const secureSessionManager = new SecureSessionManager();

type AuditLogLevel = 'info' | 'warning' | 'error' | 'critical';

interface AuditLogEntry {
  action: string;
  level: AuditLogLevel;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

class AuditLogger {
  async log(entry: AuditLogEntry): Promise<void> {
    const metadata = {
      ...entry.metadata,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('[Audit Log]', { entry, metadata });
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const merchantId = user?.id ?? null;

      const {
        table_name: metadataTableName,
        record_id: metadataRecordId,
        employee_id: metadataEmployeeId,
        old_values: metadataOldValues,
        ip_address: metadataIpAddress,
        ip: metadataIp,
        user_agent: metadataUserAgent,
        ...restMetadata
      } = metadata ?? {};

      const insertPayload = {
        merchant_id: merchantId,
        employee_id: metadataEmployeeId ? String(metadataEmployeeId) : null,
        action: entry.action,
        table_name: (metadataTableName as string) || 'system',
        record_id: metadataRecordId ? String(metadataRecordId) : null,
        old_values: (metadataOldValues as Record<string, unknown>) ?? null,
        new_values: entry.details
          ? { ...entry.details, level: entry.level, metadata: restMetadata }
          : { level: entry.level, metadata: restMetadata },
        ip_address: (metadataIpAddress as string) || (metadataIp as string) || null,
        user_agent:
          (metadataUserAgent as string) ||
          (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      };

      const { error } = await supabase.from('audit_log').insert(insertPayload);
      if (error) throw error;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('AuditLogger failed', error);
      }
    }
  }
}

export const auditLogger = new AuditLogger();

class InputValidator {
  sanitizeString(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/[<>"'`;()]/g, (char) => `&#${char.charCodeAt(0)};`);
  }

  sanitizeObject<T extends Record<string, unknown>>(payload: T): T {
    return Object.keys(payload).reduce((acc, key) => {
      const value = payload[key];
      acc[key] = typeof value === 'string' ? this.sanitizeString(value) : value;
      return acc;
    }, {} as T);
  }

  validateEmail(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  validatePassword(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return value.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(value);
  }
}

export const inputValidator = new InputValidator();

type ThreatLevel = 'low' | 'medium' | 'high';

interface ThreatDetails {
  type: string;
  level: ThreatLevel;
  context?: Record<string, unknown>;
}

class ThreatDetector {
  detectAnomaly(action: string, context?: Record<string, unknown>): ThreatDetails | null {
    if (action.includes('sql') || action.includes('drop table')) {
      return { type: 'sql_injection', level: 'high', context };
    }

    if (context?.ip && typeof context.ip === 'string' && context.ip.startsWith('192.0')) {
      return { type: 'suspicious_ip', level: 'medium', context };
    }

    return null;
  }
}

export const threatDetector = new ThreatDetector();

class SecurityGuard {
  constructor(
    private readonly sessionManager: SecureSessionManager,
    private readonly logger: AuditLogger,
    private readonly detector: ThreatDetector,
  ) {}

  async guardAction(
    action: string,
    callback: () => Promise<unknown>,
    context?: Record<string, unknown>,
  ): Promise<unknown> {
    const threat = this.detector.detectAnomaly(action, context);
    if (threat) {
      await this.logger.log({
        action,
        level: threat.level === 'high' ? 'critical' : 'warning',
        details: threat,
      });

      if (threat.level === 'high') {
        throw new Error('Action bloquée pour raisons de sécurité.');
      }
    }

    const result = await callback();

    await this.logger.log({
      action,
      level: 'info',
      metadata: context,
    });

    return result;
  }

  async clearSession(): Promise<void> {
    await this.sessionManager.clear();
  }
}

export const securityGuard = new SecurityGuard(
  secureSessionManager,
  auditLogger,
  threatDetector,
);

