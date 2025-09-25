import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Bell,
  ShoppingCart,
  Store,
  Truck,
  Shield,
  ChevronDown,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Search,
  Heart,
  History,
  HelpCircle,
  CreditCard,
  MapPin,
  Clock,
  Star,
  MessageCircle,
  Plus,
  Package,
  Users,
  BarChart3,
  FileText,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { useAdvancedToast } from '@/components/ui/advanced-toast';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const { user, profile, signOut, isRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useAdvancedToast();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationCount, setNotificationCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // ✅ Monitoring de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Gestion du thème sombre
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
    toast.info('Thème changé', !isDarkMode ? 'Mode sombre activé' : 'Mode clair activé');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie', 'À bientôt !');
      navigate(ROUTES.HOME);
    } catch (error) {
      toast.error('Erreur de déconnexion', 'Veuillez réessayer');
    }
  };

  // ✅ Navigation items selon le rôle
  const getNavigationItems = () => {
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
          { name: 'Analytics', href: '/admin/analytics', icon: FileText },
          { name: 'Paramètres', href: '/admin/settings', icon: Settings },
        ];
      case 'sub_admin':
        return [
          ...baseItems,
          { name: 'Dashboard', href: ROUTES.ADMIN, icon: BarChart3 },
          { name: 'Utilisateurs', href: '/admin/users', icon: Users },
          { name: 'Analytics', href: '/admin/analytics', icon: FileText },
        ];
      case 'merchant':
        return [
          ...baseItems,
          { name: 'Dashboard', href: ROUTES.MERCHANT, icon: BarChart3 },
          { name: 'Commandes', href: '/merchant/orders', icon: Package },
          { name: 'Produits', href: '/merchant/products', icon: Plus },
          { name: 'Analytics', href: '/merchant/analytics', icon: BarChart3 },
        ];
      case 'driver':
        return [
          ...baseItems,
          { name: 'Dashboard', href: ROUTES.DRIVER, icon: Truck },
          { name: 'Livraisons', href: '/driver/deliveries', icon: Package },
          { name: 'Historique', href: '/driver/history', icon: History },
        ];
      case 'client':
      default:
        return [
          ...baseItems,
          { name: 'Mon Compte', href: ROUTES.CLIENT, icon: User },
          { name: 'Commandes', href: '/client/orders', icon: Package },
          { name: 'Favoris', href: '/client/favorites', icon: Heart },
          { name: 'Historique', href: '/client/history', icon: History },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  // ✅ Composant Navigation Desktop
  const DesktopNavigation = () => (
    <nav className="hidden lg:flex items-center space-x-8">
      {navigationItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
              isActive
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  // ✅ Composant Navigation Mobile
  const MobileNavigation = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex flex-col h-full">
          {/* Header Mobile */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="font-semibold text-lg">CourseMax</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Mobile */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Actions rapides Mobile */}
            <div className="px-4 mt-6">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                Actions rapides
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Localiser
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Mobile */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-orange-500" />
                )}
                <span className="text-xs text-gray-500">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // ✅ Composant User Menu
  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile?.email}
            </p>
            <Badge variant="outline" className="w-fit text-xs">
              {profile?.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Actions selon le rôle */}
        {profile?.role === 'client' && (
          <>
            <DropdownMenuItem onClick={() => navigate('/client/orders')}>
              <Package className="mr-2 h-4 w-4" />
              <span>Mes commandes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/client/favorites')}>
              <Heart className="mr-2 h-4 w-4" />
              <span>Favoris</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/client/payment')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Moyens de paiement</span>
            </DropdownMenuItem>
          </>
        )}
        
        {profile?.role === 'merchant' && (
          <>
            <DropdownMenuItem onClick={() => navigate('/merchant/orders')}>
              <Package className="mr-2 h-4 w-4" />
              <span>Commandes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/merchant/products')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Produits</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/merchant/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </DropdownMenuItem>
          </>
        )}
        
        {profile?.role === 'driver' && (
          <>
            <DropdownMenuItem onClick={() => navigate('/driver/deliveries')}>
              <Truck className="mr-2 h-4 w-4" />
              <span>Livraisons</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/driver/history')}>
              <History className="mr-2 h-4 w-4" />
              <span>Historique</span>
            </DropdownMenuItem>
          </>
        )}
        
        {(isRole(['admin', 'sub_admin'])) && (
          <>
            <DropdownMenuItem onClick={() => navigate('/admin/users')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Utilisateurs</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Mon profil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/help')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Aide</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link to={ROUTES.HOME} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CM</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CourseMax
            </span>
          </Link>
        </div>

        {/* Navigation Desktop */}
        <DesktopNavigation />

        {/* Actions */}
        <div className="flex items-center space-x-4">

          {/* Recherche */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          {user && (
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Panier (pour les clients) */}
          {user && profile?.role === 'client' && (
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Thème */}
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Menu ou Login */}
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={ROUTES.LOGIN}>Se connecter</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">S'inscrire</Link>
              </Button>
            </div>
          )}

          {/* Menu Mobile */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
};

export default Navigation;
