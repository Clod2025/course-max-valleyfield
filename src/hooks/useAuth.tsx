import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/errorHandler';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  avatar_url?: string;
  role: 'client' | 'admin' | 'driver' | 'merchant' | 'livreur' | 'store_manager'; // ✅ TOUS LES RÔLES POSSIBLES
  is_active: boolean;
  store_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  isRole: (allowedRoles: string[]) => boolean; // ✅ NOUVELLE FONCTION UTILITAIRE
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ FONCTION UTILITAIRE POUR VÉRIFIER LES RÔLES
  const isRole = (allowedRoles: string[]): boolean => {
    if (!profile) return false;
    return allowedRoles.includes(profile.role);
  };

  // Fetch user profile avec gestion d'erreur robuste
  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        throw error;
      }
      
      console.log('✅ Profile fetched:', data);
      setProfile(data as Profile);
      return data as Profile;
    } catch (error: any) {
      console.error('❌ Profile fetch failed:', error);
      logError(error, 'Récupération du profil utilisateur');
      return null;
    }
  };

  // ✅ LOGIQUE DE REDIRECTION ULTRA-ROBUSTE
  const redirectBasedOnRole = (userProfile: Profile | null, isSigningIn = false) => {
    console.log('🔄 Redirect check:', { 
      userProfile, 
      isSigningIn, 
      currentPath: window.location.pathname 
    });
    
    if (!userProfile) {
      console.log('❌ No profile, skipping redirect');
      return;
    }

    const currentPath = window.location.pathname;
    console.log('📍 Current path:', currentPath);
    console.log('👤 User role:', userProfile.role);
    
    // ✅ MAPPING ULTRA-COMPLET DE TOUS LES RÔLES POSSIBLES
    const roleToDashboard: Record<string, string> = {
      // Rôles principaux (nouveaux)
      'client': '/dashboard/client',
      'merchant': '/dashboard/marchand',
      'driver': '/dashboard/livreur',
      'admin': '/dashboard/admin',
      
      // Rôles anciens (compatibilité)
      'livreur': '/dashboard/livreur',
      'store_manager': '/dashboard/marchand',
      
      // Rôles avec majuscules (au cas où)
      'Client': '/dashboard/client',
      'Merchant': '/dashboard/marchand',
      'Marchand': '/dashboard/marchand',
      'Driver': '/dashboard/livreur',
      'Livreur': '/dashboard/livreur',
      'Admin': '/dashboard/admin',
      'ADMIN': '/dashboard/admin',
      'CLIENT': '/dashboard/client',
      'MERCHANT': '/dashboard/marchand',
      'DRIVER': '/dashboard/livreur'
    };

    const targetDashboard = roleToDashboard[userProfile.role];
    
    if (!targetDashboard) {
      console.log('❌ Unknown role:', userProfile.role);
      console.log('Available roles:', Object.keys(roleToDashboard));
      window.location.href = '/auth/unauthorized';
      return;
    }

    // ✅ Ne pas rediriger si déjà sur le bon dashboard
    if (currentPath === targetDashboard) {
      console.log('✅ Already on correct dashboard, skipping redirect');
      return;
    }

    // ✅ Rediriger depuis ces pages spécifiques
    const shouldRedirect = isSigningIn || 
      currentPath === '/' || 
      currentPath === '/home' || 
      currentPath === '/login' || 
      currentPath === '/register' ||
      currentPath.startsWith('/dashboard'); // ✅ Rediriger même si sur mauvais dashboard

    if (!shouldRedirect) {
      console.log('❌ Not redirecting from this page:', currentPath);
      return;
    }

    console.log('🚀 Redirecting to:', targetDashboard);
    console.log('🎯 Redirection reason:', isSigningIn ? 'SIGN_IN' : 'ROLE_CHECK');
    
    // ✅ Redirection immédiate et forcée
    setTimeout(() => {
      window.location.href = targetDashboard;
    }, 100);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', { event, session: !!session });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // ✅ Délai pour éviter les conflits
          setTimeout(async () => {
            const userProfile = await fetchProfile(session.user.id);
            if (userProfile) {
              // ✅ REDIRECTION FORCÉE APRÈS CONNEXION
              redirectBasedOnRole(userProfile, event === 'SIGNED_IN');
            }
          }, 300);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Vérifier session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Checking existing session:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(userProfile => {
          if (userProfile) {
            redirectBasedOnRole(userProfile, false);
          }
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: userData?.first_name || '',
            last_name: userData?.last_name || '',
            role: userData?.role || 'client'
          }
        }
      });
      
      return { error };
    } catch (error: any) {
      logError(error, 'Inscription utilisateur');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (error: any) {
      logError(error, 'Connexion utilisateur');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Supprimer la session Supabase
      await supabase.auth.signOut();
      
      // Nettoyer l'état local
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Redirection sécurisée vers la page Home
      window.location.href = '/home';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer quand même la redirection
      window.location.href = '/home';
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      return { error: null };
    } catch (error: any) {
      logError(error, 'Mise à jour du profil');
      return { error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      signUp, 
      signIn, 
      signOut, 
      updateProfile,
      isRole // ✅ NOUVELLE FONCTION UTILITAIRE
    }}>
      {children}
    </AuthContext.Provider>
  );
};