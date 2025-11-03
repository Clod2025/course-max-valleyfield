import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  LogOut, 
  ShoppingCart,
  Bell,
  Menu,
  X,
  Store,
  Settings,
  Heart,
  Clock,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ClientHelpModal } from './ClientHelpModal';
import { ClientPriceComparisonModal } from './ClientPriceComparisonModal';
import { ClientNotificationsDropdown } from './ClientNotificationsDropdown';

export function ClientHeader() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { cartItems } = useCart();
  const [showMenu, setShowMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const safeCartItems = cartItems || [];
  const cartItemsCount = safeCartItems.length;

  const menuItems = [
    { id: 'stores', label: 'Magasins', icon: Store, action: () => navigate('/stores') },
    { id: 'price-comparison', label: 'Comparer les prix', icon: BarChart3, action: () => setShowPriceComparison(true) },
    { id: 'orders', label: 'Mes Commandes', icon: Clock, action: () => navigate('/dashboard/client') },
    { id: 'favorites', label: 'Favoris', icon: Heart, action: () => navigate('/dashboard/client') },
    { id: 'settings', label: 'Paramètres', icon: Settings, action: () => navigate('/dashboard/client/settings') },
    { id: 'help', label: 'Aide', icon: HelpCircle, action: () => setShowHelpModal(true) },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link to="/dashboard/client" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg">CourseMax</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors" 
              onClick={() => setShowPriceComparison(true)}
              title="Comparer les prix en temps réel"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Comparer les prix</span>
            </Button>

            {/* ✅ CORRECTION : Notifications réelles */}
            <ClientNotificationsDropdown onCountChange={setNotificationsCount} />

            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2" 
              onClick={() => navigate('/stores')}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => setShowMenu(true)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                <AvatarFallback>
                  {profile?.first_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMenu(false)}>
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-bold text-lg">CourseMax</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(false)}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                      <AvatarFallback>
                        {profile?.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {profile?.first_name} {profile?.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => {
                        item.action();
                        setShowMenu(false);
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => {
                  signOut();
                  setShowMenu(false);
                }}
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      )}

      <ClientHelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />

      <ClientPriceComparisonModal 
        isOpen={showPriceComparison} 
        onClose={() => setShowPriceComparison(false)} 
      />
    </>
  );
}