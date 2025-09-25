# 🗺️ Système Distance et Livraison Multi-Marchands - CourseMax

## 📋 Vue d'ensemble

Le système de distance et livraison multi-marchands de CourseMax permet de calculer des distances réelles, optimiser des itinéraires, et gérer des livraisons groupées avec tarification dynamique.

## 🏗️ Architecture

```
src/services/
├── DistanceCalculatorService.ts      # Calcul de distances et géocodage
├── DeliveryPricingService.ts         # Moteur de tarification
├── RouteOptimizerService.ts          # Optimisation d'itinéraires
├── DeliveryFeeDistributionService.ts # Répartition des coûts
├── __tests__/                        # Tests unitaires
└── README.md                         # Cette documentation
```

## 🔧 Services

### 1. DistanceCalculatorService

**Rôle :** Calcul de distances réelles et géocodage d'adresses

**Fonctionnalités :**
- Calcul de distance entre deux adresses
- Optimisation d'itinéraires multi-marchands
- Géocodage d'adresses en coordonnées
- Cache intelligent des résultats
- Fallback en cas d'erreur API

**Méthodes principales :**
```typescript
// Calcul de distance simple
await distanceCalculatorService.calculateDistance(
  '123 Main St, Montreal',
  '456 Oak St, Montreal'
);

// Calcul d'itinéraire optimisé
await distanceCalculatorService.calculateMultiMerchantRoute(
  'Client Address',
  [
    { merchantId: 'm1', merchantName: 'Store 1', address: '123 St' },
    { merchantId: 'm2', merchantName: 'Store 2', address: '456 St' }
  ]
);

// Géocodage d'adresse
await distanceCalculatorService.geocodeAddress('123 Main St, Montreal');
```

**Configuration :**
- API Google Maps (recommandé)
- Fallback Haversine pour calculs approximatifs
- Cache de 5 minutes pour les résultats
- Gestion des erreurs et timeouts

### 2. DeliveryPricingService

**Rôle :** Calcul des frais de livraison avec tarification dynamique

**Fonctionnalités :**
- Tarification basée sur la distance
- Multiplicateurs temporels (heures de pointe, weekend)
- Seuils de livraison gratuite
- Suppléments pour zones éloignées
- Frais d'arrêts multiples

**Méthodes principales :**
```typescript
// Calcul pour un marchand
const result = await deliveryPricingService.calculateSingleMerchantDelivery(
  'Client Address',
  'Merchant Address',
  25.00, // Valeur de la commande
  'normal' // Créneau horaire
);

// Calcul pour plusieurs marchands
const result = await deliveryPricingService.calculateMultiMerchantDelivery(
  'Client Address',
  merchantOrders,
  'rush' // Heure de pointe
);
```

**Paramètres de tarification :**
- Frais de base : 2.99$
- Prix par km : 0.50$
- Seuil livraison gratuite : 25.00$
- Distance gratuite : 5km
- Supplément zone éloignée : 5.00$ (>15km)
- Supplément arrêt multiple : 3.00$

### 3. RouteOptimizerService

**Rôle :** Optimisation d'itinéraires pour livraisons multi-marchands

**Algorithmes supportés :**
- **Google Maps** : Utilise l'API Directions avec waypoints
- **Nearest Neighbor** : Algorithme du plus proche voisin
- **Genetic Algorithm** : Algorithme génétique pour grandes distances
- **Simulated Annealing** : Recuit simulé pour optimisation

**Méthodes principales :**
```typescript
// Optimisation d'itinéraire
const result = await routeOptimizerService.optimizeRoute(
  {
    clientAddress: 'Client Address',
    merchantStops: [
      { merchantId: 'm1', merchantName: 'Store 1', address: '123 St' },
      { merchantId: 'm2', merchantName: 'Store 2', address: '456 St' }
    ],
    driverConstraints: {
      maxDistance: 50, // km
      maxDuration: 120, // minutes
      vehicleType: 'car'
    }
  },
  {
    algorithm: 'google_maps',
    considerTraffic: true,
    considerTimeWindows: true
  }
);
```

**Contraintes supportées :**
- Distance maximale
- Durée maximale
- Fenêtres de temps des marchands
- Priorités des marchands
- Types de véhicules

### 4. DeliveryFeeDistributionService

**Rôle :** Répartition des frais de livraison entre marchands

**Méthodes de répartition :**
- **Proportionnelle** : Basée sur la valeur des commandes
- **Égale** : Répartition égale entre tous les marchands
- **Basée sur la distance** : Selon la distance ajoutée par chaque marchand
- **Hybride** : Combinaison de plusieurs facteurs

**Méthodes principales :**
```typescript
// Calcul de répartition
const result = await deliveryFeeDistributionService.calculateFeeDistribution(
  merchantOrders,
  totalDeliveryFee,
  'proportional' // Méthode de répartition
);

// Comparaison des méthodes
const comparison = await deliveryFeeDistributionService.compareDistributionMethods(
  merchantOrders,
  totalDeliveryFee
);

// Recommandation de méthode
const recommendation = await deliveryFeeDistributionService.recommendDistributionMethod(
  merchantOrders,
  totalDeliveryFee
);
```

## 🗄️ Base de données

### Tables requises

