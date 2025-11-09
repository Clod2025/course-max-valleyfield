import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Smartphone, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  AlertTriangle,
  FileText,
  Image
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InteracOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  status: 'pending_interac_verification' | 'interac_verified' | 'interac_rejected';
  created_at: string;
  interac_proofs: {
    id: string;
    file_path: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }[];
  merchant_interac_info: {
    email: string;
    phone: string;
  };
}

interface InteracVerificationProps {
  className?: string;
}

export const InteracVerification: React.FC<InteracVerificationProps> = ({
  className
}) => {
  const [orders, setOrders] = useState<InteracOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<InteracOrder | null>(null);
  const [verificationComment, setVerificationComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadInteracOrders();
    }
  }, [user]);

  const loadInteracOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          user:profiles!orders_user_id_fkey(first_name,last_name,email,phone),
          interac_proofs:order_proofs(order_id,file_path,original_filename,file_size,mime_type,uploaded_at)
        `)
        .eq('status', 'pending_interac_verification')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const merchantInfo = {
        email: user?.email ?? '',
        phone: user?.user_metadata?.phone ?? ''
      };

      const formattedOrders: InteracOrder[] = (orderData || []).map((order: any) => {
        const userInfo = order.user || {};
        return {
          id: order.id,
          order_number: order.order_number,
          customer_name: [userInfo.first_name, userInfo.last_name].filter(Boolean).join(' ') || 'Client',
          customer_email: userInfo.email || 'Non fourni',
          customer_phone: userInfo.phone || 'Non fourni',
          amount: order.total_amount ?? 0,
          status: order.status,
          created_at: order.created_at,
          interac_proofs: (order.interac_proofs || []).map((proof: any) => ({
            id: proof.id || `${order.id}-${proof.file_path}`,
            file_path: proof.file_path,
            original_filename: proof.original_filename || proof.file_path?.split('/').pop() || 'preuve',
            file_size: proof.file_size || 0,
            mime_type: proof.mime_type || 'application/octet-stream',
            uploaded_at: proof.uploaded_at || order.created_at
          })),
          merchant_interac_info: merchantInfo
        };
      });

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setOrders([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes Interac.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_interac_verification':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'interac_verified':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Vérifié
          </Badge>
        );
      case 'interac_rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const verifyPayment = async (orderId: string, verified: boolean) => {
    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from('orders')
        .update({
          status: verified ? 'interac_verified' : 'interac_rejected',
          updated_at: new Date().toISOString(),
          payment_notes: verificationComment || null
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      await loadInteracOrders();

      toast({
        title: verified ? "Paiement vérifié" : "Paiement rejeté",
        description: `La commande ${selectedOrder?.order_number ?? ''} a été ${verified ? 'vérifiée' : 'rejetée'}`,
      });

      setSelectedOrder(null);
      setVerificationComment('');
    } catch (error) {
      console.error('Erreur vérification Interac:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la vérification.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des commandes Interac...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="w-6 h-6" />
          Vérification des paiements Interac
        </h2>
        <p className="text-muted-foreground mt-2">
          Vérifiez et confirmez les paiements Interac de vos clients
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {orders.filter(o => o.status === 'pending_interac_verification').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vérifiés</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'interac_verified').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">
                  {orders.filter(o => o.status === 'interac_rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande Interac</h3>
              <p className="text-muted-foreground">
                Les commandes avec paiement Interac apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Commande #{order.order_number}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {order.customer_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {order.customer_phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {order.amount.toFixed(2)}$
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Preuves de paiement */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Preuves de paiement:</h4>
                  <div className="space-y-2">
                    {order.interac_proofs.map((proof) => (
                      <div key={proof.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          {getFileIcon(proof.mime_type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{proof.original_filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(proof.file_size)} • {new Date(proof.uploaded_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informations de transfert attendu */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Transfert attendu:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Email:</span>
                      <p className="font-mono">{order.merchant_interac_info.email}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Téléphone:</span>
                      <p className="font-mono">{order.merchant_interac_info.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {order.status === 'pending_interac_verification' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Vérifier le paiement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de vérification */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vérifier le paiement - #{selectedOrder.order_number}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Détails de la commande */}
              <div>
                <h4 className="font-semibold mb-3">Détails de la commande</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Téléphone:</span>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant:</span>
                    <p className="font-medium text-primary">{selectedOrder.amount.toFixed(2)}$</p>
                  </div>
                </div>
              </div>

              {/* Preuves de paiement */}
              <div>
                <h4 className="font-semibold mb-3">Preuves téléchargées</h4>
                <div className="space-y-2">
                  {selectedOrder.interac_proofs.map((proof) => (
                    <div key={proof.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        {getFileIcon(proof.mime_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{proof.original_filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(proof.file_size)} • {new Date(proof.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <Label htmlFor="comment">Commentaire (optionnel)</Label>
                <Textarea
                  id="comment"
                  placeholder="Ajoutez un commentaire sur votre vérification..."
                  value={verificationComment}
                  onChange={(e) => setVerificationComment(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => verifyPayment(selectedOrder.id, false)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  onClick={() => verifyPayment(selectedOrder.id, true)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
