import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Truck,
  Download,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAnalyticsProps {
  dateRange: string;
  merchantFilter: string;
  showDetailed?: boolean;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  activeDrivers: number;
  activeMerchants: number;
  ordersGrowth: number;
  revenueGrowth: number;
  commissionGrowth: number;
  ordersByDay: Array<{
    date: string;
    orders: number;
    revenue: number;
    commissions: number;
  }>;
  ordersByMerchant: Array<{
    merchant: string;
    orders: number;
    revenue: number;
    type: string;
  }>;
  driverPerformance: Array<{
    driver: string;
    deliveries: number;
    rating: number;
    earnings: number;
  }>;
  commissionBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const AdminAnalytics = ({ dateRange, merchantFilter, showDetailed = false }: AdminAnalyticsProps) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, merchantFilter]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simuler des données pour l'instant - remplacer par de vraies requêtes Supabase
      const mockData: AnalyticsData = {
        totalOrders: 1247,
        totalRevenue: 45230,
        totalCommissions: 2156,
        activeDrivers: 23,
        activeMerchants: 45,
        ordersGrowth: 15.2,
        revenueGrowth: 8.7,
        commissionGrowth: 12.3,
        ordersByDay: [
          { date: '2024-01-01', orders: 45, revenue: 1200, commissions: 60 },
          { date: '2024-01-02', orders: 52, revenue: 1350, commissions: 68 },
          { date: '2024-01-03', orders: 38, revenue: 980, commissions: 49 },
          { date: '2024-01-04', orders: 61, revenue: 1580, commissions: 79 },
          { date: '2024-01-05', orders: 48, revenue: 1250, commissions: 63 },
          { date: '2024-01-06', orders: 55, revenue: 1420, commissions: 71 },
          { date: '2024-01-07', orders: 67, revenue: 1730, commissions: 87 },
        ],
        ordersByMerchant: [
          { merchant: 'Restaurant Le Bistro', orders: 156, revenue: 4200, type: 'restaurant' },
          { merchant: 'Pharmacie Centrale', orders: 89, revenue: 2100, type: 'pharmacy' },
          { merchant: 'Épicerie Martin', orders: 234, revenue: 3800, type: 'grocery' },
          { merchant: 'Boulangerie Dupont', orders: 67, revenue: 1200, type: 'restaurant' },
          { merchant: 'Super C', orders: 189, revenue: 3200, type: 'grocery' },
        ],
        driverPerformance: [
          { driver: 'Jean Dupuis', deliveries: 45, rating: 4.8, earnings: 890 },
          { driver: 'Marie Tremblay', deliveries: 38, rating: 4.9, earnings: 760 },
          { driver: 'Pierre Gagnon', deliveries: 42, rating: 4.7, earnings: 840 },
          { driver: 'Sophie Leblanc', deliveries: 35, rating: 4.6, earnings: 700 },
          { driver: 'Marc Roy', deliveries: 29, rating: 4.5, earnings: 580 },
        ],
        commissionBreakdown: [
          { name: 'Commissions Livraison', value: 2156, color: '#8884d8' },
          { name: 'Frais de Service', value: 1200, color: '#82ca9d' },
          { name: 'Abonnements', value: 800, color: '#ffc658' },
          { name: 'Publicité', value: 400, color: '#ff7300' },
        ]
      };

      setData(mockData);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.ordersGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={data.ordersGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.ordersGrowth)}%
              </span>
              <span className="ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Généré</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={data.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.revenueGrowth)}%
              </span>
              <span className="ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalCommissions.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.commissionGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={data.commissionGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.commissionGrowth)}%
              </span>
              <span className="ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livreurs Actifs</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeMerchants} marchands actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {showDetailed && (
        <>
          {/* Graphiques détaillés */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des commandes */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Commandes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.ordersByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="orders" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Commandes"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Revenus ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance par marchand */}
            <Card>
              <CardHeader>
                <CardTitle>Performance par Marchand</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.ordersByMerchant}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="merchant" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#8884d8" name="Commandes" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenus ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance des livreurs */}
          <Card>
            <CardHeader>
              <CardTitle>Performance des Livreurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.driverPerformance.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{driver.driver}</p>
                        <p className="text-sm text-muted-foreground">
                          {driver.deliveries} livraisons • Note: {driver.rating}/5
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${driver.earnings}</p>
                      <p className="text-sm text-muted-foreground">Gains</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Répartition des commissions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.commissionBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.commissionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter les données
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Programmer un rapport
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyser les tendances
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;