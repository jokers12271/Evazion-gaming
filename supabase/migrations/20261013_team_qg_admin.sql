-- ============================================================================
-- Edition du Quartier General par l'admin
-- ----------------------------------------------------------------------------
-- La fenetre "Quartier General de Clan" devient editable pour les admins :
--   - teams.image        : deja gere (colonne existante)
--   - team_configs.monthly_fee / join_fee : deja gerees (colonnes existantes)
--   - team_configs.status / perks         : nouvelles colonnes ci-dessous
--
-- A APPLIQUER MANUELLEMENT dans le dashboard Supabase (SQL Editor) : l'agent
-- n'a pas acces aux DDL sur ce projet.
-- ============================================================================

-- 1. Colonnes du statut et des avantages du clan
ALTER TABLE public.team_configs
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE public.team_configs
  ADD COLUMN IF NOT EXISTS perks text;

-- 2. Valeur par defaut pour les teams deja configurees
UPDATE public.team_configs
   SET status = 'Actif · Top Tier'
 WHERE status IS NULL OR status = '';

UPDATE public.team_configs
   SET perks = E'Sessions d''entraînement réservées le mardi et jeudi soir au Sanctuary.\nPartage des victoires en tournoi et bonus de jetons de groupe.\nAccès prioritaire aux consoles PS5 Pro lors des gros tournois de clan.'
 WHERE perks IS NULL OR perks = '';

-- 3. Droits d'ecriture : reserve aux administrateurs
ALTER TABLE public.team_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_configs_admin_manage" ON public.team_configs;
CREATE POLICY "team_configs_admin_manage"
  ON public.team_configs FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));