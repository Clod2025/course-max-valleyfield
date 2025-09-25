import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Settings, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Info,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LoyaltySettingsData {
  id: string;
  loyalty_enabled: boolean;
  loyalty_earn_rate: number;
  loyalty_redeem_rate: number;
  min_redemption_points: number;
  max_redemption_percentage: number;
  points_expiry_days: number;
  is_active: boolean;
}

export const LoyaltySettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LoyaltySettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Charger les paramètres
  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Sauvegarder les paramètres
  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('loyalty_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de fidélité ont été mis à jour",
        variant: "success"
      });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof LoyaltySettingsData, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const calculateExampleEarnings = (amount: number) => {
    if (!settings) return 0;
    return Math.floor(amount * settings.loyalty_earn_rate);
  };

  const calculateExampleRedemption = (points: number) => {
    if (!settings) return 0;
    return points * settings.loyalty_redeem_rate;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des paramètres...</p>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Paramètres non disponibles</h3>
          <p className="text-muted-foreground">
            Impossible de charger les paramètres de fidélité
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-600" />
            Configuration du Système de Fidélité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configurez les paramètres du programme de fidélité pour vos clients
          </p>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="earnings">Gains</TabsTrigger>
          <TabsTrigger value="redemption">Échanges</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Paramètres généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="loyalty-enabled" className="text-base">
                    Activer le système de fidélité
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux clients de gagner et utiliser des points de fidélité
                  </p>
                </div>
                <Switch
                  id="loyalty-enabled"
                  checked={settings.loyalty_enabled}
                  onCheckedChange={(checked) => handleChange('loyalty_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is-active" className="text-base">
                    Système actif
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Le système est actuellement en service
                  </p>
                </div>
                <Switch
                  id="is-active"
                  checked={settings.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
              </div>

              <div>
                <Label htmlFor="points-expiry">Expiration des points (jours)</Label>
                <Input
                  id="points-expiry"
                  type="number"
                  min="30"
                  max="1095"
                  value={settings.points_expiry_days}
                  onChange={(e) => handleChange('points_expiry_days', parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Les points expirent après {settings.points_expiry_days} jours d'inactivité
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Paramètres de gains
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="earn-rate">Points par dollar dépensé</Label>
                <Input
                  id="earn-rate"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={settings.loyalty_earn_rate}
                  onChange={(e) => handleChange('loyalty_earn_rate', parseFloat(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Les clients gagnent {settings.loyalty_earn_rate} point(s) par dollar dépensé
                </p>
              </div>

              {/* Exemple de calcul */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Exemple de calcul</h4>
                <div className="space-y-2 text-sm">
                  <p>Commande de 50$ = {calculateExampleEarnings(50)} points</p>
                  <p>Commande de 100$ = {calculateExampleEarnings(100)} points</p>
                  <p>Commande de 200$ = {calculateExampleEarnings(200)} points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemption" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Paramètres d'échange
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="redeem-rate">Valeur d'un point (en dollars)</Label>
                <Input
                  id="redeem-rate"
                  type="number"
                  min="0.001"
                  max="1"
                  step="0.001"
                  value={settings.loyalty_redeem_rate}
                  onChange={(e) => handleChange('loyalty_redeem_rate', parseFloat(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  1 point = {settings.loyalty_redeem_rate}$ de réduction
                </p>
              </div>

              <div>
                <Label htmlFor="min-redemption">Points minimum pour échanger</Label>
                <Input
                  id="min-redemption"
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.min_redemption_points}
                  onChange={(e) => handleChange('min_redemption_points', parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Les clients doivent avoir au moins {settings.min_redemption_points} points pour échanger
                </p>
              </div>

              <div>
                <Label htmlFor="max-percentage">Pourcentage maximum de réduction par commande</Label>
                <Input
                  id="max-percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.max_redemption_percentage}
                  onChange={(e) => handleChange('max_redemption_percentage', parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum {settings.max_redemption_percentage}% de réduction par commande
                </p>
              </div>

              {/* Exemple d'échange */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">Exemple d'échange</h4>
                <div className="space-y-2 text-sm">
                  <p>{settings.min_redemption_points} points = {calculateExampleRedemption(settings.min_redemption_points).toFixed(2)}$ de réduction</p>
                  <p>100 points = {calculateExampleRedemption(100).toFixed(2)}$ de réduction</p>
                  <p>500 points = {calculateExampleRedemption(500).toFixed(2)}$ de réduction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Aperçu du système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Comment gagner des points
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>• 1$ dépensé = {settings.loyalty_earn_rate} point</p>
                    <p>• Points valides {settings.points_expiry_days} jours</p>
                    <p>• Points ajoutés automatiquement après commande</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Comment utiliser les points
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>• Minimum {settings.min_redemption_points} points requis</p>
                    <p>• 1 point = {settings.loyalty_redeem_rate}$ de réduction</p>
                    <p>• Maximum {settings.max_redemption_percentage}% de réduction par commande</p>
                  </div>
                </div>
              </div>

              {/* Exemple complet */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-3">Exemple complet</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Commande de 100$ :</strong></p>
                  <p>• Points gagnés : {calculateExampleEarnings(100)} points</p>
                  <p>• Valeur des points : {calculateExampleRedemption(calculateExampleEarnings(100)).toFixed(2)}$</p>
                  <p>• Réduction maximale : {Math.min(100 * settings.max_redemption_percentage / 100, calculateExampleRedemption(calculateExampleEarnings(100))).toFixed(2)}$</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Sauvegarder les modifications</h3>
              <p className="text-sm text-muted-foreground">
                Les modifications prendront effet immédiatement
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
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
        </CardContent>
      </Card>

      {/* Erreurs */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LoyaltySettings;
