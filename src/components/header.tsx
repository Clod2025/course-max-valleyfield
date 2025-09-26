import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, Home, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getDashboardLink = () => {
    if (!profile) return '/home';
    
    const roleToDashboard: Record<string, string> = {
      'client': '/dashboard/client',
      'merchant': '/dashboard/marchand',
      'driver': '/dashboard/livreur',
      'admin': '/dashboard/admin',
      'livreur': '/dashboard/livreur',
      'store_manager': '/dashboard/marchand',
      // Majuscules
      'Client': '/dashboard/client',
      'Merchant': '/dashboard/marchand',
      'Marchand': '/dashboard/marchand',
      'Driver': '/dashboard/livreur',
      'Livreur': '/dashboard/livreur',
      'Admin': '/dashboard/admin'
    };
    
    return roleToDashboard[profile.role] || '/auth/unauthorized';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - toujours visible */}
        <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
            alt="CourseMax Logo" 
            className="h-8 w-auto sm:h-10"
          />
          <span className="text-lg font-bold text-primary sm:text-xl">CourseMax</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(getDashboardLink())}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {profile?.first_name || 'Mon Espace'}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Déconnexion</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Connexion
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
              >
                Inscription
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <img 
                    src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                    alt="CourseMax" 
                    className="h-6 w-auto"
                  />
                  <div>
                    <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(getDashboardLink());
                    setShowMobileMenu(false);
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Mon Espace
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    signOut();
                    setShowMobileMenu(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/login');
                    setShowMobileMenu(false);
                  }}
                >
                  Connexion
                </Button>
                <Button
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/register');
                    setShowMobileMenu(false);
                  }}
                >
                  Inscription
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}