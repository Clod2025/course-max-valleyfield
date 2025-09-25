import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  HelpCircle, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Package,
  X,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRecentOrders } from '@/hooks/useRecentOrders';
import { useAuth } from '@/hooks/useAuth';

interface ClientHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpRequest {
  orderId: string;
  type: 'help' | 'complaint';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export const ClientHelpModal: React.FC<ClientHelpModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { orders: recentOrders, loading: ordersLoading } = useRecentOrders();
  const { toast } = useToast();
  
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [helpType, setHelpType] = useState<'help' | 'complaint'>('help');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedOrder('');
      setHelpType('help');
      setSubject('');
      setMessage('');
      setPriority('medium');
    }
  }, [isOpen]);

  const selectedOrderData = recentOrders?.find(order => order.id === selectedOrder);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !subject || !message) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const helpRequest: HelpRequest = {
        orderId: selectedOrder,
        type: helpType,
        subject,
        message,
        priority
      };

      // TODO: Remplacer par un appel API réel
      // const response = await fetch('/api/help-requests', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(helpRequest)
      // });

      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Demande envoyée",
        description: "Votre demande d'aide a été envoyée avec succès. Nous vous répondrons dans les plus brefs délais.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi de votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'confirmed':
        return <Badge variant="default"><Package className="w-3 h-3 mr-1" />Confirmée</Badge>;
      case 'preparing':
        return <Badge className="bg-orange-600"><Package className="w-3 h-3 mr-1" />En préparation</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-blue-600"><Package className="w-3 h-3 mr-1" />En livraison</Badge>;
      case 'delivered':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Livrée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isOrderActive = selectedOrderData?.status && 
    !['delivered', 'cancelled'].includes(selectedOrderData.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Centre d'aide client
          </DialogTitle>
          <DialogDescription>
            Sélectionnez une commande et décrivez votre problème pour recevoir de l'aide personnalisée.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de la commande */}
          <div className="space-y-3">
            <Label htmlFor="order-select">Commande concernée *</Label>
            <Select value={selectedOrder} onValueChange={setSelectedOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une commande" />
              </SelectTrigger>
              <SelectContent>
                {ordersLoading ? (
                  <SelectItem value="loading" disabled>
                    Chargement des commandes...
                  </SelectItem>
                ) : recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>Commande #{order.order_number}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-orders" disabled>
                    Aucune commande trouvée
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Informations de la commande sélectionnée */}
            {selectedOrderData && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Commande #{selectedOrderData.order_number}</h4>
                    {getOrderStatusBadge(selectedOrderData.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Date: {new Date(selectedOrderData.created_at).toLocaleDateString()}</p>
                    <p>Total: {selectedOrderData.total_amount}$</p>
                    <p>Articles: {selectedOrderData.items?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Type d'aide */}
          {selectedOrder && (
            <div className="space-y-3">
              <Label>Type de demande *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={helpType === 'help' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setHelpType('help')}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">Demande d'aide</span>
                </Button>
                <Button
                  type="button"
                  variant={helpType === 'complaint' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setHelpType('complaint')}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">Plainte/Signalement</span>
                </Button>
              </div>

              {/* Alerte contextuelle */}
              {selectedOrderData && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {isOrderActive ? (
                      <>
                        Cette commande est encore en cours. Vous pouvez demander de l'aide pour suivre votre commande, 
                        modifier votre adresse de livraison, ou contacter le livreur.
                      </>
                    ) : (
                      <>
                        Cette commande est terminée. Vous pouvez signaler un problème avec votre commande, 
                        demander un remboursement, ou évaluer le service.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Résumé de votre demande"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Description détaillée *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre problème ou votre demande en détail..."
              rows={4}
              required
            />
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Faible - Question générale</SelectItem>
                <SelectItem value="medium">Moyenne - Problème standard</SelectItem>
                <SelectItem value="high">Élevée - Problème urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedOrder || !subject || !message}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer la demande
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
