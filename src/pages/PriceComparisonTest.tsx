import React from 'react';
import { ClientHeader } from '@/components/client/ClientHeader';
import { ClientPriceComparisonModal } from '@/components/client/ClientPriceComparisonModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const PriceComparisonTest = () => {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Test du Comparateur de Prix</h1>
            <p className="text-muted-foreground">
              Cette page permet de tester l'intégration du comparateur de prix dans l'espace client.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Fonctionnalités Testées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">✅ Boutons ajoutés dans :</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Header client (icône + menu)</li>
                    <li>• Page des magasins</li>
                    <li>• Page des produits</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">✅ Fonctionnalités :</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Modal de comparaison de prix</li>
                    <li>• Intégration de la logique existante</li>
                    <li>• Interface responsive</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => setShowModal(true)}
                  className="w-full"
                  size="lg"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Ouvrir le Comparateur de Prix
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions de Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Test du Header :</h4>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur l'icône BarChart3 dans le header ou sur "Comparer les prix" dans le menu latéral.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">2. Test de la Recherche :</h4>
                <p className="text-sm text-muted-foreground">
                  Tapez le nom d'un produit (ex: "pomme", "lait", "pain") pour voir les résultats de comparaison.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">3. Test des Résultats :</h4>
                <p className="text-sm text-muted-foreground">
                  Vérifiez que les prix s'affichent correctement avec les informations des magasins.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ClientPriceComparisonModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
};

export default PriceComparisonTest;
