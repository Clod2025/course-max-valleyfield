import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  ShoppingCart,
  Package,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationBarProps {
  merchantId?: string;
}

export function NotificationBar({ merchantId }: NotificationBarProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Abonnement en temps réel pour les nouvelles notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'logs_actions',
          filter: `merchant_id=eq.${merchantId}`
        }, 
        (payload) => {
          console.log('Nouvelle notification:', payload.new);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [merchantId]);

  const loadNotifications = async () => {
    try {
      // Charger les notifications depuis les logs d'actions
      const { data, error } = await supabase
        .from('logs_actions')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Convertir les logs en notifications
      const newNotifications: Notification[] = (data || []).map(log => ({
        id: log.id,
        type: getNotificationType(log.action),
        title: getNotificationTitle(log.action),
        message: getNotificationMessage(log.action, log),
        timestamp: new Date(log.created_at),
        read: false,
        action: getNotificationAction(log.action)
      }));

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      // Notifications de démonstration
      const demoNotifications: Notification[] = [
        {
          id: 'demo-1',
          type: 'warning',
          title: 'Commande en attente',
          message: 'Commande #1234 en attente de traitement',
          timestamp: new Date(Date.now() - 300000),
          read: false,
          action: {
            label: 'Voir',
            onClick: () => console.log('Voir commande')
          }
        },
        {
          id: 'demo-2',
          type: 'success',
          title: 'Produit ajouté',
          message: 'Le produit "Pommes Golden" a été ajouté avec succès',
          timestamp: new Date(Date.now() - 600000),
          read: false
        },
        {
          id: 'demo-3',
          type: 'info',
          title: 'Nouvel employé',
          message: 'Marie Martin a été ajoutée comme superviseur',
          timestamp: new Date(Date.now() - 900000),
          read: true
        }
      ];
      setNotifications(demoNotifications);
      setUnreadCount(demoNotifications.filter(n => !n.read).length);
    }
  };

  const getNotificationType = (action: string): Notification['type'] => {
    if (action.includes('commande') || action.includes('order')) return 'warning';
    if (action.includes('ajout') || action.includes('créé')) return 'success';
    if (action.includes('erreur') || action.includes('error')) return 'error';
    return 'info';
  };

  const getNotificationTitle = (action: string): string => {
    if (action.includes('commande')) return 'Nouvelle commande';
    if (action.includes('produit')) return 'Produit';
    if (action.includes('employé')) return 'Employé';
    if (action.includes('paiement')) return 'Paiement';
    return 'Notification';
  };

  const getNotificationMessage = (action: string, log: any): string => {
    return `${action} - ${new Date(log.created_at).toLocaleString('fr-CA')}`;
  };

  const getNotificationAction = (action: string) => {
    if (action.includes('commande')) {
      return {
        label: 'Voir',
        onClick: () => console.log('Voir commande')
      };
    }
    return undefined;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panneau de notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panneau */}
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
                        !notification.read ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleString('fr-CA')}
                          </p>
                          {notification.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                notification.action?.onClick();
                                markAsRead(notification.id);
                              }}
                              className="mt-2 text-xs h-6 px-2"
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setIsOpen(false);
                    // Naviguer vers la page des notifications
                  }}
                >
                  Voir toutes les notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