```sql
-- Configuration de tarification
CREATE TABLE delivery_pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_fee DECIMAL(10,2) NOT NULL DEFAULT 2.99,
  price_per_km DECIMAL(10,2) NOT NULL DEFAULT 0.50,
  free_delivery_threshold DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  max_free_distance INTEGER NOT NULL DEFAULT 5,
  remote_zone_fee DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  remote_zone_distance INTEGER NOT NULL DEFAULT 15,
  multi_stop_fee DECIMAL(10,2) NOT NULL DEFAULT 3.00,
  rush_hour_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.50,
  weekend_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.20,
  holiday_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Créneaux horaires
CREATE TABLE delivery_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Zones géographiques
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  coordinates JSONB NOT NULL, -- Array de {lat, lng}
  fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Configuration de répartition des frais
CREATE TABLE delivery_fee_distribution_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method VARCHAR(20) NOT NULL DEFAULT 'proportional',
  base_fee_weight DECIMAL(3,2) NOT NULL DEFAULT 0.60,
  distance_weight DECIMAL(3,2) NOT NULL DEFAULT 0.30,
  priority_weight DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  minimum_fee DECIMAL(10,2) NOT NULL DEFAULT 0.50,
  maximum_fee DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  round_to_nearest DECIMAL(10,2) NOT NULL DEFAULT 0.01,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Flux de données

### Livraison simple
1. Client sélectionne un marchand
2. Calcul de distance client ↔ marchand
3. Calcul des frais de livraison
4. Affichage du total à l'utilisateur

### Livraison multi-marchands
1. Client ajoute des produits de plusieurs marchands
2. Optimisation de l'itinéraire (TSP)
3. Calcul des frais totaux
4. Répartition des frais entre marchands
5. Affichage du détail des coûts

### Interface livreur
1. Réception de la commande groupée
2. Affichage de l'itinéraire optimisé
3. Navigation GPS intégrée
4. Confirmation de chaque arrêt
5. Finalisation de la livraison

## 🛡️ Sécurité et Performance

### Mesures de sécurité
- Validation des adresses avant géocodage
- Limitation des requêtes API (rate limiting)
- Cache sécurisé avec expiration
- Gestion des erreurs et fallbacks

### Optimisations de performance
- Cache intelligent des calculs
- Requêtes parallèles quand possible
- Compression des données de route
- Préchargement des zones populaires

### Monitoring
- Métriques de performance des API
- Taux d'erreur des calculs
- Temps de réponse des services
- Utilisation du cache

## 🧪 Tests

### Tests unitaires
```bash
npm test src/services/__tests__/DistanceSystem.test.ts
```

### Tests d'intégration
- Test du flux complet de livraison
- Test des optimisations d'itinéraire
- Test de la répartition des frais
- Test de performance avec charge

### Tests de charge
- 100 calculs simultanés
- Gestion des pics de trafic
- Performance du cache
- Limites des API externes

## 📊 Analytics

### Métriques trackées
- Distance moyenne par livraison
- Temps de calcul des itinéraires
- Taux d'optimisation des routes
- Économies réalisées par groupage
- Satisfaction client par type de livraison

### Dashboard analytics
- Vue d'ensemble des performances
- Statistiques multi-marchands
- Opportunités d'optimisation
- Performance des livreurs
- Tendances temporelles

## 🚀 Déploiement

### Prérequis
- [ ] Clé API Google Maps configurée
- [ ] Base de données migrée
- [ ] Cache Redis configuré
- [ ] Monitoring activé
- [ ] Tests E2E passés

### Variables d'environnement
```env
# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# Monitoring
ANALYTICS_ENABLED=true
PERFORMANCE_MONITORING=true
```

### Checklist de déploiement
- [ ] API Google Maps testée
- [ ] Configuration tarification initialisée
- [ ] Tests de charge passés
- [ ] Monitoring configuré
- [ ] Documentation mise à jour
- [ ] Formation équipe

## 🔧 Configuration

### Configuration par défaut
```typescript
const defaultConfig = {
  baseFee: 2.99,
  pricePerKm: 0.50,
  freeDeliveryThreshold: 25.00,
  maxFreeDistance: 5,
  remoteZoneFee: 5.00,
  remoteZoneDistance: 15,
  multiStopFee: 3.00,
  rushHourMultiplier: 1.5,
  weekendMultiplier: 1.2,
  holidayMultiplier: 1.3
};
```

### Personnalisation
- Interface admin pour modifier les tarifs
- Tests en temps réel des modifications
- Historique des changements
- Rollback possible

## 📞 Support

### Problèmes courants
1. **API Google Maps indisponible** : Fallback automatique vers Haversine
2. **Calculs lents** : Vérifier le cache et les limites API
3. **Itinéraires non optimaux** : Ajuster les paramètres d'optimisation
4. **Frais incorrects** : Vérifier la configuration de tarification

### Debug
- Logs détaillés des calculs
- Métriques de performance
- Traces des requêtes API
- Statistiques d'utilisation du cache

## 📈 Roadmap

### Version 1.1
- [ ] Support d'autres APIs de géolocalisation
- [ ] Optimisation en temps réel du trafic
- [ ] Prédiction de la demande
- [ ] IA pour l'optimisation des routes

### Version 1.2
- [ ] Intégration avec les systèmes de transport public
- [ ] Optimisation carbone
- [ ] Prédiction météo
- [ ] Analytics avancées

---

**Dernière mise à jour :** 28 janvier 2024  
**Version :** 1.0.0  
**Auteur :** Équipe CourseMax
