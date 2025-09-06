import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
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
import { NewMerchantForm } from '@/components/admin/NewMerchantForm';
import { DeliveryPricingManager } from '@/components/admin/DeliveryPricingManager';
import { NewDriverForm } from '@/components/admin/NewDriverForm';
import { DocumentManager } from '@/components/admin/DocumentManager';
import { AnnouncementManager } from '@/components/admin/AnnouncementManager';
import { FinanceManager } from '@/components/admin/FinanceManager';
import { CommissionManager } from '@/components/admin/CommissionManager';
import { AdminSettings } from '@/components/admin/AdminSettings';

const AdminDashboard = () => {
  const { profile, loading, isRole } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedDateRange, setSelectedDateRange] = useState('week');

  // ✅ VÉRIFICATION CORRIGÉE AVEC TOUS LES RÔLES ADMIN POSSIBLES
  const isAdminRole = isRole(['admin', 'Admin', 'ADMIN']);

  // Protection de route : vérifier que l'utilisateur est admin
  useEffect(() => {
    if (!loading && profile) {
      if (!isAdminRole) {
        navigate('/auth/unauthorized');
      }
    }
  }, [profile, loading, navigate, isAdminRole]);

  // Afficher loading pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ VÉRIFICATION CORRIGÉE
  if (!profile || !isAdminRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
              </p>
              <div className="text-sm text-gray-500">
                <p>Rôle actuel: <strong>{profile?.role || 'Non défini'}</strong></p>
                <p>Rôles autorisés: admin</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'new-merchant':
        return <NewMerchantForm />;
      case 'pricing':
        return <DeliveryPricingManager />;
      case 'new-driver':
        return <NewDriverForm />;
      case 'documents':
        return <DocumentManager />;
      case 'announcements':
        return <AnnouncementManager />;
      case 'finance':
        return <FinanceManager />;
      case 'commissions':
        return <CommissionManager />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

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
                Bienvenue, {profile.first_name || 'Admin'} - Contrôle total du système CourseMax
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-primary">
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Badge>
              <Badge variant="outline">
                Rôle: {profile.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions rapides - TOUS FONCTIONNELS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('new-merchant')}
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs">Nouveau Marchand</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('pricing')}
            >
              <DollarSign className="w-6 h-6" />
              <span className="text-xs">Tarification</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('new-driver')}
            >
              <Truck className="w-6 h-6" />
              <span className="text-xs">Nouveau Livreur</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('documents')}
            >
              <FileText className="w-6 h-6" />
              <span className="text-xs">Documents</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('announcements')}
            >
              <Bell className="w-6 h-6" />
              <span className="text-xs">Annonces</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('finance')}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs">Finance</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('commissions')}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-xs">Commissions</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
              onClick={() => setActiveSection('settings')}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs">Paramètres</span>
            </Button>
          </div>
        </div>

        {/* Navigation secondaire */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={activeSection === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('overview')}
            >
              Vue d'ensemble
            </Button>
            {activeSection !== 'overview' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('overview')}
              >
                ← Retour
              </Button>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        {renderMainContent()}
      </div>

      <AppFooter />
    </div>
  );
};

// Composant Vue d'ensemble
const AdminOverview = () => {
  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marchands Actifs</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livreurs Actifs</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">+2 cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,230$</div>
            <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Aujourd'hui</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+8% vs hier</p>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Nouveau marchand approuvé</p>
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
                <p className="font-medium">Document en attente</p>
                <p className="text-sm text-muted-foreground">Permis de conduire - Marie L. - il y a 6h</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gestion des Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gérez les marchands, livreurs et clients de la plateforme
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Marchands en attente</span>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Livreurs à vérifier</span>
                <Badge variant="secondary">2</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Documents en attente</span>
                <Badge variant="destructive">5</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configurez les paramètres de la plateforme CourseMax
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Tarification</span>
                <Badge variant="outline">Configuré</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Zones de livraison</span>
                <Badge variant="outline">Valleyfield</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Maintenance</span>
                <Badge variant="outline">Aucune</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;