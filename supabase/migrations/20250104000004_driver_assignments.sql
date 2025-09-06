-- Table pour gérer les assignations de livreurs
CREATE TABLE IF NOT EXISTS public.driver_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_ids uuid[] NOT NULL,
    available_drivers uuid[] NOT NULL,
    assigned_driver_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    total_orders INTEGER NOT NULL DEFAULT 1,
    total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_driver_assignments_store_id ON public.driver_assignments(store_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_status ON public.driver_assignments(status);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_expires_at ON public.driver_assignments(expires_at);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_assigned_driver ON public.driver_assignments(assigned_driver_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_driver_assignments_updated_at 
    BEFORE UPDATE ON public.driver_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins
CREATE POLICY "Admin can manage driver assignments" ON public.driver_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Politique pour les livreurs (peuvent voir leurs assignations)
CREATE POLICY "Drivers can view their assignments" ON public.driver_assignments
    FOR SELECT USING (
        assigned_driver_id = auth.uid() OR 
        auth.uid() = ANY(available_drivers)
    );

-- Politique pour les livreurs (peuvent accepter les assignations)
CREATE POLICY "Drivers can accept assignments" ON public.driver_assignments
    FOR UPDATE USING (
        auth.uid() = ANY(available_drivers) AND 
        status = 'pending' AND 
        expires_at > now()
    );

-- Fonction pour accepter une assignation
CREATE OR REPLACE FUNCTION accept_driver_assignment(
    p_assignment_id uuid,
    p_driver_id uuid
)
RETURNS boolean AS $$
DECLARE
    v_assignment RECORD;
BEGIN
    -- Récupérer l'assignation
    SELECT * INTO v_assignment
    FROM public.driver_assignments
    WHERE id = p_assignment_id 
    AND status = 'pending' 
    AND expires_at > now()
    AND p_driver_id = ANY(available_drivers);
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Mettre à jour l'assignation
    UPDATE public.driver_assignments
    SET 
        assigned_driver_id = p_driver_id,
        status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    WHERE id = p_assignment_id;
    
    -- Mettre à jour toutes les commandes du groupe
    UPDATE public.orders
    SET 
        status = 'preparing',
        updated_at = now()
    WHERE id = ANY(v_assignment.order_ids);
    
    -- Créer les entrées de livraison
    INSERT INTO public.deliveries (order_id, driver_id, status, estimated_delivery)
    SELECT 
        order_id,
        p_driver_id,
        'assigned',
        now() + interval '30 minutes'
    FROM unnest(v_assignment.order_ids) AS order_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les assignations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_assignments()
RETURNS void AS $$
BEGIN
    -- Marquer les assignations expirées comme expirées
    UPDATE public.driver_assignments
    SET 
        status = 'expired',
        updated_at = now()
    WHERE status = 'pending' 
    AND expires_at <= now();
    
    -- Remettre les commandes en attente
    UPDATE public.orders
    SET 
        status = 'confirmed',
        updated_at = now()
    WHERE id IN (
        SELECT unnest(order_ids)
        FROM public.driver_assignments
        WHERE status = 'expired'
    );
END;
$$ LANGUAGE plpgsql;
