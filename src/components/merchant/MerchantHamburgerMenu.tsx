import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  Package, 
  Upload, 
  Megaphone, 
  DollarSign,
  CreditCard, 
  Settings,
  Store,
  Mail,
  Phone,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMerchantStore } from '@/hooks/useMerchantStore';
import { NotificationBar } from './NotificationBar';

interface MerchantHamburgerMenuProps {
  onMenuItemClick: (item: string) => void;
  activeItem: string;
  onSidebarToggle?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
}

export function MerchantHamburgerMenu({ onMenuItemClick, activeItem, onSidebarToggle, isCollapsed = false }: MerchantHamburgerMenuProps) {
  const { profile, signOut } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { store: merchantStore } = useMerchantStore({ ownerId: profile?.user_id });
  
  // Utiliser la prop externe si fournie, sinon l'état interne
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;
  
  const handleToggle = () => {
    const newCollapsed = !collapsed;
    if (onSidebarToggle) {
      onSidebarToggle(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };

  const menuItems = [
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'products', label: 'Gestion Produits', icon: Package },
    { id: 'inventory', label: 'Soumettre Inventaire', icon: Upload },
    { id: 'promotions', label: 'Affiches & Promos', icon: Megaphone },
    { id: 'employees', label: 'Gestion Employés', icon: User },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'finance', label: 'Finance & Rapports', icon: DollarSign },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const handleMenuItemClick = (itemId: string) => {
    onMenuItemClick(itemId);
  };

  return (
    <>
      {/* Bouton Hamburger - Toujours visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="fixed top-4 left-4 z-50 bg-white shadow-lg border"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Menu Latéral - Toujours visible, fixé à gauche */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-50 shadow-xl z-40 transition-all duration-300
        ${collapsed ? 'w-20' : 'w-80'}
        border-r border-gray-200
      `}>
        <div className="h-full flex flex-col">
          {/* Header du menu */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center gap-3">
                  <img 
                    src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                    alt="CourseMax" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-primary">Espace Marchand</h2>
                    <p className="text-xs text-muted-foreground">Gestion de votre magasin</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {/* Bouton collapse/expand */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggle}
                  className="opacity-70 hover:opacity-100"
                >
                  {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu du menu */}
          <div className="flex-1 overflow-y-auto">
            {!collapsed ? (
              <>
                {/* Profil Marchand */}
                <div className="p-4">
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback>
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">
                            {profile?.first_name} {profile?.last_name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            <Store className="w-3 h-3 mr-1" />
                            Marchand
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{profile?.email || 'Email non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{profile?.phone || 'Téléphone non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{profile?.address || 'Adresse non renseignée'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {merchantStore && (
                  <div className="px-4">
                    <Card className="bg-primary/5 border-primary/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Store className="w-4 h-4" />
                          <span className="truncate">{merchantStore.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{merchantStore.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span className="truncate">{merchantStore.phone || 'Téléphone non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{merchantStore.email || 'Email non renseigné'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Separator className="mx-4" />

                {/* Menu Items */}
                <div className="p-4 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={activeItem === item.id ? 'default' : 'ghost'}
                        className={`w-full justify-start h-12 text-left transition-all duration-200 ${
                          activeItem === item.id 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'hover:bg-white text-gray-700'
                        }`}
                        onClick={() => handleMenuItemClick(item.id)}
                      >
                        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Menu Collapsed - Seulement les icônes */
              <div className="p-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeItem === item.id ? 'default' : 'ghost'}
                      size="sm"
                      className={`w-full p-3 transition-all duration-200 ${
                        activeItem === item.id 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'hover:bg-white text-gray-700'
                      }`}
                      onClick={() => handleMenuItemClick(item.id)}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-center">
              <NotificationBar merchantId={profile?.id} />
            </div>
          </div>

          {/* Footer avec déconnexion */}
          <div className="p-4 border-t bg-gray-50">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 transition-all duration-200"
              onClick={signOut}
            >
              <X className="w-5 h-5 mr-3" />
              {!collapsed && <span className="font-medium text-sm">Déconnexion</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
