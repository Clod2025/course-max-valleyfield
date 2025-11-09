import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, TrendingUp, Users, Package, Filter, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/receiptCalculator';

interface Transaction {
  id: string;
  order_id: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  customer_email: string;
  store_id: string;
  merchant_amount: number;
  driver_amount: number;
  admin_amount: number;
  platform_commission: number;
  created_at: string;
  order?: {
    order_number: string;
    status: string;
    store?: {
      name: string;
    };
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const AdminPaymentDashboard: React.FC = () => {
  const { profile, isRole } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    storeId: 'all',
    page: 1,
    pageSize: 50,
  });

  const isAdmin = isRole(['admin', 'Admin', 'ADMIN']);

  useEffect(() => {
    if (!isAdmin) return;
    fetchTransactions();
  }, [isAdmin, filters]);

  const fetchTransactions = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          order:orders(
            order_number,
            status,
            store:stores(name),
            profiles(first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false })
        .range((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize - 1);

      if (filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
      if (filters.storeId !== 'all') query = query.eq('store_id', filters.storeId);

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data as Transaction[]);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Totaux calculés avec useMemo pour optimiser les performances
  const totals = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalMerchant = transactions.reduce((sum, t) => sum + t.merchant_amount, 0);
    const totalDriver = transactions.reduce((sum, t) => sum + t.driver_amount, 0);
    const totalAdmin = transactions.reduce((sum, t) => sum + t.admin_amount, 0);
    const completed = transactions.filter(t => t.status === 'completed').length;
    return { totalRevenue, totalMerchant, totalDriver, totalAdmin, completed };
  }, [transactions]);

  const exportCSV = () => {
    const header = ['Date/Heure', 'Commande', 'Client', 'Marchand', 'Montant total', 'Marchand', 'Livreur', 'Admin', 'Statut'];
    const rows = transactions.map(t => [
      t.created_at,
      t.order?.order_number || '',
      t.order?.profiles ? `${t.order.profiles.first_name || ''} ${t.order.profiles.last_name || ''}`.trim() : t.customer_email,
      t.order?.store?.name || '',
      t.amount,
      t.merchant_amount,
      t.driver_amount,
      t.admin_amount,
      t.status
    ]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${Date.now()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Accès réservé aux administrateurs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
        <Button variant="outline" onClick={exportCSV} aria-label="Exporter les transactions">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{transactions.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Marchands</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalMerchant)}</div>
            <p className="text-xs text-muted-foreground">À verser aux marchands</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Livreurs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalDriver)}</div>
            <p className="text-xs text-muted-foreground">À verser aux livreurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalAdmin)}</div>
            <p className="text-xs text-muted-foreground">{totals.completed} transactions complétées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Statut</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="completed">Complétées</SelectItem>
                  <SelectItem value="failed">Échouées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date de début</Label>
              <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })} />
            </div>

            <div>
              <Label>Date de fin</Label>
              <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })} />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchTransactions} className="w-full" disabled={loading}>
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucune transaction trouvée</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Marchand</TableHead>
                  <TableHead>Montant total</TableHead>
                  <TableHead>Répartition</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.created_at).toLocaleString('fr-CA')}</TableCell>
                    <TableCell>{transaction.order?.order_number || 'N/A'}</TableCell>
                    <TableCell>
                      {transaction.order?.profiles
                        ? `${transaction.order.profiles.first_name || ''} ${transaction.order.profiles.last_name || ''}`.trim()
                        : transaction.customer_email}
                    </TableCell>
                    <TableCell>{transaction.order?.store?.name || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>Marchand: {formatCurrency(transaction.merchant_amount)}</div>
                        <div>Livreur: {formatCurrency(transaction.driver_amount)}</div>
                        {transaction.admin_amount > 0 && <div>Admin: {formatCurrency(transaction.admin_amount)}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === 'completed'
                            ? 'default'
                            : transaction.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentDashboard;