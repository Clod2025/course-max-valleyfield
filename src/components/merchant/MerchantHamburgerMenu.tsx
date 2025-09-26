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
  Settings,
  Store,
  Mail,
  Phone,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MerchantHamburgerMenuProps {
  onMenuItemClick: (item: string) => void;
  activeItem: string;
}

export function MerchantHamburgerMenu({ onMenuItemClick, activeItem }: MerchantHamburgerMenuProps) {
  const { profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'products', label: 'Gestion Produits', icon: Package },
    { id: 'inventory', label: 'Soumettre Inventaire', icon: Upload },
    { id: 'promotions', label: 'Affiches & Promos', icon: Megaphone },
    { id: 'finance', label: 'Finance & Paiements', icon: DollarSign },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const handleMenuItemClick = (itemId: string) => {
    onMenuItemClick(itemId);
    setShowMenu(false); // Fermer le menu mobile après sélection
  };

  return (
    <>
      {/* Bouton Hamburger - Toujours visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="fixed top-4 left-4 z-50 bg-white shadow-lg border"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Overlay pour mobile */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setShowMenu(false)} 
        />
      )}

      {/* Menu Latéral */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300
        ${showMenu ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-40
        ${isCollapsed ? 'w-16' : 'w-80'}
        w-full max-w-sm lg:max-w-none
      `}>
        <div className="h-full flex flex-col">
          {/* Header du menu */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-3">
                  <img 
                    src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                    alt="CourseMax" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-primary">Merchant</h2>
                    <p className="text-xs text-muted-foreground">Espace Marchand</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {/* Bouton collapse/expand pour desktop */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden lg:flex"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                
                {/* Bouton fermer pour mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(false)}
                  className="lg:hidden"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu du menu */}
          <div className="flex-1 overflow-y-auto">
            {!isCollapsed ? (
              <>
                {/* Profil Marchand */}
                <div className="p-4">
                  <Card>
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
                          <span className="truncate">engligoclervil9@gmail.com</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>Non renseigné</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>Adresse non renseignée</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator className="mx-4" />

                {/* Menu Items */}
                <div className="p-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                  <Button
                    key={item.id}
                    variant={activeItem === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start h-12 text-left"
                    onClick={() => handleMenuItemClick(item.id)}
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Menu Collapsed - Seulement les icônes */
              <div className="p-2 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeItem === item.id ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full p-2"
                      onClick={() => handleMenuItemClick(item.id)}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer avec déconnexion */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={signOut}
            >
              <X className="w-4 h-4 mr-3" />
              {!isCollapsed && 'Déconnexion'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
