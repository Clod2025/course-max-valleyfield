import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  User, 
  LogOut, 
  Store, 
  Package, 
  DollarSign,
  Megaphone,
  Upload,
  Settings,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MerchantHeaderProps {
  onMenuItemClick: (item: string) => void;
  activeItem: string;
}

export function MerchantHeader({ onMenuItemClick, activeItem }: MerchantHeaderProps) {
  const { profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = [
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'products', label: 'Gestion Produits', icon: Package },
    { id: 'inventory', label: 'Soumettre Inventaire', icon: Upload },
    { id: 'promotions', label: 'Affiches & Promos', icon: Megaphone },
    { id: 'finance', label: 'Finance & Paiements', icon: DollarSign },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <>
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Menu hamburger et titre avec logo */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                {/* Logo officiel CourseMax */}
                <img 
                  src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                  alt="CourseMax Logo" 
                  className="h-8 w-auto"
                />
                <div>
                  <h1 className="text-xl font-bold">Dashboard Marchand</h1>
                  <p className="text-sm text-muted-foreground">
                    {profile?.first_name || 'Marchand'} - Gérez votre magasin
                  </p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-3">
              {/* Logo à côté du profil utilisateur */}
              <img 
                src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                alt="CourseMax" 
                className="h-6 w-auto"
              />
              <Badge variant="default" className="bg-primary">
                <Store className="w-4 h-4 mr-1" />
                Marchand
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu latéral mobile avec logo */}
      <div className={`fixed inset-0 z-50 ${showMenu ? 'block' : 'hidden'} lg:hidden`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
        
        <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl">
          <div className="p-6">
            {/* Header du menu avec logo */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                  alt="CourseMax" 
                  className="h-6 w-auto"
                />
                <h2 className="text-lg font-semibold">Menu Marchand</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMenu(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Profil marchand */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{profile?.role}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {profile?.phone || 'Non renseigné'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {profile?.address || 'Adresse non renseignée'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="mb-6" />

            {/* Menu items */}
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeItem === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      onMenuItemClick(item.id);
                      setShowMenu(false);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Menu desktop (sidebar permanent) avec logo */}
      <div className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white border-r shadow-sm overflow-y-auto z-40">
        <div className="p-6">
          {/* Profil marchand */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{profile?.role}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {profile?.phone || 'Non renseigné'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {profile?.address || 'Adresse non renseignée'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="mb-6" />

          {/* Menu items */}
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeItem === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => onMenuItemClick(item.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
