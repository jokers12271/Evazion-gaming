-- ============================================================================
-- Tournois : arbre (bracket), pronostics spectateurs et fiche de l'event
-- ----------------------------------------------------------------------------
-- Les donnees de tournoi vivaient dans le localStorage du navigateur
-- (tournamentData.ts) : l'arbre edite par l'admin et les pronostics des joueurs
-- n'etaient pas partages entre les machines. On les centralise ici.
--
-- Modele retenu (1 seule table, coherent avec les autres stores) :
--   * tournament_config : une ligne par cle, `value` en jsonb
--     (main_event, bracket_matches, predictions).
--   - Lecture : tout le monde.
--   - Ecriture : l'admin pilote l'arbre et la fiche ; les membres peuvent
--     poser leurs pronostics (cle predictions).
-- ============================================================================

-- 0. Trigger updated_at (recree au cas ou une migration precedente n'a pas tourne)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Table de configuration tournoi -----------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournament_config_select_all" ON public.tournament_config;
CREATE POLICY "tournament_config_select_all"
  ON public.tournament_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tournament_config_admin_all" ON public.tournament_config;
CREATE POLICY "tournament_config_admin_all"
  ON public.tournament_config FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Les membres peuvent poser / modifier leurs pronostics
DROP POLICY IF EXISTS "tournament_config_member_insert" ON public.tournament_config;
CREATE POLICY "tournament_config_member_insert"
  ON public.tournament_config FOR INSERT
  TO authenticated
  WITH CHECK (key IN ('predictions'));

DROP POLICY IF EXISTS "tournament_config_member_update" ON public.tournament_config;
CREATE POLICY "tournament_config_member_update"
  ON public.tournament_config FOR UPDATE
  TO authenticated
  USING (key IN ('predictions'))
  WITH CHECK (key IN ('predictions'));

-- 2. Trigger updated_at ------------------------------------------------------
DROP TRIGGER IF EXISTS tournament_config_touch ON public.tournament_config;
CREATE TRIGGER tournament_config_touch
  BEFORE UPDATE ON public.tournament_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Seed (identique aux valeurs par defaut du front) ------------------------
INSERT INTO public.tournament_config (key, value) VALUES
  ('main_event', $json${
    "id":"t-main-fc26",
    "title":"BRAZZA CLASH MASTERS · EA SPORTS FC 26",
    "game":"EA SPORTS FC 26",
    "format":"1v1 Élimination Directe",
    "date":"Samedi 4 Octobre 2026",
    "time":"15h00 (Check-in 14h15)",
    "cashprize_fcfa":150000,
    "mani_pool":60,
    "fee_fcfa":5000,
    "status":"Inscriptions ouvertes",
    "current_participants":28,
    "max_participants":32,
    "banner_url":"https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200",
    "featured":true,
    "station_type":"PS5 Pro · Écrans 4K 144Hz"
  }$json$::jsonb),
  ('bracket_matches', $json$[
    {"id":"m-q1","round":"quarters","round_label":"Quart 1","player1":{"id":"p-1","name":"Kratos_CG","team":"IRON FIST CG","score":3},"player2":{"id":"p-2","name":"Ghost_Brazza","team":"SANCTUARY SHADOWS","score":1},"winner_id":"p-1","status":"finished","station_label":"PS5 #1","scheduled_time":"15h15"},
    {"id":"m-q2","round":"quarters","round_label":"Quart 2","player1":{"id":"p-3","name":"Apex_Sniper","team":"FC BRAZZA","score":4},"player2":{"id":"p-4","name":"Viper_06","team":"SANCTUARY SHADOWS","score":2},"winner_id":"p-3","status":"finished","station_label":"PS5 #2","scheduled_time":"15h30"},
    {"id":"m-q3","round":"quarters","round_label":"Quart 3","player1":{"id":"p-5","name":"Junior_King","team":"FC BRAZZA","score":2},"player2":{"id":"p-6","name":"Shadow_Strike","team":"SANCTUARY SHADOWS","score":0},"winner_id":"p-5","status":"finished","station_label":"PS5 #3","scheduled_time":"15h45"},
    {"id":"m-q4","round":"quarters","round_label":"Quart 4","player1":{"id":"p-7","name":"Brazza_Beast","team":"IRON FIST CG","score":1},"player2":{"id":"p-8","name":"Darius_Prime","team":"FC BRAZZA","score":3},"winner_id":"p-8","status":"finished","station_label":"PS5 #4","scheduled_time":"16h00"},
    {"id":"m-s1","round":"semis","round_label":"Demi-Finale 1","player1":{"id":"p-1","name":"Kratos_CG","team":"IRON FIST CG","score":2},"player2":{"id":"p-3","name":"Apex_Sniper","team":"FC BRAZZA","score":1},"winner_id":"p-1","status":"finished","station_label":"Arène Scène Centrale","scheduled_time":"16h30"},
    {"id":"m-s2","round":"semis","round_label":"Demi-Finale 2","player1":{"id":"p-5","name":"Junior_King","team":"FC BRAZZA","score":1},"player2":{"id":"p-8","name":"Darius_Prime","team":"FC BRAZZA","score":2},"winner_id":"p-8","status":"finished","station_label":"Arène Scène Centrale","scheduled_time":"17h00"},
    {"id":"m-f1","round":"final","round_label":"Grande Finale","player1":{"id":"p-1","name":"Kratos_CG","team":"IRON FIST CG","score":2},"player2":{"id":"p-8","name":"Darius_Prime","team":"FC BRAZZA","score":2},"status":"live","station_label":"Grande Scène Vidéoprojecteur 4K","scheduled_time":"17h45 (PROLONGATIONS EN COURS)"}
  ]$json$::jsonb),
  ('predictions', $json$[
    {"id":"pred-1","user_id":"user-player-1","user_name":"Kratos_CG","match_id":"m-f1","predicted_winner_id":"p-1","predicted_winner_name":"Kratos_CG","mani_wager":3,"potential_gain":6,"status":"pending","created_at":"2026-10-01T18:15:00.000Z"}
  ]$json$::jsonb)
ON CONFLICT (key) DO NOTHING;
