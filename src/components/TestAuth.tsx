import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Store, 
  Truck, 
  Shield,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const TestAuth = () => {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testAccounts = [
    {
      email: 'client@test.com',
      password: 'test123',
      role: 'client',
      name: 'Marie Tremblay',
      icon: User,
      color: 'bg-blue-500'
    },
    {
      email: 'marchand@test.com',
      password: 'test123',
      role: 'merchant',
      name: 'Antoine Bouchard',
      icon: Store,
      color: 'bg-green-500'
    },
    {
      email: 'livreur@test.com',
      password: 'test123',
      role: 'driver',
      name: 'Pierre Lévesque',
      icon: Truck,
      color: 'bg-orange-500'
    },
    {
      email: 'admin@test.com',
      password: 'test123',
      role: 'admin',
      name: 'Admin CourseMax',
      icon: Shield,
      color: 'bg-purple-500'
    }
  ];

  const handleLogin = async (testEmail: string, testPassword: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (error) {
        setMessage(`Erreur: ${error.message}`);
      } else {
        setMessage('Connexion réussie !');
        // Rediriger vers le dashboard approprié
        setTimeout(() => {
          window.location.href = '/dashboard/admin'; // ou selon le rôle
        }, 1000);
      }
    } catch (error) {
      setMessage(`Erreur: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setMessage('Déconnexion réussie !');
    } catch (error) {
      setMessage(`Erreur de déconnexion: ${error}`);
    }
  };

  const handleCreateTestAccount = async (account: any) => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            first_name: account.name.split(' ')[0],
            last_name: account.name.split(' ')[1],
            role: account.role
          }
        }
      });

      if (error) {
        setMessage(`Erreur: ${error.message}`);
      } else {
        setMessage(`Compte créé avec succès ! Vérifiez votre email: ${account.email}`);
      }
    } catch (error) {
      setMessage(`Erreur: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔐 Test d'Authentification - CourseMax</h1>
        
        {/* Utilisateur connecté */}
        {user && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Utilisateur connecté
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Rôle:</strong> {user.user_metadata?.role || 'Non défini'}</p>
                <Button onClick={handleSignOut} variant="outline">
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message */}
        {message && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className={message.includes('Erreur') ? 'text-red-500' : 'text-green-500'}>
                {message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Comptes de test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testAccounts.map((account, index) => {
            const IconComponent = account.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${account.color} rounded-full flex items-center justify-center`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    {account.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge className={account.color}>
                      {account.role}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {account.email}</p>
                    <p><strong>Mot de passe:</strong> {account.password}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleLogin(account.email, account.password)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Se connecter
                    </Button>
                    <Button 
                      onClick={() => handleCreateTestAccount(account)}
                      disabled={loading}
                      variant="outline"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Connexion manuelle */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Connexion manuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
              />
            </div>
            <Button 
              onClick={() => handleLogin(email, password)}
              disabled={loading || !email || !password}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAuth;
