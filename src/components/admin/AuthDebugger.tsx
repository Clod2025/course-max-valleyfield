import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PasswordInput } from "@/components/ui/password-input";

interface AuthDebugResult {
  email: string;
  status: 'success' | 'error' | 'testing';
  message: string;
  loginTime?: number;
}

export function AuthDebugger() {
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('SecurePass2024!');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AuthDebugResult[]>([]);
  const { toast } = useToast();

  const testUsers = [
    'clodenerc@yahoo.fr',
    'claircl18@gmail.com', 
    'desirdelia@gmail.com',
    'engligoclervil9@gmail.com'
  ];

  const testSingleLogin = async (email: string, password: string) => {
    console.log('🔍 Tentative de connexion:', { email, password });
    console.log('🔗 URL Supabase:', supabase.supabaseUrl);
    console.log('🔑 Clé publique:', supabase.supabaseKey);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const loginTime = Date.now() - startTime;

      if (error) {
        return {
          email,
          status: 'error' as const,
          message: `Erreur: ${error.message}`,
          loginTime
        };
      }

      // Sign out immediately after successful test
      await supabase.auth.signOut();

      return {
        email,
        status: 'success' as const,
        message: `Connexion réussie (utilisateur: ${data.user?.email})`,
        loginTime
      };
    } catch (error) {
      return {
        email,
        status: 'error' as const,
        message: `Exception: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        loginTime: Date.now() - startTime
      };
    }
  };

  const handleTestAllUsers = async () => {
    setIsLoading(true);
    setResults([]);

    const testResults: AuthDebugResult[] = [];

    for (const email of testUsers) {
      // Add loading state
      setResults(prev => [...prev, {
        email,
        status: 'testing',
        message: 'Test en cours...'
      }]);

      const result = await testSingleLogin(email, testPassword);
      
      // Update with actual result
      setResults(prev => prev.map(r => 
        r.email === email ? result : r
      ));

      testResults.push(result);
    }

    setIsLoading(false);

    const successCount = testResults.filter(r => r.status === 'success').length;
    toast({
      title: "Tests de connexion terminés",
      description: `${successCount}/${testResults.length} connexions réussies`,
      variant: successCount === testResults.length ? "default" : "destructive",
    });
  };

  const handleTestSingleUser = async () => {
    if (!testEmail || !testPassword) {
      toast({
        title: "Champs requis",
        description: "Veuillez saisir un email et un mot de passe",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const result = await testSingleLogin(testEmail, testPassword);
    setResults([result]);
    
    setIsLoading(false);

    toast({
      title: result.status === 'success' ? "Test réussi" : "Test échoué",
      description: result.message,
      variant: result.status === 'success' ? "default" : "destructive",
    });
  };

  const testBasicConnection = async () => {
    console.log('🧪 Test de connexion de base...');
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('✅ Session:', { data, error });
      
      // Test de la base de données
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      console.log('✅ Base de données:', { profileData, profileError });
      
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Debugger d'authentification</CardTitle>
        <CardDescription>
          Testez la connexion des utilisateurs pour identifier les problèmes d'authentification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test manuel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test manuel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-email">Email</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="test-password">Mot de passe</Label>
              <PasswordInput
                id="test-password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Mot de passe"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleTestSingleUser} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? "Test en cours..." : "Tester cette connexion"}
            </Button>
            
            {/* NOUVEAU BOUTON */}
            <Button 
              onClick={testBasicConnection} 
              variant="outline"
              className="ml-2"
            >
              🔗 Tester la connexion Supabase
            </Button>
          </div>
        </div>

        {/* Test automatique */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test automatique des utilisateurs</h3>
          <p className="text-sm text-muted-foreground">
            Teste la connexion de tous les utilisateurs de test avec le mot de passe: <code>SecurePass2024!</code>
          </p>
          <Button 
            onClick={handleTestAllUsers} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Tests en cours..." : "🧪 Tester tous les utilisateurs"}
          </Button>
        </div>

        {/* Résultats */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Résultats des tests</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{result.email}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                    {result.loginTime && (
                      <div className="text-xs text-muted-foreground">
                        Temps: {result.loginTime}ms
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={
                      result.status === 'success' ? 'default' : 
                      result.status === 'error' ? 'destructive' : 'secondary'
                    }
                  >
                    {result.status === 'success' ? '✓ Succès' : 
                     result.status === 'error' ? '✗ Échec' : '⏳ Test...'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aide */}
        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <strong>💡 Guide de dépannage:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong>invalid_credentials</strong>: Mot de passe incorrect ou utilisateur non confirmé</li>
            <li><strong>Email not confirmed</strong>: L'utilisateur doit confirmer son email</li>
            <li><strong>Too many requests</strong>: Limitation de taux, attendez quelques minutes</li>
            <li><strong>Invalid login credentials</strong>: Email ou mot de passe invalide</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
