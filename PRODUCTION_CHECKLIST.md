# 🚀 Checklist de Production - CourseMax

## ⚠️ CRITIQUE - À FAIRE AVANT LA MISE EN PRODUCTION

### 1. 🔐 SÉCURITÉ

#### 1.1 Variables d'environnement
- [ ] **Créer `.env.production`** avec toutes les variables nécessaires
- [ ] **Supprimer les credentials hardcodés** dans :
  - `src/integrations/supabase/client.ts` (URL et clé par défaut)
  - `supabase/functions/*/index.ts` (URLs hardcodées)
- [ ] **Variables requises** :
  ```env
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  STRIPE_SECRET_KEY=
  STRIPE_PUBLISHABLE_KEY=
  STRIPE_WEBHOOK_SECRET=
  ```

#### 1.2 CORS - Configuration sécurisée
- [ ] **Restreindre CORS** : Actuellement `'Access-Control-Allow-Origin': '*'` dans toutes les Edge Functions
- [ ] **Remplacer par** : Domaine spécifique de production
  ```typescript
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.PRODUCTION_URL || 'https://votre-domaine.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }
  ```

#### 1.3 Validation côté serveur
- [ ] **Ajouter validation Zod/Joi** dans toutes les Edge Functions
- [ ] **Sanitisation des inputs** utilisateurs
- [ ] **Rate limiting** sur les endpoints critiques (paiement, authentification)

#### 1.4 RLS (Row Level Security)
- [ ] **Vérifier toutes les politiques RLS** dans Supabase
- [ ] **Tester les permissions** pour chaque rôle (client, merchant, driver, admin)
- [ ] **Audit des fonctions SECURITY DEFINER**

---

### 2. 💳 STRIPE - Paiements

#### 2.1 Webhooks Stripe (CRITIQUE)
- [ ] **Créer Edge Function `stripe-webhook`** pour gérer les événements :
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `transfer.created`
- [ ] **Configurer le webhook** dans le dashboard Stripe
- [ ] **Vérifier la signature** du webhook avec `STRIPE_WEBHOOK_SECRET`
- [ ] **Mettre à jour les statuts** de transaction dans la base de données

#### 2.2 Gestion des erreurs de paiement
- [ ] **Gérer les échecs** de paiement (carte refusée, fonds insuffisants)
- [ ] **Notifications** aux clients en cas d'échec
- [ ] **Retry logic** pour les erreurs temporaires

#### 2.3 Tests en mode test Stripe
- [ ] **Tester avec des cartes de test** Stripe
- [ ] **Scénarios de test** :
  - Paiement réussi
  - Paiement échoué
  - Remboursement
  - Paiement en 3x

---

### 3. 📊 MONITORING & LOGGING

#### 3.1 Système de logging
- [ ] **Remplacer `console.log`** par un service de logging (Sentry, LogRocket, ou Supabase Logs)
- [ ] **Logs structurés** avec niveaux (error, warn, info, debug)
- [ ] **Context** dans les logs (user_id, order_id, etc.)

#### 3.2 Monitoring d'erreurs
- [ ] **Intégrer Sentry** ou équivalent pour le tracking d'erreurs
- [ ] **Alertes** pour les erreurs critiques
- [ ] **Dashboard** de monitoring

#### 3.3 Analytics
- [ ] **Intégrer Google Analytics** ou équivalent
- [ ] **Tracking des événements** :
  - Commandes créées
  - Paiements réussis/échoués
  - Conversions
  - Abandons de panier

---

### 4. 🗄️ BASE DE DONNÉES

#### 4.1 Backup automatique
- [ ] **Configurer les backups** Supabase (quotidien recommandé)
- [ ] **Tester la restauration** d'un backup
- [ ] **Documenter la procédure** de restauration

#### 4.2 Indexes de performance
- [ ] **Vérifier les indexes** sur :
  - `orders.created_at`
  - `orders.user_id`
  - `orders.status`
  - `transactions.payment_intent_id`
  - `transactions.created_at`
- [ ] **Analyser les requêtes lentes** avec `EXPLAIN ANALYZE`

#### 4.3 Migration en production
- [ ] **Exécuter toutes les migrations** en production
- [ ] **Vérifier l'ordre** des migrations
- [ ] **Rollback plan** en cas de problème

---

### 5. 🚀 DÉPLOIEMENT

#### 5.1 Build de production
- [ ] **Optimiser le build** : `npm run build`
- [ ] **Vérifier la taille** du bundle (objectif < 500KB gzippé)
- [ ] **Code splitting** pour les routes
- [ ] **Tree shaking** activé

#### 5.2 Service Worker / PWA
- [ ] **Vérifier `manifest.json`** :
  - Nom, icônes, thème
  - Mode offline
- [ ] **Service Worker** pour le cache
- [ ] **Test d'installation** PWA sur mobile

#### 5.3 Domaine & SSL
- [ ] **Configurer le domaine** personnalisé
- [ ] **Certificat SSL** (HTTPS obligatoire)
- [ ] **Redirect HTTP → HTTPS**

#### 5.4 Variables d'environnement en production
- [ ] **Configurer dans la plateforme** de déploiement (Vercel, Netlify, etc.)
- [ ] **Ne jamais commiter** `.env` dans Git
- [ ] **Documenter** toutes les variables nécessaires

---

