import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  Package, 
  AlertCircle,
  Eye,
  User,
  History,
  Phone,
  MapPin,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeAuth } from './EmployeeAuth';

interface Commis {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  code_unique: string;
  is_active: boolean;
}

interface Commande {
  id: string;
  client_nom: string;
  client_phone: string;
  client_email: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface OrderLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  commis: {
    prenom: string;
    nom: string;
    code_unique: string;
  } | null;
}

export function EnhancedOrdersDisplay() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [orderLogs, setOrderLogs] = useState<Record<string, OrderLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [authenticatedCommis, setAuthenticatedCommis] = useState<Commis | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Commande | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadCommandes();
    }
  }, [profile]);

  const loadCommandes = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Charger les commandes
      const { data: commandesData, error: commandesError } = await supabase
        .from('commandes')
        .select('*')
        .eq('merchant_id', profile.id)
        .order('created_at', { ascending: false });

      if (commandesError) {
        // Si la table n'existe pas, créer des données de démonstration
        if (commandesError.code === 'PGRST116' || commandesError.message?.includes('relation "commandes" does not exist')) {
          console.log('Table commandes non trouvée, utilisation de données de démonstration');
          const demoCommandes: Commande[] = [
            {
              id: 'demo-1',
              client_nom: 'Marie Dubois',
              client_phone: '450-123-4567',
              client_email: 'marie.dubois@email.com',
              status: 'en_attente',
              total_amount: 25.50,
              notes: 'Livraison urgente',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'demo-2',
              client_nom: 'Jean Martin',
              client_phone: '450-987-6543',
              client_email: 'jean.martin@email.com',
              status: 'en_attente',
              total_amount: 18.75,
              notes: 'Pas de tomates',
              created_at: new Date(Date.now() - 3600000).toISOString(),
              updated_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'demo-3',
              client_nom: 'Sophie Tremblay',
              client_phone: '450-555-1234',
              client_email: 'sophie.tremblay@email.com',
              status: 'acceptee',
              total_amount: 32.00,
              notes: 'Appeler avant livraison',
              created_at: new Date(Date.now() - 7200000).toISOString(),
              updated_at: new Date(Date.now() - 7200000).toISOString()
            }
          ];
          setCommandes(demoCommandes);
          setOrderLogs({});
          return;
        }
        throw commandesError;
      }
      
      setCommandes(commandesData || []);

      // Charger les logs pour chaque commande
      if (commandesData && commandesData.length > 0) {
        const orderIds = commandesData.map(c => c.id);
        const { data: logsData, error: logsError } = await supabase
          .from('order_logs')
          .select(`
            *,
            commis:prenom, nom, code_unique
          `)
          .in('order_id', orderIds)
          .order('timestamp', { ascending: false });

        if (logsError) {
          console.log('Table order_logs non trouvée, logs vides');
          setOrderLogs({});
        } else {
          // Organiser les logs par commande
          const logsByOrder: Record<string, OrderLog[]> = {};
          (logsData || []).forEach(log => {
            if (!logsByOrder[log.order_id]) {
              logsByOrder[log.order_id] = [];
            }
            logsByOrder[log.order_id].push(log);
          });
          setOrderLogs(logsByOrder);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      // En cas d'erreur, utiliser des données de démonstration
      const demoCommandes: Commande[] = [
        {
          id: 'demo-error-1',
          client_nom: 'Client Démo',
          client_phone: '450-000-0000',
          client_email: 'demo@email.com',
          status: 'en_attente',
          total_amount: 15.00,
          notes: 'Commande de démonstration',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setCommandes(demoCommandes);
      setOrderLogs({});
      
      toast({
        title: "Mode démonstration",
        description: "Utilisation de données de démonstration",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (commandeId: string) => {
    if (!authenticatedCommis) {
      toast({
        title: "Erreur",
        description: "Vous devez être authentifié en tant qu'employé",
        variant: "destructive"
      });
      return;
    }

    try {
      // Vérifier si c'est une commande de démonstration
      if (commandeId.startsWith('demo-')) {
        // Mode démonstration - mettre à jour localement
        setCommandes(prev => prev.map(c => 
          c.id === commandeId ? { ...c, status: 'acceptee' } : c
        ));
        
        // Ajouter un log local
        const newLog: OrderLog = {
          id: `log-${Date.now()}`,
          action: 'Commande acceptée',
          details: `Commande acceptée par ${authenticatedCommis.prenom} ${authenticatedCommis.nom} (${authenticatedCommis.code_unique})`,
          timestamp: new Date().toISOString(),
          commis: {
            prenom: authenticatedCommis.prenom,
            nom: authenticatedCommis.nom,
            code_unique: authenticatedCommis.code_unique
          }
        };
        
        setOrderLogs(prev => ({
          ...prev,
          [commandeId]: [newLog, ...(prev[commandeId] || [])]
        }));

        toast({
          title: "Commande acceptée (Démo)",
          description: `La commande a été acceptée par ${authenticatedCommis.prenom} ${authenticatedCommis.nom}`,
        });
        return;
      }

      // Mode production - utiliser Supabase
      const { error: updateError } = await supabase
        .from('commandes')
        .update({ 
          status: 'acceptee',
          updated_at: new Date().toISOString()
        })
        .eq('id', commandeId);

      if (updateError) throw updateError;

      // Créer un log de l'action
      const { error: logError } = await supabase
        .from('order_logs')
        .insert({
          order_id: commandeId,
          commis_id: authenticatedCommis.id,
          action: 'Commande acceptée',
          details: `Commande acceptée par ${authenticatedCommis.prenom} ${authenticatedCommis.nom} (${authenticatedCommis.code_unique})`
        });

      if (logError) {
        console.log('Erreur lors de la création du log:', logError);
        // Continuer même si le log échoue
      }

      // Recharger les données
      await loadCommandes();

      toast({
        title: "Commande acceptée",
        description: `La commande a été acceptée par ${authenticatedCommis.prenom} ${authenticatedCommis.nom}`,
      });

    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la commande",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-500';
      case 'acceptee': return 'bg-blue-500';
      case 'en_preparation': return 'bg-orange-500';
      case 'prete': return 'bg-green-500';
      case 'livree': return 'bg-gray-500';
      case 'annulee': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'acceptee': return 'Acceptée';
      case 'en_preparation': return 'En préparation';
      case 'prete': return 'Prête';
      case 'livree': return 'Livrée';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  };

  const pendingOrders = commandes.filter(c => c.status === 'en_attente');
  const acceptedOrders = commandes.filter(c => c.status === 'acceptee');
  const otherOrders = commandes.filter(c => !['en_attente', 'acceptee'].includes(c.status));

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Commandes en cours</h2>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec authentification employé */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Commandes</h2>
          <p className="text-muted-foreground">
            Gérez vos commandes avec traçabilité des actions
          </p>
        </div>
        
        <div className="w-80">
          <EmployeeAuth
            onEmployeeAuthenticated={setAuthenticatedCommis}
            onLogout={() => setAuthenticatedCommis(null)}
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{acceptedOrders.length}</div>
            <div className="text-sm text-muted-foreground">Acceptées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {commandes.filter(c => ['prete', 'livree'].includes(c.status)).length}
            </div>
            <div className="text-sm text-muted-foreground">Terminées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{commandes.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes en attente */}
      {pendingOrders.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Commandes en attente ({pendingOrders.length})
          </h3>
          <div className="grid gap-4">
            {pendingOrders.map((commande) => (
              <Card key={commande.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{commande.client_nom}</h4>
                      <p className="text-sm text-muted-foreground">
                        Commande #{commande.id.slice(-8)} • {new Date(commande.created_at).toLocaleString('fr-CA')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{commande.total_amount.toFixed(2)}$</div>
                      <Badge className={`${getStatusColor(commande.status)} text-white`}>
                        {getStatusLabel(commande.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      {commande.client_phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      {commande.client_email}
                    </div>
                  </div>

                  {commande.notes && (
                    <div className="bg-accent/10 p-3 rounded-md mb-4">
                      <p className="text-sm font-medium mb-1">Notes du client:</p>
                      <p className="text-sm text-muted-foreground">{commande.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(commande)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir détails
                    </Button>
                    
                    {authenticatedCommis && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOrder(commande.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Accepter commande
                      </Button>
                    )}
                  </div>

                  {/* Historique des actions */}
                  {orderLogs[commande.id] && orderLogs[commande.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Historique des actions
                      </h5>
                      <div className="space-y-2">
                        {orderLogs[commande.id].map((log) => (
                          <div key={log.id} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{log.action}</span>
                              <span className="text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString('fr-CA')}
                              </span>
                            </div>
                            {log.commis && (
                              <div className="text-muted-foreground mt-1">
                                Par {log.commis.prenom} {log.commis.nom} ({log.commis.code_unique})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Autres commandes */}
      {[...acceptedOrders, ...otherOrders].length > 0 && (
        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Autres commandes ({[...acceptedOrders, ...otherOrders].length})
          </h3>
          <div className="grid gap-4">
            {[...acceptedOrders, ...otherOrders].map((commande) => (
              <Card key={commande.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{commande.client_nom}</h4>
                      <p className="text-sm text-muted-foreground">
                        Commande #{commande.id.slice(-8)} • {new Date(commande.created_at).toLocaleString('fr-CA')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{commande.total_amount.toFixed(2)}$</div>
                      <Badge className={`${getStatusColor(commande.status)} text-white`}>
                        {getStatusLabel(commande.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Historique des actions */}
                  {orderLogs[commande.id] && orderLogs[commande.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Historique des actions
                      </h5>
                      <div className="space-y-2">
                        {orderLogs[commande.id].map((log) => (
                          <div key={log.id} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{log.action}</span>
                              <span className="text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString('fr-CA')}
                              </span>
                            </div>
                            {log.commis && (
                              <div className="text-muted-foreground mt-1">
                                Par {log.commis.prenom} {log.commis.nom} ({log.commis.code_unique})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* État vide */}
      {commandes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground">
              Les nouvelles commandes apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions pour les employés */}
      {!authenticatedCommis && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note :</strong> Les employés doivent s'authentifier avec leur code unique 
            pour pouvoir accepter les commandes et tracer leurs actions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
