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
      const days =
        dateRange === '30d' ? 30 :
        dateRange === '90d' ? 90 : 7;

      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - days);

      const previousPeriodStart = new Date(periodStart);
      previousPeriodStart.setDate(periodStart.getDate() - days);

      const previousPeriodEnd = new Date(periodStart);

      let ordersQuery = supabase
        .from('orders')
        .select('id, total_amount, created_at, store_id, status')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', now.toISOString());

      let ordersPrevQuery = supabase
        .from('orders')
        .select('id, total_amount')
        .gte('created_at', previousPeriodStart.toISOString())
        .lte('created_at', previousPeriodEnd.toISOString());

      if (merchantFilter && merchantFilter !== 'all') {
        ordersQuery = ordersQuery.eq('store_id', merchantFilter);
        ordersPrevQuery = ordersPrevQuery.eq('store_id', merchantFilter);
      }

      const [
        ordersResult,
        ordersPrevResult,
        deliveriesResult,
        commissionsResult,
        storesResult,
        driversResult,
      ] = await Promise.all([
        ordersQuery,
        ordersPrevQuery,
        supabase
          .from('deliveries')
          .select('driver_id')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', now.toISOString()),
        supabase
          .from('delivery_commissions')
          .select('driver_id, platform_amount, driver_amount')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', now.toISOString()),
        supabase.from('stores').select('id, name, store_type'),
        supabase
          .from('profiles')
          .select('user_id, first_name, last_name, driver_rating')
          .in('role', ['livreur', 'driver']),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (ordersPrevResult.error) throw ordersPrevResult.error;
      if (deliveriesResult.error && deliveriesResult.error.code !== 'PGRST116') throw deliveriesResult.error;
      if (commissionsResult.error && commissionsResult.error.code !== 'PGRST116') throw commissionsResult.error;
      if (storesResult.error && storesResult.error.code !== 'PGRST116') throw storesResult.error;
      if (driversResult.error && driversResult.error.code !== 'PGRST116') throw driversResult.error;

      const orders = ordersResult.data || [];
      const prevOrders = ordersPrevResult.data || [];
      const deliveries = deliveriesResult.data || [];
      const commissions = commissionsResult.data || [];
      const stores = storesResult.data || [];
      const drivers = driversResult.data || [];

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalCommissions = commissions.reduce((sum, entry) => sum + (entry.platform_amount || 0), 0);

      const ordersByDate = new Map<string, { orders: number; revenue: number; commissions: number }>();
      orders.forEach(order => {
        const dateKey = new Date(order.created_at).toISOString().slice(0, 10);
        if (!ordersByDate.has(dateKey)) {
          ordersByDate.set(dateKey, { orders: 0, revenue: 0, commissions: 0 });
        }
        const aggregate = ordersByDate.get(dateKey)!;
        aggregate.orders += 1;
        aggregate.revenue += order.total_amount || 0;
      });

      const commissionsByDate = new Map<string, number>();
      commissions.forEach(entry => {
        const dateKey = new Date(entry.created_at).toISOString().slice(0, 10);
        commissionsByDate.set(dateKey, (commissionsByDate.get(dateKey) || 0) + (entry.platform_amount || 0));
      });

      commissionsByDate.forEach((value, date) => {
        if (!ordersByDate.has(date)) {
          ordersByDate.set(date, { orders: 0, revenue: 0, commissions: 0 });
        }
        const aggregate = ordersByDate.get(date)!;
        aggregate.commissions += value;
      });

      const ordersByMerchantMap = new Map<string, { orders: number; revenue: number }>();
      orders.forEach(order => {
        const key = order.store_id || 'unknown';
        if (!ordersByMerchantMap.has(key)) {
          ordersByMerchantMap.set(key, { orders: 0, revenue: 0 });
        }
        const aggregate = ordersByMerchantMap.get(key)!;
        aggregate.orders += 1;
        aggregate.revenue += order.total_amount || 0;
      });

      const storeNameMap = new Map<string, { name: string; type: string }>();
      stores.forEach(store => {
        storeNameMap.set(store.id, { name: store.name || store.id, type: store.store_type || 'other' });
      });

      const driverNameMap = new Map<string, { name: string; rating: number }>();
      drivers.forEach(driver => {
        driverNameMap.set(driver.user_id, {
          name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || driver.user_id,
          rating: driver.driver_rating || 0,
        });
      });

      const driverDeliveriesAggregate = new Map<string, number>();
      deliveries.forEach(entry => {
        if (!entry.driver_id) return;
        driverDeliveriesAggregate.set(entry.driver_id, (driverDeliveriesAggregate.get(entry.driver_id) || 0) + 1);
      });

      const driverEarningsAggregate = new Map<string, number>();
      commissions.forEach(entry => {
        if (!entry.driver_id) return;
        driverEarningsAggregate.set(entry.driver_id, (driverEarningsAggregate.get(entry.driver_id) || 0) + (entry.driver_amount || 0));
      });

      const driverPerformance = Array.from(driverDeliveriesAggregate.entries())
        .map(([driverId, deliveriesCount]) => ({
          driver: driverNameMap.get(driverId)?.name || driverId,
          deliveries: deliveriesCount,
          rating: driverNameMap.get(driverId)?.rating || 0,
          earnings: driverEarningsAggregate.get(driverId) || 0,
        }))
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 5);

      const commissionBreakdown = [
        {
          name: 'Commissions Livraison',
          value: commissions.reduce((sum, entry) => sum + (entry.platform_amount || 0), 0),
          color: '#8884d8',
        },
        {
          name: 'Versements Livreurs',
          value: commissions.reduce((sum, entry) => sum + (entry.driver_amount || 0), 0),
          color: '#82ca9d',
        },
      ];

      const currentOrders = orders.length;
      const previousOrders = prevOrders.length;
      const currentRevenue = totalRevenue;
      const previousRevenue = prevOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const currentCommissions = totalCommissions;
      const previousCommissions = 0;

      const analyticsData: AnalyticsData = {
        totalOrders,
        totalRevenue,
        totalCommissions,
        activeDrivers: new Set(deliveries.map(entry => entry.driver_id).filter(Boolean)).size,
        activeMerchants: new Set(orders.map(order => order.store_id).filter(Boolean)).size,
        ordersGrowth: previousOrders ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0,
        revenueGrowth: previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
        commissionGrowth: previousCommissions ? ((currentCommissions - previousCommissions) / previousCommissions) * 100 : 0,
        ordersByDay: Array.from(ordersByDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, values]) => ({
            date,
            orders: values.orders,
            revenue: values.revenue,
            commissions: values.commissions,
          })),
        ordersByMerchant: Array.from(ordersByMerchantMap.entries())
          .map(([storeId, values]) => ({
            merchant: storeNameMap.get(storeId)?.name || storeId,
            orders: values.orders,
            revenue: values.revenue,
            type: storeNameMap.get(storeId)?.type || 'other',
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
        driverPerformance,
        commissionBreakdown,
      };

      setData(analyticsData);
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
