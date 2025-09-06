import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Shield, 
  Mail, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  EyeOff 
} from 'lucide-react';

interface TestUser {
  email: string;
  status: 'unknown' | 'exists' | 'not_found' | 'error';
  hasProfile: boolean;
  emailConfirmed: boolean;
  lastSignIn: string | null;
  role?: string;
  error?: string;
}

const AuthenticationManager = () => {
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const { toast } = useToast();

  // Les 4 comptes de test à vérifier
  const TEST_EMAILS = [
    'clodenerc@yahoo.fr',
    'engligoclervil9@gmail.com', 
    'claircl18@gmail.com',
    'desirdalia@gmail.com'
  ];

  // Vérifier le statut de tous les utilisateurs de test
  const checkUsersStatus = async () => {
    setLoading(true);
    console.log('🔍 Vérification du statut des utilisateurs de test...');

    try {
      // Appel à la fonction Supabase pour vérifier les utilisateurs
      const { data, error } = await supabase.functions.invoke('check-users-status', {
        body: { emails: TEST_EMAILS }
      });

      if (error) {
        console.error('❌ Erreur lors de la vérification:', error);
        toast({
          title: "Erreur de vérification",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Statut des utilisateurs récupéré:', data);
      setTestUsers(data.users || []);

    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      toast({
        title: "Erreur système",
        description: "Impossible de vérifier les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un lien de réinitialisation pour un utilisateur
  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    console.log(`🔄 Envoi du reset pour: ${email}`);

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email,
          redirectUrl: `${window.location.origin}/reset-password`
        }
      });

      if (error) {
        console.error('❌ Erreur envoi reset:', error);
        toast({
          title: "Erreur d'envoi",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Reset envoyé:', data);
      toast({
        title: "Email envoyé !",
        description: `Lien de réinitialisation envoyé à ${email}`,
      });

      // Afficher le lien temporaire en développement
      if (process.env.NODE_ENV === 'development' && data.action_link) {
        console.log(`🔗 Lien temporaire pour ${email}:`, data.action_link);
        toast({
          title: "Lien temporaire (DEV)",
          description: "Consultez la console pour le lien direct",
        });
      }

    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      toast({
        title: "Erreur système",
        description: "Impossible d'envoyer le reset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le mot de passe directement (mode admin)
  const resetPasswordDirect = async (email: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Mot de passe invalide",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log(`🔑 Reset direct pour: ${email}`);

    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { 
          email,
          newPassword 
        }
      });

      if (error) {
        console.error('❌ Erreur reset direct:', error);
        toast({
          title: "Erreur de reset",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Mot de passe mis à jour:', data);
      toast({
        title: "Mot de passe mis à jour !",
        description: `Nouveau mot de passe configuré pour ${email}`,
      });

      // Mettre à jour le statut
      await checkUsersStatus();

    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      toast({
        title: "Erreur système",
        description: "Impossible de mettre à jour le mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Batch reset pour tous les utilisateurs de test
  const batchResetPasswords = async () => {
    const password = 'CourseMax2024!'; // Mot de passe temporaire sécurisé

    setLoading(true);
    console.log('🔄 Reset batch pour tous les utilisateurs de test...');

    try {
      const usersToReset = TEST_EMAILS.map(email => ({
        email,
        newPassword: password
      }));

      const { data, error } = await supabase.functions.invoke('batch-password-reset', {
        body: { users: usersToReset }
      });

      if (error) {
        console.error('❌ Erreur batch reset:', error);
        toast({
          title: "Erreur de batch reset",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Batch reset terminé:', data);

      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const totalCount = data.results?.length || 0;

      toast({
        title: "Batch reset terminé !",
        description: `${successCount}/${totalCount} mots de passe mis à jour`,
      });

      // Afficher les résultats détaillés en développement
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Résultats détaillés:', data.results);
      }

      // Mettre à jour le statut
      await checkUsersStatus();

    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      toast({
        title: "Erreur système",
        description: "Impossible d'effectuer le batch reset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    checkUsersStatus();
  }, []);

  const getStatusBadge = (user: TestUser) => {
    if (user.status === 'exists') {
      return <Badge variant="default" className="bg-green-500">✅ Existe</Badge>;
    } else if (user.status === 'not_found') {
      return <Badge variant="destructive">❌ Introuvable</Badge>;
    } else if (user.status === 'error') {
      return <Badge variant="destructive">⚠️ Erreur</Badge>;
    }
    return <Badge variant="secondary">❓ Inconnu</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestionnaire d'Authentification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Outil de diagnostic et réparation pour les 4 comptes de test CourseMax.
              <br />
              <strong>Mode sécurisé :</strong> Pas d'exposition de mots de passe en clair.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={checkUsersStatus}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser Status
            </Button>

            <Button 
              onClick={batchResetPasswords}
              disabled={loading}
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Key className="h-4 w-4 mr-2" />
              Reset Batch (4 comptes)
            </Button>

            <Button 
              onClick={() => setShowPasswords(!showPasswords)}
              variant="ghost"
              size="sm"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {showPasswords && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Mot de passe temporaire (après batch reset) :</strong> CourseMax2024!
                <br />
                <small>Changez-le après connexion pour plus de sécurité.</small>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Liste des utilisateurs de test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Comptes de Test ({testUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TEST_EMAILS.map((email) => {
              const user = testUsers.find(u => u.email === email) || { 
                email, 
                status: 'unknown' as const, 
                hasProfile: false, 
                emailConfirmed: false, 
                lastSignIn: null 
              };

              return (
                <div key={email} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">{email}</span>
                      {getStatusBadge(user)}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendPasswordReset(email)}
                        disabled={loading}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Envoyer Reset
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                    <div>Profil: {user.hasProfile ? '✅' : '❌'}</div>
                    <div>Email confirmé: {user.emailConfirmed ? '✅' : '❌'}</div>
                    <div>Rôle: {user.role || 'N/A'}</div>
                    <div>Dernière connexion: {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Jamais'}</div>
                  </div>

                  {user.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{user.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthenticationManager;
