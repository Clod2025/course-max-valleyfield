import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Package,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryAnalytics {
  period: {
    start: string;
    end: string;
    label: string;
  };
  overview: {
    totalDeliveries: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalDistance: number;
    averageDeliveryTime: number;
    customerSatisfaction: number;
  };
  multiMerchantStats: {
    totalMultiMerchantOrders: number;
    averageSavings: number;
    averageDistanceSaved: number;
    customerSatisfaction: number;
    deliveryTimeIncrease: number;
    adoptionRate: number;
  };
  efficiency: {
    averageRouteOptimization: number;
    fuelSavings: number;
    timeSavings: number;
    costReduction: number;
  };
  trends: {
    deliveryVolume: Array<{
      date: string;
      single: number;
      multi: number;
      total: number;
    }>;
    revenue: Array<{
      date: string;
      amount: number;
      type: 'single' | 'multi';
    }>;
    satisfaction: Array<{
      date: string;
      score: number;
    }>;
  };
  optimizationOpportunities: {
    suggestedMerchantPairs: Array<{
      merchant1: string;
      merchant2: string;
      frequency: number;
      potentialSavings: number;
      confidence: number;
    }>;
    peakGroupingHours: string[];
    underservedZones: string[];
    recommendedPricing: {
      zone: string;
      currentFee: number;
      suggestedFee: number;
      expectedImpact: string;
    }[];
  };
  performance: {
    topPerformingZones: Array<{
      zone: string;
      deliveries: number;
      revenue: number;
      efficiency: number;
    }>;
    driverPerformance: Array<{
      driverId: string;
      driverName: string;
      deliveries: number;
      averageTime: number;
      customerRating: number;
      efficiency: number;
    }>;
    merchantParticipation: Array<{
      merchantId: string;
      merchantName: string;
      singleOrders: number;
      multiOrders: number;
      participationRate: number;
    }>;
  };
}

