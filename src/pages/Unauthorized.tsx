import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground">
          Vous n&apos;avez pas les permissions nécessaires pour
          accéder à cette page.
        </p>
      </div>
      <Button onClick={() => navigate(-1)}>
        Retour
      </Button>
    </div>
  );
}


