import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Percent, 
  Save,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CommissionSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [commissionRates, setCommissionRates] = useState({
    delivery_fee_commission: 15, // % sur les frais de livraison
    platform_commission: 5, // % sur les ventes des marchands
    driver_commission: 80, // % des frais de livraison pour le livreur
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Commissions mises à jour",
        description: "Les nouveaux taux de commission ont été sauvegardés",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les commissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestion des Commissions</h2>
          <p className="text-muted-foreground">
            Configurez les taux de commission de la plateforme
          </p>
        </div>
      </div>

      {/* Configuration des commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Taux de Commission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="platform_commission">Commission Plateforme (%)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="platform_commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRates.platform_commission}
                  onChange={(e) => setCommissionRates(prev => ({
                    ...prev,
                    platform_commission: parseFloat(e.target.value) || 0
                  }))}
                />
                <Percent className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Commission sur les ventes des marchands
              </p>
            </div>
            
            <div>
              <Label htmlFor="delivery_fee_commission">Commission Frais de Livraison (%)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="delivery_fee_commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRates.delivery_fee_commission}
                  onChange={(e) => setCommissionRates(prev => ({
                    ...prev,
                    delivery_fee_commission: parseFloat(e.target.value) || 0
                  }))}
                />
                <Percent className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Commission sur les frais de livraison
              </p>
            </div>
            
            <div>
              <Label htmlFor="driver_commission">Part du Livreur (%)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="driver_commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRates.driver_commission}
                  onChange={(e) => setCommissionRates(prev => ({
                    ...prev,
                    driver_commission: parseFloat(e.target.value) || 0
                  }))}
                />
                <Percent className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Part des frais de livraison pour le livreur
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulation */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation de Commission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3">Exemple : Commande de 50$ avec livraison de 5$</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-green-600">
                  {(50 * (100 - commissionRates.platform_commission) / 100).toFixed(2)}$
                </div>
                <div className="text-sm text-muted-foreground">Pour le Marchand</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-blue-600">
                  {(5 * commissionRates.driver_commission / 100).toFixed(2)}$
                </div>
                <div className="text-sm text-muted-foreground">Pour le Livreur</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-purple-600">
                  {(50 * commissionRates.platform_commission / 100 + 5 * (100 - commissionRates.driver_commission) / 100).toFixed(2)}$
                </div>
                <div className="text-sm text-muted-foreground">Pour la Plateforme</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