export const DeliveryAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Simulation des données d'analytics
      const mockAnalytics: DeliveryAnalytics = {
        period: {
          start: '2024-01-21',
          end: '2024-01-28',
          label: '7 derniers jours'
        },
        overview: {
          totalDeliveries: 1247,
          totalRevenue: 18650.50,
          averageOrderValue: 14.97,
          totalDistance: 3124.5,
          averageDeliveryTime: 28.5,
          customerSatisfaction: 4.2
        },
        multiMerchantStats: {
          totalMultiMerchantOrders: 312,
          averageSavings: 3.25,
          averageDistanceSaved: 2.8,
          customerSatisfaction: 4.4,
          deliveryTimeIncrease: 15,
          adoptionRate: 25.0
        },
        efficiency: {
          averageRouteOptimization: 18.5,
          fuelSavings: 245.30,
          timeSavings: 156,
          costReduction: 12.5
        },
        trends: {
          deliveryVolume: [
            { date: '2024-01-21', single: 45, multi: 12, total: 57 },
            { date: '2024-01-22', single: 52, multi: 15, total: 67 },
            { date: '2024-01-23', single: 48, multi: 18, total: 66 },
            { date: '2024-01-24', single: 61, multi: 22, total: 83 },
            { date: '2024-01-25', single: 55, multi: 19, total: 74 },
            { date: '2024-01-26', single: 67, multi: 25, total: 92 },
            { date: '2024-01-27', single: 58, multi: 21, total: 79 }
          ],
          revenue: [
            { date: '2024-01-21', amount: 2450.50, type: 'single' },
            { date: '2024-01-21', amount: 320.75, type: 'multi' },
            { date: '2024-01-22', amount: 2680.25, type: 'single' },
            { date: '2024-01-22', amount: 420.30, type: 'multi' }
          ],
          satisfaction: [
            { date: '2024-01-21', score: 4.1 },
            { date: '2024-01-22', score: 4.3 },
            { date: '2024-01-23', score: 4.2 },
            { date: '2024-01-24', score: 4.4 },
            { date: '2024-01-25', score: 4.3 },
            { date: '2024-01-26', score: 4.5 },
            { date: '2024-01-27', score: 4.4 }
          ]
        },
        optimizationOpportunities: {
          suggestedMerchantPairs: [
            { merchant1: 'Pharmaprix', merchant2: 'Metro', frequency: 45, potentialSavings: 4.20, confidence: 0.85 },
            { merchant1: 'IGA', merchant2: 'Dollarama', frequency: 32, potentialSavings: 3.50, confidence: 0.78 },
            { merchant1: 'Jean Coutu', merchant2: 'Provigo', frequency: 28, potentialSavings: 3.80, confidence: 0.72 }
          ],
          peakGroupingHours: ['11:00-14:00', '17:00-20:00'],
          underservedZones: ['Downtown', 'Airport', 'Industrial'],
          recommendedPricing: [
            { zone: 'Downtown', currentFee: 2.99, suggestedFee: 3.50, expectedImpact: '+15% revenue' },
            { zone: 'Airport', currentFee: 5.99, suggestedFee: 4.99, expectedImpact: '+25% volume' }
          ]
        },
        performance: {
          topPerformingZones: [
            { zone: 'Centre-ville', deliveries: 245, revenue: 3675.50, efficiency: 92 },
            { zone: 'Banlieue', deliveries: 189, revenue: 2835.25, efficiency: 88 },
            { zone: 'Résidentiel', deliveries: 156, revenue: 2340.75, efficiency: 85 }
          ],
          driverPerformance: [
            { driverId: 'd1', driverName: 'Jean Dubois', deliveries: 45, averageTime: 25, customerRating: 4.5, efficiency: 95 },
            { driverId: 'd2', driverName: 'Marie Martin', deliveries: 42, averageTime: 28, customerRating: 4.3, efficiency: 88 },
            { driverId: 'd3', driverName: 'Pierre Tremblay', deliveries: 38, averageTime: 32, customerRating: 4.1, efficiency: 82 }
          ],
          merchantParticipation: [
            { merchantId: 'm1', merchantName: 'Pharmaprix', singleOrders: 125, multiOrders: 45, participationRate: 26.5 },
            { merchantId: 'm2', merchantName: 'Metro', singleOrders: 98, multiOrders: 38, participationRate: 27.9 },
            { merchantId: 'm3', merchantName: 'IGA', singleOrders: 87, multiOrders: 22, participationRate: 20.2 }
          ]
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value: number, previousValue: number) => {
    if (value > previousValue) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (value < previousValue) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (value: number, previousValue: number) => {
    if (value > previousValue) return 'text-green-600';
    if (value < previousValue) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
          <p className="text-muted-foreground">
            Les analytics ne sont pas encore disponibles pour cette période
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics de Livraison
          </h2>
          <p className="text-muted-foreground">
            Analyse des performances et optimisations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('7d')}
          >
            7 jours
          </Button>
          <Button
            variant={selectedPeriod === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('30d')}
          >
            30 jours
          </Button>
          <Button
            variant={selectedPeriod === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('90d')}
          >
            90 jours
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livraisons totales</p>
                <p className="text-2xl font-bold">{analytics.overview.totalDeliveries}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.overview.totalDeliveries, 1200)}
                  <span className={cn("text-sm", getTrendColor(analytics.overview.totalDeliveries, 1200))}>
                    +3.9%
                  </span>
                </div>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold">${analytics.overview.totalRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.overview.totalRevenue, 18000)}
                  <span className={cn("text-sm", getTrendColor(analytics.overview.totalRevenue, 18000))}>
                    +7.2%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
                <p className="text-2xl font-bold">{analytics.overview.averageDeliveryTime}min</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.overview.averageDeliveryTime, 30)}
                  <span className={cn("text-sm", getTrendColor(analytics.overview.averageDeliveryTime, 30))}>
                    -5.0%
                  </span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{analytics.overview.customerSatisfaction}/5</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.overview.customerSatisfaction, 4.0)}
                  <span className={cn("text-sm", getTrendColor(analytics.overview.customerSatisfaction, 4.0))}>
                    +5.0%
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="multi">Multi-marchands</TabsTrigger>
          <TabsTrigger value="optimization">Optimisations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des livraisons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Livraisons simples</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Livraisons multi-marchands</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zones les plus actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performance.topPerformingZones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{zone.zone}</p>
                        <p className="text-sm text-muted-foreground">{zone.deliveries} livraisons</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${zone.revenue.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{zone.efficiency}% efficacité</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="multi" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques multi-marchands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Commandes multi-marchands</span>
                  <span className="font-bold">{analytics.multiMerchantStats.totalMultiMerchantOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Économies moyennes</span>
                  <span className="font-bold text-green-600">${analytics.multiMerchantStats.averageSavings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance économisée</span>
                  <span className="font-bold text-blue-600">{analytics.multiMerchantStats.averageDistanceSaved}km</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux d'adoption</span>
                  <span className="font-bold">{analytics.multiMerchantStats.adoptionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Satisfaction client</span>
                  <span className="font-bold text-orange-600">{analytics.multiMerchantStats.customerSatisfaction}/5</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participation des marchands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performance.merchantParticipation.map((merchant, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{merchant.merchantName}</p>
                        <p className="text-sm text-muted-foreground">
                          {merchant.singleOrders} simples, {merchant.multiOrders} multi
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{merchant.participationRate}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunités d'optimisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium">Paires de marchands suggérées</h4>
                  {analytics.optimizationOpportunities.suggestedMerchantPairs.map((pair, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{pair.merchant1} + {pair.merchant2}</p>
                          <p className="text-sm text-muted-foreground">
                            {pair.frequency} commandes • Économies: ${pair.potentialSavings}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {Math.round(pair.confidence * 100)}% confiance
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommandations tarifaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.optimizationOpportunities.recommendedPricing.map((pricing, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{pricing.zone}</p>
                          <p className="text-sm text-muted-foreground">
                            ${pricing.currentFee} → ${pricing.suggestedFee}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">{pricing.expectedImpact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Efficacité du système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics.efficiency.averageRouteOptimization}%</p>
                  <p className="text-sm text-muted-foreground">Optimisation d'itinéraire</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${analytics.efficiency.fuelSavings.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Économies de carburant</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{analytics.efficiency.timeSavings}h</p>
                  <p className="text-sm text-muted-foreground">Temps économisé</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{analytics.efficiency.costReduction}%</p>
                  <p className="text-sm text-muted-foreground">Réduction des coûts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance des livreurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.performance.driverPerformance.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{driver.driverName}</p>
                        <p className="text-sm text-muted-foreground">{driver.deliveries} livraisons</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium">{driver.averageTime}min</p>
                        <p className="text-xs text-muted-foreground">Temps moyen</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{driver.customerRating}/5</p>
                        <p className="text-xs text-muted-foreground">Note client</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{driver.efficiency}%</p>
                        <p className="text-xs text-muted-foreground">Efficacité</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Volume de livraisons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.trends.deliveryVolume.slice(-7).map((day, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{day.date}</span>
                      <div className="flex gap-4">
                        <span className="text-sm">{day.single} simples</span>
                        <span className="text-sm text-green-600">{day.multi} multi</span>
                        <span className="text-sm font-medium">{day.total} total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.trends.satisfaction.slice(-7).map((day, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${(day.score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{day.score}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
