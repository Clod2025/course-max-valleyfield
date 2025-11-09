import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Home,
  Store,
  ShoppingCart,
  User,
  Bell,
  Package,
  Truck,
  BarChart3,
  Users,
  Settings
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const BottomNavigation: React.FC = () => {
  const { user, profile, isRole } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // ✅ Items de navigation selon le rôle
  const getBottomNavItems = () => {
    if (!profile) return [];

    const baseItems = [
      { name: 'Accueil', href: ROUTES.HOME, icon: Home },
      { name: 'Magasins', href: ROUTES.STORES, icon: Store },
    ];

    switch (profile.role) {
      case 'admin':
        return [
          ...baseItems,
          { name: 'Dashboard', href: ROUTES.ADMIN, icon: BarChart3 },
          { name: 'Utilisateurs', href: '/admin/users', icon: Users },
          { name: 'Paramètres', href: '/admin/settings', icon: Settings },
        ];
      case 'sub_admin':
        return [
          ...baseItems,
          { name: 'Dashboard', href: ROUTES.ADMIN, icon: BarChart3 },
          { name: 'Utilisateurs', href: '/admin/users', icon: Users },
        ];
      case 'merchant':
        return [
          ...baseItems,
          { name: 'Dashboard', href: ROUTES.MERCHANT, icon: BarChart3 },
          { name: 'Commandes', href: '/merchant/orders', icon: Package },
          { name: 'Mon Compte', href: '/merchant/profile', icon: User },
        ];
      case 'driver':
        return [
          ...baseItems,
          { name: 'Dashboard', href: ROUTES.DRIVER, icon: Truck },
          { name: 'Livraisons', href: '/driver/deliveries', icon: Package },
          { name: 'Mon Compte', href: '/driver/profile', icon: User },
        ];
      case 'client':
      default:
        return [
          ...baseItems,
          { name: 'Panier', href: '/cart', icon: ShoppingCart },
          { name: 'Commandes', href: '/client/orders', icon: Package },
          { name: 'Mon Compte', href: ROUTES.CLIENT, icon: User },
        ];
    }
  };

  const navItems = getBottomNavItems();

  // ✅ Masquer sur desktop et si pas d'utilisateur
  if (!user || !isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {/* Badge pour notifications (exemple) */}
                {item.name === 'Panier' && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                  >
                    3
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium mt-1 truncate max-w-full">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
