import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/utils/errorHandler';
import { CheckCircle, AlertTriangle, Key } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Vérifier si nous avons un token valide
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    console.log('🔍 Reset password params:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken, 
      type 
    });

    if (type === 'recovery' && accessToken && refreshToken) {
      // Token valide trouvé
      setValidToken(true);
      
      // Configurer la session Supabase avec les tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('❌ Erreur configuration session:', error);
          setValidToken(false);
          toast({
            title: "Lien invalide",
            description: "Le lien de réinitialisation n'est plus valide",
            variant: "destructive",
          });
        } else {
          console.log('✅ Session configurée pour reset');
        }
      });
    } else {
      console.log('❌ Paramètres de reset manquants ou invalides');
      setValidToken(false);
    }
  }, [searchParams, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validToken) {
      toast({
        title: "Erreur",
        description: "Session de réinitialisation invalide",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Validation des mots de passe
    const cleanPassword = sanitizeInput(password);
    const cleanConfirmPassword = sanitizeInput(confirmPassword);

    if (!cleanPassword || !cleanConfirmPassword) {
      toast({
        title: "Erreur de saisie",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Mise à jour du mot de passe...');
      
      const { error } = await supabase.auth.updateUser({
        password: cleanPassword
      });

      if (error) {
        console.error('❌ Erreur mise à jour mot de passe:', error);
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ Mot de passe mis à jour avec succès');
        setSuccess(true);
        
        toast({
          title: "Mot de passe mis à jour !",
          description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe",
        });

        // Rediriger vers login après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      toast({
        title: "Erreur système",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // Page de succès
  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto py-12 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gradient flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Mot de passe mis à jour !
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Votre mot de passe a été mis à jour avec succès.
                  Vous serez redirigé vers la page de connexion dans quelques secondes.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => navigate('/login')}
                className="w-full gradient-primary text-white"
              >
                Se connecter maintenant
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Page d'erreur si token invalide
  if (validToken === false) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto py-12 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-red-600 flex items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Lien invalide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ce lien de réinitialisation n'est plus valide ou a expiré.
                  Veuillez demander un nouveau lien de réinitialisation.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/forgot-password')}
                  className="w-full gradient-primary text-white"
                >
                  Demander un nouveau lien
                </Button>
                
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full"
                >
                  Retour à la connexion
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Formulaire de réinitialisation
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gradient flex items-center justify-center gap-2">
              <Key className="h-6 w-6" />
              Nouveau mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Choisissez un nouveau mot de passe sécurisé
            </p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  required
                  disabled={loading || validToken === null}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  disabled={loading || validToken === null}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full gradient-primary text-white" 
                disabled={loading || validToken !== true}
              >
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-sm text-primary hover:underline"
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
