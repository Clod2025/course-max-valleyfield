import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreCard } from "@/components/ui/store-card";
import { MapPin, Search, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Store {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  phone: string;
  type: 'grocery' | 'pharmacy' | 'warehouse';
  hours: string;
  isOpen: boolean;
  minOrder: number;
}

const VALLEYFIELD_STORES: Store[] = [
  {
    id: "iga-valleyfield",
    name: "IGA Valleyfield",
    address: "83 Rue Nicholson, Valleyfield",
    coordinates: [45.2467, -74.1256],
    phone: "(450) 377-1234",
    type: "grocery",
    hours: "8h-21h",
    isOpen: true,
    minOrder: 0
  },
  {
    id: "metro-plus",
    name: "Metro Plus Valleyfield",
    address: "60 Bd Monseigneur-Langlois, Valleyfield",
    coordinates: [45.2489, -74.1198],
    phone: "(450) 377-5678",
    type: "grocery",
    hours: "8h-22h",
    isOpen: true,
    minOrder: 0
  },
  {
    id: "super-c",
    name: "Super C",
    address: "405 Bd Harwood, Valleyfield",
    coordinates: [45.2523, -74.1345],
    phone: "(450) 377-9876",
    type: "grocery",
    hours: "8h-21h",
    isOpen: true,
    minOrder: 0
  },
  {
    id: "provigo",
    name: "Provigo",
    address: "15 Rue Victoria, Valleyfield",
    coordinates: [45.2445, -74.1278],
    phone: "(450) 377-4567",
    type: "grocery",
    hours: "7h-23h",
    isOpen: true,
    minOrder: 0
  },
  {
    id: "pharmaprix",
    name: "Pharmaprix",
    address: "405 Bd Harwood, Valleyfield",
    coordinates: [45.2523, -74.1345],
    phone: "(450) 377-3456",
    type: "pharmacy",
    hours: "9h-21h",
    isOpen: true,
    minOrder: 0
  },
  {
    id: "jean-coutu",
    name: "Jean Coutu",
    address: "169 Rue Victoria, Valleyfield",
    coordinates: [45.2456, -74.1289],
    phone: "(450) 377-2345",
    type: "pharmacy",
    hours: "9h-21h",
    isOpen: true,
    minOrder: 0
  },
  {
    id: "walmart",
    name: "Walmart Valleyfield",
    address: "50 Bd Mgr Langlois, Valleyfield",
    coordinates: [45.2478, -74.1234],
    phone: "(450) 377-1111",
    type: "warehouse",
    hours: "8h-22h",
    isOpen: true,
    minOrder: 0
  }
];

// Calcul prix livraison dynamique
function calculateDeliveryFee(distance: number, storeType: string): number {
  let basePrice = 5.00;
  let perKm = 1.50;
  
  // Majoration distance
  if (distance > 10) perKm = 2.00;
  
  // Minimum par type magasin
  const minFees = { 'grocery': 6.00, 'pharmacy': 4.50, 'warehouse': 7.00 };
  
  return Math.max(
    basePrice + (distance * perKm),
    minFees[storeType] || 5.00
  );
}

// Simulation calcul distance (remplacer par Google Maps API)
function calculateDistance(userCoords: [number, number], storeCoords: [number, number]): number {
  const [lat1, lon1] = userCoords;
  const [lat2, lon2] = storeCoords;
  
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getEstimatedTime(distance: number): string {
  const baseTime = 20; // minutes base
  const timePerKm = 2; // minutes par km
  const total = Math.round(baseTime + (distance * timePerKm));
  return `${total}-${total + 10} min`;
}

interface StoreSelectorProps {
  onStoreSelect: (store: Store & { distance: number; deliveryFee: number }) => void;
}

export function StoreSelector({ onStoreSelect }: StoreSelectorProps) {
  const [userAddress, setUserAddress] = useState("");
  const [userCoords, setUserCoords] = useState<[number, number]>([45.2467, -74.1256]); // Valleyfield center
  const [filteredStores, setFilteredStores] = useState(VALLEYFIELD_STORES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { toast } = useToast();

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

  const filterStores = () => {
    let filtered = VALLEYFIELD_STORES;
    
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
  };

  useEffect(() => {
    filterStores();
  }, [searchTerm, selectedType]);

  const storeTypes = [
    { key: 'grocery', label: 'Épiceries', count: VALLEYFIELD_STORES.filter(s => s.type === 'grocery').length },
    { key: 'pharmacy', label: 'Pharmacies', count: VALLEYFIELD_STORES.filter(s => s.type === 'pharmacy').length },
    { key: 'warehouse', label: 'Grandes surfaces', count: VALLEYFIELD_STORES.filter(s => s.type === 'warehouse').length }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header avec adresse */}
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

      {/* Filtres */}
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

      {/* Liste des magasins */}
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

      {filteredStores.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun magasin trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}