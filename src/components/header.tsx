import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
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
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}