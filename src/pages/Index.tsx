import { useState } from "react";
import { Header } from "@/components/header";
import { StoreSelector } from "@/components/store-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface SelectedStore {
  id: string;
  name: string;
  address: string;
  distance: number;
  deliveryFee: number;
  type: string;
}

const Index = () => {
  console.log('Index component rendering');
  const [selectedStore, setSelectedStore] = useState<SelectedStore | null>(null);

  const handleStoreSelect = (store: SelectedStore) => {
    setSelectedStore(store);
  };

  const handleBackToStores = () => {
    setSelectedStore(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        {!selectedStore ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-gradient">
                Livraison rapide à Valleyfield
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Commandez de tous vos magasins préférés et recevez vos achats en 25-45 minutes
              </p>
            </div>
            
            <StoreSelector onStoreSelect={handleStoreSelect} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleBackToStores}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux magasins
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold">Commander chez {selectedStore.name}</h1>
                <p className="text-muted-foreground">
                  Livraison: {selectedStore.deliveryFee.toFixed(2)}$ • {selectedStore.distance.toFixed(1)}km
                </p>
              </div>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Votre commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Décrivez votre commande
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none h-32"
                    placeholder="Exemple: 2L lait 2%, pain tranché, 6 bananes, fromage cheddar fort, 1kg pommes..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Soyez précis pour faciliter la préparation
                  </p>
                </div>
                
                <div className="bg-accent/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Frais de livraison</span>
                    <span className="text-xl font-bold text-primary">
                      {selectedStore.deliveryFee.toFixed(2)}$
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vous payez vos achats directement au magasin
                  </p>
                </div>
                
                <Button className="w-full gradient-primary text-white font-medium">
                  Payer les frais de livraison - {selectedStore.deliveryFee.toFixed(2)}$
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
