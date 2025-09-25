# Système de Fidélité CourseMax

## 📋 Vue d'ensemble

Le système de fidélité CourseMax permet aux clients de gagner et d'utiliser des points de fidélité lors de leurs achats. Le système est entièrement configurable côté administrateur et s'intègre parfaitement au processus de checkout existant.

## 🎯 Fonctionnalités

### Pour les Clients
- **Gain de points** : 1$ dépensé = 1 point (configurable)
- **Utilisation des points** : 100 points = 1$ de réduction (configurable)
- **Historique complet** : Suivi de tous les gains et utilisations
- **Interface intuitive** : Intégration transparente au checkout
- **Calculs en temps réel** : Affichage instantané des économies

### Pour les Administrateurs
- **Configuration complète** : Tous les paramètres sont modifiables
- **Tableau de bord dédié** : Interface admin pour gérer le système
- **Statistiques** : Suivi des performances du programme
- **Activation/désactivation** : Contrôle total du système

## 🏗️ Architecture

### Base de Données
```sql
-- Tables principales
loyalty_settings     -- Configuration du système
loyalty_transactions -- Historique des transactions
loyalty_redemptions  -- Historique des échanges
profiles.loyalty_points -- Points de l'utilisateur
```

### Composants React
```
src/components/loyalty/
├── LoyaltyCard.tsx          -- Carte de points utilisateur
├── LoyaltyHistory.tsx       -- Historique des transactions
├── LoyaltyRedeem.tsx        -- Interface d'échange de points
└── README.md               -- Cette documentation

src/components/checkout/
└── LoyaltyCheckout.tsx      -- Intégration au checkout

src/components/admin/
└── LoyaltySettings.tsx      -- Configuration admin

src/hooks/
└── useLoyalty.tsx           -- Hook principal du système
```

## 🔧 Configuration

### Paramètres Administrateur

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `loyalty_enabled` | Activer le système | `true` |
| `loyalty_earn_rate` | Points par dollar dépensé | `1.0` |
| `loyalty_redeem_rate` | Valeur d'un point en dollars | `0.01` |
| `min_redemption_points` | Minimum pour échanger | `100` |
| `max_redemption_percentage` | Max % de réduction par commande | `50` |
| `points_expiry_days` | Expiration des points (jours) | `365` |

### Exemples de Configuration

#### Configuration Standard
```javascript
{
  loyalty_enabled: true,
  loyalty_earn_rate: 1.0,        // 1 point par dollar
  loyalty_redeem_rate: 0.01,     // 1 point = 0.01$
  min_redemption_points: 100,    // 100 points minimum
  max_redemption_percentage: 50, // 50% max de réduction
  points_expiry_days: 365        // 1 an d'expiration
}
```

#### Configuration Premium
```javascript
{
  loyalty_enabled: true,
  loyalty_earn_rate: 2.0,        // 2 points par dollar
  loyalty_redeem_rate: 0.02,     // 1 point = 0.02$
  min_redemption_points: 50,     // 50 points minimum
  max_redemption_percentage: 75, // 75% max de réduction
  points_expiry_days: 730        // 2 ans d'expiration
}
```

## 🚀 Utilisation

### Hook Principal
```typescript
import { useLoyalty } from '@/hooks/useLoyalty';

const { 
  account,           // Données de fidélité
  loading,           // État de chargement
  calculateEarnedPoints,    // Calculer les points gagnés
  calculatePointsValue,     // Calculer la valeur des points
  addPoints,         // Ajouter des points
  redeemPoints,      // Utiliser des points
  canRedeemPoints    // Vérifier si l'utilisateur peut échanger
} = useLoyalty();
```

### Composant de Checkout
```typescript
import LoyaltyCheckout from '@/components/checkout/LoyaltyCheckout';

<LoyaltyCheckout
  orderTotal={100}
  onLoyaltyDiscount={(points, discount) => {
    // Gérer la réduction appliquée
  }}
  onRemoveLoyaltyDiscount={() => {
    // Supprimer la réduction
  }}
/>
```

### Configuration Admin
```typescript
import LoyaltySettings from '@/components/admin/LoyaltySettings';

<LoyaltySettings />
```

## 📊 Fonctions de Base de Données

### Ajouter des Points
```sql
SELECT add_loyalty_points(
  p_user_id := 'user-uuid',
  p_points := 50,
  p_order_id := 'order-uuid',
  p_description := 'Points gagnés pour commande',
  p_metadata := '{"order_amount": 50}'
);
```

### Utiliser des Points
```sql
SELECT redeem_loyalty_points(
  p_user_id := 'user-uuid',
  p_order_id := 'order-uuid',
  p_points_to_redeem := 100,
  p_redeem_rate := 0.01
);
```

### Historique des Transactions
```sql
SELECT * FROM get_loyalty_history(
  p_user_id := 'user-uuid',
  p_limit := 50,
  p_offset := 0
);
```

## 🧪 Tests

### Tests Unitaires
```bash
# Tests du hook useLoyalty
npm test src/hooks/__tests__/useLoyalty.test.tsx

# Tests des composants
npm test src/components/loyalty/__tests__/LoyaltyCard.test.tsx
npm test src/components/checkout/__tests__/LoyaltyCheckout.test.tsx
```

### Tests d'Intégration
- Test du flux complet de gain de points
- Test du flux d'échange de points
- Test de la configuration admin
- Test des calculs de réduction

## 🔒 Sécurité

### Row Level Security (RLS)
- Les utilisateurs ne peuvent voir que leurs propres transactions
- Les admins ont accès complet au système
- Les paramètres sont publics en lecture seule

### Validation
- Validation côté client et serveur
- Vérification des limites de réduction
- Protection contre les échanges frauduleux

## 📈 Métriques et Analytics

### Métriques Clés
- Taux d'adoption du programme
- Points gagnés/utilisés par période
- Valeur moyenne des échanges
- Rétention des clients avec points

### Tableaux de Bord
- Vue d'ensemble des performances
- Statistiques par utilisateur
- Tendances des échanges
- Impact sur les revenus

## 🚨 Gestion d'Erreurs

### Erreurs Communes
- **Points insuffisants** : L'utilisateur n'a pas assez de points
- **Limite de réduction** : Dépassement du pourcentage maximum
- **Système désactivé** : Le programme est temporairement fermé
- **Points expirés** : Les points ont dépassé leur date d'expiration

### Messages Utilisateur
- Messages d'erreur clairs et informatifs
- Suggestions d'actions correctives
- Aide contextuelle pour comprendre les règles

## 🔄 Maintenance

### Tâches Régulières
- Nettoyage des points expirés
- Sauvegarde des transactions
- Mise à jour des statistiques
- Vérification de l'intégrité des données

### Monitoring
- Surveillance des performances
- Alertes en cas d'anomalies
- Logs des transactions importantes
- Rapports de sécurité

## 📚 Ressources

### Documentation Technique
- [Migration de base de données](./migrations/20250128000000_loyalty_system.sql)
- [API Reference](./api.md)
- [Troubleshooting](./troubleshooting.md)

### Guides Utilisateur
- [Guide Client](./client-guide.md)
- [Guide Administrateur](./admin-guide.md)
- [FAQ](./faq.md)

## 🤝 Contribution

### Développement
1. Fork du repository
2. Création d'une branche feature
3. Implémentation des changements
4. Tests complets
5. Pull request avec description détaillée

### Standards
- Code TypeScript strict
- Tests unitaires obligatoires
- Documentation à jour
- Respect des conventions de nommage

---

**Version**: 1.0.0  
**Dernière mise à jour**: 28 janvier 2025  
**Maintenu par**: Équipe CourseMax
