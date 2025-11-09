import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Megaphone, 
  Plus, 
  Image as ImageIcon,
  Calendar,
  Percent,
  Eye,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePromotions } from '@/hooks/usePromotions';

export function PromotionManager() {
  const { toast } = useToast();
  const { 
    promotions, 
    loading, 
    activePromotions, 
    expiredPromotions, 
    futurePromotions,
    addPromotion, 
    updatePromotion, 
    deletePromotion, 
    togglePromotionStatus 
  } = usePromotions();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percent: '',
    image_url: '',
    start_at: '',
    end_at: '',
    is_active: true
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.discount_percent || !formData.start_at || !formData.end_at) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Générer automatiquement une image si non fournie
    const promoImage = formData.image_url || 
      `https://via.placeholder.com/400x200/4f46e5/white?text=${encodeURIComponent(formData.title)}`;

    const success = await addPromotion({
      title: formData.title,
      description: formData.description,
      discount_percent: parseFloat(formData.discount_percent),
      image_url: promoImage,
      start_at: formData.start_at,
      end_at: formData.end_at,
      is_active: true
    });

    if (success) {
      resetForm();
      setShowAddDialog(false);
    }
  };

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion.id);
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      discount_percent: promotion.discount_percent.toString(),
      image_url: promotion.image_url || '',
      start_at: promotion.start_at.split('T')[0], // Convertir pour input type="date"
      end_at: promotion.end_at.split('T')[0],
      is_active: promotion.is_active
    });
    setShowAddDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingPromotion || !formData.title || !formData.discount_percent) return;

    const success = await updatePromotion(editingPromotion, {
      title: formData.title,
      description: formData.description,
      discount_percent: parseFloat(formData.discount_percent),
      image_url: formData.image_url,
      start_at: formData.start_at,
      end_at: formData.end_at,
      is_active: formData.is_active
    });

    if (success) {
      resetForm();
      setShowAddDialog(false);
      setEditingPromotion(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return;
    await deletePromotion(id);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount_percent: '',
      image_url: '',
      start_at: '',
      end_at: '',
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Affiches & Promotions</h2>
          <p className="text-muted-foreground">
            Créez des promotions visibles sur l'interface client
          </p>
        </div>
        
        <Button onClick={() => { resetForm(); setEditingPromotion(null); setShowAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Promotion
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Promotions</p>
                <p className="text-2xl font-bold">{promotions.length}</p>
              </div>
              <Megaphone className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-green-600">{activePromotions.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Programmées</p>
                <p className="text-2xl font-bold text-orange-600">{futurePromotions.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expirées</p>
                <p className="text-2xl font-bold text-gray-400">{expiredPromotions.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des promotions */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : promotions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune promotion</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première promotion pour attirer les clients
            </p>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une promotion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promotion) => {
            const now = new Date();
            const start = new Date(promotion.start_at);
            const end = new Date(promotion.end_at);
            const isExpired = end < now;
            const isFuture = start > now;
            const isActive = !isExpired && !isFuture && promotion.is_active;

            return (
              <Card key={promotion.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-r from-primary to-primary/80 rounded-t-lg flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{promotion.discount_percent}%</div>
                      <div className="text-sm">DE RÉDUCTION</div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{promotion.title}</h3>
                        {promotion.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {promotion.description}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={isActive ? 'default' : isExpired ? 'secondary' : 'outline'}
                      >
                        {isExpired ? 'Expirée' : isFuture ? 'Programmée' : isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {start.toLocaleDateString('fr-CA')} - {end.toLocaleDateString('fr-CA')}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promotion.is_active}
                          onCheckedChange={() => togglePromotionStatus(promotion.id)}
                          disabled={isExpired}
                        />
                        <span className="text-sm text-muted-foreground">
                          {promotion.is_active ? 'Activée' : 'Désactivée'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(promotion)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDelete(promotion.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog pour ajouter/modifier */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Modifier la promotion' : 'Nouvelle Promotion'}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion ? 'Modifiez les détails de votre promotion' : 'Créez une nouvelle promotion pour attirer plus de clients'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre de la promotion *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Solde sur les fruits"
                />
              </div>
              
              <div>
                <Label htmlFor="discount">Pourcentage de réduction *</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                  placeholder="Ex: 20"
                />
              </div>
              
              <div>
                <Label htmlFor="start_at">Date de début *</Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_at: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_at">Date de fin *</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_at: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre promotion..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL de l'image (optionnel)</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Si non fournie, une image sera générée automatiquement
              </p>
            </div>

            {editingPromotion && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Promotion active</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); setEditingPromotion(null); }}>
              Annuler
            </Button>
            <Button onClick={editingPromotion ? handleUpdate : handleSubmit}>
              {editingPromotion ? 'Modifier' : 'Créer & Publier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
