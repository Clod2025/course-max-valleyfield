import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  Camera,
  Phone,
  Package,
  Route,
  Users,
  DollarSign,
  Play,
  Pause,
  Square,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryStop {
  id: string;
  type: 'pickup' | 'delivery';
  merchantId?: string;
  merchantName?: string;
  clientName?: string;
  address: string;
  coordinates: { lat: number; lng: number };
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  estimatedArrival: string;
  estimatedDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    image?: string;
    category?: string;
  }>;
  specialInstructions?: string;
  contactInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
  proofOfPickup?: string[];
  proofOfDelivery?: string[];
  notes?: string;
}

export interface MultiStopDelivery {
  id: string;
  orderNumber: string;
  clientAddress: string;
  clientCoordinates: { lat: number; lng: number };
  totalDistance: number;
  totalDuration: number;
  totalFee: number;
  stops: DeliveryStop[];
  currentStopIndex: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  driverId: string;
  driverName: string;
  vehicleInfo: {
    type: 'car' | 'bike' | 'scooter';
    plate?: string;
    model?: string;
  };
}

interface MultiStopDeliveryProps {
  delivery: MultiStopDelivery;
  onStatusUpdate: (deliveryId: string, stopId: string, status: string) => void;
  onCompleteDelivery: (deliveryId: string) => void;
  onCancelDelivery: (deliveryId: string, reason: string) => void;
  className?: string;
}

