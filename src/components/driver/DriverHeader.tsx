import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  User, 
  LogOut, 
  Truck, 
  Settings, 
  HelpCircle, 
  DollarSign,
  Gift,
  Camera,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function DriverHeader() {
  const { profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Logique d'upload de photo à implémenter
      console.log('Photo sélectionnée:', file);
      setShowPhotoUpload(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Menu Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                L
              </div>
              <div>
                <span className="text-lg font-bold text-primary">CourseMax</span>
                <Badge variant="default" className="ml-2 text-xs bg-blue-600">
                  <Truck className="w-3 h-3 mr-1" />
                  LIVREUR
                </Badge>
              </div>
            </div>
          </div>

          {/* Statut et Profil Rapide */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-600 border-green-600">
              ● En ligne
            </Badge>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {profile?.first_name || 'Livreur'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Latéral */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMenu(false)}>
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-background shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du menu */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Menu Livreur</h2>
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
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full"
                    onClick={() => setShowPhotoUpload(true)}
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                </div>
                <div>
                  <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {profile?.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Informations du profil */}
            <div className="p-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informations Personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.address || 'Non renseigné'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Boutons fonctionnels */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold mb-3">Actions</h3>
              
              {/* Finance / Paiement */}
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => {
                  setShowMenu(false);
                  // Navigation vers finance
                }}
              >
                <DollarSign className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Finance / Paiement</p>
                  <p className="text-xs text-muted-foreground">Gains • Paiements vendredi</p>
                </div>
              </Button>

              {/* Pourboires */}
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => {
                  setShowMenu(false);
                  // Navigation vers pourboires
                }}
              >
                <Gift className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Pourboires</p>
                  <p className="text-xs text-muted-foreground">Transfert automatique</p>
                </div>
              </Button>

              {/* Paramètres / Aide */}
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => {
                  setShowMenu(false);
                  // Navigation vers aide
                }}
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Paramètres / Aide</p>
                  <p className="text-xs text-muted-foreground">Questions • Réclamations</p>
                </div>
              </Button>

              {/* Paramètres */}
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => {
                  setShowMenu(false);
                  // Navigation vers paramètres
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Paramètres</p>
                  <p className="text-xs text-muted-foreground">Configuration</p>
                </div>
              </Button>
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

      {/* Modal Upload Photo */}
      {showPhotoUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Changer la photo de profil
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPhotoUpload(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button asChild className="w-full">
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Choisir une photo
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
