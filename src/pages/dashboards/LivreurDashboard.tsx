import React, { useEffect, useState } from 'react';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { AppFooter } from '@/components/AppFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Clock, 
  MapPin, 
  Bell,
  CheckCircle,
  AlertCircle,
  Truck,
  DollarSign,
  Navigation,
  Phone,
  User,
  Star,
  Timer,
  Route
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDriverAssignments } from '@/hooks/useDriverAssignments';
import DriverAssignmentCard from '@/components/DriverAssignmentCard';

interface Assignment {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  pickup_address: string;
  delivery_address: string;
  distance: number;
  estimated_time: number;
  payment_amount: number;
  items_count: number;
  priority: 'normal' | 'urgent' | 'express';
  created_at: string;
  store_name: string;
}

const LivreurDashboard = () => {
  const { profile, loading: authLoading, isRole } = useAuth();
  const { 
    assignments, 
    loading, 
    fetchAssignments, 
    acceptAssignment 
  } = useDriverAssignments();

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [driverStatus, setDriverStatus] = useState<'online' | 'offline' | 'busy'>('online');

  // ✅ VÉRIFICATION CORRIGÉE AVEC TOUS LES RÔLES LIVREUR POSSIBLES
  const isDriverRole = isRole(['livreur', 'driver', 'Driver', 'Livreur', 'DRIVER']);

  useEffect(() => {
    if (isDriverRole) {
      fetchAssignments();
      // Actualiser les assignations toutes les 30 secondes
      const interval = setInterval(fetchAssignments, 30000);
      return () => clearInterval(interval);
    }
  }, [profile, isDriverRole]);

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

  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      await acceptAssignment(assignmentId);
      setDriverStatus('busy');
      // Actualiser la liste
      fetchAssignments();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'express': return 'bg-orange-600';
      default: return 'bg-blue-600';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'URGENT';
      case 'express': return 'EXPRESS';
      default: return 'NORMAL';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DriverHeader />
      
      <div className="container mx-auto py-6 px-4">
        {/* Statut du livreur */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Truck className="w-7 h-7 text-blue-600" />
                Assignations Disponibles
              </h1>
              <p className="text-muted-foreground mt-1">
                Bienvenue, {profile.first_name} - Choisissez vos livraisons
              </p>
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
                  onClick={fetchAssignments}
                  disabled={loading}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>

              {assignments.map((assignment) => (
                <Card 
                  key={assignment.id} 
                  className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            Commande #{assignment.order_number}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {assignment.store_name} • {assignment.items_count} article{assignment.items_count > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {getPriorityLabel(assignment.priority)}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {assignment.payment_amount.toFixed(2)}$
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Récupération */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                          <MapPin className="w-4 h-4" />
                          Récupération
                        </div>
                        <p className="text-sm pl-6">{assignment.pickup_address}</p>
                      </div>

                      {/* Livraison */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                          <Navigation className="w-4 h-4" />
                          Livraison
                        </div>
                        <p className="text-sm pl-6">{assignment.delivery_address}</p>
                      </div>
                    </div>

                    {/* Informations client */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{assignment.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{assignment.customer_phone}</span>
                      </div>
                    </div>

                    {/* Détails de la course */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <Route className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="font-semibold">{assignment.distance} km</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <Timer className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Temps estimé</p>
                        <p className="font-semibold">{assignment.estimated_time} min</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Gain</p>
                        <p className="font-semibold">{assignment.payment_amount.toFixed(2)}$</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAcceptAssignment(assignment.id)}
                        disabled={driverStatus !== 'online'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accepter la Livraison
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

        {/* Modal détails assignation */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Détails de la Livraison</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAssignment(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div>
                    <h4 className="font-semibold mb-3">Informations Générales</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Numéro de commande</p>
                        <p className="font-medium">#{selectedAssignment.order_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Magasin</p>
                        <p className="font-medium">{selectedAssignment.store_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Articles</p>
                        <p className="font-medium">{selectedAssignment.items_count} article{selectedAssignment.items_count > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Priorité</p>
                        <Badge className={getPriorityColor(selectedAssignment.priority)}>
                          {getPriorityLabel(selectedAssignment.priority)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Itinéraire */}
                  <div>
                    <h4 className="font-semibold mb-3">Itinéraire</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">Récupération</p>
                          <p className="text-sm">{selectedAssignment.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <Navigation className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">Livraison</p>
                          <p className="text-sm">{selectedAssignment.delivery_address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client */}
                  <div>
                    <h4 className="font-semibold mb-3">Informations Client</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{selectedAssignment.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedAssignment.customer_phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rémunération */}
                  <div>
                    <h4 className="font-semibold mb-3">Rémunération</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Gain de base</p>
                        <p className="text-lg font-bold text-purple-600">{selectedAssignment.payment_amount.toFixed(2)}$</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Pourboire estimé</p>
                        <p className="text-lg font-bold text-yellow-600">2-5$</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total estimé</p>
                        <p className="text-lg font-bold text-green-600">{(selectedAssignment.payment_amount + 3.5).toFixed(2)}$</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        handleAcceptAssignment(selectedAssignment.id);
                        setSelectedAssignment(null);
                      }}
                      disabled={driverStatus !== 'online'}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accepter cette Livraison
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAssignment(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
};

export default LivreurDashboard;