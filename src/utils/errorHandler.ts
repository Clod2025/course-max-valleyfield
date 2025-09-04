import { AuthError } from '@supabase/supabase-js';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
};

// Fonction pour nettoyer les données d'entrée
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
};

// Fonction de retry avec backoff exponentiel - NE PAS RETRY LES ERREURS 400
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = defaultRetryOptions
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Si c'est une erreur 400 (identifiants invalides), ne pas retry
      if (error.status === 400) {
        throw error;
      }
      
      // Si ce n'est pas une erreur 429 ou si c'est le dernier essai, on lève l'erreur
      if (error.status !== 429 || attempt === options.maxRetries) {
        throw error;
      }
      
      // Calcul du délai avec backoff exponentiel
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );
      
      console.log(`Tentative ${attempt + 1} échouée (429), retry dans ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Gestion spécifique des erreurs Supabase Auth
export const getAuthErrorMessage = (error: AuthError | Error | any): string => {
  // Erreur 400 - Identifiants invalides
  if (error?.status === 400 || 
      error?.code === 'invalid_credentials' ||
      error?.message?.includes('Invalid login credentials') ||
      error?.message?.includes('Email not confirmed')) {
    return 'Email ou mot de passe incorrect. Vérifiez vos identifiants.';
  }
  
  // Erreur 429 - Trop de requêtes
  if (error?.status === 429 || error?.code === 'too_many_requests') {
    return 'Le serveur est temporairement saturé, veuillez réessayer dans quelques instants';
  }
  
  // Erreur de réseau
  if (error?.message?.includes('fetch') || 
      error?.message?.includes('network') ||
      error?.message?.includes('Failed to fetch')) {
    return 'Erreur de connexion, vérifiez votre connexion internet et réessayez';
  }
  
  // Erreur email déjà utilisé
  if (error?.message?.includes('already been registered') ||
      error?.code === 'user_already_exists') {
    return 'Cette adresse email est déjà utilisée';
  }
  
  // Erreur mot de passe trop faible
  if (error?.message?.includes('Password should be') ||
      error?.code === 'weak_password') {
    return 'Le mot de passe doit contenir au moins 6 caractères';
  }

  // Erreur de confirmation email
  if (error?.code === 'email_not_confirmed') {
    return 'Veuillez confirmer votre email avant de vous connecter';
  }
  
  // Message par défaut
  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
};

// Logger centralisé pour les erreurs
export const logError = (error: any, context: string) => {
  console.group(`🚨 Erreur ${context}`);
  console.error('Message:', error?.message);
  console.error('Status:', error?.status);
  console.error('Code:', error?.code);
  console.error('Stack:', error?.stack);
  console.error('Objet complet:', error);
  console.groupEnd();
};

// Wrapper pour les appels API avec gestion d'erreur
export const safeApiCall = async <T>(
  apiCall: () => Promise<{ data: T | null; error: any }>,
  context: string,
  options: RetryOptions = defaultRetryOptions
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const result = await retryWithBackoff(apiCall, options);
    if (result.error) {
      logError(result.error, context);
      return { 
        data: null, 
        error: getAuthErrorMessage(result.error) 
      };
    }
    return { data: result.data, error: null };
  } catch (error: any) {
    logError(error, context);
    return { 
      data: null, 
      error: getAuthErrorMessage(error) 
    };
  }
};