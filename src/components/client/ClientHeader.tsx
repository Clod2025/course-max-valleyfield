import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function ClientHeader() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { items: cartItems, total: cartTotal } = useCart();
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = [
    { id: 'stores', label: 'Magasins', icon: Store, action: () => navigate('/stores') },
    { id: 'orders', label: 'Mes Commandes', icon: Clock, action: () => navigate('/dashboard/client') },
    { id: 'favorites', label: 'Favoris', icon: Heart, action: () => navigate('/dashboard/client') },
    { id: 'settings', label: 'Paramètres', icon: Settings, action: () => navigate('/dashboard/client') },
    { id: 'help', label: 'Aide', icon: HelpCircle, action: () => navigate('/dashboard/client') },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Menu Hamburger + Logo Client */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/dashboard/client" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {/* Logo officiel CourseMax */}
              <img 
                src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                alt="CourseMax Logo" 
                className="h-8 w-auto"
              />
              <div>
                <span className="text-xl font-bold text-primary">CourseMax</span>
                <Badge variant="default" className="ml-2 text-xs bg-green-600">
                  <User className="w-3 h-3 mr-1" />
                  CLIENT
                </Badge>
              </div>
            </Link>
          </div>

          {/* Actions Client */}
          <div className="flex items-center gap-4">
            {/* Logo à côté du profil utilisateur */}
            <img 
              src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
              alt="CourseMax" 
              className="h-6 w-auto"
            />
            
            {/* Panier */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/order-checkout')}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItems && cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartItems.length}
                </Badge>
              )}
              <span className="hidden sm:inline ml-2">
                {cartTotal ? `${cartTotal.toFixed(2)}$` : 'Panier'}
              </span>
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={() => navigate('/dashboard/client')}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                2
              </span>
            </Button>

            {/* Profil */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {profile?.first_name || 'Client'}
              </span>
            </div>

            {/* Déconnexion */}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Latéral avec logo */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMenu(false)}>
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-background shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du menu avec logo */}
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img 
                    src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                    alt="CourseMax" 
                    className="h-6 w-auto"
                  />
                  <h2 className="text-lg font-semibold">Menu Client</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Profil dans le menu */}
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <Badge variant="outline" className="mt-1 bg-green-600 text-white">
                    {profile?.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Informations du panier */}
            <div className="p-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Mon Panier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {cartItems?.length || 0} article{(cartItems?.length || 0) > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold">
                      {cartTotal ? `${cartTotal.toFixed(2)}$` : '0.00$'}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-3" 
                    size="sm"
                    onClick={() => {
                      navigate('/order-checkout');
                      setShowMenu(false);
                    }}
                  >
                    Voir le panier
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Menu items */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold mb-3">Navigation</h3>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => {
                      item.action();
                      setShowMenu(false);
                    }}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </div>

            <Separator />

            {/* Déconnexion */}
            <div className="p-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
