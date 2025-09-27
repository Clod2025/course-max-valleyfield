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
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Commis {
  id: string;
  nom: string;
  email: string;
  code_unique: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface CommisFormData {
  nom: string;
  email: string;
  password: string;
  role: string;
}

export function CommisManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [commis, setCommis] = useState<Commis[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<CommisFormData>({
    nom: '',
    email: '',
    password: '',
    role: 'commis'
  });

  useEffect(() => {
    loadCommis();
  }, []);

  const loadCommis = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Utiliser la fonction sécurisée pour récupérer les commis
      const { data, error } = await supabase.rpc('get_merchant_commis');

      if (error) {
        // Si la fonction n'existe pas, utiliser des données de démonstration
        if (error.code === 'PGRST116' || error.message?.includes('function get_merchant_commis() does not exist')) {
          console.log('Fonction get_merchant_commis non trouvée, utilisation de données de démonstration');
          const demoCommis: Commis[] = [
            {
              id: 'demo-commis-1',
              nom: 'Jean Dupont',
              email: 'jean.dupont@demo.com',
              code_unique: 'COM-ABC123',
              role: 'commis',
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'demo-commis-2',
              nom: 'Marie Martin',
              email: 'marie.martin@demo.com',
              code_unique: 'COM-DEF456',
              role: 'supervisor',
              is_active: true,
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ];
          setCommis(demoCommis);
          return;
        }
        throw error;
      }
      setCommis(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commis:', error);
      // En cas d'erreur, utiliser des données de démonstration
      const demoCommis: Commis[] = [
        {
          id: 'demo-commis-error',
          nom: 'Employé Démo',
          email: 'demo@demo.com',
          code_unique: 'COM-DEMO1',
          role: 'commis',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      setCommis(demoCommis);
      
      toast({
        title: "Mode démonstration",
        description: "Utilisation de données de démonstration pour les employés",
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
    return password;
  };

  const handleCreateCommis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté en tant que marchand",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.prenom,
            last_name: formData.nom,
            role: 'commis'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erreur lors de la création de l\'utilisateur');
      }

      // 2. Générer un code unique
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_commis_code');

      if (codeError) throw codeError;

      // 3. Créer le commis dans la table commis
      const { data: commisData, error: commisError } = await supabase
        .from('commis')
        .insert({
          merchant_id: profile.id,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          code_unique: codeData
        })
        .select()
        .single();

      if (commisError) throw commisError;

      // 4. Mettre à jour la liste
      setCommis(prev => [commisData, ...prev]);
      
      // 5. Réinitialiser le formulaire
      setFormData({ nom: '', prenom: '', email: '', password: '' });
      setShowForm(false);

      toast({
        title: "Commis créé avec succès",
        description: `${formData.prenom} ${formData.nom} a été ajouté avec le code ${codeData}`,
      });

    } catch (error: any) {
      console.error('Erreur lors de la création du commis:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le commis",
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
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
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

  const togglePasswordVisibility = (commisId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [commisId]: !prev[commisId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Employés</h2>
          <p className="text-muted-foreground">
            Gérez les accès de vos commis et employés
          </p>
        </div>
        
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un commis
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{commis.length}</div>
            <div className="text-sm text-muted-foreground">Total employés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {commis.filter(c => c.is_active).length}
            </div>
            <div className="text-sm text-muted-foreground">Actifs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {commis.filter(c => !c.is_active).length}
            </div>
            <div className="text-sm text-muted-foreground">Inactifs</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nouveau Commis
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCommis} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                    placeholder="Jean"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder="Dupont"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jean.dupont@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mot de passe sécurisé"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, password: generatePassword() }))}
                    >
                      Générer
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le commis'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des commis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Liste des Employés ({commis.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commis.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun employé</h3>
              <p className="text-muted-foreground mb-4">
                Ajoutez votre premier commis pour commencer
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un commis
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {commis.map((commis) => (
                <div key={commis.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {commis.prenom} {commis.nom}
                        </h4>
                        <Badge variant={commis.is_active ? 'default' : 'secondary'}>
                          {commis.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {commis.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          <span className="font-mono">{commis.code_unique}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(commis.code_unique, 'Code unique')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(commis.id, commis.is_active)}
                    >
                      {commis.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Instructions pour les employés</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Les employés se connectent avec le compte marchand principal</li>
                <li>• Après connexion, ils entrent leur code unique pour s'identifier</li>
                <li>• Le code unique permet de tracer toutes leurs actions</li>
                <li>• Seuls les employés actifs peuvent accéder aux commandes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
