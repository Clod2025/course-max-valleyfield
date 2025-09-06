import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, Home, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const getDashboardLink = () => {
    if (!profile) return '/home';
    
    // ✅ MAPPING ULTRA-COMPLET
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
        <Link to="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">
            C
          </div>
          <span className="text-xl font-bold text-primary">CourseMax</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/home" className="text-sm font-medium hover:text-primary transition-colors">
            Accueil
          </Link>
          <Link to="/stores" className="text-sm font-medium hover:text-primary transition-colors">
            Magasins
          </Link>
          {user && (
            <Link to={getDashboardLink()} className="text-sm font-medium hover:text-primary transition-colors">
              Mon Espace
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(getDashboardLink())}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
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
                <span className="hidden sm:inline">Déconnexion</span>
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
      </div>
    </header>
  );
}