import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  TrendingUp,
  Clock,
  Store
} from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MerchantsList, MerchantPrice } from './MerchantsList';
import { usePriceComparison } from '@/hooks/usePriceComparison';
import { cn } from '@/lib/utils';

interface PriceComparisonProps {
  className?: string;
  onMerchantSelect?: (merchantId: string) => void;
  onProductView?: (merchantId: string) => void;
}

export const PriceComparison: React.FC<PriceComparisonProps> = ({
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

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connecté';
      case 'disconnected':
        return 'Déconnecté';
      case 'error':
        return 'Erreur de connexion';
      default:
        return 'Déconnecté';
    }
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto p-6 space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Comparateur de Prix
        </h1>
        <p className="text-muted-foreground">
          Trouvez le meilleur prix pour vos produits préférés
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche de Produits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBar
            onSearch={handleSearch}
            onClear={clearSearch}
            suggestions={suggestions}
            onSuggestionSelect={handleSuggestionSelect}
            isLoading={isSearching}
            placeholder="Rechercher un produit..."
          />
          
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
              
              {merchants.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Trier par:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="price">Prix</option>
                    <option value="rating">Note</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>
              )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getConnectionStatusIcon()}
              <span>{getConnectionStatusText()}</span>
              {lastUpdated && (
                <span className="text-xs">
                  • Mis à jour: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Prix maximum</label>
                  <input
                    type="number"
                    placeholder="Prix max"
                    className="w-full text-sm border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Distance maximum</label>
                  <input
                    type="number"
                    placeholder="Distance (km)"
                    className="w-full text-sm border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Note minimum</label>
                  <input
                    type="number"
                    placeholder="Note min"
                    className="w-full text-sm border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchQuery && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Résultats pour "{searchQuery}"
                {merchants.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {merchants.length} magasin{merchants.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {isUpdating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Mise à jour...</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPrices}
                  disabled={isUpdating}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
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

      {/* Empty State */}
      {!searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Commencez votre recherche
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tapez le nom d'un produit pour comparer les prix entre les magasins
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Prix en temps réel</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Mise à jour automatique</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Les prix sont mis à jour automatiquement toutes les 30 secondes
        </p>
        <p className="mt-1">
          Dernière mise à jour: {lastUpdated ? lastUpdated.toLocaleString() : 'Jamais'}
        </p>
      </div>
    </div>
  );
};
