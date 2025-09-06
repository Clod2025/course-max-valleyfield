import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Car,
  CreditCard,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function NewDriverForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Informations personnelles
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Valleyfield',
    
    // Informations véhicule
    vehicle_type: 'car',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    license_plate: '',
    
    // Documents
    driver_license: '',
    insurance_number: '',
    
    // Disponibilité
    availability: 'full_time',
    notes: '',
  });

  const vehicleTypes = [
    { value: 'car', label: 'Voiture' },
    { value: 'bike', label: 'Vélo' },
    { value: 'scooter', label: 'Scooter' },
    { value: 'motorcycle', label: 'Moto' },
    { value: 'van', label: 'Camionnette' }
  ];

  const availabilityOptions = [
    { value: 'full_time', label: 'Temps plein' },
    { value: 'part_time', label: 'Temps partiel' },
    { value: 'weekend', label: 'Fins de semaine' },
    { value: 'evening', label: 'Soirées' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
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
            role: 'driver'
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
          role: 'driver',
          address: formData.address
        });

      if (profileError) throw profileError;

      // 3. Créer les informations du livreur
      const { error: driverError } = await supabase
        .from('drivers')
        .insert({
          user_id: authData.user?.id,
          vehicle_type: formData.vehicle_type,
          vehicle_make: formData.vehicle_make,
          vehicle_model: formData.vehicle_model,
          vehicle_year: parseInt(formData.vehicle_year) || null,
          license_plate: formData.license_plate,
          driver_license: formData.driver_license,
          insurance_number: formData.insurance_number,
          availability: formData.availability,
          is_active: true,
          is_verified: false // Nécessite vérification des documents
        });

      if (driverError) throw driverError;

      toast({
        title: "Succès",
        description: `Livreur ${formData.first_name} ${formData.last_name} créé avec succès`,
      });

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: 'Valleyfield',
        vehicle_type: 'car',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        license_plate: '',
        driver_license: '',
        insurance_number: '',
        availability: 'full_time',
        notes: '',
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le livreur",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Nouveau Livreur</h2>
          <p className="text-muted-foreground">
            Ajoutez un nouveau livreur à la plateforme CourseMax
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
                  placeholder="Dupuis"
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
                  placeholder="jean.dupuis@email.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(450) 123-4567"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Rue Principale"
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
            </div>
          </CardContent>
        </Card>

        {/* Informations véhicule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Informations du Véhicule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_type">Type de véhicule</Label>
                <select
                  id="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="license_plate">Plaque d'immatriculation</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                  placeholder="ABC 123"
                />
              </div>
              
              <div>
                <Label htmlFor="vehicle_make">Marque</Label>
                <Input
                  id="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_make: e.target.value }))}
                  placeholder="Toyota"
                />
              </div>
              
              <div>
                <Label htmlFor="vehicle_model">Modèle</Label>
                <Input
                  id="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                  placeholder="Corolla"
                />
              </div>
              
              <div>
                <Label htmlFor="vehicle_year">Année</Label>
                <Input
                  id="vehicle_year"
                  type="number"
                  value={formData.vehicle_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_year: e.target.value }))}
                  placeholder="2020"
                />
              </div>
              
              <div>
                <Label htmlFor="availability">Disponibilité</Label>
                <select
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {availabilityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driver_license">Numéro de permis de conduire</Label>
                <Input
                  id="driver_license"
                  value={formData.driver_license}
                  onChange={(e) => setFormData(prev => ({ ...prev, driver_license: e.target.value }))}
                  placeholder="A1234567890"
                />
              </div>
              
              <div>
                <Label htmlFor="insurance_number">Numéro d'assurance</Label>
                <Input
                  id="insurance_number"
                  value={formData.insurance_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, insurance_number: e.target.value }))}
                  placeholder="INS123456"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes supplémentaires sur le livreur..."
                rows={3}
              />
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
            Créer le Livreur
          </Button>
        </div>
      </form>
    </div>
  );
}
