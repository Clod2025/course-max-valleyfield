import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Users, 
  Key, 
  Mail, 
  User,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMerchantStore } from '@/hooks/useMerchantStore';

interface Commis {
  id: string;
  user_id?: string;
  nom: string;
  prenom: string;
  email: string;
  code_unique: string;
  role: string;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  store_id?: string | null;
  merchant_id?: string;
}

interface CommisFormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string;
}

export function CommisManagementNew() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [commis, setCommis] = useState<Commis[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<CommisFormData>({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'commis'
  });
  const { store } = useMerchantStore({ ownerId: profile?.user_id });

  useEffect(() => {
    loadCommis();
    
    // Abonnement en temps réel pour les nouveaux commis
    const subscription = supabase
      .channel('commis_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'commis'
        }, 
        (payload) => {
          if (!store?.id || payload.new.store_id === store.id) {
            loadCommis();
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'commis'
        }, 
        (payload) => {
          if (!store?.id || payload.new.store_id === store.id) {
            loadCommis();
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'commis'
        }, 
        (payload) => {
          if (!store?.id || payload.old.store_id === store.id) {
            loadCommis();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.user_id, store?.id]);

  const loadCommis = async () => {
    if (!profile?.user_id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('commis')
        .select('*')
        .order('created_at', { ascending: false });

      if (store?.id) {
        query = query.eq('store_id', store.id);
      } else {
        query = query.eq('merchant_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCommis(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commis:', error);
      setCommis([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleAddCommis = async () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Mode production - utiliser le nouveau flux avec compte dédié
      if (!profile?.store_id) {
        throw new Error("Magasin introuvable. Veuillez configurer vos informations magasin.");
      }

      const { data, error } = await supabase.rpc('create_commis_account', {
        p_email: formData.email,
        p_password: formData.password,
        p_first_name: formData.prenom,
        p_last_name: formData.nom,
        p_store_id: profile.store_id,
        p_role: formData.role
      });

      if (error) {
        throw error;
      }

      if (data) {
        const newCommis: Commis = {
          id: data.id,
          user_id: data.user_id,
          nom: formData.nom,
          prenom: formData.prenom,
          email: data.email,
          code_unique: data.code_unique,
          role: data.role,
          must_change_password: true,
          is_active: true,
          created_at: new Date().toISOString(),
          store_id: data.store_id,
          merchant_id: data.merchant_id,
        };

        setCommis(prev => [newCommis, ...prev]);
      }

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        role: 'commis'
      });
      setShowForm(false);

      toast({
        title: "Commis ajouté",
        description: `${formData.nom} a été ajouté avec succès`,
      });

    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du commis:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le commis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (commisId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('commis')
        .update({ is_active: !isActive })
        .eq('id', commisId);

      if (error) throw error;

      setCommis(prev => prev.map(c =>
        c.id === commisId ? { ...c, is_active: !isActive } : c
      ));

      toast({
        title: "Statut mis à jour",
        description: `Le commis a été ${!isActive ? 'activé' : 'désactivé'}`,
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCommis = async (commisId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commis ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('commis')
        .delete()
        .eq('id', commisId);

      if (error) throw error;

      setCommis(prev => prev.filter(c => c.id !== commisId));

      toast({
        title: "Commis supprimé",
        description: "Le commis a été supprimé avec succès",
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le commis",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: `${label} copié dans le presse-papiers`,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'commis': return 'bg-blue-100 text-blue-800';
      case 'supervisor': return 'bg-green-100 text-green-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'commis': return 'Commis';
      case 'supervisor': return 'Superviseur';
      case 'manager': return 'Manager';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestion des Commis</h2>
            <p className="text-muted-foreground">Gérez vos employés et leurs accès</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Commis</h2>
          <p className="text-muted-foreground">Gérez vos employés et leurs accès</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un Commis
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{commis.length}</div>
            <div className="text-sm text-muted-foreground">Total Commis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{commis.filter(c => !c.must_change_password).length}</div>
            <div className="text-sm text-muted-foreground">Actifs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{commis.filter(c => c.must_change_password).length}</div>
            <div className="text-sm text-muted-foreground">Mot de passe temporaire</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Ajouter un nouveau commis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Dupont"
                />
              </div>
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                  placeholder="Jean"
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
                placeholder="jean.dupont@email.com"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mot de passe sécurisé"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="commis">Commis</option>
                  <option value="supervisor">Superviseur</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddCommis} disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Ajouter le Commis
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des commis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Liste des Commis</h3>
        {commis.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">Aucun commis</h4>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter votre premier employé
              </p>
              <Button onClick={() => setShowForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un Commis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {commis.map((commis) => (
              <Card key={commis.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{commis.prenom} {commis.nom}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {commis.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(commis.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleLabel(commis.role)}
                      </Badge>
                      <Badge variant={commis.must_change_password ? 'destructive' : 'default'}>
                        {commis.must_change_password ? 'Mot de passe temporaire' : 'Actif'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Code Unique</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={commis.code_unique}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(commis.code_unique, 'Code unique')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de création</Label>
                      <div className="text-sm text-muted-foreground">
                        {new Date(commis.created_at).toLocaleDateString('fr-CA')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={commis.is_active ? 'destructive' : 'default'}
                      onClick={() => handleToggleActive(commis.id, commis.is_active)}
                    >
                      {commis.is_active ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Activer
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCommis(commis.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