export const MultiStopDelivery: React.FC<MultiStopDeliveryProps> = ({
  delivery,
  onStatusUpdate,
  onCompleteDelivery,
  onCancelDelivery,
  className
}) => {
  const [currentStop, setCurrentStop] = useState<DeliveryStop | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofType, setProofType] = useState<'pickup' | 'delivery'>('pickup');
  
  const { toast } = useToast();

  useEffect(() => {
    if (delivery.stops.length > 0) {
      const current = delivery.stops[delivery.currentStopIndex];
      setCurrentStop(current);
    }
  }, [delivery.currentStopIndex, delivery.stops]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timerStart) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - timerStart.getTime()) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStart]);

  const startTimer = () => {
    setTimerStart(new Date());
    setIsTimerRunning(true);
    toast({
      title: "Timer démarré",
      description: "Le chronomètre de livraison a été activé",
    });
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    toast({
      title: "Timer en pause",
      description: "Le chronomètre a été mis en pause",
    });
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setElapsedTime(0);
    setTimerStart(null);
    toast({
      title: "Timer arrêté",
      description: "Le chronomètre a été arrêté",
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600">En attente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Terminé</Badge>;
      case 'skipped':
        return <Badge variant="destructive">Ignoré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStopIcon = (type: string) => {
    return type === 'pickup' ? <Package className="w-5 h-5" /> : <Users className="w-5 h-5" />;
  };

  const handleStopStatusUpdate = (stopId: string, status: string) => {
    onStatusUpdate(delivery.id, stopId, status);
    
    if (status === 'completed') {
      toast({
        title: "Arrêt terminé",
        description: "L'arrêt a été marqué comme terminé",
      });
    }
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    toast({
      title: "Navigation démarrée",
      description: "Ouvrir l'application de navigation",
    });
  };

  const handleArriveAtStop = () => {
    if (currentStop) {
      handleStopStatusUpdate(currentStop.id, 'in_progress');
      toast({
        title: "Arrivé à destination",
        description: `Arrivé chez ${currentStop.merchantName || currentStop.clientName}`,
      });
    }
  };

  const handleCompleteStop = () => {
    if (currentStop) {
      handleStopStatusUpdate(currentStop.id, 'completed');
      setShowProofModal(true);
      setProofType(currentStop.type);
    }
  };

  const handleNextStop = () => {
    if (delivery.currentStopIndex < delivery.stops.length - 1) {
      // Logique pour passer au prochain arrêt
      toast({
        title: "Arrêt suivant",
        description: "Passage au prochain arrêt",
      });
    } else {
      // Dernier arrêt terminé
      onCompleteDelivery(delivery.id);
      toast({
        title: "Livraison terminée",
        description: "Tous les arrêts ont été complétés",
      });
    }
  };

  const getProgressPercentage = () => {
    const completedStops = delivery.stops.filter(stop => stop.status === 'completed').length;
    return (completedStops / delivery.stops.length) * 100;
  };

  const getRemainingStops = () => {
    return delivery.stops.filter(stop => stop.status === 'pending').length;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête de la livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6" />
              <span>Livraison #{delivery.orderNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(delivery.status)}
              <Badge variant="outline">
                {getRemainingStops()} arrêts restants
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{delivery.totalDistance.toFixed(1)} km</p>
                <p className="text-xs text-muted-foreground">Distance totale</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">{delivery.totalDuration} min</p>
                <p className="text-xs text-muted-foreground">Durée estimée</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">${delivery.totalFee.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Frais de livraison</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">{delivery.stops.length}</p>
                <p className="text-xs text-muted-foreground">Arrêts total</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre de progression */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression de la livraison</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{delivery.stops.filter(s => s.status === 'completed').length} terminés</span>
              <span>{getRemainingStops()} restants</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Chronomètre de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-mono font-bold">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex gap-2">
              {!isTimerRunning ? (
                <Button onClick={startTimer} size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Démarrer
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="outline" size="sm">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={stopTimer} variant="outline" size="sm">
                <Square className="w-4 h-4 mr-2" />
                Arrêter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="current">Arrêt actuel</TabsTrigger>
          <TabsTrigger value="route">Itinéraire</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arrêts de récupération */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Récupérations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {delivery.stops.filter(stop => stop.type === 'pickup').map((stop, index) => (
                    <div key={stop.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {getStopIcon(stop.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{stop.merchantName}</p>
                        <p className="text-sm text-muted-foreground">{stop.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {stop.items.length} articles
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(stop.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          Arrivée: {stop.estimatedArrival}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Arrêt de livraison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {delivery.stops.filter(stop => stop.type === 'delivery').map((stop, index) => (
                    <div key={stop.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        {getStopIcon(stop.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{stop.clientName}</p>
                        <p className="text-sm text-muted-foreground">{stop.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {stop.items.length} articles
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(stop.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          Arrivée: {stop.estimatedArrival}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          {currentStop ? (
            <div className="space-y-4">
              {/* Informations de l'arrêt actuel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStopIcon(currentStop.type)}
                    {currentStop.type === 'pickup' ? 'Récupération' : 'Livraison'}
                    {currentStop.merchantName || currentStop.clientName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-muted-foreground">{currentStop.address}</p>
                    </div>
                    
                    {currentStop.contactInfo && (
                      <div>
                        <p className="font-medium">Contact</p>
                        <p className="text-muted-foreground">
                          {currentStop.contactInfo.name} - {currentStop.contactInfo.phone}
                        </p>
                      </div>
                    )}

                    {currentStop.specialInstructions && (
                      <div>
                        <p className="font-medium">Instructions spéciales</p>
                        <p className="text-muted-foreground">{currentStop.specialInstructions}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium">Articles</p>
                      <div className="space-y-2 mt-2">
                        {currentStop.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Quantité: {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleStartNavigation}
                  className="flex-1"
                  disabled={isNavigating}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {isNavigating ? 'Navigation active' : 'Démarrer navigation'}
                </Button>
                
                <Button
                  onClick={handleArriveAtStop}
                  variant="outline"
                  className="flex-1"
                  disabled={currentStop.status !== 'pending'}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Arrivé sur place
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCompleteStop}
                  className="flex-1"
                  disabled={currentStop.status !== 'in_progress'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Terminer l'arrêt
                </Button>
                
                <Button
                  onClick={handleNextStop}
                  variant="outline"
                  className="flex-1"
                  disabled={currentStop.status !== 'completed'}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Arrêt suivant
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun arrêt actuel</h3>
                <p className="text-muted-foreground">
                  Tous les arrêts ont été complétés
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="route" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Itinéraire optimisé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {delivery.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                      stop.status === 'completed' ? "bg-green-600" :
                      stop.status === 'in_progress' ? "bg-blue-600" :
                      index === delivery.currentStopIndex ? "bg-orange-600" : "bg-gray-400"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {stop.type === 'pickup' ? stop.merchantName : stop.clientName}
                      </p>
                      <p className="text-sm text-muted-foreground">{stop.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {stop.type === 'pickup' ? 'Récupération' : 'Livraison'} • 
                        Arrivée: {stop.estimatedArrival}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(stop.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions finales */}
      {delivery.stops.every(stop => stop.status === 'completed') && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Livraison terminée !
                </h3>
                <p className="text-green-700">
                  Tous les arrêts ont été complétés avec succès
                </p>
              </div>
              <Button
                onClick={() => onCompleteDelivery(delivery.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Finaliser la livraison
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
