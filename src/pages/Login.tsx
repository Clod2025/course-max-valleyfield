import React, { useState, useEffect } from "react";
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
import { sanitizeInput, safeApiCall } from "@/utils/errorHandler";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ SUPPRESSION DE LA LOGIQUE DE REDIRECTION - Laisser useAuth gérer complètement
  useEffect(() => {
    if (user && profile) {
      console.log('👤 Already logged in, useAuth will handle redirect');
    }
  }, [user, profile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

    console.log('🔑 Attempting login for:', cleanEmail);

    const { error } = await signIn(cleanEmail, cleanPassword);

    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants incorrects",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: "Redirection en cours...",
      });
      // ✅ Ne pas naviguer manuellement - useAuth va rediriger automatiquement
    }

    setLoading(false);
  };

  // ✅ Affichage conditionnel si déjà connecté
  if (user && profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Déjà connecté</h2>
              <p className="text-muted-foreground mb-4">
                Vous êtes connecté en tant que {profile.role}
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate('/dashboard/client')} className="w-full">
                  Aller à mon tableau de bord
                </Button>
                <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                  placeholder="Votre mot de passe"
                  required
                  disabled={loading}
                />
              </div>
              
              <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
            
            <div className="text-center space-y-2">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
              
              <div className="text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  S'inscrire
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section de test avec les comptes de démonstration */}
        <Card className="max-w-md mx-auto mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
              🧪 Comptes de test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                <strong>Client:</strong> clodenerc@yahoo.fr
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                <strong>Marchand:</strong> engligoclervil9@gmail.com
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                <strong>Livreur:</strong> claircl18@gmail.com
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                <strong>Admin:</strong> desirdalia@gmail.com
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Mot de passe:</strong> CourseMax2024!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;