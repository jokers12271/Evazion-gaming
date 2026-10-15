-- ============================================================================
-- Arbre de tournoi interactif : configuration + matchs, visibles par tous
-- ============================================================================

-- 1. Configuration de l'arbre -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_bracket_config (
  id text PRIMARY KEY DEFAULT 'main',
  teams text[] NOT NULL DEFAULT '{}',
  team_count integer NOT NULL DEFAULT 8,
  format text NOT NULL DEFAULT 'single',
  system text NOT NULL DEFAULT 'cup',
  is_generated boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tournament_bracket_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tb_config_select_all" ON public.tournament_bracket_config;
CREATE POLICY "tb_config_select_all"
  ON public.tournament_bracket_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tb_config_admin_all" ON public.tournament_bracket_config;
CREATE POLICY "tb_config_admin_all"
  ON public.tournament_bracket_config FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. Matchs de l'arbre --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id text PRIMARY KEY,
  bracket_id text NOT NULL DEFAULT 'main',
  round integer NOT NULL DEFAULT 1,
  position integer NOT NULL DEFAULT 0,
  player1 text NOT NULL DEFAULT '',
  player2 text NOT NULL DEFAULT '',
  score1 integer,
  score2 integer,
  winner text,
  status text NOT NULL DEFAULT 'pending',
  match_date timestamptz,
  leg integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tournament_matches_bracket_idx ON public.tournament_matches (bracket_id, round, position);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tb_matches_select_all" ON public.tournament_matches;
CREATE POLICY "tb_matches_select_all"
  ON public.tournament_matches FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tb_matches_admin_all" ON public.tournament_matches;
CREATE POLICY "tb_matches_admin_all"
  ON public.tournament_matches FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. Ligne de configuration par defaut ---------------------------------------
INSERT INTO public.tournament_bracket_config (id, teams, team_count, format, system, is_generated)
VALUES ('main', ARRAY[]::text[], 8, 'single', 'cup', false)
ON CONFLICT (id) DO NOTHING;
