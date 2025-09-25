import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PriceComparisonWrapper } from '@/components/PriceComparison';

interface ClientPriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPriceComparisonModal: React.FC<ClientPriceComparisonModalProps> = ({
  isOpen,
  onClose
}) => {
  const handleMerchantSelect = (merchantId: string) => {
    // Rediriger vers le magasin sélectionné
    console.log('Magasin sélectionné:', merchantId);
    // Vous pouvez ajouter une navigation ici si nécessaire
  };

  const handleProductView = (merchantId: string) => {
    // Afficher les détails du produit
    console.log('Voir le produit du magasin:', merchantId);
    // Vous pouvez ajouter une navigation ici si nécessaire
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Comparateur de Prix
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <PriceComparisonWrapper
            onMerchantSelect={handleMerchantSelect}
            onProductView={handleProductView}
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
