import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef, useMemo } from 'react';
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
  role: 'client' | 'admin' | 'livreur' | 'store_manager';
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
  isRole: (allowedRoles: string[]) => boolean;
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
  
  // ✅ CORRECTION : Utiliser useRef pour éviter les re-renders
  const isInitialized = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ FONCTION UTILITAIRE POUR VÉRIFIER LES RÔLES
  const isRole = useCallback((allowedRoles: string[]): boolean => {
    if (!profile) return false;
    return allowedRoles.includes(profile.role);
  }, [profile]);

  // ✅ CORRECTION : fetchProfile avec useCallback stable et dépendances correctes
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
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
  }, []);

  // ✅ CORRECTION : redirectBasedOnRole avec useCallback stable
  const redirectBasedOnRole = useCallback((userProfile: Profile | null, isSigningIn = false) => {
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
    
    // ✅ CORRECTION : Redirection directe sans useCallback imbriqué
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    
    redirectTimeoutRef.current = setTimeout(() => {
      window.location.href = targetDashboard;
    }, 100);
  }, []);

  // ✅ CORRECTION : useEffect avec gestion propre des dépendances
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Vérifier session existante
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        console.log('🔍 Checking existing session:', !!existingSession);
        
        if (mounted) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
          
          if (existingSession?.user) {
            const userProfile = await fetchProfile(existingSession.user.id);
            if (userProfile && mounted) {
              redirectBasedOnRole(userProfile, false);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', { event, session: !!session });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const userProfile = await fetchProfile(session.user.id);
            if (userProfile && mounted) {
              redirectBasedOnRole(userProfile, event === 'SIGNED_IN');
            }
          } catch (error) {
            console.error('❌ Error handling auth state change:', error);
          }
        } else {
          setProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Initialiser l'authentification
    if (!isInitialized.current) {
      isInitialized.current = true;
      initializeAuth();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [fetchProfile, redirectBasedOnRole]);

  const signUp = useCallback(async (email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: string }) => {
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
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
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
  }, []);

  const signOut = useCallback(async () => {
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
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
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
  }, [user]);

  // ✅ CORRECTION : Valeur du contexte stable avec useMemo
  const contextValue = useMemo(() => ({
    user, 
    session, 
    profile, 
    loading, 
    signUp, 
    signIn, 
    signOut, 
    updateProfile,
    isRole
  }), [user, session, profile, loading, signUp, signIn, signOut, updateProfile, isRole]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};