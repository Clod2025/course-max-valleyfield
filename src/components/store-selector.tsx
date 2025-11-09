import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreCard } from "@/components/ui/store-card";
import { MapPin, Search, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Store {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  phone: string;
  type: 'grocery' | 'pharmacy' | 'warehouse' | 'restaurant';
  hours: string;
  isOpen: boolean;
  minOrder: number;
}

// Calcul prix livraison dynamique
function calculateDeliveryFee(distance: number, storeType: string): number {
  let basePrice = 5.00;
  let perKm = 1.50;
  
  if (distance > 10) perKm = 2.00;
  
  const minFees = { 'grocery': 6.00, 'pharmacy': 4.50, 'warehouse': 7.00, 'restaurant': 5.50 };
  
  return Math.max(
    basePrice + (distance * perKm),
    minFees[storeType] || 5.00
  );
}

function calculateDistance(userCoords: [number, number], storeCoords: [number, number]): number {
  const [lat1, lon1] = userCoords;
  const [lat2, lon2] = storeCoords;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getEstimatedTime(distance: number): string {
  const baseTime = 20;
  const timePerKm = 2;
  const total = Math.round(baseTime + (distance * timePerKm));
  return `${total}-${total + 10} min`;
}

interface StoreSelectorProps {
  onStoreSelect: (store: Store & { distance: number; deliveryFee: number }) => void;
}

export function StoreSelector({ onStoreSelect }: StoreSelectorProps) {
  const [userAddress, setUserAddress] = useState("");
  const [userCoords, setUserCoords] = useState<[number, number]>([45.2467, -74.1256]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { toast } = useToast();

  // ✅ Charger les magasins depuis Supabase
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Transformer les données Supabase en format Store
      const transformedStores: Store[] = (data || []).map(store => ({
        id: store.id,
        name: store.name,
        address: `${store.address}, ${store.city}`,
        coordinates: [
          store.latitude || 45.2467, 
          store.longitude || -74.1256
        ],
        phone: store.phone || '',
        type: (store.store_type as 'grocery' | 'pharmacy' | 'warehouse' | 'restaurant') || 'grocery',
        hours: store.opening_hours || '9h-18h',
        isOpen: store.is_active,
        minOrder: store.minimum_order || 25.00
      }));

      setStores(transformedStores);
      setFilteredStores(transformedStores);
    } catch (error: any) {
      console.error('Erreur lors du chargement des magasins:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les magasins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([position.coords.latitude, position.coords.longitude]);
          toast({
            title: "Position détectée",
            description: "Calcul des prix de livraison mis à jour",
          });
        },
        (error) => {
          toast({
            title: "Erreur de géolocalisation",
            description: "Utilisation de l'adresse par défaut",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleStoreClick = (store: Store) => {
    const distance = calculateDistance(userCoords, store.coordinates);
    const deliveryFee = calculateDeliveryFee(distance, store.type);
    
    onStoreSelect({
      ...store,
      distance,
      deliveryFee
    });
  };

  // Filtres des magasins
  useEffect(() => {
    let filtered = stores;
    
    if (searchTerm) {
      filtered = filtered.filter(store => 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType) {
      filtered = filtered.filter(store => store.type === selectedType);
    }
    
    setFilteredStores(filtered);
  }, [searchTerm, selectedType, stores]);

  const storeTypes = [
    { key: 'grocery', label: 'Épiceries', count: stores.filter(s => s.type === 'grocery').length },
    { key: 'pharmacy', label: 'Pharmacies', count: stores.filter(s => s.type === 'pharmacy').length },
    { key: 'warehouse', label: 'Grandes surfaces', count: stores.filter(s => s.type === 'warehouse').length },
    { key: 'restaurant', label: 'Restaurants', count: stores.filter(s => s.type === 'restaurant').length }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="shadow-coursemax">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-6 h-6 text-primary" />
            Votre adresse de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Entrez votre adresse à Valleyfield..."
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={getCurrentLocation}
              variant="outline"
              size="icon"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Les prix de livraison sont calculés automatiquement selon votre distance
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un magasin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => setSelectedType(null)}
            size="sm"
          >
            Tous les magasins
          </Button>
          {storeTypes.map(type => (
            <Button
              key={type.key}
              variant={selectedType === type.key ? "default" : "outline"}
              onClick={() => setSelectedType(selectedType === type.key ? null : type.key)}
              size="sm"
              className="gap-1"
            >
              {type.label}
              <Badge variant="secondary" className="ml-1">
                {type.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Chargement des magasins...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredStores.map((store) => {
            const distance = calculateDistance(userCoords, store.coordinates);
            const deliveryFee = calculateDeliveryFee(distance, store.type);
            const estimatedTime = getEstimatedTime(distance);
            
            return (
              <StoreCard
                key={store.id}
                id={store.id}
                name={store.name}
                address={store.address}
                distance={distance}
                deliveryFee={deliveryFee}
                estimatedTime={estimatedTime}
                type={store.type}
                isOpen={store.isOpen}
                onClick={() => handleStoreClick(store)}
              />
            );
          })}
        </div>
      )}

      {!loading && filteredStores.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun magasin trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
