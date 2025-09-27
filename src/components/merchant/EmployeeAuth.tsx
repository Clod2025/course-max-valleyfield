import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Key, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Store,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Commis {
  id: string;
  nom: string;
  email: string;
  code_unique: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  last_password_change?: string;
}

interface EmployeeAuthProps {
  onEmployeeAuthenticated: (commis: Commis) => void;
  onLogout: () => void;
}

export function EmployeeAuth({ onEmployeeAuthenticated, onLogout }: EmployeeAuthProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticatedCommis, setAuthenticatedCommis] = useState<Commis | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Vérifier si un commis est déjà authentifié (session)
  useEffect(() => {
    const savedCommis = sessionStorage.getItem('authenticated_commis');
    if (savedCommis) {
      try {
        const commis = JSON.parse(savedCommis);
        setAuthenticatedCommis(commis);
        onEmployeeAuthenticated(commis);
      } catch (error) {
        console.error('Erreur lors du parsing du commis sauvegardé:', error);
        sessionStorage.removeItem('authenticated_commis');
      }
    }
  }, [onEmployeeAuthenticated]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!profile?.id) {
      setError('Vous devez être connecté en tant que marchand');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Vérifier si on est en mode démonstration
      const isDemoMode = code.trim().toUpperCase().startsWith('COM-');
      
      if (isDemoMode) {
        // Mode démonstration - simuler l'authentification
        const demoCommis: Commis[] = [
          {
            id: 'demo-commis-1',
            nom: 'Jean Dupont',
            email: 'jean.dupont@demo.com',
            code_unique: 'COM-ABC123',
            role: 'commis',
            is_active: true,
            must_change_password: true
          },
          {
            id: 'demo-commis-2',
            nom: 'Marie Martin',
            email: 'marie.martin@demo.com',
            code_unique: 'COM-DEF456',
            role: 'supervisor',
            is_active: true,
            must_change_password: false
          }
        ];
        
        const foundCommis = demoCommis.find(c => 
          c.code_unique === code.trim().toUpperCase() && 
          c.email === email.trim()
        );
        
        if (foundCommis) {
          // Vérifier si le mot de passe doit être changé
          if (foundCommis.must_change_password) {
            // Sauvegarder la session et rediriger vers le changement de mot de passe
            const sessionData = {
              ...foundCommis,
              temp_password: password // Mot de passe temporaire pour la démo
            };
            localStorage.setItem('commis_session', JSON.stringify(sessionData));
            window.location.href = '/commis-change-password';
            return;
          }
          
          // Authentification réussie
          setAuthenticatedCommis(foundCommis);
          sessionStorage.setItem('authenticated_commis', JSON.stringify(foundCommis));
          onEmployeeAuthenticated(foundCommis);

          toast({
            title: "Authentification réussie (Démo)",
            description: `Bienvenue ${foundCommis.nom}`,
          });
          return;
        } else {
          setError('Identifiants de démonstration invalides. Essayez: COM-ABC123 avec jean.dupont@demo.com ou COM-DEF456 avec marie.martin@demo.com');
          return;
        }
      }

      // Mode production - utiliser la fonction sécurisée
      const { data, error: authError } = await supabase.rpc('verify_commis_credentials', {
        p_email: email.trim(),
        p_password: password,
        p_code_unique: code.trim().toUpperCase()
      });

      if (authError) {
        if (authError.code === 'PGRST116' || authError.message?.includes('function verify_commis_credentials() does not exist')) {
          console.log('Fonction verify_commis_credentials non trouvée, utilisation de données de démonstration');
          setError('Fonction d\'authentification non disponible. Utilisez les identifiants de démonstration.');
          return;
        }
        setError(authError.message || 'Erreur d\'authentification');
        return;
      }

      if (!data) {
        setError('Identifiants invalides');
        return;
      }

      // Vérifier si le mot de passe doit être changé
      if (data.must_change_password) {
        // Sauvegarder la session et rediriger vers le changement de mot de passe
        localStorage.setItem('commis_session', JSON.stringify(data));
        window.location.href = '/commis-change-password';
        return;
      }

      // Authentification réussie
      setAuthenticatedCommis(data);
      sessionStorage.setItem('authenticated_commis', JSON.stringify(data));
      onEmployeeAuthenticated(data);

      toast({
        title: "Authentification réussie",
        description: `Bienvenue ${data.nom}`,
      });

    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      setError('Erreur lors de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticatedCommis(null);
    setCode('');
    setError('');
    sessionStorage.removeItem('authenticated_commis');
    onLogout();
    
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté",
    });
  };

  // Si un commis est déjà authentifié, afficher ses informations
  if (authenticatedCommis) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Employé connecté
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-semibold">
                {authenticatedCommis.nom}
              </span>
            </div>
            <Badge variant="outline" className="flex items-center gap-1 w-fit mx-auto">
              <Key className="w-3 h-3" />
              {authenticatedCommis.code_unique}
            </Badge>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Store className="w-4 h-4" />
              {profile?.first_name} {profile?.last_name}
            </div>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Formulaire d'authentification
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Key className="w-5 h-5" />
          Authentification Employé
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Entrez vos identifiants pour accéder aux commandes
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code unique</Label>
            <Input
              id="code"
              type="text"
              placeholder="COM-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center font-mono"
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !code.trim() || !email.trim() || !password.trim()}
          >
            {loading ? 'Vérification...' : 'Se connecter'}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note :</strong> Utilisez vos identifiants personnels (email + mot de passe + code unique) 
            pour vous authentifier. Si c'est votre première connexion, vous devrez changer votre mot de passe.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
