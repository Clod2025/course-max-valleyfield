# Guide de correction du formulaire d'ajout de produit

## Problème résolu
Erreur: "could not find the function public.create_product_with_image(...)"

## Solutions implémentées

### 1. Migration Supabase
- **Fichier**: `supabase/migrations/20250115000011_fix_create_product_function.sql`
- **Fonction créée**: `create_product_with_image` avec les paramètres corrects
- **Structure de table**: Colonnes renommées pour correspondre (nom, categorie, prix, unite, etc.)
- **Permissions**: Rôle `authenticated` peut exécuter la fonction

### 2. Validation du formulaire
- **Validation en temps réel** des champs obligatoires
- **Messages d'erreur** clairs pour chaque champ
- **Indicateurs visuels** (bordures rouges) pour les erreurs
- **Empêche l'envoi** de formulaires invalides

### 3. Mapping des champs
- **Correspondance parfaite** entre frontend et backend
- **Paramètres corrects** passés à la fonction Supabase
- **Gestion des valeurs nulles** et par défaut

## Structure de la fonction

```sql
CREATE OR REPLACE FUNCTION public.create_product_with_image(
    p_nom TEXT,
    p_categorie TEXT,
    p_prix NUMERIC,
    p_stock INTEGER DEFAULT 0,
    p_unite TEXT DEFAULT 'unité',
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_merchant_id UUID DEFAULT NULL
)
RETURNS JSON
```

## Champs validés

1. **Nom du produit** (obligatoire, min 2 caractères)
2. **Catégorie** (obligatoire)
3. **Prix** (obligatoire, > 0)
4. **Stock** (optionnel, >= 0)
5. **Image** (obligatoire, sélectionnée)

## Utilisation

1. Saisir le nom du produit
2. Cliquer sur "Chercher Images"
3. Sélectionner une image
4. Remplir les autres champs
5. Cliquer sur "Ajouter le Produit"

## Mode démonstration
Si l'utilisateur n'est pas connecté, le formulaire fonctionne en mode démonstration avec des données locales.

## Sécurité
- Fonction avec `SECURITY DEFINER`
- Vérification de l'authentification
- Politiques RLS activées
- Permissions limitées au rôle `authenticated`
