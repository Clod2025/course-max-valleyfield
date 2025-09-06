import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  LogOut, 
  Shield, 
  Settings, 
  Bell,
  Search,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function AdminHeader() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Admin */}
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <span className="text-xl font-bold text-primary">CourseMax</span>
            <Badge variant="destructive" className="ml-2 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              ADMIN
            </Badge>
          </div>
        </div>

        {/* Navigation Admin - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/admin')}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/merchants')}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Marchands
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/drivers')}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Livreurs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/finance')}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Finance
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/settings')}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Paramètres
          </Button>
        </nav>

        {/* Actions Admin */}
        <div className="flex items-center gap-3">
          {/* Recherche rapide */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-8 pr-3 py-1 text-sm border rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>

          {/* Profil Admin */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {profile?.first_name || 'Admin'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>

          {/* Menu mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Menu mobile */}
      {showMobileMenu && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto py-4 px-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/admin')}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/admin/merchants')}
            >
              Marchands
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/admin/drivers')}
            >
              Livreurs
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/admin/finance')}
            >
              Finance
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/admin/settings')}
            >
              Paramètres
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
