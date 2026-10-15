-- ============================================================================
-- Tournois : places, cashprize, systeme, format et evenement phare.
-- Le hero "evenement phare" est desormais derive d'un tournoi marque is_spotlight
-- (plus de table spotlight_event separee).
-- ============================================================================

-- 1. Nouvelles colonnes sur les tournois -------------------------------------
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS max_places      integer NOT NULL DEFAULT 20 CHECK (max_places BETWEEN 2 AND 20),
  ADD COLUMN IF NOT EXISTS cashprize_fcfa  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS system          text    NOT NULL DEFAULT 'coupe'      CHECK (system IN ('coupe', 'championnat')),
  ADD COLUMN IF NOT EXISTS format          text    NOT NULL DEFAULT 'elimination' CHECK (format IN ('elimination', 'aller_retour')),
  ADD COLUMN IF NOT EXISTS is_spotlight    boolean NOT NULL DEFAULT false;

-- 2. Un seul evenement phare a la fois ---------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS tournaments_single_spotlight
  ON public.tournaments (is_spotlight)
  WHERE is_spotlight = true;

-- 3. RLS tournois : lecture publique / ecriture admin ------------------------
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournaments_select_public" ON public.tournaments;
CREATE POLICY "tournaments_select_public"
  ON public.tournaments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tournaments_admin_all" ON public.tournaments;
CREATE POLICY "tournaments_admin_all"
  ON public.tournaments FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. Dotations : chaque tournoi a son propre podium --------------------------
DO $$
BEGIN
  IF to_regclass('public.tournament_prizes') IS NULL THEN
    -- La table n'existe pas encore (migration 20261009 non passee)
    RETURN;
  END IF;

  ALTER TABLE public.tournament_prizes
    ADD COLUMN IF NOT EXISTS tournament_id text;

  -- Anciennes lignes globales (sans tournoi) : supprimees
  DELETE FROM public.tournament_prizes WHERE tournament_id IS NULL;

  -- Remplace la cle primaire (place) par (tournament_id, place)
  ALTER TABLE public.tournament_prizes DROP CONSTRAINT IF EXISTS tournament_prizes_pkey;
  ALTER TABLE public.tournament_prizes ALTER COLUMN tournament_id SET NOT NULL;
  ALTER TABLE public.tournament_prizes ADD PRIMARY KEY (tournament_id, place);
END
$$;