### 6. 🧪 TESTS

#### 6.1 Tests unitaires
- [ ] **Couverture > 70%** pour les fonctions critiques
- [ ] **Tests des hooks** (usePayments, useOrders, etc.)
- [ ] **Tests des utilitaires** (receiptCalculator, etc.)

#### 6.2 Tests d'intégration
- [ ] **Tests des Edge Functions**
- [ ] **Tests des flux** de paiement
- [ ] **Tests des notifications** en temps réel

#### 6.3 Tests E2E
- [ ] **Scénarios critiques** :
  - Création de compte
  - Passage de commande
  - Paiement
  - Suivi de livraison

---

### 7. 📱 OPTIMISATIONS PERFORMANCE

#### 7.1 Images
- [ ] **Optimisation automatique** des images (WebP, compression)
- [ ] **Lazy loading** pour les images
- [ ] **CDN** pour les assets statiques

#### 7.2 Requêtes
- [ ] **Pagination** sur les listes (commandes, produits)
- [ ] **Cache** des requêtes fréquentes
- [ ] **Debounce** sur les recherches

#### 7.3 Bundle size
- [ ] **Analyser le bundle** avec `npm run build -- --analyze`
- [ ] **Éliminer les dépendances** inutiles
- [ ] **Dynamic imports** pour les composants lourds

---

### 8. 📋 DOCUMENTATION

#### 8.1 README.md
- [ ] **Instructions d'installation** complètes
- [ ] **Variables d'environnement** documentées
- [ ] **Guide de déploiement**
- [ ] **Structure du projet**

#### 8.2 API Documentation
- [ ] **Documenter toutes les Edge Functions**
- [ ] **Exemples de requêtes/réponses**
- [ ] **Codes d'erreur** possibles

#### 8.3 Runbook
- [ ] **Procédures d'urgence** :
  - Paiement échoué
  - Panne de base de données
  - Incident de sécurité
- [ ] **Contacts** d'urgence
- [ ] **Procédure de rollback**

---

### 9. 🔔 NOTIFICATIONS

#### 9.1 Email
- [ ] **Configurer un service d'email** (SendGrid, Resend, etc.)
- [ ] **Templates d'email** :
  - Confirmation de commande
  - Suivi de livraison
  - Récupération de mot de passe
- [ ] **Tests d'envoi** d'emails

#### 9.2 Notifications push
- [ ] **Service Worker** pour les notifications push
- [ ] **Permissions** utilisateur
- [ ] **Templates** de notifications

---

### 10. ⚖️ CONFORMITÉ LÉGALE

#### 10.1 RGPD / Confidentialité
- [ ] **Politique de confidentialité** complète
- [ ] **Consentement** pour les cookies
- [ ] **Droit à l'oubli** (suppression de compte)
- [ ] **Export des données** utilisateur

#### 10.2 Conditions générales
- [ ] **CGU** complètes
- [ ] **CGV** pour les marchands
- [ ] **Politique de remboursement**

#### 10.3 Paiements
- [ ] **Conformité PCI-DSS** (gérée par Stripe)
- [ ] **Mentions légales** sur les pages de paiement

---

### 11. 🧹 NETTOYAGE CODE

#### 11.1 Code mort
- [ ] **Supprimer les `console.log`** de debug
- [ ] **Supprimer les commentaires** de développement
- [ ] **Nettoyer les imports** inutilisés

#### 11.2 Configuration
- [ ] **Supprimer les fallbacks** hardcodés
- [ ] **Vérifier les `TODO`** et `FIXME`
- [ ] **Code de production uniquement**

---

### 12. 🔄 CONTINUOUS INTEGRATION

#### 12.1 CI/CD
- [ ] **GitHub Actions** ou équivalent
- [ ] **Tests automatiques** avant déploiement
- [ ] **Linting** automatique
- [ ] **Build automatique** sur push

---

## 📝 FICHIERS À CRÉER

1. **`.env.production.example`** - Template des variables d'environnement
2. **`DEPLOYMENT.md`** - Guide de déploiement détaillé
3. **`supabase/functions/stripe-webhook/index.ts`** - Handler webhook Stripe
4. **`docs/API.md`** - Documentation API
5. **`docs/RUNBOOK.md`** - Procédures d'urgence

---

## ✅ CHECKLIST FINALE

- [ ] Tous les tests passent
- [ ] Build de production fonctionne
- [ ] Variables d'environnement configurées
- [ ] Webhooks Stripe configurés et testés
- [ ] CORS restreint
- [ ] Monitoring en place
- [ ] Documentation complète
- [ ] Backup configuré
- [ ] SSL/HTTPS actif
- [ ] Tests E2E passent
- [ ] Performance optimisée
- [ ] Conformité légale vérifiée

---

## 🎯 PRIORITÉS

### 🔴 URGENT (Bloquant)
1. Webhooks Stripe
2. Variables d'environnement
3. CORS sécurisé
4. Validation serveur

### 🟡 IMPORTANT (Avant lancement)
5. Monitoring
6. Tests critiques
7. Backup
8. Documentation

### 🟢 SOUHAITABLE (Post-lancement)
9. Analytics avancés
10. Optimisations performance
11. Tests E2E complets
12. CI/CD

---

**Date de création** : 2025-01-03  
**Dernière mise à jour** : 2025-01-03

