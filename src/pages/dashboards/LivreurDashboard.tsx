import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { DriverFinance } from '@/components/driver/DriverFinance';
import { DriverTips } from '@/components/driver/DriverTips';
import { DriverSupport } from '@/components/driver/DriverSupport';
import { DriverSettings } from '@/components/driver/DriverSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Bell,
  CheckCircle,
  AlertCircle,
  Truck,
  DollarSign,
  User,
  Timer,
  Clock,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDriverAssignments } from '@/hooks/useDriverAssignments';
import { DriverAssignmentCard } from '@/components/DriverAssignmentCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LivreurDashboard = () => {
  const { profile, loading: authLoading, isRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    assignments, 
    loading, 
    fetchAssignments, 
    acceptAssignment 
  } = useDriverAssignments();

  const [driverStatus, setDriverStatus] = useState<'online' | 'offline' | 'busy'>('online');

  // ✅ VÉRIFICATION CORRIGÉE AVEC TOUS LES RÔLES LIVREUR POSSIBLES
  const isDriverRole = isRole(['livreur', 'driver', 'Driver', 'Livreur', 'DRIVER']);

  useEffect(() => {
    if (isDriverRole && profile?.user_id) {
      fetchAssignments();
      
      // ✅ NOUVEAU: Realtime pour driver_assignments
      const channel = supabase
        .channel('driver-assignments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_assignments',
            filter: `available_drivers=cs.{${profile.user_id}}`
          },
          (payload) => {
            console.log('🔔 Nouvelle assignation reçue:', payload);
            toast({
              title: "📦 Nouvelle livraison disponible!",
              description: "Une nouvelle assignation vous attend",
            });
            fetchAssignments();
          }
        )
        .subscribe();

      // Actualiser toutes les 30 secondes
      const interval = setInterval(fetchAssignments, 30000);
      
      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [profile, isDriverRole, profile?.user_id, fetchAssignments, toast]);

  // Déterminer quelle vue afficher selon l'URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/finance')) return 'finance';
    if (path.includes('/pourboires')) return 'tips';
    if (path.includes('/aide')) return 'support';
    if (path.includes('/parametres')) return 'settings';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DriverHeader />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ VÉRIFICATION CORRIGÉE
  if (!profile || !isDriverRole) {
    return (
      <div className="min-h-screen bg-background">
        <DriverHeader />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté en tant que livreur pour accéder à cette page.
              </p>
              <div className="text-sm text-gray-500">
                <p>Rôle actuel: <strong>{profile?.role || 'Non défini'}</strong></p>
                <p>Rôles autorisés: livreur, driver</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Rendu conditionnel selon la vue
  const renderContent = () => {
    switch (currentView) {
      case 'finance':
        return <DriverFinance />;
      case 'tips':
        return <DriverTips />;
      case 'support':
        return <DriverSupport />;
      case 'settings':
        return <DriverSettings />;
      default:
        return <MainDashboardContent />;
    }
  };

  // Composant pour le contenu principal du dashboard
  const MainDashboardContent = () => {
    const handleAcceptAssignment = async (assignmentId: string) => {
      try {
        await acceptAssignment(assignmentId);
        setDriverStatus('busy');
        fetchAssignments();
      } catch (error) {
        console.error('Erreur lors de l\'acceptation:', error);
      }
    };

    return (
      <div className="container mx-auto py-6 px-4">
        {/* Statut du livreur */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Truck className="w-7 h-7 text-blue-600" />
                Assignations Disponibles
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={driverStatus === 'online' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDriverStatus(driverStatus === 'online' ? 'offline' : 'online')}
                className={driverStatus === 'online' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  driverStatus === 'online' ? 'bg-white' : 'bg-green-500'
                }`} />
                {driverStatus === 'online' ? 'En ligne' : 'Hors ligne'}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Disponibles</p>
                  <p className="text-2xl font-bold text-blue-800">{assignments?.length || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-green-800">8</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">Gains</p>
                  <p className="text-2xl font-bold text-purple-800">156$</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Temps Actif</p>
                  <p className="text-2xl font-bold text-orange-800">6h 30m</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerte si hors ligne */}
        {driverStatus === 'offline' && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Vous êtes actuellement hors ligne. Passez en ligne pour recevoir des assignations.
            </AlertDescription>
          </Alert>
        )}

        {/* Liste des assignations */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg">Chargement des assignations...</p>
            </div>
          ) : assignments && assignments.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {assignments.length} livraison{assignments.length > 1 ? 's' : ''} disponible{assignments.length > 1 ? 's' : ''}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAssignments()}
                  disabled={loading}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>

              {assignments.map((assignment) => (
                <DriverAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onAccept={handleAcceptAssignment}
                  canAccept={driverStatus === 'online'}
                />
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Aucune assignation disponible</h3>
                <p className="text-muted-foreground mb-6">
                  {driverStatus === 'offline' 
                    ? 'Passez en ligne pour recevoir des assignations.'
                    : 'Nouvelles livraisons disponibles bientôt dans votre zone.'
                  }
                </p>
                {driverStatus === 'offline' && (
                  <Button onClick={() => setDriverStatus('online')}>
                    Passer en ligne
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DriverHeader />
      
      {/* Contenu principal avec flex-grow */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* ✅ REMPLACÉ : Footer minimaliste et professionnel pour livreur */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="font-semibold text-foreground">
                <Truck className="inline w-4 h-4 mr-1" />
                CourseMax Livreur
              </span>
              <span>•</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Button variant="ghost" size="sm" className="h-auto p-0" onClick={() => navigate('/dashboard/livreur/aide')}>
                <HelpCircle className="w-4 h-4 mr-1" />
                Support
              </Button>
              <span>•</span>
              <Button variant="ghost" size="sm" className="h-auto p-0" onClick={() => navigate('/dashboard/livreur/parametres')}>
                <User className="w-4 h-4 mr-1" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LivreurDashboard;