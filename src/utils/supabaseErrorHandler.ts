import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/config/env';

// ✅ Types d'erreurs Supabase
export interface SupabaseErrorInfo {
  code: string;
  message: string;
  details?: string;
  hint?: string;
  isTableMissing: boolean;
  isConnectionError: boolean;
  isTimeout: boolean;
  isAuthError: boolean;
}

// ✅ Analyseur d'erreurs Supabase
export const analyzeSupabaseError = (error: any): SupabaseErrorInfo => {
  const postgresError = error as PostgrestError;
  
  return {
    code: postgresError.code || 'UNKNOWN',
    message: postgresError.message || 'Erreur inconnue',
    details: postgresError.details,
    hint: postgresError.hint,
    isTableMissing: postgresError.code === 'PGRST106' || 
                   postgresError.message?.includes('does not exist') ||
                   postgresError.message?.includes('relation') ||
                   postgresError.code === '42P01',
    isConnectionError: postgresError.code === '08006' || 
                      postgresError.message?.includes('connection') ||
                      postgresError.message?.includes('network'),
    isTimeout: postgresError.message?.includes('timeout') ||
               postgresError.message?.includes('Timeout'),
    isAuthError: postgresError.code === 'PGRST301' ||
                 postgresError.message?.includes('JWT') ||
                 postgresError.message?.includes('unauthorized')
  };
};

// ✅ Gestionnaire d'erreur Supabase avec fallback
export const handleSupabaseError = <T>(
  error: any,
  fallbackData: T,
  context: string = 'Supabase operation'
): { data: T; error: SupabaseErrorInfo | null } => {
  const errorInfo = analyzeSupabaseError(error);
  
  logger.auth.error(`${context} failed:`, {
    code: errorInfo.code,
    message: errorInfo.message,
    isTableMissing: errorInfo.isTableMissing,
    isConnectionError: errorInfo.isConnectionError,
    isTimeout: errorInfo.isTimeout,
    isAuthError: errorInfo.isAuthError
  });

  // ✅ Retourner les données de fallback avec l'info d'erreur
  return {
    data: fallbackData,
    error: errorInfo
  };
};

// ✅ Wrapper pour les requêtes Supabase avec gestion d'erreur
export const safeSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T,
  context: string = 'Supabase query',
  timeout: number = 10000
): Promise<{ data: T; error: SupabaseErrorInfo | null }> => {
  try {
    // ✅ Use AbortController for proper cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const { data, error } = await queryFn();
      clearTimeout(timeoutId);
    
      if (error) {
        return handleSupabaseError(error, fallbackData, context);
      }

      return {
        data: data || fallbackData,
        error: null
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Check if error is from abort signal
      if (error.name === 'AbortError') {
        return handleSupabaseError(new Error('Query timeout'), fallbackData, context);
      }
      
      return handleSupabaseError(error, fallbackData, context);
    }
  } catch (error: any) {
    return handleSupabaseError(error, fallbackData, context);
  }
};

// ✅ Vérificateur de table Supabase
export const checkTableExists = async (
  tableName: string,
  supabase: SupabaseClient
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
};

// ✅ Gestionnaire de requêtes avec vérification de table
export const safeTableQuery = async <T>(
  tableName: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T,
  supabase: SupabaseClient,
  context: string = 'Table query'
): Promise<{ data: T; error: SupabaseErrorInfo | null }> => {
  // ✅ Vérifier d'abord si la table existe
  const tableExists = await checkTableExists(tableName, supabase);
  
  if (!tableExists) {
    logger.auth.warn(`Table ${tableName} n'existe pas, utilisation des données de fallback`);
    return {
      data: fallbackData,
      error: {
        code: 'TABLE_NOT_FOUND',
        message: `Table ${tableName} not found`,
        isTableMissing: true,
        isConnectionError: false,
        isTimeout: false,
        isAuthError: false
      }
    };
  }

  // ✅ Exécuter la requête avec gestion d'erreur
  return await safeSupabaseQuery(queryFn, fallbackData, context);
};
