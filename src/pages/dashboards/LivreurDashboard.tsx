import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
import { useAuth } from '@/hooks/useAuth';
import DriverDashboard from '../DriverDashboard';

const LivreurDashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  // Protection de route : vérifier que l'utilisateur est livreur
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role !== 'livreur') {
        navigate('/auth/unauthorized');
      }
    }
  }, [profile, loading, navigate]);

  // Afficher loading pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  // Ne pas afficher le contenu si pas livreur
  if (!profile || profile.role !== 'livreur') {
    return null;
  }

  // Réutiliser le composant DriverDashboard existant
  return <DriverDashboard />;
};

export default LivreurDashboard;