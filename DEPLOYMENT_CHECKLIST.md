# 📋 Checklist de Déploiement CourseMax

## ✅ Checklist Avant Déploiement Production

### 🔴 CRITIQUE (Doit être fait AVANT déploiement)

- [x] **Boucle infinie corrigée** dans `GlobalErrorHandler.tsx`
  - ✅ Utilisation de `useRef` pour stabiliser `toast`
  - ✅ `useCallback` sans dépendances instables

- [ ] **Migrations SQL appliquées** dans Supabase
  - [ ] `20250202000000_fix_merchant_tables_final.sql` (promotions, merchant_employees, etc.)
  - [ ] `20250202000001_fix_stores_and_profile_links.sql` (owner_id, store_id)
  - 📍 **Action requise**: Exécuter ces migrations manuellement dans Supabase Studio

- [x] **Credentials externalisées** vers variables d'environnement
  - ✅ `src/integrations/supabase/client.ts` utilise `import.meta.env`
  - ⚠️ **Action requise**: Créer `.env` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

### 🟡 IMPORTANT

- [x] **TOAST_REMOVE_DELAY réduit** de 1M ms à 5s
  - ✅ `src/hooks/use-toast.ts` corrigé

- [x] **Logger utilitaire créé** pour console.log conditionnel
  - ✅ `src/utils/logger.ts` créé
  - ⚠️ **Action requise**: Remplacer `console.log` par `logger.log` dans les fichiers critiques
  - 📍 Fichiers à mettre à jour: `useAuth.tsx`, `useOrders.tsx`, `useCart.tsx`, etc.

### 🟢 RECOMMANDÉ

- [x] **Fichier `.env.example` créé** pour documentation
  - ✅ Template disponible pour équipe

- [ ] **Console.log remplacés** par `logger.*` dans tous les hooks
  - 📍 ~81 occurrences à migrer progressivement

- [ ] **Tests de régression**
  - [ ] Tester authentification marchand/employé/client
  - [ ] Tester gestion commandes
  - [ ] Tester paiements
  - [ ] Tester promotions

- [ ] **Build de production testé**
  - [ ] `npm run build` réussit
  - [ ] Aucun warning/erreur critique
  - [ ] Bundle size optimisé

---

## 🚀 Étapes de Déploiement

### 1. Préparation Environnement

```bash
# Créer fichier .env avec les vraies valeurs
cp .env.example .env
# Éditer .env avec vos credentials Supabase
```

### 2. Appliquer Migrations SQL

```bash
# Option A: Via Supabase CLI
npx supabase migration up

# Option B: Via Supabase Studio (recommandé)
# 1. Aller sur https://supabase.com/dashboard
# 2. Ouvrir votre projet
# 3. Aller dans SQL Editor
# 4. Copier/coller chaque migration et exécuter
```

### 3. Build Production

```bash
npm run build
# Vérifier que dist/ est créé sans erreurs
```

### 4. Déploiement

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Autre**: Suivre procédure standard de votre plateforme

---

## 🧪 Tests Post-Déploiement

1. ✅ Page d'accueil charge
2. ✅ Authentification fonctionne (marchand/employé/client)
3. ✅ Dashboard marchand accessible
4. ✅ Gestion employés fonctionne
5. ✅ Gestion promotions fonctionne
6. ✅ Commandes s'affichent en temps réel
7. ✅ Aucune boucle infinie détectée
8. ✅ Console du navigateur propre (pas de logs en prod)

---

## 📝 Notes Importantes

- **Boucle infinie**: Corrigée avec `useRef` dans `GlobalErrorHandler.tsx`
- **Toast delay**: Réduit de 16 min à 5 secondes
- **Logger**: Nouveau système pour logs conditionnels
- **Migrations**: DOIVENT être appliquées avant déploiement

---

## 🆘 En cas de problème

1. Vérifier les logs Supabase pour erreurs SQL
2. Vérifier console du navigateur pour erreurs JS
3. Vérifier `.env` a les bonnes variables
4. Vérifier RLS (Row Level Security) activé sur tables sensibles

---

**Dernière mise à jour**: 2025-02-02  
**Version**: 1.0.0

