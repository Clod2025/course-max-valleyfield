import React from 'react';
import { ClientHeader } from '@/components/client/ClientHeader';
import { AppFooter } from '@/components/AppFooter';
import { ClientSettings as ClientSettingsComponent } from '@/components/client/ClientSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const ClientSettings = () => {
  const { profile, isRole } = useAuth();

  // Vérifier si l'utilisateur est un client
  const isClientRole = isRole(['client', 'Client', 'CLIENT']);

  if (!profile || !isClientRole) {
    return (
      <div className="min-h-screen bg-background">
        <ClientHeader />
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Accès non autorisé. Vous devez être connecté en tant que client.
            </AlertDescription>
          </Alert>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      
      <div className="container mx-auto py-6 px-4">
        <ClientSettingsComponent />
      </div>

      <AppFooter />
    </div>
  );
};

export default ClientSettings;
