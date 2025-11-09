-- Migration: Fix infinite recursion in RLS policies for orders and deliveries
-- Version corrigée avec fonction SECURITY DEFINER pour éviter la récursion infinie

-- ✅ ÉTAPE 1: Créer une fonction pour vérifier les permissions sans récursion
CREATE OR REPLACE FUNCTION public.check_driver_order_access(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier le rôle de l'utilisateur
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE user_id = v_user_id;

  -- Si c'est un livreur, vérifier via driver_assignments OU deliveries
  IF v_user_role IN ('livreur', 'driver', 'Driver', 'Livreur') THEN
    -- Vérifier via driver_assignments (sans récursion RLS car on utilise SECURITY DEFINER)
    RETURN EXISTS (
      SELECT 1 FROM public.driver_assignments
      WHERE (
        driver_assignments.assigned_driver_id = v_user_id
        OR v_user_id = ANY(driver_assignments.available_drivers)
      )
      AND p_order_id = ANY(driver_assignments.order_ids)
    )
    OR EXISTS (
      -- Vérifier directement via deliveries (sans récursion car fonction SECURITY DEFINER)
      SELECT 1 FROM public.deliveries
      WHERE deliveries.order_id = p_order_id
      AND deliveries.driver_id = v_user_id
    );
  END IF;

  -- Si c'est un utilisateur normal, vérifier si c'est sa commande
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = p_order_id
    AND orders.user_id = v_user_id
  );
END;
$$;

-- ✅ ÉTAPE 2: Supprimer les politiques problématiques qui causent la récursion
DROP POLICY IF EXISTS "Drivers can view assigned deliveries orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can view orders via assignments" ON public.orders;

-- ✅ ÉTAPE 3: Créer une nouvelle politique utilisant la fonction SECURITY DEFINER
CREATE POLICY "Drivers can view assigned deliveries orders" ON public.orders
  FOR SELECT USING (
    -- Utiliser la fonction SECURITY DEFINER pour éviter la récursion
    public.check_driver_order_access(orders.id)
    OR
    -- Fallback pour les utilisateurs normaux (leur propre commande)
    orders.user_id = auth.uid()
  );

-- ✅ ÉTAPE 4: Corriger la politique deliveries pour éviter la récursion
DROP POLICY IF EXISTS "Users can view their order deliveries" ON public.deliveries;

-- Nouvelle politique qui évite la récursion
CREATE POLICY "Users can view their order deliveries" ON public.deliveries
  FOR SELECT USING (
    -- Pour les livreurs : vérifier directement driver_id (pas de récursion)
    deliveries.driver_id = auth.uid()
    OR
    -- Pour les utilisateurs : utiliser la fonction SECURITY DEFINER
    public.check_driver_order_access(deliveries.order_id)
  );

-- ✅ ÉTAPE 5: S'assurer que la fonction est accessible
GRANT EXECUTE ON FUNCTION public.check_driver_order_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_driver_order_access(uuid) TO anon;
