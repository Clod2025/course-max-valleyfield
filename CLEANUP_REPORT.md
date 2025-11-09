# Cleanup Report

## Mock Data / Placeholder Fallbacks
- `src/components/admin/FinanceManager.tsx` (L162-L241) — mock payment methods, commission transfers, and driver payment entries returned lorsque les tables Supabase sont manquantes.
- `src/components/TrackingExample.tsx` (L117-L123) — mock tracking results array and metrics encore présents.

## Demo Data / `demo-` Identifiers
- *(Tous les composants marchands principaux ont été nettoyés.)*

## `isDemoMode` Flags
- *(Supprimés des composants marchands ciblés.)*

## Authentication Listeners / Legacy Logic
- `src/hooks/useAuth.tsx` (L435-L528) — direct `supabase.auth.onAuthStateChange` with complex redirects/cache logic.
- `src/hooks/useAuth.js` (L36-L54) — standalone `supabase.auth.onAuthStateChange` listener duplicating session handling.

## Local Storage (auth/supabase)
- Aucun accès direct détecté vers `localStorage` avec clés contenant `auth` ou `supabase` (en dehors des SDK Supabase).

## Demo Components to Remove
- *(Supprimé.)*

