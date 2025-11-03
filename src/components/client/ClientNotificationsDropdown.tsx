import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, CheckCircle, AlertCircle, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order';
  title: string;
  message: string | null;
  read: boolean;
  link: string | null;
  metadata: any;
  created_at: string;
}

interface ClientNotificationsDropdownProps {
  onCountChange?: (count: number) => void;
}

export function ClientNotificationsDropdown({ onCountChange }: ClientNotificationsDropdownProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
      onCountChange?.(unread);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  }, [user, onCountChange]);

  useEffect(() => {
    loadNotifications();

    // Subscription temps réel
    if (!user) return;

    const channel = supabase
      .channel('client-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lu
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Naviguer si lien fourni
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      case 'order':
        return <Package className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'order':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
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

          {/* Dropdown */}
          <div className="absolute right-0 top-12 w-80 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs h-6 px-2"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Tout lire
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
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
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-l-4 cursor-pointer ${getTypeColor(notification.type)} ${
                        !notification.read ? 'bg-background' : 'bg-muted/30'
                      } hover:bg-muted/50 transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString('fr-CA')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    navigate('/dashboard/client?tab=notifications');
                    setIsOpen(false);
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
