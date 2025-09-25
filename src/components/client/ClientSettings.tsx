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
  User, 
  Bell, 
  Shield, 
  MapPin, 
  CreditCard, 
  Heart,
  Settings,
  Save,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ClientSettings: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [address, setAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // États pour les paramètres
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    province: ''
  });

  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false
    },
    delivery: {
      preferred_time: 'anytime',
      delivery_instructions: '',
      contact_method: 'phone'
    },
    privacy: {
      share_data: false,
      analytics: true,
      cookies: true
    }
  });

  const [addresses, setAddresses] = useState([
    {
      id: '1',
      name: 'Domicile',
      address: '123 Rue Principale',
      city: 'Valleyfield',
      postal_code: 'J6T 1A1',
      is_default: true
    },
    {
      id: '2',
      name: 'Bureau',
      address: '456 Avenue du Commerce',
      city: 'Valleyfield',
      postal_code: 'J6T 2B2',
      is_default: false
    }
  ]);

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      is_default: true
    }
  ]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        province: profile.province || ''
      });
      setAddress(profile.address || '');
    }
  }, [profile]);

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profile?.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceUpdate = async (section: string, key: string, value: any) => {
    try {
      const newPreferences = {
        ...preferences,
        [section]: {
          ...preferences[section as keyof typeof preferences],
          [key]: value
        }
      };
      
      setPreferences(newPreferences);

      // Sauvegarder en base de données
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: profile?.id,
          preferences: newPreferences
        });

      if (error) throw error;

      toast({
        title: "Préférence mise à jour",
        description: "Vos préférences ont été sauvegardées",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences",
        variant: "destructive"
      });
    }
  };

  const handleSaveAddress = async () => {
    if (address.length < 5) {
      toast({
        title: "Erreur de validation",
        description: "L'adresse doit contenir au moins 5 caractères",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ address: address })
        .eq('id', profile?.id);

      if (error) throw error;

      toast({
        title: "Adresse mise à jour",
        description: "Votre adresse a été sauvegardée avec succès",
        variant: "success"
      });
      
      setIsEditingAddress(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'adresse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'adresse",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAddress = () => {
    const newAddress = {
      id: Date.now().toString(),
      name: 'Nouvelle adresse',
      address: '',
      city: '',
      postal_code: '',
      is_default: false
    };
    setAddresses([...addresses, newAddress]);
  };

  const removeAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      is_default: addr.id === id
    })));
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Paramètres du compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations personnelles, préférences et paramètres de compte
          </p>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="addresses">Adresses</TabsTrigger>
          <TabsTrigger value="payment">Paiement</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={profileData.postal_code}
                    onChange={(e) => setProfileData(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={isLoading}>
                {isLoading ? (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Préférences de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) => 
                      handlePreferenceUpdate('notifications', 'email', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">Notifications SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par SMS
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={preferences.notifications.sms}
                    onCheckedChange={(checked) => 
                      handlePreferenceUpdate('notifications', 'sms', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Notifications push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications push
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={preferences.notifications.push}
                    onCheckedChange={(checked) => 
                      handlePreferenceUpdate('notifications', 'push', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-notifications">Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des offres et promotions
                    </p>
                  </div>
                  <Switch
                    id="marketing-notifications"
                    checked={preferences.notifications.marketing}
                    onCheckedChange={(checked) => 
                      handlePreferenceUpdate('notifications', 'marketing', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Préférences de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferred-time">Heure de livraison préférée</Label>
                <select
                  id="preferred-time"
                  className="w-full p-2 border rounded-md"
                  value={preferences.delivery.preferred_time}
                  onChange={(e) => 
                    handlePreferenceUpdate('delivery', 'preferred_time', e.target.value)
                  }
                >
                  <option value="anytime">N'importe quand</option>
                  <option value="morning">Matin (8h-12h)</option>
                  <option value="afternoon">Après-midi (12h-17h)</option>
                  <option value="evening">Soir (17h-20h)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="delivery-instructions">Instructions de livraison</Label>
                <textarea
                  id="delivery-instructions"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  value={preferences.delivery.delivery_instructions}
                  onChange={(e) => 
                    handlePreferenceUpdate('delivery', 'delivery_instructions', e.target.value)
                  }
                  placeholder="Ex: Sonner à la porte d'entrée, laisser au bureau..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6">
          {/* Adresse principale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Mon adresse principale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditingAddress ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Adresse actuelle</p>
                    <p className="font-medium">{address || 'Aucune adresse enregistrée'}</p>
                  </div>
                  <Button 
                    onClick={() => setIsEditingAddress(true)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier l'adresse
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Adresse complète</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="123 Rue Principale, Valleyfield, QC J6T 1A1"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Minimum 5 caractères requis
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveAddress}
                      disabled={isLoading || address.length < 5}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingAddress(false);
                        setAddress(profile?.address || '');
                      }}
                      disabled={isLoading}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adresses de livraison supplémentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresses de livraison supplémentaires
                </div>
                <Button onClick={addAddress} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{addr.name}</h4>
                        {addr.is_default && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!addr.is_default && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultAddress(addr.id)}
                          >
                            Définir par défaut
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeAddress(addr.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {addr.address}, {addr.city} {addr.postal_code}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Méthodes de paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{method.brand} •••• {method.last4}</p>
                          <p className="text-sm text-muted-foreground">
                            Expire {method.expiry}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && (
                          <Badge variant="default" className="bg-green-600">
                            Par défaut
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
