import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, ArrowLeft, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';

const SignupConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('signup_email');

    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('signup_email', emailParam); // Store for future use
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email is found, redirect to home or login
      toast({
        title: "Information manquante",
        description: "Impossible de trouver l'email de confirmation. Veuillez vous inscrire ou vous connecter.",
        variant: "destructive"
      });
      navigate('/register', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleResendConfirmation = async () => {
    if (!email || resending || countdown > 0) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      toast({
        title: "Lien de confirmation renvoyé",
        description: `Un nouveau lien a été envoyé à ${email}.`,
      });
      setCountdown(60); // Start 60-second countdown
    } catch (error: any) {
      console.error('Error resending confirmation email:', error);
      toast({
        title: "Erreur lors du renvoi",
        description: error.message || "Impossible de renvoyer le lien de confirmation.",
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full mx-auto text-center p-6">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-gray-900">
              Compte créé avec succès !
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 text-lg">
              Votre compte a été créé avec succès 🎉. Veuillez vérifier votre courriel pour confirmer votre inscription avant de continuer.
            </p>
            
            {email && (
              <div className="flex items-center justify-center space-x-2 text-blue-600 font-medium text-xl">
                <Mail className="h-6 w-6" />
                <span>{email}</span>
              </div>
            )}
            
            <p className="text-gray-600">
              Un courriel de confirmation a été envoyé à votre adresse email. 
              Veuillez vérifier votre boîte de réception (et votre dossier de spam) pour confirmer votre inscription.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleResendConfirmation}
                disabled={resending || countdown > 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Renvoyer dans {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renvoyer le lien de confirmation
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la page de connexion
              </Button>
              
              <Button
                onClick={() => navigate('/home')}
                variant="ghost"
                className="w-full text-gray-600 hover:bg-gray-50"
              >
                Retour à l'accueil
              </Button>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500 mt-6">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Le lien est valide pendant 24 heures.</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SignupConfirmation;
