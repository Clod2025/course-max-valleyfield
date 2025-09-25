import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle,
  Info,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaymentMethod {
  id: 'card' | 'interac';
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  processingTime: string;
  fees?: number;
}

interface PaymentMethodSelectorProps {
  amount: number;
  merchantInfo: {
    id: string;
    name: string;
    hasInterac: boolean;
    interacEmail?: string;
    interacPhone?: string;
  };
  onMethodSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod | null;
  className?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Carte de débit/crédit',
    description: 'Paiement sécurisé instantané',
    icon: <CreditCard className="w-6 h-6" />,
    enabled: true,
    processingTime: 'Instantané',
    fees: 0.03 // 3% de frais
  },
  {
    id: 'interac',
    name: 'Interac e-Transfer',
    description: 'Transfert bancaire sécurisé',
    icon: <Smartphone className="w-6 h-6" />,
    enabled: true,
    processingTime: 'Vérification manuelle',
    fees: 0 // Pas de frais
  }
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  merchantInfo,
  onMethodSelect,
  selectedMethod,
  className
}) => {
  const [showFees, setShowFees] = useState(false);

  const getAvailableMethods = () => {
    return PAYMENT_METHODS.filter(method => {
      if (method.id === 'interac') {
        return merchantInfo.hasInterac;
      }
      return method.enabled;
    });
  };

  const calculateTotalWithFees = (method: PaymentMethod) => {
    if (method.fees && method.fees > 0) {
      return amount + (amount * method.fees);
    }
    return amount;
  };

  const availableMethods = getAvailableMethods();

  return (
    <div className={cn("space-y-4", className)}>
      {/* En-tête avec montant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Méthode de paiement</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {amount.toFixed(2)}$
              </div>
              <div className="text-sm text-muted-foreground">
                Total de la commande
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Informations marchand pour Interac */}
      {merchantInfo.hasInterac && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Paiement Interac disponible
                </h4>
                <p className="text-sm text-blue-700">
                  {merchantInfo.name} accepte les paiements Interac e-Transfer
                </p>
                {merchantInfo.interacEmail && (
                  <p className="text-xs text-blue-600 mt-1">
                    Email: {merchantInfo.interacEmail}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sélection des méthodes */}
      <div className="space-y-3">
        {availableMethods.map((method) => {
          const isSelected = selectedMethod?.id === method.id;
          const totalWithFees = calculateTotalWithFees(method);
          const hasFees = method.fees && method.fees > 0;

          return (
            <Card
              key={method.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected 
                  ? "ring-2 ring-primary border-primary bg-primary/5" 
                  : "hover:border-primary/50"
              )}
              onClick={() => onMethodSelect(method)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-lg",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {method.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{method.name}</h3>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {method.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Sécurisé
                        </span>
                        <span>{method.processingTime}</span>
                        {hasFees && (
                          <span className="text-orange-600">
                            +{method.fees! * 100}% de frais
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {totalWithFees.toFixed(2)}$
                    </div>
                    {hasFees && (
                      <div className="text-xs text-muted-foreground">
                        Frais: {((totalWithFees - amount)).toFixed(2)}$
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails des frais */}
                {hasFees && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Sous-total:</span>
                      <span>{amount.toFixed(2)}$</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Frais de traitement:</span>
                      <span>{((totalWithFees - amount)).toFixed(2)}$</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                      <span>Total:</span>
                      <span>{totalWithFees.toFixed(2)}$</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informations de sécurité */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              Paiements sécurisés et protégés
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Toutes les transactions sont chiffrées et protégées par les plus hauts standards de sécurité.
          </p>
        </CardContent>
      </Card>

      {/* Bouton d'information sur les frais */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFees(!showFees)}
          className="text-muted-foreground"
        >
          <DollarSign className="w-4 h-4 mr-1" />
          {showFees ? 'Masquer' : 'Voir'} les détails des frais
        </Button>
      </div>

      {showFees && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Détails des frais</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Carte de débit/crédit:</span>
                <span className="text-orange-600">3% de frais</span>
              </div>
              <div className="flex justify-between">
                <span>Interac e-Transfer:</span>
                <span className="text-green-600">Aucun frais</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Les frais de traitement couvrent la sécurité et la rapidité des transactions.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
