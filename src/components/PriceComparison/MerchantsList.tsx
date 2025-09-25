import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Store, 
  Star, 
  MapPin, 
  Phone, 
  ExternalLink,
  TrendingDown,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MerchantPrice {
  id: string;
  name: string;
  logo_url?: string;
  address: string;
  city: string;
  phone?: string;
  price: number;
  isBestPrice: boolean;
  rating?: number;
  deliveryTime?: string;
  isAvailable: boolean;
  lastUpdated: string;
}

interface MerchantsListProps {
  merchants: MerchantPrice[];
  isLoading?: boolean;
  onViewProduct: (merchantId: string) => void;
  onSelectMerchant: (merchantId: string) => void;
  className?: string;
}

export const MerchantsList: React.FC<MerchantsListProps> = ({
  merchants,
  isLoading = false,
  onViewProduct,
  onSelectMerchant,
  className
}) => {
  // Sort merchants by price (ascending)
  const sortedMerchants = [...merchants].sort((a, b) => a.price - b.price);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          Aucun magasin trouvé
        </h3>
        <p className="text-sm text-muted-foreground">
          Aucun magasin ne vend ce produit pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {sortedMerchants.map((merchant, index) => (
        <Card 
          key={merchant.id} 
          className={cn(
            "transition-all duration-200 hover:shadow-md",
            merchant.isBestPrice && "ring-2 ring-green-500 ring-opacity-50"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Merchant Info */}
              <div className="flex items-center space-x-4 flex-1">
                {/* Logo */}
                <div className="relative">
                  {merchant.logo_url ? (
                    <img
                      src={merchant.logo_url}
                      alt={merchant.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  {merchant.isBestPrice && (
                    <div className="absolute -top-1 -right-1">
                      <Badge 
                        variant="default" 
                        className="bg-green-500 text-white text-xs px-1.5 py-0.5"
                      >
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Meilleur prix
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Merchant Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">
                      {merchant.name}
                    </h3>
                    {merchant.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-muted-foreground">
                          {merchant.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {merchant.address}, {merchant.city}
                      </span>
                    </div>
                    {merchant.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{merchant.phone}</span>
                      </div>
                    )}
                  </div>

                  {merchant.deliveryTime && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Livraison: {merchant.deliveryTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col items-end space-y-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {merchant.price.toFixed(2)} $
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mis à jour: {new Date(merchant.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {merchant.isAvailable ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Disponible</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <X className="h-4 w-4" />
                      <span>Indisponible</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewProduct(merchant.id)}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir le produit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSelectMerchant(merchant.id)}
                    disabled={!merchant.isAvailable}
                  >
                    Sélectionner
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
