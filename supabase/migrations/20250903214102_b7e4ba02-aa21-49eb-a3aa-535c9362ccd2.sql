-- Corriger les problèmes de sécurité RLS
-- Activer RLS sur la table users (si elle existe et est utilisée)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Ajouter des politiques pour la table users
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);