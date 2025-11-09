import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Hash } from 'lucide-react';
import { useCommisAuth } from '@/hooks/useCommisAuth';

const CommisLogin = () => {
  const navigate = useNavigate();
  const { login, loading, error, commis, mustChangePassword } = useCommisAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (commis) {
    if (mustChangePassword) {
      navigate('/commis/change-password', { replace: true });
    } else {
      navigate('/commis/orders', { replace: true });
    }
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const success = await login(identifier.trim(), password);
    if (success) {
      if (mustChangePassword) {
        navigate('/commis/change-password', { replace: true });
      } else {
        navigate('/commis/orders', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Connexion Commis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Utilisez votre email et votre mot de passe pour accéder aux commandes de votre magasin.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email ou code unique</Label>
              <div className="relative">
                <Input
                  id="identifier"
                  autoComplete="username"
                  placeholder="ex.: jean@commerce.com ou COM-AB12CD34"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                />
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
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
                  className="pl-10 pr-10"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !identifier.trim() || !password.trim()}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note :</strong> Vous pouvez entrer votre email ou votre code unique (ex.: COM-XXXXXXX).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommisLogin;

