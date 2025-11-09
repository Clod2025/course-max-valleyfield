import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Save,
  Edit,
  Upload,
  Image,
  Settings,
  CreditCard,
  Bell,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StoreData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  opening_hours: string;
  delivery_radius: number;
  delivery_fee: number;
  minimum_order: number;
  is_active: boolean;
  accepts_orders: boolean;
  logo_url?: string;
  banner_url?: string;
}

const StoreSettings = () => {
  const { profile } = useAuth();
  const [isEditing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [storeData, setStoreData] = useState<StoreData>({
    id: '',
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    opening_hours: '',
    delivery_radius: 0,
    delivery_fee: 0,
    minimum_order: 0,
    is_active: true,
    accepts_orders: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      let storeRecord = null;

      if (profile.store_id) {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', profile.store_id)
          .maybeSingle();

        if (error) throw error;
        storeRecord = data;
      }

      if (!storeRecord) {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('manager_id', profile.user_id ?? profile.id)
          .maybeSingle();

        if (error) throw error;
        storeRecord = data;
      }

      if (!storeRecord) {
        setEditing(true);
        setStoreData(prev => ({
          ...prev,
          email: profile.email || '',
          phone: profile.phone || ''
        }));
        return;
      }

      const openingHoursValue = (() => {
        const value = storeRecord.opening_hours;
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.join('\n');
        return '';
      })();

      setStoreData({
        id: storeRecord.id,
        name: storeRecord.name || '',
        description: storeRecord.description || '',
        address: storeRecord.address || '',
        city: storeRecord.city || '',
        postal_code: storeRecord.postal_code || '',
        phone: storeRecord.phone || '',
        email: storeRecord.email || '',
        opening_hours: openingHoursValue,
        delivery_radius: storeRecord.delivery_radius ?? 0,
        delivery_fee: storeRecord.delivery_fee ?? 0,
        minimum_order: storeRecord.minimum_order ?? 0,
        is_active: storeRecord.is_active ?? true,
        accepts_orders: storeRecord.accepts_orders ?? true,
        logo_url: storeRecord.logo_url || undefined,
        banner_url: storeRecord.banner_url || undefined,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données du magasin:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du magasin.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!storeData.name.trim()) {
      errors.name = 'Le nom du magasin est requis';
    }

    if (!storeData.address.trim()) {
      errors.address = 'L\'adresse est requise';
    }

    if (!storeData.city.trim()) {
      errors.city = 'La ville est requise';
    }

    if (!storeData.postal_code.trim()) {
      errors.postal_code = 'Le code postal est requis';
    }

    if (!storeData.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    }

    if (!storeData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!isValidEmail(storeData.email)) {
      errors.email = 'Veuillez entrer un email valide';
    }

    if (storeData.delivery_radius <= 0) {
      errors.delivery_radius = 'Le rayon de livraison doit être supérieur à 0';
    }

    if (storeData.delivery_fee < 0) {
      errors.delivery_fee = 'Les frais de livraison ne peuvent pas être négatifs';
    }

    if (storeData.minimum_order < 0) {
      errors.minimum_order = 'La commande minimum ne peut pas être négative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      if (!profile) {
        throw new Error("Profil marchand introuvable");
      }

      const payload: Record<string, any> = {
        name: storeData.name.trim(),
        description: storeData.description.trim(),
        address: storeData.address.trim(),
        city: storeData.city.trim(),
        postal_code: storeData.postal_code.trim(),
        phone: storeData.phone.trim(),
        email: storeData.email.trim(),
        opening_hours: storeData.opening_hours
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean),
        delivery_radius: Number(storeData.delivery_radius),
        delivery_fee: Number(storeData.delivery_fee),
        minimum_order: Number(storeData.minimum_order),
        is_active: storeData.is_active,
        accepts_orders: storeData.accepts_orders,
        updated_at: new Date().toISOString(),
      };

      let currentStoreId = storeData.id;

      if (currentStoreId) {
        const { error } = await supabase
          .from('stores')
          .update(payload)
          .eq('id', currentStoreId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('stores')
          .insert({
            ...payload,
            manager_id: profile.user_id ?? profile.id,
            is_active: storeData.is_active,
            accepts_orders: storeData.accepts_orders,
          })
          .select('id')
          .single();

        if (error) throw error;
        currentStoreId = data.id;

        await supabase
          .from('profiles')
          .update({ store_id: currentStoreId })
          .eq('user_id', profile.user_id ?? profile.id);

        setStoreData(prev => ({ ...prev, id: currentStoreId }));
      }

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de votre magasin ont été mis à jour",
      });

      setEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StoreData, value: string | number | boolean) => {
    setStoreData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur pour ce champ
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold">Paramètres du Magasin</h2>
        <p className="text-muted-foreground">Gérez les informations et paramètres de votre magasin</p>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Informations Générales
            </CardTitle>
            <Button 
              variant={isEditing ? "default" : "outline"}
              onClick={() => setEditing(!isEditing)}
              disabled={saving}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du magasin *</Label>
              <Input
                id="name"
                value={storeData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={storeData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={storeData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              rows={3}
              placeholder="Décrivez votre magasin..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={storeData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className={formErrors.phone ? 'border-red-500' : ''}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="opening_hours">Heures d'ouverture</Label>
              <Input
                id="opening_hours"
                value={storeData.opening_hours}
                onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                disabled={!isEditing}
                placeholder="9h00 - 18h00"
              />
            </div>
            <div>
              <Label htmlFor="delivery_radius">Rayon de livraison (km) *</Label>
              <Input
                id="delivery_radius"
                type="number"
                min="1"
                value={storeData.delivery_radius}
                onChange={(e) => handleInputChange('delivery_radius', Number(e.target.value))}
                disabled={!isEditing}
                className={formErrors.delivery_radius ? 'border-red-500' : ''}
              />
              {formErrors.delivery_radius && (
                <p className="text-sm text-red-500 mt-1">{formErrors.delivery_radius}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              value={storeData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={!isEditing}
              className={formErrors.address ? 'border-red-500' : ''}
            />
            {formErrors.address && (
              <p className="text-sm text-red-500 mt-1">{formErrors.address}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={storeData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!isEditing}
                className={formErrors.city ? 'border-red-500' : ''}
              />
              {formErrors.city && (
                <p className="text-sm text-red-500 mt-1">{formErrors.city}</p>
              )}
            </div>
            <div>
              <Label htmlFor="postal_code">Code postal *</Label>
              <Input
                id="postal_code"
                value={storeData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                disabled={!isEditing}
                className={formErrors.postal_code ? 'border-red-500' : ''}
              />
              {formErrors.postal_code && (
                <p className="text-sm text-red-500 mt-1">{formErrors.postal_code}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres de livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Paramètres de Livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_fee">Frais de livraison ($) *</Label>
              <Input
                id="delivery_fee"
                type="number"
                step="0.01"
                min="0"
                value={storeData.delivery_fee}
                onChange={(e) => handleInputChange('delivery_fee', Number(e.target.value))}
                disabled={!isEditing}
                className={formErrors.delivery_fee ? 'border-red-500' : ''}
              />
              {formErrors.delivery_fee && (
                <p className="text-sm text-red-500 mt-1">{formErrors.delivery_fee}</p>
              )}
            </div>
            <div>
              <Label htmlFor="minimum_order">Commande minimum ($) *</Label>
              <Input
                id="minimum_order"
                type="number"
                step="0.01"
                min="0"
                value={storeData.minimum_order}
                onChange={(e) => handleInputChange('minimum_order', Number(e.target.value))}
                disabled={!isEditing}
                className={formErrors.minimum_order ? 'border-red-500' : ''}
              />
              {formErrors.minimum_order && (
                <p className="text-sm text-red-500 mt-1">{formErrors.minimum_order}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres d'état */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            État du Magasin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active">Magasin actif</Label>
              <p className="text-sm text-muted-foreground">
                Le magasin est visible pour les clients
              </p>
            </div>
            <Switch
              id="is_active"
              checked={storeData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              disabled={!isEditing}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="accepts_orders">Accepte les commandes</Label>
              <p className="text-sm text-muted-foreground">
                Les clients peuvent passer des commandes
              </p>
            </div>
            <Switch
              id="accepts_orders"
              checked={storeData.accepts_orders}
              onCheckedChange={(checked) => handleInputChange('accepts_orders', checked)}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Images du Magasin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo_url">Logo du magasin</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo_url"
                  value={storeData.logo_url || ''}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  disabled={!isEditing}
                  placeholder="URL du logo"
                />
                <Button variant="outline" size="sm" disabled={!isEditing}>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {storeData.logo_url && (
                <div className="mt-2">
                  <img 
                    src={storeData.logo_url} 
                    alt="Logo" 
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="banner_url">Bannière du magasin</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="banner_url"
                  value={storeData.banner_url || ''}
                  onChange={(e) => handleInputChange('banner_url', e.target.value)}
                  disabled={!isEditing}
                  placeholder="URL de la bannière"
                />
                <Button variant="outline" size="sm" disabled={!isEditing}>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {storeData.banner_url && (
                <div className="mt-2">
                  <img 
                    src={storeData.banner_url} 
                    alt="Bannière" 
                    className="w-full h-20 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setEditing(false);
              fetchStoreData(); // Recharger les données originales
            }}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
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
      )}
    </div>
  );
};

export default StoreSettings;
