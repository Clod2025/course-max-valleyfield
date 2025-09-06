import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  BarChart3,
  Download,
  Truck,
  Building2
} from 'lucide-react';
import { useCommissions, Commission, CommissionStats } from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CommissionManagement = () => {
  const { commissions, loading, fetchCommissions, getCommissionStats, updateCommissionStatus } = useCommissions();
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      // Charger les commissions
      const filters: any = {};
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      
      if (startDate) {
        filters.start_date = startDate;
      }
      
      if (endDate) {
        filters.end_date = endDate;
      }

      await fetchCommissions(filters);

      // Charger les statistiques
      const statsData = await getCommissionStats(selectedPeriod);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleStatusChange = async (commissionId: string, newStatus: 'pending' | 'paid' | 'cancelled') => {
    await updateCommissionStatus(commissionId, newStatus);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const exportData = () => {
    // Logique d'exportation CSV
    const csvData = commissions.map(c => ({
      'Numéro de commande': c.orders?.order_number || 'N/A',
      'Date': format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      'Livreur': c.profiles ? `${c.profiles.first_name || ''} ${c.profiles.last_name || ''}`.trim() : 'Non assigné',
      'Frais de livraison': c.delivery_fee,
      'Commission (%)': c.commission_percent,
      'Montant plateforme': c.platform_amount,
      'Montant livreur': c.driver_amount,
      'Statut': c.status
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: "Export réussi",
      description: "Les données ont été exportées en CSV",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Commissions</h2>
          <p className="text-muted-foreground">
            Suivez et gérez les commissions de livraison de la plateforme
          </p>
        </div>
        <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistiques générales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_platform_amount)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_commissions} commission(s) ce {selectedPeriod === 'month' ? 'mois' : selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Livreurs</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_driver_amount)}</div>
              <p className="text-xs text-muted-foreground">
                Moyenne: {formatCurrency(stats.total_driver_amount / (stats.total_commissions || 1))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frais Totaux</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_delivery_fees)}</div>
              <p className="text-xs text-muted-foreground">
                Commission moy: {stats.average_commission_percent.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Livreurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.top_drivers.length}</div>
              <p className="text-xs text-muted-foreground">
                Actifs ce {selectedPeriod === 'month' ? 'mois' : selectedPeriod}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="period">Période</Label>
                  <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start-date">Date début</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Date fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Button onClick={loadData} disabled={loading}>
                  {loading ? 'Chargement...' : 'Appliquer les filtres'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table des commissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Liste des Commissions</CardTitle>
              <CardDescription>
                {commissions.length} commission(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Livreur</TableHead>
                    <TableHead>Frais</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Livreur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        {commission.orders?.order_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(commission.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {commission.profiles 
                          ? `${commission.profiles.first_name || ''} ${commission.profiles.last_name || ''}`.trim()
                          : 'Non assigné'
                        }
                      </TableCell>
                      <TableCell>{formatCurrency(commission.delivery_fee)}</TableCell>
                      <TableCell>{commission.commission_percent}%</TableCell>
                      <TableCell>{formatCurrency(commission.platform_amount)}</TableCell>
                      <TableCell>{formatCurrency(commission.driver_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(commission.status)}>
                          {commission.status === 'pending' ? 'En attente' :
                           commission.status === 'paid' ? 'Payé' : 'Annulé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={commission.status}
                          onValueChange={(value: any) => handleStatusChange(commission.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {commissions.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune commission trouvée pour la période sélectionnée
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics des Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-6">
                  {/* Statuts */}
                  <div>
                    <h4 className="font-semibold mb-3">Répartition par statut</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{stats.by_status.pending}</div>
                        <div className="text-sm text-muted-foreground">En attente</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.by_status.paid}</div>
                        <div className="text-sm text-muted-foreground">Payées</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{stats.by_status.cancelled}</div>
                        <div className="text-sm text-muted-foreground">Annulées</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Livreurs */}
                  {stats.top_drivers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Top Livreurs</h4>
                      <div className="space-y-2">
                        {stats.top_drivers.slice(0, 5).map((driver, index) => (
                          <div key={driver.driver_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{driver.name || 'Nom non disponible'}</div>
                                <div className="text-sm text-muted-foreground">{driver.email}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(driver.total_amount)}</div>
                              <div className="text-sm text-muted-foreground">{driver.count} livraisons</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des Commissions</CardTitle>
              <CardDescription>
                Configurez les paramètres de commission de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="commission-percent">Pourcentage de commission (%)</Label>
                  <Input
                    id="commission-percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="20.0"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Pourcentage prélevé par la plateforme sur chaque frais de livraison
                  </p>
                </div>
                
                <Button>
                  Sauvegarder les paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommissionManagement;
