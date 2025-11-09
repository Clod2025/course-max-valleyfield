import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeInput } from "@/utils/errorHandler";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation et nettoyage des données
    const cleanEmail = sanitizeInput(email);

    if (!cleanEmail) {
      toast({
        title: "Erreur de saisie",
        description: "Veuillez saisir votre adresse email",
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

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSent(true);
        toast({
          title: "Email envoyé !",
          description: "Vérifiez votre boîte email pour réinitialiser votre mot de passe",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto py-12 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gradient">
                Email envoyé !
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
              </p>
              <p className="text-muted-foreground">
                Vérifiez votre boîte email et suivez les instructions pour réinitialiser votre mot de passe.
              </p>
              
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
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
              Mot de passe oublié
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Saisissez votre adresse email pour recevoir un lien de réinitialisation
            </p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
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
              
              <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
            </form>
            
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ForgotPassword;
