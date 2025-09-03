-- Ajouter des politiques RLS pour la table roles
CREATE POLICY "Admin can view all roles" ON public.roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own role" ON public.roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );