import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface MerchantEmployee {
  id: string;
  merchant_id: string;
  store_id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  employee_code: string;
  password_hash: string;
  role: 'employee' | 'manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AddEmployeeData {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  password: string;
  role: 'employee' | 'manager';
}

interface UseEmployeesReturn {
  employees: MerchantEmployee[];
  loading: boolean;
  error: string | null;
  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: AddEmployeeData) => Promise<boolean>;
  updateEmployee: (id: string, updates: Partial<MerchantEmployee>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  toggleEmployeeStatus: (id: string) => Promise<boolean>;
  generateEmployeeCode: () => Promise<string | null>;
}

export const useEmployees = (): UseEmployeesReturn => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<MerchantEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!profile?.user_id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('merchant_employees')
        .select('*')
        .eq('merchant_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEmployees(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des employés:', err);
      setError(err.message || 'Erreur lors du chargement des employés');
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de charger les employés',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, toast]);

  const generateEmployeeCode = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('generate_employee_code');
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Erreur lors de la génération du code employé:', err);
      toast({
        title: "Erreur",
        description: "Impossible de générer un code d'employé",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const addEmployee = useCallback(async (
    employeeData: AddEmployeeData
  ): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      // Générer un code d'employé
      const employeeCode = await generateEmployeeCode();
      if (!employeeCode) return false;

      // TODO: Hash le mot de passe côté backend pour la production
      // Pour l'instant, on stocke directement (à NE PAS FAIRE en production)
      const passwordHash = btoa(employeeData.password); // Base64 encoding seulement pour développement

      const { error: insertError } = await supabase
        .from('merchant_employees')
        .insert([{
          merchant_id: profile.user_id,
          store_id: profile.store_id,
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          phone: employeeData.phone,
          email: employeeData.email,
          employee_code: employeeCode,
          password_hash: passwordHash,
          role: employeeData.role,
          is_active: true
        }]);

      if (insertError) throw insertError;

      await fetchEmployees();
      toast({
        title: "Succès",
        description: "Employé ajouté avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout d\'un employé:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible d\'ajouter l\'employé',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, generateEmployeeCode, fetchEmployees, toast]);

  const updateEmployee = useCallback(async (
    id: string,
    updates: Partial<MerchantEmployee>
  ): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: updateError } = await supabase
        .from('merchant_employees')
        .update(updates)
        .eq('id', id)
        .eq('merchant_id', profile.user_id);

      if (updateError) throw updateError;

      await fetchEmployees();
      toast({
        title: "Succès",
        description: "Employé mis à jour avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour d\'un employé:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de mettre à jour l\'employé',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchEmployees, toast]);

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: deleteError } = await supabase
        .from('merchant_employees')
        .delete()
        .eq('id', id)
        .eq('merchant_id', profile.user_id);

      if (deleteError) throw deleteError;

      await fetchEmployees();
      toast({
        title: "Succès",
        description: "Employé supprimé avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la suppression d\'un employé:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de supprimer l\'employé',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchEmployees, toast]);

  const toggleEmployeeStatus = useCallback(async (id: string): Promise<boolean> => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return false;

    return await updateEmployee(id, { is_active: !employee.is_active });
  }, [employees, updateEmployee]);

  useEffect(() => {
    if (profile?.user_id) {
      fetchEmployees();
    }
  }, [profile?.user_id, fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    generateEmployeeCode
  };
};

export default useEmployees;
