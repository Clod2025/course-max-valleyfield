import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  MapPin, 
  Save, 
  Plus, 
  Trash2,
  Edit
} from 'lucide-react';

interface PricingTier {
  id: string;
  min_distance: number;
  max_distance: number;
  price: number;
  description: string;
}

const DeliveryPricing = () => {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingTiers();
  }, []);

  const fetchPricingTiers = async () => {
    setLoading(true);
    try {
      // Simuler des données pour l'instant
      const mockTiers: PricingTier[] = [
        {
          id: '1',
          min_distance: 0,
          max_distance: 3,
          price: 5,
          description: 'Livraison locale (0-3 km)'
        },
        {
          id: '2',
          min_distance: 3,
          max_distance: 6,
          price: 7,
          description: 'Livraison moyenne (3-6 km)'
        },
        {
          id: '3',
          min_distance: 6,
          max_distance: 10,
          price: 10,
          description: 'Livraison longue (6-10 km)'
        },
        {
          id: '4',
          min_distance: 10,
          max_distance: 999,
          price: 12,
          description: 'Livraison extra-longue (+10 km)'
        }
      ];
      setPricingTiers(mockTiers);
    } catch (error) {
      console.error('Erreur lors du chargement des tarifs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTier = (tier: PricingTier) => {
    // Logique de sauvegarde
    console.log('Sauvegarde du tarif:', tier);
    setEditingTier(null);
  };

  const handleAddTier = () => {
    const newTier: PricingTier = {
      id: Date.now().toString(),
      min_distance: 0,
      max_distance: 0,
      price: 0,
      description: ''
    };
    setPricingTiers([...pricingTiers, newTier]);
    setEditingTier(newTier.id);
  };

  const handleDeleteTier = (id: string) => {
    setPricingTiers(pricingTiers.filter(tier => tier.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des tarifs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tarification de Livraison</h2>
          <p className="text-muted-foreground">Configurez les tarifs selon la distance</p>
        </div>
        <Button onClick={handleAddTier}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Tarif
        </Button>
      </div>

      {/* Liste des tarifs */}
      <div className="grid gap-4">
        {pricingTiers.map((tier) => (
          <Card key={tier.id}>
            <CardContent className="p-6">
              {editingTier === tier.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`min-${tier.id}`}>Distance min (km)</Label>
                      <Input
                        id={`min-${tier.id}`}
                        type="number"
                        value={tier.min_distance}
                        onChange={(e) => {
                          const updatedTiers = pricingTiers.map(t => 
                            t.id === tier.id ? { ...t, min_distance: Number(e.target.value) } : t
                          );
                          setPricingTiers(updatedTiers);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`max-${tier.id}`}>Distance max (km)</Label>
                      <Input
                        id={`max-${tier.id}`}
                        type="number"
                        value={tier.max_distance}
                        onChange={(e) => {
                          const updatedTiers = pricingTiers.map(t => 
                            t.id === tier.id ? { ...t, max_distance: Number(e.target.value) } : t
                          );
                          setPricingTiers(updatedTiers);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`price-${tier.id}`}>Prix ($)</Label>
                    <Input
                      id={`price-${tier.id}`}
                      type="number"
                      value={tier.price}
                      onChange={(e) => {
                        const updatedTiers = pricingTiers.map(t => 
                          t.id === tier.id ? { ...t, price: Number(e.target.value) } : t
                        );
                        setPricingTiers(updatedTiers);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`desc-${tier.id}`}>Description</Label>
                    <Input
                      id={`desc-${tier.id}`}
                      value={tier.description}
                      onChange={(e) => {
                        const updatedTiers = pricingTiers.map(t => 
                          t.id === tier.id ? { ...t, description: e.target.value } : t
                        );
                        setPricingTiers(updatedTiers);
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveTier(tier)}>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button variant="outline" onClick={() => setEditingTier(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tier.description}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{tier.min_distance} - {tier.max_distance === 999 ? '∞' : tier.max_distance} km</span>
                        <Badge className="bg-green-500">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {tier.price}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingTier(tier.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTier(tier.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {pricingTiers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun tarif configuré</h3>
            <p className="text-muted-foreground">
              Ajoutez des tarifs de livraison pour commencer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliveryPricing;
