import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, Home } from "lucide-react";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
            alt="CourseMax" 
            className="h-8 w-auto"
            onError={(e) => {
              console.log('Logo failed to load');
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-xl font-bold text-gradient">CourseMax</h1>
        </Link>
        
        <nav className="hidden md:flex items-center gap-4">
          <Link to="/home">
            <Button variant="ghost" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Accueil
            </Button>
          </Link>
          <Link to="/stores">
            <Button variant="ghost">
              Magasins
            </Button>
          </Link>
        </nav>
        
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => {
              // Mobile menu toggle logic can be added here
              console.log('Mobile menu clicked');
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}