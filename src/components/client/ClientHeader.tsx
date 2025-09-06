import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  LogOut, 
  ShoppingCart,
  Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

export function ClientHeader() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { items: cartItems, total: cartTotal } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Client */}
        <Link to="/dashboard/client" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
            C
          </div>
          <div>
            <span className="text-xl font-bold text-primary">CourseMax</span>
            <Badge variant="default" className="ml-2 text-xs bg-green-600">
              <User className="w-3 h-3 mr-1" />
              CLIENT
            </Badge>
          </div>
        </Link>

        {/* Actions Client */}
        <div className="flex items-center gap-4">
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
          <Button variant="ghost" size="sm" className="relative">
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
  );
}
