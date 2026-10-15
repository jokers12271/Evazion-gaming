-- ============================================================================
-- Evenement Phare (Spotlight) : brouillon tant que l'admin n'a pas valide.
-- Visible par le public uniquement si is_active = true.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT um.is_admin FROM public.users_metadata um WHERE um.user_id = $1),
    false
  );
$$;

CREATE TABLE IF NOT EXISTS public.spotlight_event (
  id text PRIMARY KEY DEFAULT 'main',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cashprize text NOT NULL DEFAULT '',
  mani text NOT NULL DEFAULT '',
  slots text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.spotlight_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spotlight_select_public" ON public.spotlight_event;
CREATE POLICY "spotlight_select_public"
  ON public.spotlight_event FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "spotlight_select_admin" ON public.spotlight_event;
CREATE POLICY "spotlight_select_admin"
  ON public.spotlight_event FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "spotlight_admin_all" ON public.spotlight_event;
CREATE POLICY "spotlight_admin_all"
  ON public.spotlight_event FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
