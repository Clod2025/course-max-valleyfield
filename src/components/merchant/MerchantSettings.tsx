import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Save,
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MerchantHelpModal } from './MerchantHelpModal';

export function MerchantSettings() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    opening_hours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '17:00', closed: false },
    }
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres ont été mis à jour avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Paramètres du Magasin</h2>
          <p className="text-muted-foreground">
            Configurez les informations de votre magasin
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <MerchantHelpModal />
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Informations du profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil Marchand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{profile?.first_name} {profile?.last_name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge className="mt-1">{profile?.role}</Badge>
            </div>
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Changer photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations du magasin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Informations du Magasin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store_name">Nom du magasin</Label>
              <Input
                id="store_name"
                value={storeSettings.store_name}
                onChange={(e) => setStoreSettings(prev => ({ 
                  ...prev, 
                  store_name: e.target.value 
                }))}
                placeholder="Ex: Épicerie Martin"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={storeSettings.phone}
                onChange={(e) => setStoreSettings(prev => ({ 
                  ...prev, 
                  phone: e.target.value 
                }))}
                placeholder="(450) 123-4567"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email du magasin</Label>
              <Input
                id="email"
                type="email"
                value={storeSettings.email}
                onChange={(e) => setStoreSettings(prev => ({ 
                  ...prev, 
                  email: e.target.value 
                }))}
                placeholder="contact@epicerie-martin.com"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Adresse complète</Label>
              <Input
                id="address"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings(prev => ({ 
                  ...prev, 
                  address: e.target.value 
                }))}
                placeholder="123 Rue Principale, Valleyfield, QC"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description du magasin</Label>
            <Textarea
              id="description"
              value={storeSettings.description}
              onChange={(e) => setStoreSettings(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              placeholder="Décrivez votre magasin, vos spécialités..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Heures d'ouverture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Heures d'ouverture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.key} className="flex items-center gap-4">
                <div className="w-24">
                  <Label className="text-sm font-medium">{day.label}</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!storeSettings.opening_hours[day.key].closed}
                    onChange={(e) => setStoreSettings(prev => ({
                      ...prev,
                      opening_hours: {
                        ...prev.opening_hours,
                        [day.key]: {
                          ...prev.opening_hours[day.key],
                          closed: !e.target.checked
                        }
                      }
                    }))}
                    className="rounded"
                  />
                  <Label className="text-sm">Ouvert</Label>
                </div>
                
                {!storeSettings.opening_hours[day.key].closed && (
                  <>
                    <Input
                      type="time"
                      value={storeSettings.opening_hours[day.key].open}
                      onChange={(e) => setStoreSettings(prev => ({
                        ...prev,
                        opening_hours: {
                          ...prev.opening_hours,
                          [day.key]: {
                            ...prev.opening_hours[day.key],
                            open: e.target.value
                          }
                        }
                      }))}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">à</span>
                    <Input
                      type="time"
                      value={storeSettings.opening_hours[day.key].close}
                      onChange={(e) => setStoreSettings(prev => ({
                        ...prev,
                        opening_hours: {
                          ...prev.opening_hours,
                          [day.key]: {
                            ...prev.opening_hours[day.key],
                            close: e.target.value
                          }
                        }
                      }))}
                      className="w-32"
                    />
                  </>
                )}
                
                {storeSettings.opening_hours[day.key].closed && (
                  <Badge variant="secondary">Fermé</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
