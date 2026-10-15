-- ============================================================================
-- OBJECTIF COMMUNAUTAIRE + SOIREES THEMATIQUES + DEMANDES D'INSCRIPTION
-- ----------------------------------------------------------------------------
-- Remplace le blob community_config (absent de ce projet) et le compteur
-- d'inscrits qui vivait dans le navigateur.
--
-- Workflow d'inscription :
--   1. le joueur clique sur "Confirmer ma presence"
--   2. une fenetre affiche les conditions + les frais d'inscription
--   3. s'il accepte, une DEMANDE (status = 'pending') est creee
--   4. l'admin voit la demande dans la gestion de la soiree, avec le montant
--      et le numero de paiement si le reglement se fait a distance
--   5. l'admin valide -> status = 'confirmed' + notification au joueur
--      (ou 'rejected' + notification de refus)
--
-- A APPLIQUER MANUELLEMENT dans le dashboard Supabase (SQL Editor) :
-- l'agent n'a pas acces aux DDL sur ce projet.
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

-- ============================================================================
-- 1. Objectif communautaire (ligne unique 'current')
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_goal (
  id text PRIMARY KEY DEFAULT 'current',
  label text NOT NULL DEFAULT 'Objectif Communautaire',
  title text NOT NULL DEFAULT '',
  current_hours numeric NOT NULL DEFAULT 0 CHECK (current_hours >= 0),
  target_hours numeric NOT NULL DEFAULT 1000 CHECK (target_hours > 0),
  reward_text text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users_metadata(user_id) ON DELETE SET NULL,
  CHECK (id = 'current')
);

ALTER TABLE public.community_goal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_goal_read" ON public.community_goal;
CREATE POLICY "community_goal_read"
  ON public.community_goal FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "community_goal_admin_write" ON public.community_goal;
CREATE POLICY "community_goal_admin_write"
  ON public.community_goal FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- 2. Soirees thematiques
--    Les frais d'inscription et le paiement a distance sont geres ici, pas
--    dans le texte libre de la description.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  category text NOT NULL DEFAULT 'Fight Night',
  game text NOT NULL DEFAULT '',
  date_str text NOT NULL DEFAULT '',
  time_str text NOT NULL DEFAULT '',
  image_url text,
  description text NOT NULL DEFAULT '',
  reward_text text NOT NULL DEFAULT '',

  -- Inscription
  conditions text NOT NULL DEFAULT '',
  entry_fee numeric NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  remote_payment_allowed boolean NOT NULL DEFAULT false,
  max_slots integer CHECK (max_slots IS NULL OR max_slots > 0),

  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users_metadata(user_id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_events_active_idx
  ON public.community_events (is_active, created_at DESC);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Lecture publique des soirees actives, lecture complete pour l'admin.
DROP POLICY IF EXISTS "community_events_read" ON public.community_events;
CREATE POLICY "community_events_read"
  ON public.community_events FOR SELECT
  TO anon, authenticated
  USING (is_active OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "community_events_admin_write" ON public.community_events;
CREATE POLICY "community_events_admin_write"
  ON public.community_events FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Mise a jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_events_touch ON public.community_events;
CREATE TRIGGER community_events_touch
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- 3. Demandes d'inscription
--    UNIQUE (event_id, user_id) : un joueur ne peut pas envoyer deux
--    demandes pour la meme soiree, le second envoi met a jour la premiere.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users_metadata(user_id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected')),
  conditions_accepted_at timestamptz NOT NULL DEFAULT now(),

  -- Reglement
  payment_method text NOT NULL DEFAULT 'onsite'
    CHECK (payment_method IN ('onsite', 'remote')),
  payment_amount numeric NOT NULL DEFAULT 0 CHECK (payment_amount >= 0),
  payment_reference text,
  payment_note text,

  -- Suivi admin
  reviewed_by uuid REFERENCES public.users_metadata(user_id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_note text,

  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_registrations_event_idx
  ON public.event_registrations (event_id, status);
CREATE INDEX IF NOT EXISTS event_registrations_user_idx
  ON public.event_registrations (user_id);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Le joueur voit ses propres demandes, l'admin voit tout.
DROP POLICY IF EXISTS "event_registrations_read" ON public.event_registrations;
CREATE POLICY "event_registrations_read"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Un joueur cree sa propre demande, en 'pending' uniquement : impossible de
-- s'auto-valider en écrivant directement status = 'confirmed'.
DROP POLICY IF EXISTS "event_registrations_insert" ON public.event_registrations;
CREATE POLICY "event_registrations_insert"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND conditions_accepted_at IS NOT NULL
  );

-- Le joueur peut corriger son reglement tant que l'admin n'a pas tranche,
-- mais il ne peut pas changer le status ni s'attribuer un validateur.
DROP POLICY IF EXISTS "event_registrations_update" ON public.event_registrations;
CREATE POLICY "event_registrations_update"
  ON public.event_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
  );

-- L'admin supprime si besoin ; le joueur retire sa propre demande en attente.
DROP POLICY IF EXISTS "event_registrations_delete" ON public.event_registrations;
CREATE POLICY "event_registrations_delete"
  ON public.event_registrations FOR DELETE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (auth.uid() = user_id AND status = 'pending')
  );

-- ============================================================================
-- 4. Compteur d'inscrits confirmees
--    Evite de compter en base a chaque affichage de carte.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.event_confirmed_count(target_event uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.event_registrations r
  WHERE r.event_id = target_event
    AND r.status = 'confirmed';
$$;

GRANT EXECUTE ON FUNCTION public.event_confirmed_count(uuid) TO anon, authenticated, service_role;

-- ============================================================================
-- 5. Nettoyage des soirees fictives de demonstration
--    (Vendredi Fight Night, Champions League Brazza, Dimanche Chill...)
--    Elles vivaient en dur dans le front et sont remplacees par la base.
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.community_config') IS NOT NULL THEN
    EXECUTE $sql$DELETE FROM public.community_config WHERE key IN ('community_events', 'monthly_hours_target')$sql$;
    RAISE NOTICE 'community_config : soirees et objectif fictifs purges.';
  ELSE
    RAISE NOTICE 'community_config absent : rien a purger de ce cote.';
  END IF;
END;
$$;
