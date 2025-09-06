import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Package,
  CheckCircle,
  AlertCircle,
  Navigation
} from 'lucide-react';
import { DriverAssignment } from '@/hooks/useDriverAssignments';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DriverAssignmentCardProps {
  assignment: DriverAssignment;
  onAccept: (assignmentId: string) => void;
  canAccept?: boolean;
}

export const DriverAssignmentCard: React.FC<DriverAssignmentCardProps> = ({
  assignment,
  onAccept,
  canAccept = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'accepted':
        return <Badge variant="default">Acceptée</Badge>;
      case 'completed':
        return <Badge variant="outline">Terminée</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExpired = new Date(assignment.expires_at) < new Date();
  const timeRemaining = Math.max(0, Math.floor((new Date(assignment.expires_at).getTime() - Date.now()) / 1000 / 60));

  return (
    <Card className={`${isExpired ? 'opacity-60' : ''} ${assignment.status === 'pending' ? 'border-orange-200 bg-orange-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {assignment.total_orders} commande(s) - {assignment.stores?.name}
            </CardTitle>
            <CardDescription>
              {assignment.stores?.address}, {assignment.stores?.city}
            </CardDescription>
          </div>
          {getStatusBadge(assignment.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <div className="font-semibold">{formatCurrency(assignment.total_value)}</div>
              <div className="text-xs text-muted-foreground">Valeur totale</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-semibold">
                {assignment.status === 'pending' && !isExpired ? `${timeRemaining}min` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">
                {assignment.status === 'pending' ? 'Temps restant' : 'Statut'}
              </div>
            </div>
          </div>
        </div>

        {/* Détails des commandes */}
        {assignment.orders && assignment.orders.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Commandes :</h4>
            <div className="space-y-1">
              {assignment.orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex justify-between items-center text-sm p-2 bg-white rounded border">
                  <div>
                    <div className="font-medium">#{order.order_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.delivery_address}, {order.delivery_city}
                    </div>
                  </div>
                  <div className="font-semibold">{formatCurrency(order.total_amount)}</div>
                </div>
              ))}
              {assignment.orders.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{assignment.orders.length - 3} autre(s) commande(s)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {assignment.status === 'pending' && canAccept && !isExpired && (
            <Button 
              onClick={() => onAccept(assignment.id)}
              className="flex-1"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accepter
            </Button>
          )}
          
          {assignment.status === 'pending' && isExpired && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 mr-2" />
              Expirée
            </div>
          )}
          
          {assignment.status === 'accepted' && (
            <div className="flex-1 flex items-center justify-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Acceptée
            </div>
          )}
        </div>

        {/* Informations temporelles */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Créée : {format(new Date(assignment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
          {assignment.accepted_at && (
            <div>Acceptée : {format(new Date(assignment.accepted_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
          )}
          <div>Expire : {format(new Date(assignment.expires_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverAssignmentCard;
