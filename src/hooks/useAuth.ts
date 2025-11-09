import { useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role?: string;
  type_marchand?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface UseAuthReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    userData?: { first_name?: string; last_name?: string; role?: string; type_marchand?: string }
  ) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  isRole: (roles: string[]) => boolean;
}

const isSessionValid = (session: Session | null) =>
  !!session?.user && !!session?.access_token && session.expires_at! * 1000 > Date.now();

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<Profile | null>(null);
  const profilePromiseRef = useRef<Promise<Profile | null> | null>(null);
  const initializedRef = useRef(false);

  const setProfileState = useCallback(
    (value: Profile | null | ((prev: Profile | null) => Profile | null)) => {
      setProfile(prev => {
        const next = typeof value === 'function' ? (value as (prev: Profile | null) => Profile | null)(prev) : value;
        profileRef.current = next;
        return next;
      });
    },
    []
  );

  // 🔹 Chargement du profil depuis Supabase
  const loadProfile = useCallback(
    async (userId: string) => {
      const currentProfile = profileRef.current;
      if (currentProfile?.user_id === userId) return currentProfile;
      if (profilePromiseRef.current) return profilePromiseRef.current;

      const loadPromise = (async () => {
        try {
          const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
          if (error) {
            console.error('❌ Erreur chargement profil:', error);
            setProfileState(null);
            return null;
          }
          if (!data) {
            console.warn('⚠️ Aucun profil trouvé pour l’utilisateur', userId);
            setProfileState(null);
            return null;
          }
          const loadedProfile = data as Profile;
          setProfileState(loadedProfile);
          return loadedProfile;
        } catch (err) {
          console.error('❌ Exception chargement profil:', err);
          setProfileState(null);
          return null;
        } finally {
          profilePromiseRef.current = null;
        }
      })();

      profilePromiseRef.current = loadPromise;
      return loadPromise;
    },
    [setProfileState]
  );

  const handleSession = useCallback(
    async (session: Session | null) => {
      if (!isSessionValid(session)) {
        await supabase.auth.signOut();
        setUser(null);
        setProfileState(null);
        return;
      }
      setUser(session!.user);
      await loadProfile(session!.user.id);
    },
    [loadProfile, setProfileState]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!isSessionValid(session)) {
          setUser(null);
          setProfileState(null);
          return;
        }

        setUser(session!.user);
        await loadProfile(session!.user.id);
      } catch (err) {
        console.error('❌ Erreur initAuth:', err);
        setUser(null);
        setProfileState(null);
      } finally {
        setLoading(false);
      }
    };

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
          if (session?.user) await handleSession(session);
          setLoading(false);
          break;
        case 'SIGNED_OUT':
          setUser(null);
          setProfileState(null);
          setLoading(false);
          break;
        case 'TOKEN_REFRESHED':
          if (session?.user) setUser(session.user);
          break;
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user);
            await loadProfile(session.user.id);
          }
          break;
        default:
          if (!session || !isSessionValid(session)) {
            setUser(null);
            setProfileState(null);
          }
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [handleSession, loadProfile, setProfileState]);

  // 🔹 Méthodes publiques
  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('❌ Erreur signOut:', error);
    setUser(null);
    setProfileState(null);
    setLoading(false);
  }, [setProfileState]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [loadProfile, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      console.error('❌ Erreur signIn:', err);
      return { error: err as Error };
    }
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData?: { first_name?: string; last_name?: string; role?: string; type_marchand?: string }
    ) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: userData?.first_name,
              last_name: userData?.last_name,
              role: userData?.role,
              type_marchand: userData?.type_marchand,
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        return { error };
      } catch (err) {
        console.error('❌ Erreur signUp:', err);
        return { error: err as Error };
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return { error: new Error('No user logged in') };

      // 🔹 Protection admin
      if (profileRef.current?.role?.toLowerCase() === 'admin') {
        return { error: new Error('Le compte admin est intouchable') };
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates as Database['public']['Tables']['profiles']['Update'])
          .eq('user_id', user.id);
        if (error) return { error };
        setProfileState(prev => (prev ? { ...prev, ...updates } : prev));
        return { error: null };
      } catch (err) {
        console.error('❌ Erreur updateProfile:', err);
        return { error: err as Error };
      }
    },
    [user]
  );

  const isRole = useCallback(
    (roles: string[]) => {
      if (!profile?.role) return false;
      return roles.some(r => r.toLowerCase() === profile.role?.toLowerCase());
    },
    [profile?.role]
  );

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    signOut,
    refreshProfile,
    signIn,
    signUp,
    updateProfile,
    isRole,
  };
};