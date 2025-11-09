import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Phone, ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCommisAuth } from '@/hooks/useCommisAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type OrderStatus = 'en_attente' | 'acceptee' | 'preparation' | 'prete' | 'livree' | 'annulee';

interface CommisOrder {
  id: string;
  client_nom: string | null;
  client_phone: string | null;
  client_email: string | null;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  store_id: string | null;
}

interface OrderLogEntry {
  id: string;
  action: string;
  details?: string | null;
  created_at: string;
  commis?: {
    prenom: string;
    nom: string;
    code_unique: string;
  } | null;
}

interface OrderDetail {
  order: CommisOrder;
  logs: OrderLogEntry[];
}

const statusLabels: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  preparation: 'En préparation',
  prete: 'Prête',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const statusActions: Record<OrderStatus, OrderStatus | null> = {
  en_attente: 'acceptee',
  acceptee: 'preparation',
  preparation: 'prete',
  prete: 'livree',
  livree: null,
  annulee: null,
};

const statusColors: Record<OrderStatus, string> = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  acceptee: 'bg-blue-100 text-blue-800',
  preparation: 'bg-purple-100 text-purple-800',
  prete: 'bg-emerald-100 text-emerald-800',
  livree: 'bg-green-100 text-green-800',
  annulee: 'bg-red-100 text-red-800',
};

const CommisOrders = () => {
  const navigate = useNavigate();
  const { commis, loading: commisLoading, mustChangePassword, logout, refresh } = useCommisAuth();
  const [orders, setOrders] = useState<CommisOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [details, setDetails] = useState<OrderDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (!commisLoading && !commis) {
      navigate('/commis/login', { replace: true });
    } else if (commis && mustChangePassword) {
      navigate('/commis/change-password', { replace: true });
    }
  }, [commis, commisLoading, mustChangePassword, navigate]);

  useEffect(() => {
    if (commis) {
      fetchOrders();
    }
  }, [commis]);

  const fetchOrders = async () => {
    if (!commis) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('commandes')
        .select('*')
        .order('created_at', { ascending: false })
        .eq(commis.store_id ? 'store_id' : 'merchant_id', commis.store_id ?? commis.merchant_id);

      if (fetchError) throw fetchError;

      setOrders((data ?? []) as CommisOrder[]);
    } catch (err: any) {
      console.error('Erreur lors du chargement des commandes', err);
      setError(err?.message || 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (order: CommisOrder) => {
    const nextStatus = statusActions[order.status];
    if (!nextStatus) return;

    try {
      const { error: updateError } = await (supabase as any)
        .from('commandes')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      const { error: logError } = await (supabase as any)
        .from('order_logs')
        .insert({
          order_id: order.id,
          commis_id: commis.id,
          action: `Statut changé: ${statusLabels[order.status]} → ${statusLabels[nextStatus]}`,
          details: `Statut mis à jour par ${commis?.prenom ?? ''} ${commis?.nom ?? ''}`,
        });

      if (logError) {
        console.warn('Enregistrement du log échoué', logError);
      }

      toast({
        title: 'Statut mis à jour',
        description: `Commande désormais ${statusLabels[nextStatus]}`,
      });

      await fetchOrders();
    } catch (err: any) {
      console.error('Impossible de mettre à jour la commande', err);
      toast({
        title: 'Erreur',
        description: err?.message || 'Mise à jour impossible',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (commis?.nom && commis?.prenom && commis?.merchant_id && commis?.store_id && commis?.user_id) {
      fetchOrders();
    }
  }, [commis?.nom, commis?.prenom, commis?.merchant_id, commis?.store_id, commis?.user_id, fetchOrders, toast]);

  const handleOpenDetails = async (order: CommisOrder) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const { data, error: logsError } = await (supabase as any)
        .from('order_logs')
        .select(`
          *,
          commis:commis(prenom, nom, code_unique)
        `)
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (logsError) {
        throw logsError;
      }

      setDetails({ order, logs: (data ?? []) as OrderLogEntry[] });
    } catch (err: any) {
      console.error('Erreur lors du chargement des détails', err);
      setDetailsError(err?.message || 'Impossible de charger les détails');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setDetails(null);
    setDetailsError(null);
  };

  const actionableOrders = useMemo(() => orders.filter((order) => statusActions[order.status]), [orders]);

  if (commisLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={fetchOrders}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!commis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Commandes à traiter</h1>
          <p className="text-muted-foreground">
            Bonjour {commis.prenom} {commis.nom}, voici les commandes de votre magasin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Code: {commis.code_unique}</Badge>
          {commis.role !== 'commis' && (
            <Badge variant="secondary">{commis.role}</Badge>
          )}
          <Button variant="outline" onClick={async () => { await logout(); navigate('/commis/login'); }}>
            Se déconnecter
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-lg font-semibold">Aucune commande pour le moment</p>
            <p className="text-sm text-muted-foreground">
              Les commandes apparaîtront ici dès qu''un client passera une commande.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="border shadow-sm">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {order.client_nom || 'Client anonyme'}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    {order.client_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {order.client_phone}
                      </span>
                    )}
                    {order.client_email && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {order.client_email}
                      </span>
                    )}
                    <span>Total: {order.total_amount.toFixed(2)} $</span>
                  </div>
                </div>
                <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.notes && (
                  <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-md p-3">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <p>{order.notes}</p>
                  </div>
                )}

                {statusActions[order.status] ? (
                  <Button
                    className="w-full md:w-auto"
                    onClick={() => handleAdvanceStatus(order)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme {statusLabels[statusActions[order.status] as OrderStatus]}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cette commande est terminée.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    className="w-full md:w-auto"
                    onClick={() => handleOpenDetails(order)}
                    variant="outline"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Voir l'historique
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="ghost" onClick={refresh} className="w-full md:w-auto">
        Rafraîchir
      </Button>

      <Dialog open={Boolean(details)} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>
              Historique complet des actions effectuées sur cette commande.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {detailsError && (
            <Alert variant="destructive">
              <AlertDescription>{detailsError}</AlertDescription>
            </Alert>
          )}

          {details && !detailsLoading && !detailsError && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-semibold">{details.order.client_nom || 'Client'}</p>
                  <p className="text-sm text-muted-foreground">
                    #{details.order.id.slice(-8)} • {new Date(details.order.created_at).toLocaleString('fr-CA')}
                  </p>
                </div>
                <Badge className={statusLabels[details.order.status] ? '' : 'bg-gray-500'}>
                  {statusLabels[details.order.status] || details.order.status}
                </Badge>
              </div>

              <div className="space-y-2">
                {details.logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune action enregistrée pour le moment.</p>
                ) : (
                  details.logs.map((log) => (
                    <div key={log.id} className="rounded-md border p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('fr-CA')}
                        </span>
                      </div>
                      {(log.details || (log as any).notes) && <p>{log.details ?? (log as any).notes}</p>}
                      {log.commis && (
                        <p className="text-muted-foreground text-xs">
                          Par {log.commis.prenom} {log.commis.nom} ({log.commis.code_unique})
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommisOrders;

