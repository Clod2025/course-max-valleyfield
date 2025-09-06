import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Settings, 
  DollarSign,
  Navigation,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliverySettings {
  mapbox_access_token: string;
  delivery_fee_0_3km: number;
  delivery_fee_3_6km: number;
  delivery_fee_6_10km: number;
  delivery_fee_10plus_km: number;
  delivery_fee_long_distance_bonus: number;
  delivery_max_distance_km: number;
  delivery_estimated_time_buffer_minutes: number;
}

export const DeliverySettings: React.FC = () => {
  const [settings, setSettings] = useState<DeliverySettings>({
    mapbox_access_token: '',
    delivery_fee_0_3km: 5.00,
    delivery_fee_3_6km: 7.00,
    delivery_fee_6_10km: 10.00,
    delivery_fee_10plus_km: 12.00,
    delivery_fee_long_distance_bonus: 2.00,
    delivery_max_distance_km: 25.0,
    delivery_estimated_time_buffer_minutes: 15
  });

  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', [
          'mapbox_access_token',
          'delivery_fee_0_3km',
          'delivery_fee_3_6km',
          'delivery_fee_6_10km',
          'delivery_fee_10plus_km',
          'delivery_fee_long_distance_bonus',
          'delivery_max_distance_km',
          'delivery_estimated_time_buffer_minutes'
        ]);

      if (error) throw error;

      const newSettings = { ...settings };
      data?.forEach(setting => {
        const key = setting.key as keyof DeliverySettings;
        if (key === 'mapbox_access_token') {
          newSettings[key] = setting.value as string;
        } else {
          newSettings[key] = parseFloat(setting.value as string);
        }
      });

      setSettings(newSettings);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: key === 'mapbox_access_token' ? value : value.toString(),
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Paramètres de livraison sauvegardés",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof DeliverySettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Paramètres de Livraison
        </h2>
        <p className="text-muted-foreground">
          Configurez les paramètres de calcul des frais de livraison et l'intégration Mapbox
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Mapbox */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Configuration Mapbox
            </CardTitle>
            <CardDescription>
              Token d'accès pour l'API Mapbox Distance Matrix
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mapbox-token">Token d'accès Mapbox</Label>
              <div className="flex gap-2">
                <Input
                  id="mapbox-token"
                  type={showToken ? "text" : "password"}
                  value={settings.mapbox_access_token}
                  onChange={(e) => handleSettingChange('mapbox_access_token', e.target.value)}
                  placeholder="pk.eyJ1Ijoi..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Obtenez votre token sur <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
              </p>
            </div>

            <div>
              <Label htmlFor="max-distance">Distance maximale (km)</Label>
              <Input
                id="max-distance"
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={settings.delivery_max_distance_km}
                onChange={(e) => handleSettingChange('delivery_max_distance_km', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="time-buffer">Buffer de temps (minutes)</Label>
              <Input
                id="time-buffer"
                type="number"
                min="0"
                max="60"
                value={settings.delivery_estimated_time_buffer_minutes}
                onChange={(e) => handleSettingChange('delivery_estimated_time_buffer_minutes', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Grille tarifaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Grille Tarifaire
            </CardTitle>
            <CardDescription>
              Définissez les frais de livraison par tranche de distance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fee-0-3">0-3 km</Label>
                <Input
                  id="fee-0-3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.delivery_fee_0_3km}
                  onChange={(e) => handleSettingChange('delivery_fee_0_3km', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="fee-3-6">3-6 km</Label>
                <Input
                  id="fee-3-6"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.delivery_fee_3_6km}
                  onChange={(e) => handleSettingChange('delivery_fee_3_6km', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="fee-6-10">6-10 km</Label>
                <Input
                  id="fee-6-10"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.delivery_fee_6_10km}
                  onChange={(e) => handleSettingChange('delivery_fee_6_10km', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="fee-10plus">10+ km</Label>
                <Input
                  id="fee-10plus"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.delivery_fee_10plus_km}
                  onChange={(e) => handleSettingChange('delivery_fee_10plus_km', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="long-distance-bonus">Bonus longue distance (>15km)</Label>
              <Input
                id="long-distance-bonus"
                type="number"
                step="0.01"
                min="0"
                value={settings.delivery_fee_long_distance_bonus}
                onChange={(e) => handleSettingChange('delivery_fee_long_distance_bonus', parseFloat(e.target.value))}
              />
            </div>

            {/* Aperçu de la grille */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Aperçu de la grille</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>0-3 km:</span>
                  <Badge variant="outline">{settings.delivery_fee_0_3km.toFixed(2)}$</Badge>
                </div>
                <div className="flex justify-between">
                  <span>3-6 km:</span>
                  <Badge variant="outline">{settings.delivery_fee_3_6km.toFixed(2)}$</Badge>
                </div>
                <div className="flex justify-between">
                  <span>6-10 km:</span>
                  <Badge variant="outline">{settings.delivery_fee_6_10km.toFixed(2)}$</Badge>
                </div>
                <div className="flex justify-between">
                  <span>10+ km:</span>
                  <Badge variant="outline">{settings.delivery_fee_10plus_km.toFixed(2)}$</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Bonus >15km:</span>
                  <Badge variant="outline">+{settings.delivery_fee_long_distance_bonus.toFixed(2)}$</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  );
};

export default DeliverySettings;
