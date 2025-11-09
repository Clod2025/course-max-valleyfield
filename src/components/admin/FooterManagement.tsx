import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Navigation,
  Copyright,
  Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FooterItem {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface FooterFormData {
  key: string;
  value: string;
  category: string;
  description: string;
  is_public: boolean;
}

export const FooterManagement: React.FC = () => {
  const { toast } = useToast();
  const [footerItems, setFooterItems] = useState<FooterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FooterItem | null>(null);
  const [formData, setFormData] = useState<FooterFormData>({
    key: '',
    value: '',
    category: 'footer',
    description: '',
    is_public: true
  });

  // Chargement des données du footer
  const fetchFooterData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching footer data...');
      
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'footer')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching footer data:', error);
        throw error;
      }

      console.log('✅ Footer data fetched:', data?.length || 0, 'items');
      setFooterItems(data || []);
      
      toast({
        title: "Données chargées",
        description: `${data?.length || 0} élément(s) de footer trouvé(s)`,
      });
    } catch (error: any) {
      console.error('❌ Error loading footer data:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les données du footer: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Sauvegarde d'un élément de footer
  const saveFooterItem = async (itemData: FooterFormData, isEdit = false) => {
    try {
      setSaving(true);
      console.log('🔄 Saving footer item:', itemData);
      
      if (isEdit && editingItem) {
        // Modification d'un élément existant
        const { error } = await supabase
          .from('settings')
          .update({
            key: itemData.key,
            value: itemData.value,
            category: itemData.category,
            description: itemData.description,
            is_public: itemData.is_public,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Élément de footer modifié avec succès",
        });
      } else {
        // Création d'un nouvel élément
        const { error } = await supabase
          .from('settings')
          .insert({
            key: itemData.key,
            value: itemData.value,
            category: itemData.category,
            description: itemData.description,
            is_public: itemData.is_public
          });

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Élément de footer ajouté avec succès",
        });
      }

      // Recharger les données
      await fetchFooterData();
      
      // Fermer les modals
      setIsAddOpen(false);
      setIsEditOpen(false);
      setEditingItem(null);
      
      // Réinitialiser le formulaire
      setFormData({
        key: '',
        value: '',
        category: 'footer',
        description: '',
        is_public: true
      });
      
    } catch (error: any) {
      console.error('❌ Error saving footer item:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Suppression d'un élément de footer
  const deleteFooterItem = async (itemId: string) => {
    try {
      console.log('🗑️ Deleting footer item:', itemId);
      
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Élément de footer supprimé avec succès",
      });

      // Recharger les données
      await fetchFooterData();
      
    } catch (error: any) {
      console.error('❌ Error deleting footer item:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Ouverture du modal d'édition
  const openEditModal = (item: FooterItem) => {
    setEditingItem(item);
    setFormData({
      key: item.key,
      value: typeof item.value === 'string' ? item.value : JSON.stringify(item.value),
      category: item.category,
      description: item.description || '',
      is_public: item.is_public
    });
    setIsEditOpen(true);
  };

  // Chargement initial
  useEffect(() => {
    fetchFooterData();
  }, [fetchFooterData]);

  // Icône selon le type d'élément
  const getItemIcon = (key: string) => {
    if (key.includes('phone')) return <Phone className="w-4 h-4" />;
    if (key.includes('email')) return <Mail className="w-4 h-4" />;
    if (key.includes('address')) return <MapPin className="w-4 h-4" />;
    if (key.includes('facebook')) return <Facebook className="w-4 h-4" />;
    if (key.includes('instagram')) return <Instagram className="w-4 h-4" />;
    if (key.includes('twitter')) return <Twitter className="w-4 h-4" />;
    if (key.includes('navigation')) return <Navigation className="w-4 h-4" />;
    if (key.includes('copyright')) return <Copyright className="w-4 h-4" />;
    return <LinkIcon className="w-4 h-4" />;
  };

  // Type d'élément selon la clé
  const getItemType = (key: string) => {
    if (key.includes('phone') || key.includes('email') || key.includes('address')) return 'Contact';
    if (key.includes('facebook') || key.includes('instagram') || key.includes('twitter')) return 'Réseaux sociaux';
    if (key.includes('navigation')) return 'Navigation';
    if (key.includes('copyright')) return 'Copyright';
    return 'Général';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des données du footer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Gestion du Footer
          </h1>
          <p className="text-muted-foreground">
            Gérez les éléments du footer du site (contact, navigation, réseaux sociaux, etc.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchFooterData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un élément
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un élément de footer</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau lien ou élément au pied de page
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveFooterItem(formData, false); }} className="space-y-4">
                <div>
                  <Label htmlFor="key">Clé *</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="Ex: phone, email, facebook_url"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Identifiant unique pour cet élément
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="value">Valeur *</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Ex: (450) 123-4567, support@coursemax.ca"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de cet élément"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_public">Public (visible sur le site)</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tableau des éléments de footer */}
      <Card>
        <CardHeader>
          <CardTitle>Éléments du Footer ({footerItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {footerItems.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Aucun élément de footer</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter des éléments au footer de votre site.
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le premier élément
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Clé</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {footerItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getItemIcon(item.key)}
                        <span className="font-medium">{getItemType(item.key)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {item.key}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}>
                        {typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.description || 'Aucune description'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_public ? "default" : "secondary"}>
                        {item.is_public ? "Public" : "Privé"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFooterItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'élément de footer</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'élément de footer sélectionné
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveFooterItem(formData, true); }} className="space-y-4">
            <div>
              <Label htmlFor="edit_key">Clé *</Label>
              <Input
                id="edit_key"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_value">Valeur *</Label>
              <Input
                id="edit_value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Input
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit_is_public">Public (visible sur le site)</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
