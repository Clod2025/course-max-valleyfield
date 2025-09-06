import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone, 
  Plus, 
  Image as ImageIcon,
  Calendar,
  Percent,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount_percent: number;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export function PromotionManager() {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percent: '',
    start_date: '',
    end_date: '',
  });

  const handleAddPromotion = async () => {
    if (!formData.title || !formData.discount_percent) {
      toast({
        title: "Erreur",
        description: "Le titre et le pourcentage sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Générer automatiquement une image de promotion
      const promoImage = `https://via.placeholder.com/400x200/4f46e5/white?text=${encodeURIComponent(formData.title)}`;

      const newPromotion: Promotion = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        discount_percent: parseInt(formData.discount_percent),
        image_url: promoImage,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: true
      };

      setPromotions(prev => [newPromotion, ...prev]);
      setFormData({
        title: '',
        description: '',
        discount_percent: '',
        start_date: '',
        end_date: '',
      });
      setShowAddForm(false);

      toast({
        title: "Succès",
        description: "Promotion créée et visible pour les clients",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la promotion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
        
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Promotion
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{promotions.length}</div>
            <div className="text-sm text-muted-foreground">Total Promotions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {promotions.filter(p => p.is_active).length}
            </div>
            <div className="text-sm text-muted-foreground">Actives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {promotions.filter(p => new Date(p.end_date) < new Date()).length}
            </div>
            <div className="text-sm text-muted-foreground">Expirées</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nouvelle Promotion
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  value={formData.discount_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                  placeholder="Ex: 20"
                />
              </div>
              
              <div>
                <Label htmlFor="start_date">Date de début</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">Date de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
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
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddPromotion} disabled={loading}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Créer & Publier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des promotions */}
      {promotions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune promotion</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première promotion pour attirer les clients
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une promotion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promotion) => (
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {promotion.description}
                      </p>
                    </div>
                    <Badge variant={promotion.is_active ? 'default' : 'secondary'}>
                      {promotion.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {(promotion.start_date || promotion.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {promotion.start_date && new Date(promotion.start_date).toLocaleDateString('fr-CA')}
                      {promotion.start_date && promotion.end_date && ' - '}
                      {promotion.end_date && new Date(promotion.end_date).toLocaleDateString('fr-CA')}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Aperçu
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}