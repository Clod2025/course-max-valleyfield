import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const useAuthDebug = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Test de connexion pour un utilisateur
  const testLogin = async (email: string, password: string): Promise<AuthTestResult> => {
    setLoading(true);
    
    try {
      console.log(`🧪 Test login pour: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erreur test login:', error);
        return {
          success: false,
          message: 'Échec de connexion',
          error: error.message
        };
      }

      console.log('✅ Test login réussi:', data);
      
      // Déconnexion immédiate après test
      await supabase.auth.signOut();
      
      return {
        success: true,
        message: 'Connexion test réussie',
        data: {
          userId: data.user?.id,
          email: data.user?.email,
          emailConfirmed: data.user?.email_confirmed_at !== null,
          lastSignIn: data.user?.last_sign_in_at
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur inattendue test login:', error);
      return {
        success: false,
        message: 'Erreur système',
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  // Test de reset password
  const testPasswordReset = async (email: string): Promise<AuthTestResult> => {
    setLoading(true);
    
    try {
      console.log(`🧪 Test reset password pour: ${email}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Erreur test reset:', error);
        return {
          success: false,
          message: 'Échec envoi reset',
          error: error.message
        };
      }

      console.log('✅ Test reset réussi');
      
      return {
        success: true,
        message: 'Reset envoyé avec succès'
      };

    } catch (error: any) {
      console.error('❌ Erreur inattendue test reset:', error);
      return {
        success: false,
        message: 'Erreur système',
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  // Test batch pour tous les comptes
  const runBatchTests = async (accounts: Array<{email: string, password: string}>) => {
    setLoading(true);
    const results: Array<{email: string, loginTest: AuthTestResult, resetTest: AuthTestResult}> = [];
    
    try {
      for (const account of accounts) {
        console.log(`🧪 Test batch pour: ${account.email}`);
        
        const loginResult = await testLogin(account.email, account.password);
        const resetResult = await testPasswordReset(account.email);
        
        results.push({
          email: account.email,
          loginTest: loginResult,
          resetTest: resetResult
        });

        // Pause entre tests pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successfulLogins = results.filter(r => r.loginTest.success).length;
      const successfulResets = results.filter(r => r.resetTest.success).length;
      
      toast({
        title: "Tests terminés",
        description: `Connexions: ${successfulLogins}/${accounts.length}, Resets: ${successfulResets}/${accounts.length}`,
      });

      console.log('📊 Résultats tests batch:', results);
      return results;

    } catch (error: any) {
      console.error('❌ Erreur batch tests:', error);
      toast({
        title: "Erreur tests batch",
        description: error.message,
        variant: "destructive",
      });
      return results;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    testLogin,
    testPasswordReset,
    runBatchTests
  };
};
