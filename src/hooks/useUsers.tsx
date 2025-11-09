import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // clé publique seulement
const supabase = createClient(supabaseUrl, supabaseKey);

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
      const res = await fetch("/api/users/list");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch users");
      setUsers(json.users);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Realtime listening
  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("Realtime update received:", payload);
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addUser = async (userData: any) => {
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to create user");
      toast({ title: "Succès", description: "Utilisateur créé" });
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const updateUser = async (user_id: string, updates: any) => {
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, updates }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update user");
      toast({ title: "Succès", description: "Utilisateur mis à jour" });
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteUser = async (user_id: string) => {
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete user");
      toast({ title: "Succès", description: "Utilisateur supprimé" });
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { users, loading, fetchUsers, addUser, updateUser, deleteUser };
};