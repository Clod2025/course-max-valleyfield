-- Tables pour le support chat
CREATE TABLE IF NOT EXISTS public.support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.support_sessions(id),
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'support')),
  created_at timestamptz DEFAULT now()
);

-- RPC pour créer une session de support
CREATE OR REPLACE FUNCTION public.create_support_chat(
  p_user_id uuid,
  p_initial_message text
)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
BEGIN
  INSERT INTO public.support_sessions (user_id)
  VALUES (p_user_id)
  RETURNING id INTO session_id;
  
  INSERT INTO public.support_messages (session_id, user_id, content, sender_type)
  VALUES (session_id, p_user_id, p_initial_message, 'user');
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;