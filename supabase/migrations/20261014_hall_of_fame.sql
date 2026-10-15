-- ============================================================================
-- HALL OF FAME
-- ----------------------------------------------------------------------------
-- Table alimentee uniquement par l'admin : il n'existe plus de gagnants
-- fictifs en dur dans le code. Chaque entree reference un vrai compte
-- via users_metadata(user_id).
--
-- A APPLIQUER MANUELLEMENT dans le dashboard Supabase (SQL Editor) :
-- l'agent n'a pas acces aux DDL sur ce projet.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hall_of_fame (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users_metadata(user_id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Joueur du mois',
  month_label text,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users_metadata(user_id) ON DELETE SET NULL
);

-- Un seul joueur par position de podium
CREATE UNIQUE INDEX IF NOT EXISTS hall_of_fame_position_idx
  ON public.hall_of_fame (position);

-- Un joueur ne peut apparaitre qu'une seule fois
CREATE UNIQUE INDEX IF NOT EXISTS hall_of_fame_user_idx
  ON public.hall_of_fame (user_id);

-- ---------------------------------------------------------------------------
-- RLS : lecture publique, ecriture admin uniquement
-- ---------------------------------------------------------------------------
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hall_of_fame_read" ON public.hall_of_fame;
CREATE POLICY "hall_of_fame_read"
  ON public.hall_of_fame FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hall_of_fame_admin_manage" ON public.hall_of_fame;
CREATE POLICY "hall_of_fame_admin_manage"
  ON public.hall_of_fame FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));