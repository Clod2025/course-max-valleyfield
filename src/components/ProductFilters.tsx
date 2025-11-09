import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  X, 
  DollarSign,
  Package,
  Star
} from 'lucide-react';

interface ProductFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  showOnlyAvailable: boolean;
  onShowOnlyAvailableChange: (show: boolean) => void;
  sortBy: 'name' | 'price_asc' | 'price_desc' | 'rating';
  onSortByChange: (sort: 'name' | 'price_asc' | 'price_desc' | 'rating') => void;
}

const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  showOnlyAvailable,
  onShowOnlyAvailableChange,
  sortBy,
  onSortByChange
}: ProductFiltersProps) => {
  const clearFilters = () => {
    onCategoryChange('all');
    onPriceRangeChange([0, 1000]);
    onShowOnlyAvailableChange(false);
    onSortByChange('name');
  };

  const hasActiveFilters = selectedCategory !== 'all' || 
    priceRange[0] > 0 || 
    priceRange[1] < 1000 || 
    showOnlyAvailable;

  return (
    <div className="space-y-6">
      {/* En-tête des filtres */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Effacer
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tri */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Trier par</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { value: 'name', label: 'Nom A-Z', icon: Package },
            { value: 'price_asc', label: 'Prix croissant', icon: DollarSign },
            { value: 'price_desc', label: 'Prix décroissant', icon: DollarSign },
            { value: 'rating', label: 'Note', icon: Star }
          ].map((option) => (
            <Button
              key={option.value}
              variant={sortBy === option.value ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => onSortByChange(option.value as any)}
            >
              <option.icon className="w-4 h-4 mr-2" />
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Catégories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Catégories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => onCategoryChange('all')}
          >
            <Package className="w-4 h-4 mr-2" />
            Toutes les catégories
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => onCategoryChange(category)}
            >
              <Package className="w-4 h-4 mr-2" />
              {category}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Prix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Prix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              max={1000}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPriceRangeChange([0, 25])}
              className="flex-1"
            >
              < 25$
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPriceRangeChange([25, 50])}
              className="flex-1"
            >
              25-50$
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPriceRangeChange([50, 100])}
              className="flex-1"
            >
              50-100$
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disponibilité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Disponibilité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="available-only"
              checked={showOnlyAvailable}
              onCheckedChange={onShowOnlyAvailableChange}
            />
            <label
              htmlFor="available-only"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              En stock uniquement
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Résumé des filtres actifs */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Filtres actifs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="mr-2">
                Catégorie: {selectedCategory}
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 1000) && (
              <Badge variant="secondary" className="mr-2">
                Prix: ${priceRange[0]} - ${priceRange[1]}
              </Badge>
            )}
            {showOnlyAvailable && (
              <Badge variant="secondary">
                En stock uniquement
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductFilters;
