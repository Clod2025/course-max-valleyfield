import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CommisSession {
  id: string;
  nom: string;
  email: string;
  code_unique: string;
  role: string;
  must_change_password: boolean;
}

export default function CommisChangePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [commisSession, setCommisSession] = useState<CommisSession | null>(null);
  const [passwordPolicy, setPasswordPolicy] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    // Récupérer la session du commis depuis le localStorage
    const session = localStorage.getItem('commis_session');
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        if (parsedSession.must_change_password) {
          setCommisSession(parsedSession);
        } else {
          // Si le mot de passe n'a pas besoin d'être changé, rediriger
          navigate('/dashboard/marchand');
        }
      } catch (error) {
        console.error('Erreur lors du parsing de la session:', error);
        navigate('/dashboard/marchand');
      }
    } else {
      // Pas de session, rediriger vers la connexion
      navigate('/dashboard/marchand');
    }
  }, [navigate]);

  useEffect(() => {
    // Vérifier la politique de sécurité du nouveau mot de passe
    const newPassword = formData.newPassword;
    setPasswordPolicy({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    });
  }, [formData.newPassword]);

  const handlePasswordChange = async () => {
    if (!commisSession) return;

    // Validations
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit être différent de l'ancien",
        variant: "destructive"
      });
      return;
    }

    // Vérifier la politique de sécurité
    if (!Object.values(passwordPolicy).every(Boolean)) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe ne respecte pas la politique de sécurité",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Vérifier si on est en mode démonstration
      if (commisSession.id.startsWith('demo-')) {
        // Mode démonstration - simuler le changement
        setTimeout(() => {
          // Mettre à jour la session locale
          const updatedSession = {
            ...commisSession,
            must_change_password: false,
            last_password_change: new Date().toISOString()
          };
          localStorage.setItem('commis_session', JSON.stringify(updatedSession));
          
          toast({
            title: "Mot de passe changé (Démo)",
            description: "Votre mot de passe a été changé avec succès en mode démonstration",
          });
          
          // Rediriger vers le dashboard
          navigate('/dashboard/marchand');
        }, 1000);
        return;
      }

      // Mode production - utiliser la fonction Supabase
      const { error } = await supabase.rpc('change_commis_password', {
        p_commis_id: commisSession.id,
        p_old_password: formData.oldPassword,
        p_new_password: formData.newPassword
      });

      if (error) throw error;

      // Mettre à jour la session locale
      const updatedSession = {
        ...commisSession,
        must_change_password: false,
        last_password_change: new Date().toISOString()
      };
      localStorage.setItem('commis_session', JSON.stringify(updatedSession));

      toast({
        title: "Mot de passe changé",
        description: "Votre mot de passe a été changé avec succès",
      });

      // Rediriger vers le dashboard
      navigate('/dashboard/marchand');

    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le mot de passe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!commisSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Changement de mot de passe obligatoire</h1>
          <p className="text-muted-foreground mt-2">
            Bonjour {commisSession.nom}, vous devez changer votre mot de passe pour continuer.
          </p>
        </div>

        {/* Alerte de sécurité */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire.
          </AlertDescription>
        </Alert>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Nouveau mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ancien mot de passe */}
            <div>
              <Label htmlFor="oldPassword">Ancien mot de passe</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showPasswords.old ? 'text' : 'password'}
                  value={formData.oldPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder="Votre mot de passe actuel"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('old')}
                >
                  {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Votre nouveau mot de passe"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Confirmation du nouveau mot de passe */}
            <div>
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmez votre nouveau mot de passe"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Politique de sécurité */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Politique de sécurité</Label>
              <div className="space-y-1 text-sm">
                <div className={`flex items-center gap-2 ${passwordPolicy.length ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className="w-4 h-4" />
                  Au moins 8 caractères
                </div>
                <div className={`flex items-center gap-2 ${passwordPolicy.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className="w-4 h-4" />
                  Au moins une majuscule
                </div>
                <div className={`flex items-center gap-2 ${passwordPolicy.number ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className="w-4 h-4" />
                  Au moins un chiffre
                </div>
                <div className={`flex items-center gap-2 ${passwordPolicy.special ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className="w-4 h-4" />
                  Au moins un caractère spécial
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handlePasswordChange}
                disabled={loading || !Object.values(passwordPolicy).every(Boolean)}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Changement en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Changer le mot de passe
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informations du commis */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Nom:</span>
                <span className="font-medium">{commisSession.nom}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-medium">{commisSession.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Code unique:</span>
                <span className="font-medium font-mono">{commisSession.code_unique}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rôle:</span>
                <span className="font-medium">{commisSession.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
