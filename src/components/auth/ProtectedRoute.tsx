import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Role =
  | 'admin'
  | 'marchand'
  | 'store_manager'
  | 'livreur'
  | 'driver'
  | 'client'
  | 'commis';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
  allowedRoles?: Role[];
}

const normalizeRole = (role?: string | null) =>
  (role ?? '').toLowerCase();

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  const userRole = normalizeRole(profile?.role);

  if (requiredRole) {
    if (userRole !== normalizeRole(requiredRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (allowedRoles?.length) {
    const normalizedAllowed = allowedRoles.map((role) =>
      normalizeRole(role),
    );
    if (!normalizedAllowed.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}


