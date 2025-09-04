import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { safeApiCall, sanitizeInput } from "@/utils/errorHandler";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation et nettoyage des données
    const cleanEmail = sanitizeInput(email);
    const cleanPassword = sanitizeInput(password);

    if (!cleanEmail || !cleanPassword) {
      toast({
        title: "Erreur de saisie",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data, error } = await safeApiCall(
      () => supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      }),
      'Connexion utilisateur'
    );

    if (error) {
      setRetryCount(prev => prev + 1);
      
      toast({
        title: "Erreur de connexion",
        description: error,
        variant: "destructive",
      });

      // Afficher conseil après plusieurs échecs
      if (retryCount >= 2) {
        setTimeout(() => {
          toast({
            title: "Plusieurs tentatives échouées",
            description: "Vérifiez votre email et mot de passe. En cas de problème persistant, contactez le support.",
            variant: "destructive",
          });
        }, 1000);
      }
    } else {
      setRetryCount(0);
      toast({
        title: "Connexion réussie",
        description: "Vous serez redirigé vers votre tableau de bord",
      });
      // Redirect will be handled by useAuth based on role
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gradient">
              Connexion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              
              <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Pas encore de compte?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  S'inscrire
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;