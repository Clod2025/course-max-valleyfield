import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, Home, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

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
        <Link to="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {/* Logo officiel CourseMax */}
          <img 
            src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
            alt="CourseMax Logo" 
            className="h-10 w-auto"
          />
          <span className="text-xl font-bold text-primary">CourseMax</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <Link to={getDashboardLink()} className="text-sm font-medium hover:text-primary transition-colors">
              Mon Espace
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Logo à côté du nom d'utilisateur */}
              <img 
                src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                alt="CourseMax" 
                className="h-6 w-auto"
              />
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