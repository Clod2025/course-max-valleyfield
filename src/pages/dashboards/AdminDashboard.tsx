import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Store, 
  Truck, 
  ShoppingCart, 
  TrendingUp,
  Shield,
  Settings,
  BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  // Protection de route : vérifier que l'utilisateur est admin
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role !== 'admin') {
        navigate('/auth/unauthorized');
      }
    }
  }, [profile, loading, navigate]);

  // Afficher loading pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  // Ne pas afficher le contenu si pas admin
  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        {/* En-tête Admin */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Dashboard Administrateur
              </h1>
              <p className="text-muted-foreground mt-2">
                Bienvenue, {profile.first_name || 'Admin'} - Contrôle total du système
              </p>
            </div>
            <Badge variant="default" className="bg-primary">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Badge>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+15% ce mois</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Magasins Actifs</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">+3 nouveaux</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livreurs</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">12 en ligne</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes Aujourd'hui</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+8% vs hier</p>
            </CardContent>
          </Card>
        </div>

        {/* Sections de gestion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics & Rapports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Consultez les statistiques détaillées de la plateforme
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Revenus du mois</span>
                  <span className="font-semibold">45,230 €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Commissions</span>
                  <span className="font-semibold">2,156 €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taux de satisfaction</span>
                  <span className="font-semibold text-green-600">96.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Administration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gestion des utilisateurs et configuration système
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-accent/50">
                  <span>Gestion des rôles</span>
                  <Badge variant="outline">Actif</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-accent/50">
                  <span>Configuration des tarifs</span>
                  <Badge variant="outline">Disponible</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-accent/50">
                  <span>Modération contenu</span>
                  <Badge variant="outline">En cours</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activité Récente du Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Nouveau magasin approuvé</p>
                  <p className="text-sm text-muted-foreground">Épicerie Martin - il y a 2h</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Livreur certifié</p>
                  <p className="text-sm text-muted-foreground">Jean Dupuis - il y a 4h</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Maintenance programmée</p>
                  <p className="text-sm text-muted-foreground">Système de paiement - demain 2h00</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AppFooter />
    </div>
  );
};

export default AdminDashboard;