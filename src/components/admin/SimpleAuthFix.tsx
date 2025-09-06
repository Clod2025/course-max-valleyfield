import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Key, AlertTriangle, Database, TestTube } from 'lucide-react';

const SimpleAuthFix = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Test de connexion rapide
  const testAccount = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      console.log(`🧪 Test de connexion pour: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Échec:', error);
        setResults(prev => ({ ...prev, [email]: 'error' }));
        toast({
          title: `❌ ${email}`,
          description: `Échec: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Succès:', data);
        
        // Déconnexion immédiate
        await supabase.auth.signOut();
        
        setResults(prev => ({ ...prev, [email]: 'success' }));
        toast({
          title: `✅ ${email}`,
          description: "Connexion réussie !",
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setResults(prev => ({ ...prev, [email]: 'error' }));
      toast({
        title: "Erreur de test",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Reset via fonction existante OU fallback SQL
  const resetPassword = async (email: string) => {
    setLoading(true);
    
    try {
      console.log(`🔑 Reset pour: ${email}`);
      
      // Essayer d'abord avec la fonction Edge
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { 
          email,
          newPassword: 'CourseMax2024!' 
        }
      });

      if (error) {
        console.warn('⚠️ Fonction Edge échouée, tentative SQL directe...');
        
        // Fallback : tentative de reset via SQL direct (nécessite RLS approprié)
        const { error: sqlError } = await supabase.rpc('admin_reset_user_password', {
          user_email: email,
          new_password: 'CourseMax2024!'
        });

        if (sqlError) {
          console.error('❌ Erreur SQL aussi:', sqlError);
          toast({
            title: `❌ Reset échoué: ${email}`,
            description: "Utilisez le SQL Editor dans Supabase Dashboard",
            variant: "destructive",
          });
        } else {
          console.log('✅ Reset SQL réussi');
          toast({
            title: `✅ Reset réussi (SQL): ${email}`,
            description: "Mot de passe: CourseMax2024!",
          });
        }
      } else {
        console.log('✅ Reset réussi:', data);
        toast({
          title: `✅ Reset réussi: ${email}`,
          description: "Mot de passe: CourseMax2024!",
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      toast({
        title: "Erreur de reset",
        description: "Utilisez le SQL Editor dans Supabase Dashboard",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Test tous les comptes avec le mot de passe temporaire
  const testAllAccounts = async () => {
    setLoading(true);
    setResults({});
    
    const accounts = [
      'clodenerc@yahoo.fr',
      'engligoclervil9@gmail.com', 
      'claircl18@gmail.com',
      'desirdalia@gmail.com'
    ];

    for (const email of accounts) {
      await testAccount(email, 'CourseMax2024!');
      // Pause entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setLoading(false);
  };

  const accounts = [
    'clodenerc@yahoo.fr',
    'engligoclervil9@gmail.com', 
    'claircl18@gmail.com',
    'desirdalia@gmail.com'
  ];

  const getStatusBadge = (email: string) => {
    const status = results[email];
    if (status === 'success') {
      return <Badge className="bg-green-500">✅ OK</Badge>;
    } else if (status === 'error') {
      return <Badge variant="destructive">❌ Erreur</Badge>;
    }
    return <Badge variant="secondary">⏳ Non testé</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            🚑 Fix Comptes de Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Mot de passe temporaire :</strong> CourseMax2024!
              <br />
              <strong>Si Reset échoue :</strong> Utilisez le SQL Editor dans Supabase Dashboard
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={testAllAccounts}
              disabled={loading}
              variant="default"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Tester Tous les Comptes
            </Button>
          </div>

          <div className="grid gap-3">
            {accounts.map((email) => (
              <div key={email} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{email}</span>
                  {getStatusBadge(email)}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetPassword(email)}
                    disabled={loading}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => testAccount(email, 'CourseMax2024!')}
                    disabled={loading}
                  >
                    🧪 Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions SQL si les fonctions ne marchent pas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            💡 Solution Alternative : SQL Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Si les boutons "Reset" ne fonctionnent pas, utilisez ce script dans le SQL Editor de Supabase :
          </p>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
            {`UPDATE auth.users 
SET encrypted_password = crypt('CourseMax2024!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email IN (
    'clodenerc@yahoo.fr',
    'engligoclervil9@gmail.com', 
    'claircl18@gmail.com',
    'desirdalia@gmail.com'
);`}
          </div>
          <p className="text-xs text-muted-foreground">
            📍 Dashboard Supabase → SQL Editor → Coller le script → Run
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAuthFix;
