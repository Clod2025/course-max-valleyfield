import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation,
  Calculator,
  CheckCircle
} from 'lucide-react';
import { useDeliveryFee, DeliveryFeeRequest, DeliveryFeeResponse } from '@/hooks/useDeliveryFee';

interface DeliveryFeeCalculatorProps {
  storeId: string;
  storeName: string;
  storeAddress: string;
  onFeeCalculated?: (fee: number, calculation: DeliveryFeeResponse) => void;
  className?: string;
}

export const DeliveryFeeCalculator: React.FC<DeliveryFeeCalculatorProps> = ({
  storeId,
  storeName,
  storeAddress,
  onFeeCalculated,
  className
}) => {
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('Valleyfield');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [calculation, setCalculation] = useState<DeliveryFeeResponse | null>(null);
  
  const { loading, error, calculateDeliveryFee } = useDeliveryFee();

  const handleCalculate = async () => {
    if (!clientAddress.trim()) {
      return;
    }

    const request: DeliveryFeeRequest = {
      store_id: storeId,
      client_address: clientAddress.trim(),
      client_city: clientCity.trim(),
      client_postal_code: clientPostalCode.trim() || undefined
    };

    const result = await calculateDeliveryFee(request);
    
    if (result) {
      setCalculation(result);
      onFeeCalculated?.(result.calculation.delivery_fee, result);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Calcul des frais de livraison
        </CardTitle>
        <CardDescription>
          Calculez les frais de livraison en fonction de la distance réelle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations du magasin */}
        <div className="p-3 bg-accent/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">Magasin</span>
          </div>
          <div className="text-sm">
            <div className="font-medium">{storeName}</div>
            <div className="text-muted-foreground">{storeAddress}</div>
          </div>
        </div>

        {/* Formulaire d'adresse client */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="client-address">Adresse de livraison *</Label>
            <Input
              id="client-address"
              placeholder="123 Rue Principale"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="client-city">Ville</Label>
              <Input
                id="client-city"
                placeholder="Valleyfield"
                value={clientCity}
                onChange={(e) => setClientCity(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="client-postal">Code postal</Label>
              <Input
                id="client-postal"
                placeholder="J6S 1A1"
                value={clientPostalCode}
                onChange={(e) => setClientPostalCode(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleCalculate} 
          disabled={loading || !clientAddress.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Calcul en cours...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Calculer les frais
            </>
          )}
        </Button>

        {/* Résultats du calcul */}
        {calculation && (
          <div className="space-y-3">
            <Separator />
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Frais de livraison calculés</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Frais de livraison</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculation.calculation.delivery_fee)}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {calculation.calculation.pricing_tier}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Distance</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {calculation.calculation.distance_km} km
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Clock className="w-4 h-4" />
                  <span>Durée estimée: {calculation.calculation.estimated_duration_minutes} minutes</span>
                </div>
              </div>
            </div>

            {/* Détails techniques */}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Détails techniques
              </summary>
              <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                <div>Distance exacte: {calculation.distance.meters} mètres</div>
                <div>Durée exacte: {calculation.estimated_duration.seconds} secondes</div>
                <div>Adresse client: {calculation.client_info.address}</div>
              </div>
            </details>
          </div>
        )}

        {/* Grille tarifaire */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Grille tarifaire</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>0-3 km:</span>
              <span className="font-medium">5,00$</span>
            </div>
            <div className="flex justify-between">
              <span>3-6 km:</span>
              <span className="font-medium">7,00$</span>
            </div>
            <div className="flex justify-between">
              <span>6-10 km:</span>
              <span className="font-medium">10,00$</span>
            </div>
            <div className="flex justify-between">
              <span>10+ km:</span>
              <span className="font-medium">12,00$</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryFeeCalculator;
