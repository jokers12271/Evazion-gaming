-- ============================================================================
-- Paris 1v1 entre utilisateurs sur les matchs de tournoi (MANI tokens).
-- Flux : open (en attente) -> matched (accepte par un seul adversaire) ->
--        settled (regle, transfert au gagnant) | cancelled (annule/nul).
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

CREATE TABLE IF NOT EXISTS public.tournament_bets (
  id text PRIMARY KEY DEFAULT ('bet_' || extract(epoch from now())::text),
  match_id text NOT NULL,
  match_label text NOT NULL DEFAULT '',

  -- Createur du pari
  challenger_id uuid NOT NULL,
  challenger_name text NOT NULL DEFAULT '',
  challenger_pick text NOT NULL DEFAULT '',

  -- Adversaire (le plus rapide a accepter)
  acceptor_id uuid,
  acceptor_name text,
  acceptor_pick text,

  stake integer NOT NULL CHECK (stake > 0),
  status text NOT NULL DEFAULT 'open',
  winner_side text,

  created_at timestamptz DEFAULT now(),
  matched_at timestamptz,
  settled_at timestamptz
);

CREATE INDEX IF NOT EXISTS tournament_bets_match_idx ON public.tournament_bets (match_id);
CREATE INDEX IF NOT EXISTS tournament_bets_status_idx ON public.tournament_bets (status);

ALTER TABLE public.tournament_bets ENABLE ROW LEVEL SECURITY;

-- Lecture publique (paris ouverts visibles par tous)
DROP POLICY IF EXISTS "tbets_select_all" ON public.tournament_bets;
CREATE POLICY "tbets_select_all"
  ON public.tournament_bets FOR SELECT
  USING (true);

-- Creation reservee aux utilisateurs authentifies (createur = soi-meme)
DROP POLICY IF EXISTS "tbets_insert_own" ON public.tournament_bets;
CREATE POLICY "tbets_insert_own"
  ON public.tournament_bets FOR INSERT
  TO authenticated
  WITH CHECK (challenger_id = auth.uid());

-- Mise a jour : participant (acceptation / annulation) ou admin
DROP POLICY IF EXISTS "tbets_update_participant" ON public.tournament_bets;
CREATE POLICY "tbets_update_participant"
  ON public.tournament_bets FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR challenger_id = auth.uid()
    OR acceptor_id = auth.uid()
    OR status = 'open'
  )
  WITH CHECK (true);

-- Suppression reservee a l'admin
DROP POLICY IF EXISTS "tbets_delete_admin" ON public.tournament_bets;
CREATE POLICY "tbets_delete_admin"
  ON public.tournament_bets FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
