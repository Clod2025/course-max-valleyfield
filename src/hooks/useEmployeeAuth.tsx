import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { MerchantEmployee } from './useEmployees';

interface EmployeeAuthData {
  employee_code: string;
  password: string;
}

interface UseEmployeeAuthReturn {
  login: (data: EmployeeAuthData) => Promise<MerchantEmployee | null>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export const useEmployeeAuth = (): UseEmployeeAuthReturn => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: EmployeeAuthData): Promise<MerchantEmployee | null> => {
    setLoading(true);
    setError(null);

    try {
      // Rechercher l'employé par code
      const { data: employee, error: fetchError } = await supabase
        .from('merchant_employees')
        .select('*')
        .eq('employee_code', data.employee_code.trim().toUpperCase())
        .single();

      if (fetchError) {
        throw new Error('Code employé invalide');
      }

      if (!employee || !employee.is_active) {
        throw new Error('Compte employé désactivé');
      }

      // Vérifier le mot de passe (base64 pour démo, bcrypt en production)
      const passwordHash = btoa(data.password);
      if (employee.password_hash !== passwordHash) {
        throw new Error('Mot de passe incorrect');
      }

      // Authentification réussie
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${employee.first_name} ${employee.last_name}`,
      });

      // Sauvegarder la session
      sessionStorage.setItem('authenticated_employee', JSON.stringify(employee));
      localStorage.setItem('authenticated_employee', JSON.stringify(employee));

      return employee;
    } catch (err: any) {
      console.error('Erreur lors de l\'authentification:', err);
      const errorMessage = err.message || 'Erreur lors de l\'authentification';
      setError(errorMessage);
      toast({
        title: "Erreur d'authentification",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('authenticated_employee');
    localStorage.removeItem('authenticated_employee');
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté",
    });
  }, [toast]);

  return {
    login,
    logout,
    loading,
    error
  };
};

// Hook pour obtenir l'employé authentifié actuellement
export const useCurrentEmployee = (): MerchantEmployee | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedEmployee = sessionStorage.getItem('authenticated_employee') || 
                          localStorage.getItem('authenticated_employee');
    if (storedEmployee) {
      return JSON.parse(storedEmployee);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture de l\'employé authentifié:', error);
  }

  return null;
};

