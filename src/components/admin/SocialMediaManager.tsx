import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin,
  Youtube,
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Share2,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SocialMediaFormData {
  platform: string;
  url: string;
  is_active: boolean;
}

export const SocialMediaManager: React.FC = () => {
  const { toast } = useToast();
  const [socialMedias, setSocialMedias] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialMedia | null>(null);
  const [formData, setFormData] = useState<SocialMediaFormData>({
    platform: '',
    url: '',
    is_active: true
  });

  // Plateformes supportées
  const supportedPlatforms = [
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'twitter', label: 'Twitter/X', icon: Twitter },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'tiktok', label: 'TikTok', icon: ExternalLink }
  ];

  // Chargement des données
  const fetchSocialMedias = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching social media data...');
      
      const { data, error } = await supabase
        .from('social_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSocialMedias(data || []);

      toast({
        title: "Données chargées",
        description: `${data?.length || 0} réseau(x) social(aux) trouvé(s)`,
      });
    } catch (error: any) {
      console.error('❌ Error loading social media data:', error);
      setSocialMedias([]);
      toast({
        title: "Erreur",
        description: `Impossible de charger les données: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Ajouter un réseau social
  const addSocialMedia = async () => {
    try {
      setSaving(true);
      console.log('🔄 Adding social media:', formData);

      // Validation de l'URL
      if (!isValidUrl(formData.url)) {
        toast({
          title: "Erreur",
          description: "Veuillez entrer une URL valide",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('social_media')
        .insert({
          platform: formData.platform,
          url: formData.url.trim(),
          is_active: formData.is_active,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSocialMedias(prev => [data, ...prev]);

      toast({
        title: "Succès",
        description: "Réseau social ajouté avec succès",
      });

      setIsAddOpen(false);
      setFormData({
        platform: '',
        url: '',
        is_active: true
      });

    } catch (error: any) {
      console.error('❌ Error adding social media:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter le réseau social: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Modifier un réseau social
  const updateSocialMedia = async () => {
    try {
      setSaving(true);
      console.log('🔄 Updating social media:', formData);

      // Validation de l'URL
      if (!isValidUrl(formData.url)) {
        toast({
          title: "Erreur",
          description: "Veuillez entrer une URL valide",
          variant: "destructive",
        });
        return;
      }

      if (!editingItem) return;

      const { data, error } = await supabase
        .from('social_media')
        .update({
          platform: formData.platform,
          url: formData.url.trim(),
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSocialMedias(prev => prev.map(item => 
        item.id === editingItem.id ? data : item
      ));

      toast({
        title: "Succès",
        description: "Réseau social modifié avec succès",
      });

      setIsEditOpen(false);
      setEditingItem(null);
      setFormData({
        platform: '',
        url: '',
        is_active: true
      });

    } catch (error: any) {
      console.error('❌ Error updating social media:', error);
      toast({
        title: "Erreur",
        description: `Impossible de modifier le réseau social: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un réseau social
  const deleteSocialMedia = async (itemId: string) => {
    try {
      console.log('🗑️ Deleting social media:', itemId);
      
      const { error } = await supabase
        .from('social_media')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      setSocialMedias(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Succès",
        description: "Réseau social supprimé avec succès",
      });
      
    } catch (error: any) {
      console.error('❌ Error deleting social media:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (item: SocialMedia) => {
    setEditingItem(item);
    setFormData({
      platform: item.platform,
      url: item.url,
      is_active: item.is_active
    });
    setIsEditOpen(true);
  };

  // Validation d'URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Obtenir l'icône selon la plateforme
  const getPlatformIcon = (platform: string) => {
    const platformData = supportedPlatforms.find(p => p.value === platform);
    if (platformData) {
      const IconComponent = platformData.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <Globe className="w-4 h-4" />;
  };

  // Obtenir le nom de la plateforme
  const getPlatformName = (platform: string) => {
    const platformData = supportedPlatforms.find(p => p.value === platform);
    return platformData ? platformData.label : platform;
  };

  // Chargement initial
  useEffect(() => {
    fetchSocialMedias();
  }, [fetchSocialMedias]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des réseaux sociaux...</p>
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
            <Share2 className="w-8 h-8" />
            Gestion des Réseaux Sociaux
          </h1>
          <p className="text-muted-foreground">
            Gérez les liens vers vos réseaux sociaux affichés dans le footer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSocialMedias} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un réseau
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un réseau social</DialogTitle>
                <DialogDescription>
                  Configurez un nouveau réseau social pour votre entreprise
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addSocialMedia(); }} className="space-y-4">
                <div>
                  <Label htmlFor="platform">Plateforme *</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedPlatforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          <div className="flex items-center gap-2">
                            <platform.icon className="w-4 h-4" />
                            {platform.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://facebook.com/coursemax"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Entrez l'URL complète de votre page
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Actif (visible dans le footer)</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ajout...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tableau des réseaux sociaux */}
      <Card>
        <CardHeader>
          <CardTitle>Réseaux Sociaux ({socialMedias.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {socialMedias.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Aucun réseau social</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter vos réseaux sociaux.
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le premier réseau
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {socialMedias.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(item.platform)}
                        <span className="font-medium">{getPlatformName(item.platform)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline truncate max-w-xs"
                        >
                          {item.url}
                        </a>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Actif" : "Inactif"}
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
                          onClick={() => deleteSocialMedia(item.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le réseau social</DialogTitle>
            <DialogDescription>
              Modifiez les informations du réseau social sélectionné
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateSocialMedia(); }} className="space-y-4">
            <div>
              <Label htmlFor="edit_platform">Plateforme *</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedPlatforms.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <platform.icon className="w-4 h-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit_url">URL *</Label>
              <Input
                id="edit_url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit_is_active">Actif (visible dans le footer)</Label>
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
