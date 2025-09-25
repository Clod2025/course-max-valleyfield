import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  MapPin, 
  Clock, 
  Settings, 
  Save, 
  RotateCcw,
  TestTube,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryPricingConfig {
  id?: string;
  baseFee: number;
  pricePerKm: number;
  freeDeliveryThreshold: number;
  maxFreeDistance: number;
  remoteZoneFee: number;
  remoteZoneDistance: number;
  multiStopFee: number;
  rushHourMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlotConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  multiplier: number;
  isActive: boolean;
}

export interface ZoneConfig {
  id: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  fee: number;
  isActive: boolean;
}

export const DeliveryPricingConfig: React.FC = () => {
  const [config, setConfig] = useState<DeliveryPricingConfig>({
    baseFee: 2.99,
    pricePerKm: 0.50,
    freeDeliveryThreshold: 25.00,
    maxFreeDistance: 5,
    remoteZoneFee: 5.00,
    remoteZoneDistance: 15,
    multiStopFee: 3.00,
    rushHourMultiplier: 1.5,
    weekendMultiplier: 1.2,
    holidayMultiplier: 1.3,
    isActive: true
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([
    {
      id: 'rush-morning',
      name: 'Heure de pointe matin',
      startTime: '07:00',
      endTime: '09:00',
      multiplier: 1.5,
      isActive: true
    },
    {
      id: 'rush-evening',
      name: 'Heure de pointe soir',
      startTime: '17:00',
      endTime: '19:00',
      multiplier: 1.5,
      isActive: true
    },
    {
      id: 'night',
      name: 'Livraison nocturne',
      startTime: '22:00',
      endTime: '06:00',
      multiplier: 2.0,
      isActive: false
    }
  ]);

  const [zones, setZones] = useState<ZoneConfig[]>([
    {
      id: 'downtown',
      name: 'Centre-ville',
      coordinates: [],
      fee: 0,
      isActive: true
    },
    {
      id: 'suburbs',
      name: 'Banlieue',
      coordinates: [],
      fee: 2.00,
      isActive: true
    },
    {
      id: 'remote',
      name: 'Zone éloignée',
      coordinates: [],
      fee: 5.00,
      isActive: true
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      // Charger la configuration depuis Supabase
      const { data, error } = await supabase
        .from('delivery_pricing_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      }

      // Charger les créneaux horaires
      const { data: timeSlotsData } = await supabase
        .from('delivery_time_slots')
        .select('*')
        .order('start_time');

      if (timeSlotsData) {
        setTimeSlots(timeSlotsData);
      }

      // Charger les zones
      const { data: zonesData } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true);

      if (zonesData) {
        setZones(zonesData);
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);

      // Sauvegarder la configuration principale
      const { error: configError } = await supabase
        .from('delivery_pricing_config')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        });

      if (configError) throw configError;

      // Sauvegarder les créneaux horaires
      for (const slot of timeSlots) {
        const { error: slotError } = await supabase
          .from('delivery_time_slots')
          .upsert(slot);

        if (slotError) throw slotError;
      }

      // Sauvegarder les zones
      for (const zone of zones) {
        const { error: zoneError } = await supabase
          .from('delivery_zones')
          .upsert(zone);

        if (zoneError) throw zoneError;
      }

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de tarification ont été mis à jour",
      });

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testPricing = async () => {
    try {
      // Simulation de tests de tarification
      const testCases = [
        {
          name: "Commande simple proche",
          distance: 2,
          orderValue: 15,
          timeSlot: "normal",
          expectedFee: 2.99
        },
        {
          name: "Commande avec livraison gratuite",
          distance: 3,
          orderValue: 30,
          timeSlot: "normal",
          expectedFee: 0
        },
        {
          name: "Zone éloignée",
          distance: 20,
          orderValue: 20,
          timeSlot: "normal",
          expectedFee: 12.99
        },
        {
          name: "Heure de pointe",
          distance: 5,
          orderValue: 25,
          timeSlot: "rush",
          expectedFee: 4.49
        }
      ];

      const results = testCases.map(testCase => {
        const baseFee = testCase.orderValue >= config.freeDeliveryThreshold ? 0 : config.baseFee;
        const distanceFee = testCase.distance > config.maxFreeDistance 
          ? (testCase.distance - config.maxFreeDistance) * config.pricePerKm 
          : 0;
        const remoteFee = testCase.distance > config.remoteZoneDistance ? config.remoteZoneFee : 0;
        const timeMultiplier = testCase.timeSlot === 'rush' ? config.rushHourMultiplier : 1;
        
        const totalFee = (baseFee + distanceFee + remoteFee) * timeMultiplier;

        return {
          ...testCase,
          calculatedFee: Math.round(totalFee * 100) / 100,
          passed: Math.abs(totalFee - testCase.expectedFee) < 0.01
        };
      });

      setTestResults(results);

      toast({
        title: "Tests terminés",
        description: `${results.filter(r => r.passed).length}/${results.length} tests réussis`,
      });

    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Impossible d'exécuter les tests",
        variant: "destructive"
      });
    }
  };

  const resetToDefaults = () => {
    setConfig({
      baseFee: 2.99,
      pricePerKm: 0.50,
      freeDeliveryThreshold: 25.00,
      maxFreeDistance: 5,
      remoteZoneFee: 5.00,
      remoteZoneDistance: 15,
      multiStopFee: 3.00,
      rushHourMultiplier: 1.5,
      weekendMultiplier: 1.2,
      holidayMultiplier: 1.3,
      isActive: true
    });

    toast({
      title: "Configuration réinitialisée",
      description: "Les valeurs par défaut ont été restaurées",
    });
  };

  const updateConfig = (field: keyof DeliveryPricingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlotConfig = {
      id: `slot_${Date.now()}`,
      name: 'Nouveau créneau',
      startTime: '00:00',
      endTime: '23:59',
      multiplier: 1.0,
      isActive: true
    };
    setTimeSlots(prev => [...prev, newSlot]);
  };

  const updateTimeSlot = (id: string, field: keyof TimeSlotConfig, value: any) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de la configuration...</p>
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
            <DollarSign className="w-6 h-6" />
            Configuration de la Tarification de Livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Configurez les tarifs de livraison pour optimiser les revenus et la satisfaction client
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config.isActive ? "default" : "secondary"}>
                {config.isActive ? "Actif" : "Inactif"}
              </Badge>
              <Switch
                checked={config.isActive}
                onCheckedChange={(checked) => updateConfig('isActive', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration principale */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Tarifs de base</TabsTrigger>
          <TabsTrigger value="time">Créneaux horaires</TabsTrigger>
          <TabsTrigger value="zones">Zones géographiques</TabsTrigger>
          <TabsTrigger value="test">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="baseFee">Frais de base ($)</Label>
                    <Input
                      id="baseFee"
                      type="number"
                      step="0.01"
                      value={config.baseFee}
                      onChange={(e) => updateConfig('baseFee', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Frais fixes appliqués à chaque livraison
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="pricePerKm">Prix par kilomètre ($)</Label>
                    <Input
                      id="pricePerKm"
                      type="number"
                      step="0.01"
                      value={config.pricePerKm}
                      onChange={(e) => updateConfig('pricePerKm', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="freeDeliveryThreshold">Seuil livraison gratuite ($)</Label>
                    <Input
                      id="freeDeliveryThreshold"
                      type="number"
                      step="0.01"
                      value={config.freeDeliveryThreshold}
                      onChange={(e) => updateConfig('freeDeliveryThreshold', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxFreeDistance">Distance gratuite (km)</Label>
                    <Input
                      id="maxFreeDistance"
                      type="number"
                      value={config.maxFreeDistance}
                      onChange={(e) => updateConfig('maxFreeDistance', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="remoteZoneFee">Supplément zone éloignée ($)</Label>
                    <Input
                      id="remoteZoneFee"
                      type="number"
                      step="0.01"
                      value={config.remoteZoneFee}
                      onChange={(e) => updateConfig('remoteZoneFee', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="remoteZoneDistance">Distance zone éloignée (km)</Label>
                    <Input
                      id="remoteZoneDistance"
                      type="number"
                      value={config.remoteZoneDistance}
                      onChange={(e) => updateConfig('remoteZoneDistance', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="multiStopFee">Supplément arrêt multiple ($)</Label>
                    <Input
                      id="multiStopFee"
                      type="number"
                      step="0.01"
                      value={config.multiStopFee}
                      onChange={(e) => updateConfig('multiStopFee', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Multiplicateurs temporels</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="rushMultiplier" className="text-xs">Heures de pointe</Label>
                        <Input
                          id="rushMultiplier"
                          type="number"
                          step="0.1"
                          value={config.rushHourMultiplier}
                          onChange={(e) => updateConfig('rushHourMultiplier', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weekendMultiplier" className="text-xs">Weekend</Label>
                        <Input
                          id="weekendMultiplier"
                          type="number"
                          step="0.1"
                          value={config.weekendMultiplier}
                          onChange={(e) => updateConfig('weekendMultiplier', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="holidayMultiplier" className="text-xs">Jours fériés</Label>
                        <Input
                          id="holidayMultiplier"
                          type="number"
                          step="0.1"
                          value={config.holidayMultiplier}
                          onChange={(e) => updateConfig('holidayMultiplier', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>C Créneaux horaires</span>
                <Button onClick={addTimeSlot} size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Ajouter un créneau
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs">Nom</Label>
                        <Input
                          value={slot.name}
                          onChange={(e) => updateTimeSlot(slot.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Début</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fin</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Multiplicateur</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={slot.multiplier}
                          onChange={(e) => updateTimeSlot(slot.id, 'multiplier', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={slot.isActive}
                        onCheckedChange={(checked) => updateTimeSlot(slot.id, 'isActive', checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(slot.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zones géographiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">{zone.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Supplément: {zone.fee.toFixed(2)}$
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.isActive}
                        onCheckedChange={(checked) => 
                          setZones(prev => 
                            prev.map(z => z.id === zone.id ? { ...z, isActive: checked } : z)
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Tests de tarification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testPricing} className="w-full">
                  <TestTube className="w-4 h-4 mr-2" />
                  Exécuter les tests
                </Button>

                {testResults && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Résultats des tests</h4>
                    {testResults.map((result: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Distance: {result.distance}km, Commande: {result.orderValue}$
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {result.calculatedFee.toFixed(2)}$ (attendu: {result.expectedFee.toFixed(2)}$)
                          </p>
                          <div className="flex items-center gap-1">
                            {result.passed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={result.passed ? "text-green-600" : "text-red-600"}>
                              {result.passed ? "Réussi" : "Échec"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
        <Button
          onClick={saveConfig}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
};
