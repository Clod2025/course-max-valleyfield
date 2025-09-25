import React from 'react';
import { PriceComparisonWrapper } from './index';
import { useToast } from '@/hooks/use-toast';

/**
 * Composant de démonstration pour le comparateur de prix
 * 
 * Ce composant montre comment intégrer le comparateur de prix
 * dans votre application existante.
 */
export const PriceComparisonDemo: React.FC = () => {
  const { toast } = useToast();

  const handleMerchantSelect = (merchantId: string) => {
    toast({
      title: "Magasin sélectionné",
      description: `Vous avez sélectionné le magasin ${merchantId}`,
    });
  };

  const handleProductView = (merchantId: string) => {
    toast({
      title: "Voir le produit",
      description: `Ouverture du produit du magasin ${merchantId}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PriceComparisonWrapper
        onMerchantSelect={handleMerchantSelect}
        onProductView={handleProductView}
        className="py-6"
      />
    </div>
  );
};
