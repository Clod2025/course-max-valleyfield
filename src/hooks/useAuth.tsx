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
  type_compte?: 'Client' | 'Marchand' | 'Livreur' | 'Admin';
  type_marchand?: 'Supermarché' | 'Pharmacie' | 'Restaurant' | 'Épicerie';
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
        console.error('❌ Error fetching profile by id:', error);
        
        // Fallback: essayer de récupérer par email si l'utilisateur existe
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          console.log('🔄 Trying to fetch profile by email:', userData.user.email);
          const { data: emailData, error: emailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userData.user.email)
            .single();
          
          if (emailError) {
            console.error('❌ Error fetching profile by email:', emailError);
            throw error; // Lancer l'erreur originale
          }
          
          console.log('✅ Profile fetched by email:', emailData);
          
          // ✅ CORRECTION : Appliquer la logique de correction pour les profils récupérés par email
          if (emailData && emailData.role === 'store_manager' && (!emailData.type_compte || !emailData.type_marchand)) {
            console.log('🔧 Fixing legacy merchant profile (email fetch):', emailData.email);
            
            // Déterminer le type de marchand selon l'email
            let merchantType = 'Supermarché'; // Par défaut
            if (emailData.email === 'clovensyohan2020@gmail.com') {
              merchantType = 'Pharmacie';
            } else if (emailData.email === 'biduellodieujuste2@gmail.com') {
              merchantType = 'Restaurant';
            } else if (emailData.email === 'epicerie.marchand@gmail.com') {
              merchantType = 'Épicerie';
            }
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                role: 'store_manager',
                type_compte: 'Marchand',
                type_marchand: merchantType
              })
              .eq('id', emailData.id);

            if (updateError) {
              console.error('❌ Error updating legacy profile (email fetch):', updateError);
              console.log('🔄 Using fallback: returning corrected profile data locally');
              // Fallback: retourner les données corrigées localement même si la mise à jour DB échoue
              const updatedProfile = {
                ...emailData,
                role: 'store_manager',
                type_compte: 'Marchand',
                type_marchand: merchantType
              };
              return updatedProfile as Profile;
            } else {
              console.log('✅ Legacy profile updated successfully (email fetch) for:', merchantType);
              // Retourner les données mises à jour
              const updatedProfile = {
                ...emailData,
                role: 'store_manager',
                type_compte: 'Marchand',
                type_marchand: merchantType
              };
              return updatedProfile as Profile;
            }
          }
          
          return emailData as Profile;
        }
        
        throw error;
      }
      
      console.log('✅ Profile fetched:', data);
      console.log('🔍 Profile check:', {
        hasData: !!data,
        role: data?.role,
        type_compte: data?.type_compte,
        type_marchand: data?.type_marchand,
        shouldFix: data && data.role === 'store_manager' && (!data.type_compte || !data.type_marchand)
      });
      
      // ✅ CORRECTION : Mettre à jour les profils existants avec role 'store_manager' mais sans type_compte
      if (data && data.role === 'store_manager' && (!data.type_compte || !data.type_marchand)) {
        console.log('🔧 Fixing legacy merchant profile:', data.email);
        
        // Déterminer le type de marchand selon l'email
        let merchantType = 'Supermarché'; // Par défaut
        if (data.email === 'clovensyohan2020@gmail.com') {
          merchantType = 'Pharmacie';
        } else if (data.email === 'biduellodieujuste2@gmail.com') {
          merchantType = 'Restaurant';
        } else if (data.email === 'epicerie.marchand@gmail.com') {
          merchantType = 'Épicerie';
        }
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'store_manager',
            type_compte: 'Marchand',
            type_marchand: merchantType
          })
          .eq('id', data.id);

        if (updateError) {
          console.error('❌ Error updating legacy profile:', updateError);
        } else {
          console.log('✅ Legacy profile updated successfully for:', merchantType);
          // Retourner les données mises à jour
          const updatedProfile = {
            ...data,
            role: 'store_manager',
            type_compte: 'Marchand',
            type_marchand: merchantType
          };
          setProfile(updatedProfile as Profile);
          return updatedProfile as Profile;
        }
      }
      
      setProfile(data as Profile);
      return data as Profile;
    } catch (error: any) {
      console.error('❌ Profile fetch failed:', error);
      logError(error, 'Récupération du profil utilisateur');
      return null;
    }
  }, []);

  // ✅ CORRECTION : redirectBasedOnRole avec user dans useRef pour éviter la boucle
  const userRef = useRef(user);
  userRef.current = user;
  
  const redirectBasedOnRole = useCallback((userProfile: Profile | null, isSigningIn = false) => {
    console.log('🔄 Redirect check:', { 
      userProfile: !!userProfile,
      role: userProfile?.role,
      type_compte: userProfile?.type_compte,
      type_marchand: userProfile?.type_marchand,
      isSigningIn, 
      currentPath: window.location.pathname 
    });
    
    if (!userProfile) {
      console.log('❌ No profile, skipping redirect');
      return;
    }

    // Vérifier si l'email est confirmé - utiliser userRef au lieu de user direct
    if (userRef.current && !userRef.current.email_confirmed_at) {
      console.log('⚠️ Email not confirmed, redirecting to confirmation page');
      window.location.href = '/signup-confirmation';
      return;
    }

    const currentPath = window.location.pathname;
    console.log('📍 Current path:', currentPath);
    console.log('👤 User role:', userProfile.role);
    
    // ✅ LOGIQUE SPÉCIALISÉE POUR LES MARCHANDS
    let targetDashboard = '';
    
      console.log('🔍 Checking merchant logic:', {
        role: userProfile.role,
        type_compte: userProfile.type_compte,
        isStoreManager: userProfile.role === 'store_manager',
        isMerchant: userProfile.role === 'store_manager',
        isMarchand: userProfile.type_compte === 'Marchand'
      });
    
    if (userProfile.role === 'store_manager' || userProfile.type_compte === 'Marchand') {
      // Redirection selon le type de marchand
      console.log('🏪 Merchant type:', userProfile.type_marchand);
      switch (userProfile.type_marchand) {
        case 'Pharmacie':
          targetDashboard = '/interface-pharmacie';
          break;
        case 'Restaurant':
          targetDashboard = '/interface-restaurant';
          break;
        case 'Épicerie':
          targetDashboard = '/interface-epicerie';
          break;
        case 'Supermarché':
        default:
          targetDashboard = '/dashboard/marchand';
          break;
      }
      console.log('🎯 Target dashboard for merchant:', targetDashboard);
    } else {
      // ✅ MAPPING POUR LES AUTRES RÔLES
      const roleToDashboard: Record<string, string> = {
        // Rôles principaux (nouveaux)
        'client': '/dashboard/client',
        'driver': '/dashboard/livreur',
        'admin': '/dashboard/admin',
        
        // Rôles anciens (compatibilité)
        'livreur': '/dashboard/livreur',
        'store_manager': '/dashboard/marchand',
        
        // Rôles avec majuscules (au cas où)
        'Client': '/dashboard/client',
        'Driver': '/dashboard/livreur',
        'Livreur': '/dashboard/livreur',
        'Admin': '/dashboard/admin',
        'ADMIN': '/dashboard/admin',
        'CLIENT': '/dashboard/client',
        'DRIVER': '/dashboard/livreur'
      };

      targetDashboard = roleToDashboard[userProfile.role] || '/dashboard/client';
      console.log('🎯 Target dashboard for other role:', targetDashboard);
    }
    
    if (!targetDashboard) {
      console.log('❌ Unknown role:', userProfile.role);
      window.location.href = '/auth/unauthorized';
      return;
    }

    // ✅ Ne pas rediriger si déjà sur le bon dashboard
    console.log('🔍 Checking if already on correct dashboard:', { currentPath, targetDashboard });
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

    console.log('🔍 Should redirect check:', { 
      isSigningIn, 
      currentPath, 
      shouldRedirect,
      conditions: {
        isSigningIn,
        isHome: currentPath === '/',
        isHomePage: currentPath === '/home',
        isLogin: currentPath === '/login',
        isRegister: currentPath === '/register',
        isDashboard: currentPath.startsWith('/dashboard')
      }
    });

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
            console.log('📋 Profile fetched:', userProfile);
            if (userProfile && mounted) {
              console.log('🔄 Calling redirectBasedOnRole with:', { 
                role: userProfile.role, 
                type_compte: userProfile.type_compte, 
                type_marchand: userProfile.type_marchand,
                isSigningIn: event === 'SIGNED_IN'
              });
              redirectBasedOnRole(userProfile, event === 'SIGNED_IN');
            } else {
              console.log('❌ No profile or component unmounted');
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