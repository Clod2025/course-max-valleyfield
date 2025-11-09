import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  Store,
  Truck,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserData {
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

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  address: string;
  city: string;
}

// ✅ OPTIMISATION : Composant mémorisé pour éviter les re-renders
const UserTable: React.FC<{ users: UserData[]; title: string; icon: React.ReactNode }> = memo(({ 
  users, 
  title, 
  icon 
}) => {
  const { toast } = useToast();
  
  // ✅ CORRECTION : Handlers fonctionnels pour les boutons
  const handleView = useCallback((user: UserData) => {
    toast({
      title: "Détails de l'utilisateur",
      description: `${user.first_name} ${user.last_name} - ${user.email}`,
    });
  }, [toast]);
  
  const handleEdit = useCallback((user: UserData) => {
    toast({
      title: "Modifier utilisateur",
      description: `Modification de ${user.email}`,
    });
  }, [toast]);
  
  const handleDelete = useCallback(async (user: UserData) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${user.email}?`)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Utilisateur supprimé",
        description: `${user.email} a été supprimé avec succès`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucun utilisateur trouvé</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {user.first_name || 'N/A'} {user.last_name || 'N/A'}
                    </h4>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleView(user)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(user)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

UserTable.displayName = 'UserTable';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { user, profile, authLoading, isRole } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'client',
    phone: '',
    address: '',
    city: ''
  });

  // Lignes 202-211 - CORRECTION : Utiliser useRef pour éviter les re-renders
  // ✅ CORRECTION : Utiliser useRef pour éviter les re-renders inutiles
  const profileRoleRef = useRef(profile?.role);
  const userEmailRef = useRef(user?.email);

  useEffect(() => {
    // ✅ Ne logger que si les valeurs ont vraiment changé
    if (profileRoleRef.current !== profile?.role || userEmailRef.current !== user?.email) {
      profileRoleRef.current = profile?.role;
      userEmailRef.current = user?.email;
      
      console.log('🔍 UserManagement Debug:');
      console.log('  - User:', user?.email);
      console.log('  - Profile role:', profile?.role);
      console.log('  - Auth loading:', authLoading);
      console.log('  - Is admin?', isRole(['admin', 'Admin', 'ADMIN']));
    }
  }, [profile?.role, user?.email, authLoading, isRole]);

  // Vérification des permissions admin avec debug détaillé
  if (authLoading) return null;
  if (!user || !profile || !isRole(['admin', 'Admin', 'ADMIN'])) return null;

  // Lignes 279-353 - CORRECTION : Utiliser useRef pour toast
  const toastRef = useRef(toast);

  // ✅ Mettre à jour la référence quand toast change
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // ✅ OPTIMISATION : fetchUsers mémorisé avec useCallback
  const fetchUsers = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      setError(null);
      console.log('🔍 Fetching users from profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        setError(`Erreur Supabase: ${error.message}`);
        throw error;
      }

      console.log('✅ Users fetched:', data?.length || 0, 'users');
      
      if (data && data.length > 0) {
        setUsers(data);
        
        // ✅ CORRECTION : Utiliser toastRef.current au lieu de toast directement
        if (showLoader) {
          toastRef.current({
            title: "Données chargées",
            description: `${data.length} utilisateur(s) trouvé(s)`,
          });
        }
      } else {
        setUsers([]);
        console.log('⚠️ No users found in database');
        if (showLoader) {
          toastRef.current({
            title: "Aucun utilisateur",
            description: "Aucun utilisateur trouvé dans la base de données",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      setError(`Impossible de charger les utilisateurs: ${error.message}`);
      toastRef.current({
        title: "Erreur",
        description: `Impossible de charger les utilisateurs: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // ✅ Dépendances vides car on utilise toastRef.current

  // ✅ OPTIMISATION : useEffect avec fetchUsers mémorisé + realtime optimisé
  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          
          // ✅ OPTIMISATION : Mise à jour optimiste au lieu de re-fetch complet
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new as UserData, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(user => 
              user.id === payload.new.id ? payload.new as UserData : user
            ));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(user => user.id !== payload.old.id));
          }
          
          // ✅ CORRECTION : Utiliser toastRef.current
          toastRef.current({
            title: "Mise à jour",
            description: "Liste des utilisateurs mise à jour",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]); // ✅ Seulement fetchUsers comme dépendance

  // ✅ OPTIMISATION : Filtres mémorisés
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  // ✅ OPTIMISATION : Groupement par rôle mémorisé + DEBUG
  const usersByRole = useMemo(() => {
    const grouped = {
      admin: filteredUsers.filter(user => user.role === 'admin'),
      store_manager: filteredUsers.filter(user => user.role === 'store_manager'),
      livreur: filteredUsers.filter(user => user.role === 'livreur'),
      client: filteredUsers.filter(user => user.role === 'client')
    };
    
    // ✅ DEBUG : Log pour voir combien dans chaque groupe
    console.log('📊 Users grouped by role:', {
      admin: grouped.admin.length,
      store_manager: grouped.store_manager.length,
      livreur: grouped.livreur.length,
      client: grouped.client.length,
      total: filteredUsers.length
    });
    
    return grouped;
  }, [filteredUsers]);

  // Ajout d'un nouvel utilisateur
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('🔄 Creating new user:', formData);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        }
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }

      console.log('✅ Auth user created:', authData.user.id);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          is_active: true
        });

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw profileError;
      }

      console.log('✅ Profile created successfully');

      toastRef.current({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });

      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'client',
        phone: '',
        address: '',
        city: ''
      });
      setIsAddUserOpen(false);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la création:', error);
      toastRef.current({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchUsers()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gestion des Utilisateurs
              {refreshing && <Loader2 className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchUsers(false)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter un utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                    <DialogDescription>
                      Créez un nouveau compte utilisateur avec les informations suivantes
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">Prénom *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Nom *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="password">Mot de passe *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        Générer
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="role">Rôle *</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="store_manager">Marchand</SelectItem>
                          <SelectItem value="livreur">Livreur</SelectItem>
                          <SelectItem value="admin">Administrateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Création...
                          </>
                        ) : (
                          'Créer l\'utilisateur'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Administrateurs</SelectItem>
                <SelectItem value="store_manager">Marchands</SelectItem>
                <SelectItem value="livreur">Livreurs</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableaux par rôle */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="admin">Admins ({usersByRole.admin.length})</TabsTrigger>
          <TabsTrigger value="store_manager">Marchands ({usersByRole.store_manager.length})</TabsTrigger>
          <TabsTrigger value="livreur">Livreurs ({usersByRole.livreur.length})</TabsTrigger>
          <TabsTrigger value="client">Clients ({usersByRole.client.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UserTable 
            users={filteredUsers} 
            title="Tous les utilisateurs" 
            icon={<Users className="w-5 h-5" />} 
          />
        </TabsContent>

        <TabsContent value="admin">
          <UserTable 
            users={usersByRole.admin} 
            title="Administrateurs" 
            icon={<Shield className="w-5 h-5" />} 
          />
        </TabsContent>

        <TabsContent value="store_manager">
          <UserTable 
            users={usersByRole.store_manager} 
            title="Marchands" 
            icon={<Store className="w-5 h-5" />} 
          />
        </TabsContent>

        <TabsContent value="livreur">
          <UserTable 
            users={usersByRole.livreur} 
            title="Livreurs" 
            icon={<Truck className="w-5 h-5" />} 
          />
        </TabsContent>

        <TabsContent value="client">
          <UserTable 
            users={usersByRole.client} 
            title="Clients" 
            icon={<User className="w-5 h-5" />} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
