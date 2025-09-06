import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Key, Mail, CheckCircle, AlertTriangle } from 'lucide-react';

const QuickAuthFix = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{email: string, status: string, message: string}>>([]);
  const { toast } = useToast();

  // Les 4 comptes de test
  const TEST_ACCOUNTS = [
    'clodenerc@yahoo.fr',
    'engligoclervil9@gmail.com', 
    'claircl18@gmail.com',
    'desirdalia@gmail.com'
  ];

  // Mot de passe temporaire sécurisé
  const TEMP_PASSWORD = 'CourseMax2024!';

  // Reset les mots de passe avec les fonctions existantes
  const resetAllPasswords = async () => {
    setLoading(true);
    setResults([]);
    
    console.log('🔄 Début du reset pour les 4 comptes...');
    
    const newResults: Array<{email: string, status: string, message: string}> = [];

    for (const email of TEST_ACCOUNTS) {
      try {
        console.log(`🔑 Reset pour: ${email}`);
        
        // Utiliser la fonction update-user-password existante
        const { data, error } = await supabase.functions.invoke('update-user-password', {
          body: { 
            email: email,
            newPassword: TEMP_PASSWORD 
          }
        });

        if (error) {
          console.error(`❌ Erreur pour ${email}:`, error);
          newResults.push({
            email,
            status: 'error',
            message: error.message || 'Erreur inconnue'
          });
        } else {
          console.log(`✅ Succès pour ${email}:`, data);
          newResults.push({
            email,
            status: 'success',
            message: 'Mot de passe mis à jour'
          });
        }

        // Pause entre les appels
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`❌ Erreur inattendue pour ${email}:`, error);
        newResults.push({
          email,
          status: 'error',
          message: `Erreur: ${error.message}`
        });
      }
    }

    setResults(newResults);
    
    const successCount = newResults.filter(r => r.status === 'success').length;
    
    if (successCount === TEST_ACCOUNTS.length) {
      toast({
        title: "🎉 Tous les comptes sont réparés !",
        description: `${successCount}/${TEST_ACCOUNTS.length} mots de passe mis à jour`,
      });
    } else {
      toast({
        title: "Réparation partielle",
        description: `${successCount}/${TEST_ACCOUNTS.length} comptes réparés`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    }

    setLoading(false);
  };

  // Envoyer des emails de reset
  const sendResetEmails = async () => {
    setLoading(true);
    console.log('📧 Envoi des emails de reset...');

    const emailResults: Array<{email: string, status: string, message: string}> = [];

    for (const email of TEST_ACCOUNTS) {
      try {
        console.log(`📧 Envoi reset pour: ${email}`);
        
        // Utiliser la fonction send-password-reset existante
        const { data, error } = await supabase.functions.invoke('send-password-reset', {
          body: { 
            email: email,
            redirectUrl: `${window.location.origin}/reset-password`
          }
        });

        if (error) {
          console.error(`❌ Erreur email pour ${email}:`, error);
          emailResults.push({
            email,
            status: 'error',
            message: error.message || 'Erreur envoi email'
          });
        } else {
          console.log(`✅ Email envoyé pour ${email}:`, data);
          emailResults.push({
            email,
            status: 'success',
            message: 'Email de reset envoyé'
          });

          // Afficher le lien en développement
          if (process.env.NODE_ENV === 'development' && data.action_link) {
            console.log(`🔗 Lien direct pour ${email}:`, data.action_link);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ Erreur inattendue email pour ${email}:`, error);
        emailResults.push({
          email,
          status: 'error',
          message: `Erreur: ${error.message}`
        });
      }
    }

    setResults(emailResults);
    
    const successCount = emailResults.filter(r => r.status === 'success').length;
    
    toast({
      title: "Emails envoyés",
      description: `${successCount}/${TEST_ACCOUNTS.length} emails de reset envoyés`,
      variant: successCount > 0 ? "default" : "destructive",
    });

    setLoading(false);
  };

  // Test de connexion rapide
  const testLogin = async (email: string) => {
    try {
      console.log(`🧪 Test connexion pour: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: TEMP_PASSWORD,
      });

      if (error) {
        console.error('❌ Échec test login:', error);
        toast({
          title: "Test de connexion échoué",
          description: `${email}: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Test login réussi:', data);
        
        // Déconnexion immédiate
        await supabase.auth.signOut();
        
        toast({
          title: "✅ Connexion test réussie !",
          description: `${email} peut se connecter avec le mot de passe temporaire`,
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur test:', error);
      toast({
        title: "Erreur de test",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <Badge className="bg-green-500">✅ Réussi</Badge>;
    } else if (status === 'error') {
      return <Badge variant="destructive">❌ Erreur</Badge>;
    }
    return <Badge variant="secondary">⏳ En attente</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            🚑 Réparation Express des Comptes de Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>4 comptes à réparer :</strong> clodenerc@yahoo.fr, engligoclervil9@gmail.com, claircl18@gmail.com, desirdalia@gmail.com
              <br />
              <strong>Mot de passe temporaire :</strong> CourseMax2024!
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={resetAllPasswords}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Key className="h-4 w-4 mr-2" />
              🔧 RÉPARER TOUS LES COMPTES
            </Button>

            <Button 
              onClick={sendResetEmails}
              disabled={loading}
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              📧 Envoyer Emails Reset
            </Button>
          </div>

          {/* Affichage des résultats */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Résultats :</h4>
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{result.email}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.status === 'success' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testLogin(result.email)}
                        className="text-xs"
                      >
                        🧪 Tester
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📋 Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>1. 🔧 <strong>Cliquez "RÉPARER TOUS LES COMPTES"</strong> pour réinitialiser les 4 mots de passe</div>
          <div>2. ✅ <strong>Vérifiez les résultats</strong> - tous doivent être "Réussi"</div>
          <div>3. 🧪 <strong>Testez chaque compte</strong> avec le bouton "Tester"</div>
          <div>4. 🔐 <strong>Connexion :</strong> Email + mot de passe "CourseMax2024!"</div>
          <div>5. 📧 <strong>Optionnel :</strong> Envoyez des emails de reset pour les utilisateurs</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickAuthFix;
