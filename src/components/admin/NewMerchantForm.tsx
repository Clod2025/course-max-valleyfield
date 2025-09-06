import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Plus,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function NewMerchantForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Informations personnelles
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    
    // Informations du magasin
    store_name: '',
    store_type: 'grocery',
    description: '',
    address: '',
    city: 'Valleyfield',
    postal_code: '',
    
    // Documents
    business_license: '',
    tax_number: '',
  });

  const storeTypes = [
    { value: 'grocery', label: 'Épicerie' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'pharmacy', label: 'Pharmacie' },
    { value: 'bakery', label: 'Boulangerie' },
    { value: 'butcher', label: 'Boucherie' },
    { value: 'other', label: 'Autre' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.store_name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'TempPassword123!', // Mot de passe temporaire
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: 'merchant'
          }
        }
      });

      if (authError) throw authError;

      // 2. Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user?.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'merchant',
          address: formData.address
        });

      if (profileError) throw profileError;

      // 3. Créer le magasin
      const { error: storeError } = await supabase
        .from('stores')
        .insert({
          name: formData.store_name,
          type: formData.store_type,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          phone: formData.phone,
          manager_id: authData.user?.id,
          is_active: true
        });

      if (storeError) throw storeError;

      toast({
        title: "Succès",
        description: `Marchand ${formData.first_name} ${formData.last_name} créé avec succès`,
      });

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        store_name: '',
        store_type: 'grocery',
        description: '',
        address: '',
        city: 'Valleyfield',
        postal_code: '',
        business_license: '',
        tax_number: '',
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le marchand",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Store className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Nouveau Marchand</h2>
          <p className="text-muted-foreground">
            Ajoutez un nouveau marchand à la plateforme CourseMax
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
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
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Jean"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Martin"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jean.martin@email.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(450) 123-4567"
                />
              </div>
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
                <Label htmlFor="store_name">Nom du magasin *</Label>
                <Input
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                  placeholder="Épicerie Martin"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="store_type">Type de commerce</Label>
                <select
                  id="store_type"
                  value={formData.store_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {storeTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez le magasin, ses spécialités..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Rue Principale"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Valleyfield"
                />
              </div>
              
              <div>
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="J6T 1A1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents (Optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_license">Numéro de licence d'affaires</Label>
                <Input
                  id="business_license"
                  value={formData.business_license}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_license: e.target.value }))}
                  placeholder="123456789"
                />
              </div>
              
              <div>
                <Label htmlFor="tax_number">Numéro fiscal</Label>
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                  placeholder="987654321"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Créer le Marchand
          </Button>
        </div>
      </form>
    </div>
  );
}
