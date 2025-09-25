import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  TrendingUp,
  Clock,
  Store,
  Menu,
  X
} from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MerchantsList, MerchantPrice } from './MerchantsList';
import { usePriceComparison } from '@/hooks/usePriceComparison';
import { cn } from '@/lib/utils';

interface PriceComparisonMobileProps {
  className?: string;
  onMerchantSelect?: (merchantId: string) => void;
  onProductView?: (merchantId: string) => void;
}

export const PriceComparisonMobile: React.FC<PriceComparisonMobileProps> = ({
  className,
  onMerchantSelect,
  onProductView
}) => {
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearching,
    merchants,
    isLoading,
    error,
    lastUpdated,
    isUpdating,
    connectionStatus,
    searchProducts,
    clearSearch,
    refreshPrices
  } = usePriceComparison();

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchProducts(query);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    searchProducts(suggestion);
  };

  const handleMerchantSelect = (merchantId: string) => {
    onMerchantSelect?.(merchantId);
  };

  const handleProductView = (merchantId: string) => {
    onProductView?.(merchantId);
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn("w-full p-4 space-y-4", className)}>
      {/* Header - Mobile Optimized */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Comparateur de Prix
        </h1>
        <p className="text-sm text-muted-foreground">
          Trouvez le meilleur prix
        </p>
      </div>

      {/* Search Section - Mobile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SearchBar
            onSearch={handleSearch}
            onClear={clearSearch}
            suggestions={suggestions}
            onSuggestionSelect={handleSuggestionSelect}
            isLoading={isSearching}
            placeholder="Rechercher un produit..."
            className="w-full"
          />
          
          {/* Mobile Controls */}
          <div className="flex items-center justify-between">
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Filtres et Options</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Trier par</label>
                    <div className="space-y-2">
                      {[
                        { value: 'price', label: 'Prix (croissant)' },
                        { value: 'rating', label: 'Note' },
                        { value: 'distance', label: 'Distance' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="sortBy"
                            value={option.value}
                            checked={sortBy === option.value}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="text-primary"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-3 block">Prix maximum</label>
                    <input
                      type="number"
                      placeholder="Prix max"
                      className="w-full text-sm border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-3 block">Distance maximum</label>
                    <input
                      type="number"
                      placeholder="Distance (km)"
                      className="w-full text-sm border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-3 block">Note minimum</label>
                    <input
                      type="number"
                      placeholder="Note min"
                      className="w-full text-sm border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Connection Status - Compact */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getConnectionStatusIcon()}
              <span className="hidden sm:inline">
                {connectionStatus === 'connected' ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section - Mobile Optimized */}
      {searchQuery && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">
                    "{searchQuery}"
                  </CardTitle>
                  {merchants.length > 0 && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {merchants.length} magasin{merchants.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPrices}
                disabled={isUpdating}
                className="flex items-center gap-1 flex-shrink-0"
              >
                <RefreshCw className={cn("h-3 w-3", isUpdating && "animate-spin")} />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">{error}</span>
              </div>
            )}

            <MerchantsList
              merchants={merchants}
              isLoading={isLoading}
              onViewProduct={handleProductView}
              onSelectMerchant={handleMerchantSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State - Mobile */}
      {!searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-muted-foreground mb-2">
              Commencez votre recherche
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Tapez le nom d'un produit pour comparer les prix
            </p>
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Prix en temps réel</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Mise à jour automatique</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer - Mobile */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Prix mis à jour toutes les 30s</p>
        {lastUpdated && (
          <p>Dernière MAJ: {lastUpdated.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
};
