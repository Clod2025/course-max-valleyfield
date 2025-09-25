import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MerchantPrice } from './MerchantsList';

interface MerchantsListMobileProps {
  merchants: MerchantPrice[];
  isLoading?: boolean;
  onViewProduct: (merchantId: string) => void;
  onSelectMerchant: (merchantId: string) => void;
  className?: string;
}

export const MerchantsListMobile: React.FC<MerchantsListMobileProps> = ({
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
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-2 w-8" />
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
      <div className={cn("text-center py-8", className)}>
        <Store className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="text-base font-semibold text-muted-foreground mb-2">
          Aucun magasin trouvé
        </h3>
        <p className="text-xs text-muted-foreground">
          Aucun magasin ne vend ce produit pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {sortedMerchants.map((merchant, index) => (
        <Card 
          key={merchant.id} 
          className={cn(
            "transition-all duration-200 hover:shadow-md",
            merchant.isBestPrice && "ring-2 ring-green-500 ring-opacity-50"
          )}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header with logo and price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Logo */}
                  <div className="relative flex-shrink-0">
                    {merchant.logo_url ? (
                      <img
                        src={merchant.logo_url}
                        alt={merchant.name}
                        className="h-10 w-10 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Store className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {merchant.isBestPrice && (
                      <div className="absolute -top-1 -right-1">
                        <Badge 
                          variant="default" 
                          className="bg-green-500 text-white text-xs px-1 py-0.5"
                        >
                          <TrendingDown className="h-2 w-2 mr-0.5" />
                          Meilleur
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Merchant name and rating */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {merchant.name}
                      </h3>
                      {merchant.rating && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">
                            {merchant.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Location - compact */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                      <span className="truncate">
                        {merchant.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price - prominent */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-primary">
                    {merchant.price.toFixed(2)} $
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(merchant.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Status and delivery info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {merchant.isAvailable ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      <span>Disponible</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <X className="h-3 w-3" />
                      <span>Indisponible</span>
                    </div>
                  )}
                  
                  {merchant.deliveryTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{merchant.deliveryTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - Mobile optimized */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProduct(merchant.id)}
                  className="flex items-center gap-1 flex-1 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  Voir produit
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSelectMerchant(merchant.id)}
                  disabled={!merchant.isAvailable}
                  className="flex items-center gap-1 flex-1 text-xs"
                >
                  Sélectionner
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
