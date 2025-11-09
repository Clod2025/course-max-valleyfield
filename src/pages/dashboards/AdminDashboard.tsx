import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Store, Truck, DollarSign, ShieldAlert, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { useOptimizedQuery } from '@/utils/performance';
import { auditLogger } from '@/utils/security';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const UserManagementDebug = lazy(() => import('@/components/admin/UserManagementDebug'));
const UserDataDebugger = lazy(() => import('@/components/admin/UserDataDebugger'));
const AuthFixer = lazy(() => import('@/components/admin/AuthFixer'));
const DeliveryPricingManager = lazy(() => import('@/components/admin/DeliveryPricingManager'));
const DocumentManager = lazy(() => import('@/components/admin/DocumentManager'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));
const FinanceManager = lazy(() => import('@/components/admin/FinanceManager'));
const HelpMessagesManager = lazy(() => import('@/components/admin/HelpMessagesManager'));
const AdminPaymentDashboard = lazy(() => import('@/pages/dashboards/AdminPaymentDashboard'));

type MetricCard = {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  description: string;
};

type AuditEntry = {
  id: string;
  action: string;
  level: string;
  details: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RevenueData = {
  date: string;
  revenue: number;
  orders: number;
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('fr-CA').format(value);

const formatDate = (value: string): string =>
  new Date(value).toLocaleString('fr-CA', { hour12: false });

const EmptyState: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
    <ShieldAlert className="mb-3 h-10 w-10" />
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    {description && <p className="mt-1 text-sm">{description}</p>}
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const isDev = import.meta.env.MODE === 'development';

  const isAdmin = isRole(['admin', 'Admin', 'ADMIN']);

  useEffect(() => {
    if (!user) navigate('/login');
    else if (!isAdmin) navigate('/dashboard/client');
  }, [user, isAdmin, navigate]);

  // --- Fetch Metrics ---
  const fetchSummaryMetrics = async () => {
    if (!user) return { usersCount: 0, ordersCount: 0, issuesCount: 0 };

    let usersCount = 0, ordersCount = 0, issuesCount = 0;

    if (isAdmin) {
      const [{ count: uCount }, { count: oCount }, { count: iCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('audit_log').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
      ]);
      usersCount = uCount ?? 0;
      ordersCount = oCount ?? 0;
      issuesCount = iCount ?? 0;
    } else {
      const [{ count: oCount }, { count: iCount }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', user.id),
        supabase.from('audit_log').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
      ]);
      ordersCount = oCount ?? 0;
      issuesCount = iCount ?? 0;

      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('merchant_id', user.id);
      usersCount = uCount ?? 0;
    }

    auditLogger.log({ action: 'admin:metrics_fetched', level: 'info', metadata: { usersCount, ordersCount, issuesCount } });
    return { usersCount, ordersCount, issuesCount };
  };

  const fetchAuditLogs = async (): Promise<AuditEntry[]> => {
    if (!user) return [];
    let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(12);
    if (!isAdmin) query = query.eq('user_id', user.id);
    const { data } = await query;
    return data ?? [];
  };

  const fetchPerformanceEvents = async () => {
    if (!user) return [];
    let query = supabase.from('performance_events').select('*').order('created_at', { ascending: false }).limit(8);
    if (!isAdmin) query = query.eq('user_id', user.id);
    const { data } = await query;
    return data ?? [];
  };

  const fetchRevenueData = async (): Promise<RevenueData[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq(isAdmin ? 'is_paid' : 'merchant_id', isAdmin ? true : user.id);

    const grouped: Record<string, { revenue: number; orders: number }> = {};
    data?.forEach((o: any) => {
      const date = new Date(o.created_at).toLocaleDateString('fr-CA');
      if (!grouped[date]) grouped[date] = { revenue: 0, orders: 0 };
      grouped[date].revenue += o.total_amount;
      grouped[date].orders += 1;
    });

    return Object.entries(grouped).map(([date, values]) => ({ date, ...values })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const metricsQuery = useOptimizedQuery(['admin-metrics'], fetchSummaryMetrics, { staleTime: 60_000, cacheTTL: 60_000 });
  const auditLogsQuery = useOptimizedQuery(['admin-audit-logs'], fetchAuditLogs, { staleTime: 30_000 });
  const performanceQuery = useOptimizedQuery(['admin-performance-events'], fetchPerformanceEvents, { staleTime: 30_000 });
  const revenueQuery = useOptimizedQuery(['admin-revenue'], fetchRevenueData, { staleTime: 60_000 });

  const metricCards: MetricCard[] = useMemo(() => {
    if (!metricsQuery.data) return [
      { id: 'users', label: 'Utilisateurs actifs', icon: <Users className="h-5 w-5 text-primary" />, value: '—', description: 'Nombre total de profils' },
      { id: 'orders', label: 'Commandes', icon: <TrendingUp className="h-5 w-5 text-primary" />, value: '—', description: 'Commandes enregistrées' },
      { id: 'issues', label: 'Alertes sécurité', icon: <ShieldAlert className="h-5 w-5 text-destructive" />, value: '—', description: '24 dernières heures' },
    ];

    return [
      { id: 'users', label: 'Utilisateurs actifs', icon: <Users className="h-5 w-5 text-primary" />, value: formatNumber(metricsQuery.data.usersCount), description: 'Nombre total de profils' },
      { id: 'orders', label: 'Commandes', icon: <TrendingUp className="h-5 w-5 text-primary" />, value: formatNumber(metricsQuery.data.ordersCount), description: 'Commandes enregistrées' },
      { id: 'issues', label: 'Alertes sécurité', icon: <ShieldAlert className="h-5 w-5 text-destructive" />, value: formatNumber(metricsQuery.data.issuesCount), description: '24 dernières heures' },
    ];
  }, [metricsQuery.data]);

  if (!user || !isAdmin) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-lg text-muted-foreground">Redirection en cours...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Utilisateurs</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm">Tarification</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
            <TabsTrigger value="finance" className="text-xs sm:text-sm">Finance</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">Paiements</TabsTrigger>
            <TabsTrigger value="help" className="text-xs sm:text-sm">Aide</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Paramètres</TabsTrigger>
            {isDev && (
              <>
                <TabsTrigger value="debug" className="text-xs sm:text-sm">Debug</TabsTrigger>
                <TabsTrigger value="data-debug" className="text-xs sm:text-sm">Data</TabsTrigger>
                <TabsTrigger value="auth-fix" className="text-xs sm:text-sm">Auth</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview">
            <Suspense fallback={<div>Chargement des données...</div>}>
              <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                  {metricCards.map(card => (
                    <Card key={card.id} className="relative overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                        {card.icon}
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{card.value}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </section>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenus & Commandes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revenueQuery.isLoading || !revenueQuery.data ? (
                      <EmptyState title="Chargement" description="Récupération des données de revenus..." />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueQuery.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenu ($)" />
                          <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Commandes" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="users">
            <Suspense fallback={<div>Chargement du module utilisateurs...</div>}>
              <UserManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="pricing">
            <Suspense fallback={<div>Chargement du module tarification...</div>}>
              <DeliveryPricingManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="documents">
            <Suspense fallback={<div>Chargement du module documents...</div>}>
              <DocumentManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="finance">
            <Suspense fallback={<div>Chargement du module finance...</div>}>
              <FinanceManager />
            </Suspense>
          </TabsContent>

  <TabsContent value="payments">
            <Suspense fallback={<div>Chargement du module paiements...</div>}>
              <AdminPaymentDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="help">
            <Suspense fallback={<div>Chargement de la section aide...</div>}>
              <HelpMessagesManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings">
            <Suspense fallback={<div>Chargement des paramètres...</div>}>
              <AdminSettings />
            </Suspense>
          </TabsContent>

          {isDev && (
            <>
              <TabsContent value="debug">
                <Suspense fallback={<div>Chargement du module debug...</div>}>
                  <UserManagementDebug />
                </Suspense>
              </TabsContent>
              <TabsContent value="data-debug">
                <Suspense fallback={<div>Chargement du module data...</div>}>
                  <UserDataDebugger />
                </Suspense>
              </TabsContent>
              <TabsContent value="auth-fix">
                <Suspense fallback={<div>Chargement du module auth...</div>}>
                  <AuthFixer />
                </Suspense>
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => { metricsQuery.refetch(); auditLogsQuery.refetch(); performanceQuery.refetch(); revenueQuery.refetch(); }}>
            <RefreshCw className={`mr-2 h-4 w-4 ${metricsQuery.isFetching ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
        </div>
      </div>
    </div>
  );
}