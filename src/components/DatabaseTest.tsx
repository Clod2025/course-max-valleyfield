import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export const DatabaseTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests: TestResult[] = [
      { name: 'Connexion Supabase', status: 'pending', message: 'Test en cours...' },
      { name: 'Table profiles', status: 'pending', message: 'Test en cours...' },
      { name: 'Table stores', status: 'pending', message: 'Test en cours...' },
      { name: 'Table products', status: 'pending', message: 'Test en cours...' },
      { name: 'Permissions RLS', status: 'pending', message: 'Test en cours...' }
    ];

    setResults([...tests]);

    try {
      // Test 1: Connexion Supabase
      const startTime1 = Date.now();
      const { data: authData, error: authError } = await supabase.auth.getSession();
      const duration1 = Date.now() - startTime1;
      
      tests[0] = {
        name: 'Connexion Supabase',
        status: authError ? 'error' : 'success',
        message: authError ? `Erreur: ${authError.message}` : 'Connexion réussie',
        duration: duration1
      };
      setResults([...tests]);

      // Test 2: Table profiles
      const startTime2 = Date.now();
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const duration2 = Date.now() - startTime2;
      
      tests[1] = {
        name: 'Table profiles',
        status: profilesError ? 'error' : 'success',
        message: profilesError ? `Erreur: ${profilesError.message}` : 'Table accessible',
        duration: duration2
      };
      setResults([...tests]);

      // Test 3: Table stores
      const startTime3 = Date.now();
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .limit(1);
      const duration3 = Date.now() - startTime3;
      
      tests[2] = {
        name: 'Table stores',
        status: storesError ? 'error' : 'success',
        message: storesError ? `Erreur: ${storesError.message}` : 'Table accessible',
        duration: duration3
      };
      setResults([...tests]);

      // Test 4: Table products
      const startTime4 = Date.now();
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      const duration4 = Date.now() - startTime4;
      
      tests[3] = {
        name: 'Table products',
        status: productsError ? 'error' : 'success',
        message: productsError ? `Erreur: ${productsError.message}` : 'Table accessible',
        duration: duration4
      };
      setResults([...tests]);

      // Test 5: Permissions RLS
      const startTime5 = Date.now();
      const { data: rlsData, error: rlsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      const duration5 = Date.now() - startTime5;
      
      tests[4] = {
        name: 'Permissions RLS',
        status: rlsError ? 'error' : 'success',
        message: rlsError ? `Erreur RLS: ${rlsError.message}` : 'Permissions OK',
        duration: duration5
      };
      setResults([...tests]);

      // Résumé
      const successCount = tests.filter(t => t.status === 'success').length;
      const errorCount = tests.filter(t => t.status === 'error').length;

      toast({
        title: "Tests terminés",
        description: `${successCount} succès, ${errorCount} erreurs`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

    } catch (error) {
      console.error('Erreur lors des tests:', error);
      toast({
        title: "Erreur de test",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600">Succès</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'pending':
        return <Badge variant="outline">En cours</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Test de connexion à la base de données
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ce test vérifie la connexion à Supabase et l'accès aux tables principales.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Tests en cours...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Lancer les tests
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Résultats des tests :</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.duration && (
                      <p className="text-xs text-muted-foreground">
                        {result.duration}ms
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseTest;
