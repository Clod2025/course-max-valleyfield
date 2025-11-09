# Instructions pour exécuter la migration SQL

## Méthode 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. **Accéder au Dashboard Supabase**
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Connectez-vous à votre compte
   - Sélectionnez votre projet : `vexgjrrqbjurgiqfjxwk`

2. **Ouvrir le SQL Editor**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"** pour créer une nouvelle requête

3. **Copier et exécuter la migration**
   - Ouvrez le fichier : `supabase/migrations/20250103000000_add_payment_system.sql`
   - Copiez tout le contenu du fichier
   - Collez-le dans le SQL Editor
   - Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Vérifier le succès**
   - Vous devriez voir un message "Success. No rows returned"
   - Vérifiez que les colonnes ont été ajoutées en allant dans **"Table Editor"** → **"orders"**

---

## Méthode 2 : Via Supabase CLI (si installé)

### Prérequis
- Installer Supabase CLI : https://supabase.com/docs/guides/cli

### Étapes

1. **Vérifier que Supabase CLI est installé**
   ```bash
   supabase --version
   ```

2. **Se connecter à Supabase**
   ```bash
   supabase login
   ```

3. **Lier le projet**
   ```bash
   supabase link --project-ref vexgjrrqbjurgiqfjxwk
   ```

4. **Exécuter la migration**
   ```bash
   supabase db push
   ```
   
   OU pour une migration spécifique :
   ```bash
   supabase migration up
   ```

---

## Méthode 3 : Via psql (PostgreSQL direct)

Si vous avez accès direct à la base de données :

1. **Récupérer la connection string**
   - Dans Supabase Dashboard → Settings → Database
   - Copiez la "Connection string" (URI)

2. **Exécuter avec psql**
   ```bash
   psql "votre-connection-string" -f supabase/migrations/20250103000000_add_payment_system.sql
   ```

---

## Vérification après migration

Après avoir exécuté la migration, vérifiez que :

1. **La table `transactions` existe**
   ```sql
   SELECT * FROM public.transactions LIMIT 1;
   ```

2. **Les colonnes ont été ajoutées à `orders`**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'orders' 
   AND column_name IN ('payment', 'breakdown', 'tip', 'driver_id');
   ```

3. **Le statut 'paid' existe dans order_status**
   ```sql
   SELECT unnest(enum_range(NULL::order_status));
   ```

---

## En cas d'erreur

Si vous rencontrez des erreurs :

1. **"relation already exists"** : La table existe déjà, c'est normal avec `IF NOT EXISTS`
2. **"column already exists"** : Les colonnes existent déjà, la migration est partiellement appliquée
3. **"permission denied"** : Vérifiez que vous utilisez le bon compte avec les permissions admin

Pour réinitialiser (ATTENTION: supprime les données) :
```sql
DROP TABLE IF EXISTS public.transactions CASCADE;
ALTER TABLE public.orders 
  DROP COLUMN IF EXISTS payment,
  DROP COLUMN IF EXISTS breakdown,
  DROP COLUMN IF EXISTS tip,
  DROP COLUMN IF EXISTS driver_id;
```

Puis réexécutez la migration.

