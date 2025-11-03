-- Migration corrective pour créer les tables marchand manquantes
-- Date: 2025-02-02
-- Remplace/complète les migrations précédentes

-- 1. Table promotions (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_percent numeric(5,2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT promotions_time_check CHECK (end_at > start_at)
);

-- 2. Table merchant_employees (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.merchant_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  employee_code text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Table merchant_payment_methods (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.merchant_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('square', 'stripe', 'paypal', 'interac', 'cash')),
  provider_account_id text,
  credentials jsonb,
  is_enabled boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Table audit_log (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.merchant_employees(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Ajouter colonne fulfilled_by_employee à orders si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'fulfilled_by_employee'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN fulfilled_by_employee uuid REFERENCES public.merchant_employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_promotions_merchant_id ON public.promotions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_store_id ON public.promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_time_range ON public.promotions(start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_merchant_employees_merchant_id ON public.merchant_employees(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_employees_store_id ON public.merchant_employees(store_id);
CREATE INDEX IF NOT EXISTS idx_merchant_employees_employee_code ON public.merchant_employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_merchant_employees_is_active ON public.merchant_employees(is_active);

CREATE INDEX IF NOT EXISTS idx_merchant_payment_methods_merchant_id ON public.merchant_payment_methods(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payment_methods_store_id ON public.merchant_payment_methods(store_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payment_methods_type ON public.merchant_payment_methods(type);

CREATE INDEX IF NOT EXISTS idx_audit_log_merchant_id ON public.audit_log(merchant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_employee_id ON public.audit_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);

CREATE INDEX IF NOT EXISTS idx_orders_fulfilled_by ON public.orders(fulfilled_by_employee);

-- RLS (Row Level Security)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour promotions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'promotions' 
    AND policyname = 'Merchants can manage their promotions'
  ) THEN
    CREATE POLICY "Merchants can manage their promotions"
      ON public.promotions
      FOR ALL
      USING (merchant_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'promotions' 
    AND policyname = 'Customers can view active promotions'
  ) THEN
    CREATE POLICY "Customers can view active promotions"
      ON public.promotions
      FOR SELECT
      USING (is_active = true AND end_at > now());
  END IF;
END $$;

-- Politiques RLS pour merchant_employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_employees' 
    AND policyname = 'Merchants can manage their employees'
  ) THEN
    CREATE POLICY "Merchants can manage their employees"
      ON public.merchant_employees
      FOR ALL
      USING (merchant_id = auth.uid());
  END IF;
END $$;

-- Politiques RLS pour merchant_payment_methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_payment_methods' 
    AND policyname = 'Merchants can manage their payment methods'
  ) THEN
    CREATE POLICY "Merchants can manage their payment methods"
      ON public.merchant_payment_methods
      FOR ALL
      USING (merchant_id = auth.uid());
  END IF;
END $$;

-- Politiques RLS pour audit_log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'audit_log' 
    AND policyname = 'Merchants can view their audit logs'
  ) THEN
    CREATE POLICY "Merchants can view their audit logs"
      ON public.audit_log
      FOR SELECT
      USING (merchant_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'audit_log' 
    AND policyname = 'System can insert audit logs'
  ) THEN
    CREATE POLICY "System can insert audit logs"
      ON public.audit_log
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Fonction pour générer un code d'employé unique
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'EMP-' || UPPER(substring(md5(random()::text) from 1 for 6));
    
    SELECT EXISTS(SELECT 1 FROM public.merchant_employees WHERE employee_code = new_code)
    INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour logger les actions critiques
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_merchant_id uuid;
  v_store_id uuid;
BEGIN
  v_merchant_id := auth.uid();
  
  IF p_table_name = 'products' THEN
    SELECT store_id INTO v_store_id FROM public.products WHERE id = p_record_id;
  ELSIF p_table_name = 'orders' THEN
    SELECT store_id INTO v_store_id FROM public.orders WHERE id = p_record_id;
  ELSIF p_table_name = 'promotions' THEN
    SELECT store_id INTO v_store_id FROM public.promotions WHERE id = p_record_id;
  END IF;
  
  INSERT INTO public.audit_log (
    merchant_id,
    employee_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    v_merchant_id,
    p_employee_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    NULL,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at (ne créer que s'ils n'existent pas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_promotions_updated_at'
  ) THEN
    CREATE TRIGGER update_promotions_updated_at
      BEFORE UPDATE ON public.promotions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_merchant_employees_updated_at'
  ) THEN
    CREATE TRIGGER update_merchant_employees_updated_at
      BEFORE UPDATE ON public.merchant_employees
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_merchant_payment_methods_updated_at'
  ) THEN
    CREATE TRIGGER update_merchant_payment_methods_updated_at
      BEFORE UPDATE ON public.merchant_payment_methods
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.generate_employee_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_action(text, text, uuid, jsonb, jsonb, uuid) TO authenticated;

-- Commentaires
COMMENT ON TABLE public.promotions IS 'Promotions et offres spéciales des marchands';
COMMENT ON TABLE public.merchant_employees IS 'Employés des marchands (commis, managers)';
COMMENT ON TABLE public.merchant_payment_methods IS 'Méthodes de paiement configurées par les marchands';
COMMENT ON TABLE public.audit_log IS 'Journal d''audit pour toutes les actions critiques';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration corrective système marchand terminée avec succès!';
  RAISE NOTICE '📊 Tables créées/vérifiées: promotions, merchant_employees, merchant_payment_methods, audit_log';
  RAISE NOTICE '🔑 Colonne vérifiée: orders.fulfilled_by_employee';
  RAISE NOTICE '⚡ Index créés pour optimiser les performances';
  RAISE NOTICE '🔒 RLS activé avec politiques de sécurité';
  RAISE NOTICE '🔧 Fonctions créées: generate_employee_code, log_audit_action';
END $$;

