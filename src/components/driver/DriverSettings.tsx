import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  User, 
  Bell, 
  MapPin,
  Truck,
  Shield,
  Save
} from 'lucide-react';

export const DriverSettings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // États pour les paramètres
  const [personalInfo, setPersonalInfo] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phone: profile?.phone || '',
    address: profile?.address || ''
  });

  const [notifications, setNotifications] = useState({
    newDeliveries: true,
    paymentAlerts: true,
    systemUpdates: false,
    promotions: false
  });

  const [workPreferences, setWorkPreferences] = useState({
    maxDistance: 15,
    autoAccept: false,
    workingHours: {
      start: '08:00',
      end: '20:00'
    }
  });

  const handleSavePersonalInfo = async () => {
    setLoading(true);
    try {
      // Logique de sauvegarde des informations personnelles
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation API
      
      toast({
        title: "Informations sauvegardées",
        description: "Vos informations personnelles ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les informations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // Logique de sauvegarde des préférences de notifications
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation API
      
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences de notifications ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkPreferences = async () => {
    setLoading(true);
    try {
      // Logique de sauvegarde des préférences de travail
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation API
      
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences de travail ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Configurez vos préférences et informations</p>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Informations Personnelles</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="work">Préférences de Travail</TabsTrigger>
        </TabsList>

        {/* Informations Personnelles */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                  placeholder="(450) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                  placeholder="Votre adresse complète"
                />
              </div>

              <Button onClick={handleSavePersonalInfo} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Préférences de Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Nouvelles livraisons</h4>
                  <p className="text-sm text-muted-foreground">Recevoir des notifications pour les nouvelles assignations</p>
                </div>
                <Switch
                  checked={notifications.newDeliveries}
                  onCheckedChange={(checked) => setNotifications({...notifications, newDeliveries: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Alertes de paiement</h4>
                  <p className="text-sm text-muted-foreground">Notifications pour les paiements reçus</p>
                </div>
                <Switch
                  checked={notifications.paymentAlerts}
                  onCheckedChange={(checked) => setNotifications({...notifications, paymentAlerts: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Mises à jour système</h4>
                  <p className="text-sm text-muted-foreground">Notifications pour les mises à jour de l'application</p>
                </div>
                <Switch
                  checked={notifications.systemUpdates}
                  onCheckedChange={(checked) => setNotifications({...notifications, systemUpdates: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Promotions</h4>
                  <p className="text-sm text-muted-foreground">Recevoir des offres promotionnelles</p>
                </div>
                <Switch
                  checked={notifications.promotions}
                  onCheckedChange={(checked) => setNotifications({...notifications, promotions: checked})}
                />
              </div>

              <Button onClick={handleSaveNotifications} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder les Préférences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Préférences de Travail */}
        <TabsContent value="work">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Préférences de Travail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="maxDistance">Distance maximale (km)</Label>
                <Input
                  id="maxDistance"
                  type="number"
                  value={workPreferences.maxDistance}
                  onChange={(e) => setWorkPreferences({...workPreferences, maxDistance: parseInt(e.target.value)})}
                  min="1"
                  max="50"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Distance maximale que vous êtes prêt à parcourir pour une livraison
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Acceptation automatique</h4>
                  <p className="text-sm text-muted-foreground">Accepter automatiquement les livraisons dans votre zone</p>
                </div>
                <Switch
                  checked={workPreferences.autoAccept}
                  onCheckedChange={(checked) => setWorkPreferences({...workPreferences, autoAccept: checked})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Heure de début</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={workPreferences.workingHours.start}
                    onChange={(e) => setWorkPreferences({
                      ...workPreferences, 
                      workingHours: {...workPreferences.workingHours, start: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Heure de fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={workPreferences.workingHours.end}
                    onChange={(e) => setWorkPreferences({
                      ...workPreferences, 
                      workingHours: {...workPreferences.workingHours, end: e.target.value}
                    })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveWorkPreferences} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder les Préférences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
