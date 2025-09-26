import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean | null;
  created_at: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  user_id: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users from profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Users fetched:', data?.length || 0, 'users');
      setUsers(data || []);
      
      return data || [];
    } catch (error: any) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les utilisateurs: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    address?: string;
    city?: string;
  }) => {
    try {
      console.log('🔄 Creating new user:', userData);
      
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role
        }
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Créer le profil dans la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          phone: userData.phone || null,
          address: userData.address || null,
          city: userData.city || null,
          is_active: true
        });

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw profileError;
      }

      console.log('✅ Profile created successfully');

      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });

      // Recharger la liste
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateUser = async (userId: string, updates: Partial<UserData>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });

      // Recharger la liste
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'utilisateur",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });

      // Recharger la liste
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
      return false;
    }
  };

  // Mise à jour en temps réel avec Supabase Realtime
  useEffect(() => {
    // Chargement initial
    fetchUsers();

    // Configuration de l'écoute en temps réel
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          
          // Recharger les données après un changement
          fetchUsers();
          
          toast({
            title: "Mise à jour",
            description: "Liste des utilisateurs mise à jour",
          });
        }
      )
      .subscribe();

    // Nettoyage de l'abonnement
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser
  };
};