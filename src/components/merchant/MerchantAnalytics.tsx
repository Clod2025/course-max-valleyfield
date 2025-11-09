import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
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
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  orders: {
    today: number;
    week: number;
    month: number;
    growth: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    growth: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
}

const MerchantAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      if (!profile) {
        setAnalyticsData(null);
        return;
      }

      let storeId = profile.store_id;

      if (!storeId) {
        const { data: storeRecord, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('manager_id', profile.user_id ?? profile.id)
          .maybeSingle();

        if (storeError && storeError.code !== 'PGRST116') {
          throw storeError;
        }

        storeId = storeRecord?.id || null;
      }

      if (!storeId) {
        setAnalyticsData(null);
        return;
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const monthStart = new Date(now);
      monthStart.setDate(now.getDate() - 30);

      const [
        ordersResult,
        productsResult,
        allOrdersResult,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount, created_at, user_id')
          .eq('store_id', storeId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', now.toISOString()),
        supabase
          .from('products')
          .select('id, stock, category')
          .eq('store_id', storeId),
        supabase
          .from('orders')
          .select('id, user_id, created_at')
          .eq('store_id', storeId),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (allOrdersResult.error) throw allOrdersResult.error;

      const orders = ordersResult.data || [];
      const products = productsResult.data || [];
      const allOrders = allOrdersResult.data || [];

      let orderItems: Array<{ order_id: string; product_id: string; total_price: number }> = [];
      if (orders.length) {
        const orderIds = orders.map(order => order.id);
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('order_items')
          .select('order_id, product_id, total_price')
          .in('order_id', orderIds);

        if (orderItemsError && orderItemsError.code !== 'PGRST116') {
          throw orderItemsError;
        }
        orderItems = Array.isArray(orderItemsData) ? orderItemsData : [];
      }

      const ordersToday = orders.filter(order => new Date(order.created_at) >= todayStart).length;
      const ordersWeek = orders.filter(order => new Date(order.created_at) >= weekStart).length;
      const ordersMonth = orders.length;

      const revenueToday = orders
        .filter(order => new Date(order.created_at) >= todayStart)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const revenueWeek = orders
        .filter(order => new Date(order.created_at) >= weekStart)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const revenueMonth = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const prevPeriodStart = new Date(weekStart);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
      const prevPeriodEnd = new Date(weekStart);

      const { data: previousOrdersData, error: previousOrdersError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('store_id', storeId)
        .gte('created_at', prevPeriodStart.toISOString())
        .lte('created_at', prevPeriodEnd.toISOString());

      if (previousOrdersError) throw previousOrdersError;

      const previousOrders = previousOrdersData || [];
      const previousOrderCount = previousOrders.length;
      const previousRevenueSum = previousOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const productsLowStock = products.filter(product => (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5).length;
      const productsOutOfStock = products.filter(product => (product.stock ?? 0) <= 0).length;

      const uniqueCustomers = new Map<string, Date>();
      allOrders.forEach(order => {
        if (!order.user_id) return;
        const orderDate = new Date(order.created_at);
        const existing = uniqueCustomers.get(order.user_id);
        if (!existing || orderDate < existing) {
          uniqueCustomers.set(order.user_id, orderDate);
        }
      });

      let newCustomers = 0;
      uniqueCustomers.forEach(firstOrderDate => {
        if (firstOrderDate >= monthStart) {
          newCustomers += 1;
        }
      });

      const ordersTrendMap = new Map<string, number>();
      orders.forEach(order => {
        const dateKey = new Date(order.created_at).toISOString().slice(0, 10);
        ordersTrendMap.set(dateKey, (ordersTrendMap.get(dateKey) || 0) + 1);
      });

      const productCategoryMap = new Map<string, string>();
      products.forEach(product => {
        if (product.id) {
          productCategoryMap.set(product.id, product.category || 'Autre');
        }
      });

      const revenueByCategoryMap = new Map<string, number>();
      orderItems.forEach(item => {
        const category = productCategoryMap.get(item.product_id) || 'Autre';
        revenueByCategoryMap.set(category, (revenueByCategoryMap.get(category) || 0) + (item.total_price || 0));
      });

      if (revenueByCategoryMap.size === 0) {
        revenueByCategoryMap.set('Revenus', revenueMonth);
      }

      const analytics: AnalyticsData = {
        orders: {
          today: ordersToday,
          week: ordersWeek,
          month: ordersMonth,
          growth: previousOrderCount ? ((ordersWeek - previousOrderCount) / previousOrderCount) * 100 : 0,
        },
        revenue: {
          today: revenueToday,
          week: revenueWeek,
          month: revenueMonth,
          growth: previousRevenueSum ? ((revenueWeek - previousRevenueSum) / previousRevenueSum) * 100 : 0,
        },
        products: {
          total: products.length,
          lowStock: productsLowStock,
          outOfStock: productsOutOfStock,
        },
        customers: {
          total: uniqueCustomers.size,
          new: newCustomers,
          returning: Math.max(uniqueCustomers.size - newCustomers, 0),
        },
        ordersTrend: Array.from(ordersTrendMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, ordersCount]) => ({ date, orders: ordersCount })),
        revenueByCategory: Array.from(revenueByCategoryMap.entries()).map(([name, value], index) => ({
          name,
          value,
          color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#84d8ff'][index % 5],
        })),
      };

      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Vue d'ensemble de votre magasin</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{analyticsData.orders[dateRange as keyof typeof analyticsData.orders]}</p>
                <div className="flex items-center mt-1">
                  {analyticsData.orders.growth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analyticsData.orders.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {analyticsData.orders.growth >= 0 ? '+' : ''}{analyticsData.orders.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold">
                  ${analyticsData.revenue[dateRange as keyof typeof analyticsData.revenue].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center mt-1">
                  {analyticsData.revenue.growth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analyticsData.revenue.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {analyticsData.revenue.growth >= 0 ? '+' : ''}{analyticsData.revenue.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{analyticsData.products.total}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground">
                    {analyticsData.products.lowStock} en stock faible
                  </span>
                </div>
              </div>
              <Truck className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{analyticsData.customers.total}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground">
                    {analyticsData.customers.new} nouveaux
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.ordersTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenus par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsData.revenueByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {analyticsData.revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MerchantAnalytics;
