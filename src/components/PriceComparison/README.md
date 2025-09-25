# Comparateur de Prix CourseMax

## 🎯 Fonctionnalités

- **Recherche en temps réel** : Recherche de produits avec suggestions automatiques
- **Comparaison de prix** : Affichage des prix de tous les magasins vendant le produit
- **Mise à jour automatique** : Prix mis à jour toutes les 30 secondes
- **Design responsive** : Interface adaptée mobile, tablette et desktop
- **Tri intelligent** : Tri automatique par prix, note ou distance
- **Filtres avancés** : Filtrage par prix maximum, distance, note minimum

## 🚀 Utilisation

### Import simple
```tsx
import { PriceComparisonWrapper } from '@/components/PriceComparison';

function MyPage() {
  return (
    <PriceComparisonWrapper
      onMerchantSelect={(merchantId) => {
        console.log('Magasin sélectionné:', merchantId);
      }}
      onProductView={(merchantId) => {
        console.log('Voir produit:', merchantId);
      }}
    />
  );
}
```

### Import des composants individuels
```tsx
import { 
  PriceComparison, 
  PriceComparisonMobile, 
  SearchBar, 
  MerchantsList 
} from '@/components/PriceComparison';
```

## 📱 Responsive Design

Le composant détecte automatiquement la taille d'écran :
- **Desktop** : Interface complète avec filtres avancés
- **Mobile** : Interface optimisée avec navigation tactile

## 🔧 Configuration

### Hook usePriceComparison
```tsx
import { usePriceComparison } from '@/hooks/usePriceComparison';

const {
  searchQuery,
  setSearchQuery,
  merchants,
  isLoading,
  error,
  searchProducts,
  clearSearch,
  refreshPrices
} = usePriceComparison({
  debounceMs: 300,        // Délai de debounce pour la recherche
  updateInterval: 30000   // Intervalle de mise à jour (30s)
});
```

## 🎨 Personnalisation

### Props du composant principal
```tsx
interface PriceComparisonProps {
  className?: string;                    // Classes CSS personnalisées
  onMerchantSelect?: (merchantId: string) => void;  // Callback sélection magasin
  onProductView?: (merchantId: string) => void;     // Callback voir produit
}
```

### Props SearchBar
```tsx
interface SearchBarProps {
  onSearch: (query: string) => void;           // Callback recherche
  onClear: () => void;                        // Callback effacer
  placeholder?: string;                       // Placeholder personnalisé
  isLoading?: boolean;                        // État de chargement
  suggestions?: string[];                     // Suggestions de recherche
  onSuggestionSelect?: (suggestion: string) => void;  // Callback sélection suggestion
  className?: string;                         // Classes CSS
}
```

### Props MerchantsList
```tsx
interface MerchantsListProps {
  merchants: MerchantPrice[];                   // Liste des magasins
  isLoading?: boolean;                        // État de chargement
  onViewProduct: (merchantId: string) => void;  // Callback voir produit
  onSelectMerchant: (merchantId: string) => void;  // Callback sélectionner
  className?: string;                         // Classes CSS
}
```

## 📊 Types

### MerchantPrice
```tsx
interface MerchantPrice {
  id: string;                    // ID du magasin
  name: string;                   // Nom du magasin
  logo_url?: string;              // URL du logo
  address: string;                 // Adresse
  city: string;                   // Ville
  phone?: string;                 // Téléphone
  price: number;                  // Prix du produit
  isBestPrice: boolean;           // Meilleur prix
  rating?: number;                // Note (0-5)
  deliveryTime?: string;          // Temps de livraison
  isAvailable: boolean;           // Disponibilité
  lastUpdated: string;            // Dernière mise à jour
}
```

## 🔄 Mise à jour en temps réel

Le système utilise :
- **WebSocket** : Connexion temps réel avec Supabase
- **Polling** : Mise à jour automatique toutes les 30 secondes
- **Debouncing** : Évite les requêtes excessives lors de la saisie

## 🎯 États de l'interface

- **État initial** : Interface vide avec instructions
- **État de recherche** : Indicateur de chargement pendant la recherche
- **État avec résultats** : Liste des magasins avec prix
- **État sans résultats** : Message informatif
- **État d'erreur** : Gestion des erreurs avec retry

## 📱 Optimisations Mobile

- **Navigation tactile** : Boutons plus grands, espacement optimisé
- **Filtres en sheet** : Filtres dans un panneau coulissant
- **Informations compactes** : Affichage optimisé des informations
- **Actions simplifiées** : Boutons d'action clairs et accessibles

## 🔧 Intégration avec l'existant

Le composant respecte :
- ✅ L'architecture existante du projet
- ✅ Les composants UI déjà présents
- ✅ Les styles CSS existants
- ✅ Les patterns de hooks du projet
- ✅ La structure de base de données Supabase

## 🚀 Déploiement

Aucune configuration supplémentaire requise. Le composant utilise :
- Les composants UI existants (`@/components/ui/*`)
- Les hooks existants (`@/hooks/*`)
- La configuration Supabase existante
- Les utilitaires existants (`@/lib/utils`)
