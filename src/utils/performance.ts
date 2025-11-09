import { useMemo } from 'react';
import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

type CacheEntry<T> = {
  value: T;
  expiresAt: number | null;
};

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = typeof ttl === 'number' && ttl > 0 ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiresAt });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();

type PerformanceEvent = {
  label: string;
  duration: number;
  meta?: Record<string, unknown>;
};

type PerformanceListener = (event: PerformanceEvent) => void;

class PerformanceMonitor {
  private marks = new Map<string, number>();
  private listeners = new Set<PerformanceListener>();

  private now(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  addListener(listener: PerformanceListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: PerformanceListener): void {
    this.listeners.delete(listener);
  }

  start(label: string): void {
    this.marks.set(label, this.now());
  }

  end(label: string, meta?: Record<string, unknown>): void {
    const startTime = this.marks.get(label);
    if (startTime === undefined) return;

    const duration = this.now() - startTime;
    this.marks.delete(label);
    this.record(label, duration, meta);
  }

  record(label: string, duration: number, meta?: Record<string, unknown>): void {
    const event: PerformanceEvent = { label, duration, meta };
    this.listeners.forEach((listener) => listener(event));

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`, meta ?? '');
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

const keyToString = (key: QueryKey): string => {
  try {
    return JSON.stringify(key);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Failed to stringify query key', key, error);
    }
    return String(key);
  }
};

type OptimizedQueryOptions<TData, TError> = UseQueryOptions<TData, TError> & {
  /**
   * TTL in milliseconds for the custom cache layer (optional).
   * When provided, results are memoized outside React Query.
   */
  cacheTTL?: number;
  /**
   * Custom label used for performance measurements. Defaults to the query key string.
   */
  measureLabel?: string;
};

export function useOptimizedQuery<
  TData,
  TError = unknown,
>(
  key: QueryKey,
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData, TError>,
): UseQueryResult<TData, TError> {
  const cacheKey = useMemo(() => keyToString(key), [key]);
  const {
    cacheTTL,
    measureLabel,
    staleTime = 5 * 60 * 1000,
    gcTime = 10 * 60 * 1000,
    retry = 1,
    ...rest
  } = options ?? {};

  const optimizedQueryFn = useMemo(() => {
    return async () => {
      if (cacheTTL) {
        const cachedValue = cacheManager.get<TData>(cacheKey);
        if (cachedValue !== null) {
          return cachedValue;
        }
      }

      const label = measureLabel ?? cacheKey;
      performanceMonitor.start(label);

      try {
        const result = await queryFn();

        if (cacheTTL) {
          cacheManager.set(cacheKey, result, cacheTTL);
        }

        performanceMonitor.end(label, {
          cached: false,
          cacheKey,
        });

        return result;
      } catch (error) {
        performanceMonitor.end(measureLabel ?? cacheKey, {
          cached: false,
          cacheKey,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
  }, [cacheKey, cacheTTL, measureLabel, queryFn]);

  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: optimizedQueryFn,
    staleTime,
    gcTime,
    retry,
    ...rest,
  });
}

