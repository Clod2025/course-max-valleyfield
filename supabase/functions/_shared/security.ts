import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration CORS sécurisée
export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Gestion du preflight CORS
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

// Réponse JSON standardisée
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Réponse d'erreur standardisée
export function errorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Interface pour le résultat d'authentification
interface AuthResult {
  user: any;
  profile?: any;
  supabase: any;
}

interface AuthError {
  errorResponse: Response;
}

// Fonction de vérification d'authentification
export async function requireUser(
  req: Request,
  options?: { requireAdmin?: boolean }
): Promise<AuthResult | AuthError> {
  try {
    // 1. Extraire le token Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return {
        errorResponse: errorResponse('Authorization header manquant', 401),
      };
    }

    // 2. Créer le client Supabase avec la service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return {
        errorResponse: errorResponse('Configuration serveur manquante', 500),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // 3. Vérifier le token JWT et récupérer l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return {
        errorResponse: errorResponse('Session invalide ou expirée', 401),
      };
    }

    // 4. Si admin requis, vérifier le rôle
    if (options?.requireAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return {
          errorResponse: errorResponse('Impossible de vérifier les permissions', 500),
        };
      }

      if (!profile || profile.role !== 'admin') {
        return {
          errorResponse: errorResponse('Accès refusé - Privilèges admin requis', 403),
        };
      }

      return { user, profile, supabase };
    }

    // 5. Retourner l'utilisateur authentifié
    return { user, supabase };
  } catch (error) {
    console.error('Unexpected error in requireUser:', error);
    return {
      errorResponse: errorResponse('Erreur serveur inattendue', 500),
    };
  }
}