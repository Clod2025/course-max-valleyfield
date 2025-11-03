import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Key, 
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Store,
  ShoppingCart
} from 'lucide-react';
import { useEmployeeAuth, useCurrentEmployee } from '@/hooks/useEmployeeAuth';

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { login, logout, loading, error } = useEmployeeAuth();
  const currentEmployee = useCurrentEmployee();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Vérifier si l'employé est déjà authentifié
  useEffect(() => {
    if (currentEmployee) {
      // Rediriger vers l'interface des commandes
      navigate('/dashboard/employee/orders');
    }
  }, [currentEmployee, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeCode.trim() || !password.trim()) {
      return;
    }

    const employee = await login({
      employee_code: employeeCode,
      password
    });

    if (employee) {
      // Rediriger vers l'interface des commandes
      navigate('/dashboard/employee/orders');
    }
  };

  const handleLogout = () => {
    logout();
    setEmployeeCode('');
    setPassword('');
  };

  // Si déjà authentifié, afficher un message
  if (currentEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Store className="w-5 h-5 text-green-500" />
              Employé connecté
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">
                  {currentEmployee.first_name} {currentEmployee.last_name}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Key className="w-3 h-3" />
                Code: {currentEmployee.employee_code}
              </div>
            </div>

            <Button
              onClick={() => navigate('/dashboard/employee/orders')}
              className="w-full"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Accéder aux commandes
            </Button>

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
      </div>
    );
  }

  // Formulaire de connexion
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Key className="w-5 h-5" />
            Connexion Employé
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Entrez vos identifiants pour accéder aux commandes
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_code">Code employé</Label>
              <Input
                id="employee_code"
                type="text"
                placeholder="EMP-XXXXXX"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                className="text-center font-mono"
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !employeeCode.trim() || !password.trim()}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note :</strong> Utilisez votre code employé et votre mot de passe fournis par votre manager.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeLogin;

