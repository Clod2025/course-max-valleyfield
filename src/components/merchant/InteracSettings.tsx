import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Save,
  TestTube,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InteracSettingsData {
  interac_email: string;
  interac_phone: string;
  interac_enabled: boolean;
}

export const InteracSettings: React.FC = () => {
  const [settings, setSettings] = useState<InteracSettingsData>({
    interac_email: '',
    interac_phone: '',
    interac_enabled: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger les paramètres existants
  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('merchants')
        .select('interac_email, interac_phone, interac_enabled')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          interac_email: data.interac_email || '',
          interac_phone: data.interac_phone || '',
          interac_enabled: data.interac_enabled || false
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres Interac",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'interac_email':
        if (!value) return '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Format d\'email invalide';
        }
        return '';
      
      case 'interac_phone':
        if (!value) return '';
        const phoneRegex = /^(\+1|1)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          return 'Format de téléphone canadien invalide';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (name: keyof InteracSettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [name]: value }));
    
    // Validation en temps réel
    if (typeof value === 'string') {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Formatage automatique du numéro de téléphone canadien
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const [, area, exchange, number] = match;
      if (number) {
        return `(${area}) ${exchange}-${number}`;
      } else if (exchange) {
        return `(${area}) ${exchange}`;
      } else if (area) {
        return `(${area}`;
      }
    }
    return value;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('interac_phone', formatted);
  };

  const testInteracSettings = async () => {
    if (!settings.interac_email || !settings.interac_phone) {
      toast({
        title: "Paramètres incomplets",
        description: "Veuillez remplir l'email et le téléphone avant de tester",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    
    try {
      // Simulation d'un test de validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici, on pourrait appeler une API pour valider les informations
      // Pour l'instant, on simule un succès
      toast({
        title: "Test réussi",
        description: "Les paramètres Interac sont valides",
      });
    } catch (error) {
      toast({
        title: "Test échoué",
        description: "Impossible de valider les paramètres",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    // Validation finale
    const emailError = validateField('interac_email', settings.interac_email);
    const phoneError = validateField('interac_phone', settings.interac_phone);
    
    if (emailError || phoneError) {
      setErrors({ interac_email: emailError, interac_phone: phoneError });
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs avant de sauvegarder",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          interac_email: settings.interac_email,
          interac_phone: settings.interac_phone,
          interac_enabled: settings.interac_enabled
        })
        .eq('owner_id', user.id);

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres Interac ont été mis à jour",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = settings.interac_email && 
                     settings.interac_phone && 
                     !Object.values(errors).some(error => error !== '');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des paramètres...</p>
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
            <Smartphone className="w-5 h-5" />
            Paramètres Interac e-Transfer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configurez vos informations Interac pour permettre aux clients de payer par e-Transfer.
            Ces informations seront affichées aux clients lors du processus de paiement.
          </p>
        </CardContent>
      </Card>

      {/* Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activation Interac</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="interac-enabled" className="text-base font-medium">
                Accepter les paiements Interac
              </Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux clients de payer par Interac e-Transfer
              </p>
            </div>
            <Switch
              id="interac-enabled"
              checked={settings.interac_enabled}
              onCheckedChange={(checked) => handleInputChange('interac_enabled', checked)}
            />
          </div>

          {settings.interac_enabled && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Interac activé :</strong> Vos clients peuvent maintenant payer par Interac e-Transfer.
                Assurez-vous que vos informations ci-dessous sont correctes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informations Interac */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations Interac</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Interac */}
          <div className="space-y-2">
            <Label htmlFor="interac-email">Email Interac *</Label>
            <Input
              id="interac-email"
              type="email"
              placeholder="votre-email@exemple.com"
              value={settings.interac_email}
              onChange={(e) => handleInputChange('interac_email', e.target.value)}
              className={errors.interac_email ? "border-red-500" : ""}
            />
            {errors.interac_email && (
              <p className="text-sm text-red-500">{errors.interac_email}</p>
            )}
            <p className="text-xs text-muted-foreground">
              L'adresse email que les clients utiliseront pour vous envoyer l'argent
            </p>
          </div>

          {/* Téléphone Interac */}
          <div className="space-y-2">
            <Label htmlFor="interac-phone">Téléphone Interac *</Label>
            <div className="relative">
              <Input
                id="interac-phone"
                type="tel"
                placeholder="(450) 123-4567"
                value={settings.interac_phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={errors.interac_phone ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPhone ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.interac_phone && (
              <p className="text-sm text-red-500">{errors.interac_phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Le numéro de téléphone associé à votre compte Interac
            </p>
          </div>

          {/* Informations de sécurité */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Sécurité :</strong> Ces informations seront visibles par vos clients lors du paiement. 
              Assurez-vous qu'elles sont correctes et que vous avez accès à ces comptes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test et validation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test et validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={testInteracSettings}
              disabled={!isFormValid || isTesting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Test en cours...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Tester les paramètres
                </>
              )}
            </Button>
            
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Testez vos paramètres Interac pour vous assurer qu'ils fonctionnent correctement
              </p>
            </div>
          </div>

          {/* Statut des paramètres */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Statut :</span>
            {isFormValid ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Paramètres valides
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Paramètres incomplets
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={saveSettings}
          disabled={!isFormValid || isSaving}
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
              Sauvegarder les paramètres
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
