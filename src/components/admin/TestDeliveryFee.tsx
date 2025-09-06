import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  MapPin, 
  Navigation,
  TestTube
} from 'lucide-react';
import { useDeliveryFee } from '@/hooks/useDeliveryFee';

export const TestDeliveryFee: React.FC = () => {
  const [storeId, setStoreId] = useState('store-test-1');
  const [clientAddress, setClientAddress] = useState('123 Rue Principale, Valleyfield');
  const [result, setResult] = useState<any>(null);
  const { loading, calculateDeliveryFee } = useDeliveryFee();

  const handleTest = async () => {
    const response = await calculateDeliveryFee({
      store_id: storeId,
      client_address: clientAddress,
      client_city: 'Valleyfield'
    });

    setResult(response);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test des Frais de Livraison
        </CardTitle>
        <CardDescription>
          Testez le calcul des frais de livraison avec l'API Mapbox
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="store-id">ID du Magasin</Label>
          <Input
            id="store-id"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="store-test-1"
          />
        </div>

        <div>
          <Label htmlFor="client-address">Adresse Client</Label>
          <Input
            id="client-address"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            placeholder="123 Rue Principale, Valleyfield"
          />
        </div>

        <Button 
          onClick={handleTest} 
          disabled={loading || !storeId || !clientAddress}
          className="w-full"
        >
          {loading ? 'Test en cours...' : 'Tester le calcul'}
        </Button>

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Résultat du test :</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Distance:</span>
                <Badge variant="outline">{result.calculation.distance_km} km</Badge>
              </div>
              <div className="flex justify-between">
                <span>Frais de livraison:</span>
                <Badge variant="outline">{result.calculation.delivery_fee}$</Badge>
              </div>
              <div className="flex justify-between">
                <span>Tranche tarifaire:</span>
                <Badge variant="outline">{result.calculation.pricing_tier}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Durée estimée:</span>
                <Badge variant="outline">{result.calculation.estimated_duration_minutes} min</Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestDeliveryFee;
