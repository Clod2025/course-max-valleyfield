import { createContext, useContext, type PropsWithChildren } from 'react';
import { useAuth as useAuthHook, type UseAuthReturn } from '@/hooks/useAuth';

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const auth = useAuthHook();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};

export const useAuth = () => useAuthContext();

