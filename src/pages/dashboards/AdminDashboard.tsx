import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Store, 
  Truck, 
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Plus,
  DollarSign,
  FileText,
  Bell,
  CreditCard,
  Calendar,
  Filter,
  Download,
  AlertCircle,
  MapPin,
  Wrench
} from 'lucide-react';

// Import des composants admin fonctionnels
import { DeliveryPricingManager } from '@/components/admin/DeliveryPricingManager';
import { DocumentManager } from '@/components/admin/DocumentManager';
import { UserManagement } from '@/components/admin/UserManagement';
import { UserManagementDebug } from '@/components/admin/UserManagementDebug';
import { UserDataDebugger } from '@/components/admin/UserDataDebugger';
import { AuthFixer } from '@/components/admin/AuthFixer';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { FinanceManager } from '@/components/admin/FinanceManager';
import { HelpMessagesManager } from '@/components/admin/HelpMessagesManager';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirection si pas admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (profile?.role !== 'admin') {
      navigate('/dashboard/client');
      return;
    }
  }, [user, profile, navigate]);

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <AdminSettings />;
      case 'debug':
        return <UserManagementDebug />;
      case 'data-debug':
        return <UserDataDebugger />;
      case 'auth-fix':
        return <AuthFixer />;
      case 'pricing':
        return <DeliveryPricingManager />;
      case 'documents':
        return <DocumentManager />;
      default:
        return (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Tableau de Bord Admin</h1>
                <p className="text-muted-foreground">
                  Gérez votre plateforme de livraison
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Admin
                </Badge>
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Total des utilisateurs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Marchands</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Marchands actifs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Livreurs</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Livreurs disponibles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Revenus du mois
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actions principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('users')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gestion d'utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Gérez tous les utilisateurs de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Accéder à la gestion
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('pricing')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Tarification
                  </CardTitle>
                  <CardDescription>
                    Configurez les tarifs de livraison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Gérer les tarifs
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('documents')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents
                  </CardTitle>
                  <CardDescription>
                    Gérez les documents et contrats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Gérer les documents
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('finance')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Finance
                  </CardTitle>
                  <CardDescription>
                    Gérez les transferts, moyens de paiement et paiements des livreurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Accéder à la finance
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('settings')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Paramètres
                  </CardTitle>
                  <CardDescription>
                    Configurez les paramètres de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Accéder aux paramètres
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Debug section - seulement en développement */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Wrench className="w-5 h-5" />
                    Debug - Développement
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    Outils de debug pour le développement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="border-orange-300 text-orange-800 hover:bg-orange-100"
                      onClick={() => setActiveTab('debug')}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Debug général
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-blue-300 text-blue-800 hover:bg-blue-100"
                      onClick={() => setActiveTab('data-debug')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Debug données
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-300 text-red-800 hover:bg-red-100"
                      onClick={() => setActiveTab('auth-fix')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Réparation Auth
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="pricing">Tarification</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="help">Messages d'Aide</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            {process.env.NODE_ENV === 'development' && (
              <>
                <TabsTrigger value="debug">Debug</TabsTrigger>
                <TabsTrigger value="data-debug">Data Debug</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview">
            {renderMainContent()}
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="pricing">
            <DeliveryPricingManager />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>

        <TabsContent value="finance">
          <FinanceManager />
        </TabsContent>
        <TabsContent value="help">
          <HelpMessagesManager />
        </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          {process.env.NODE_ENV === 'development' && (
            <>
              <TabsContent value="debug">
                <UserManagementDebug />
              </TabsContent>
              
              <TabsContent value="data-debug">
                <UserDataDebugger />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}