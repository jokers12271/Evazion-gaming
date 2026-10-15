-- ============================================================================
-- BADGES & TROPHÉES : TABLE DÉDIÉE
-- ----------------------------------------------------------------------------
-- Les achievements vivaient dans community_config (table absente de ce
-- projet) puis dans le localStorage de chaque navigateur : l'admin ne pouvait
-- rien créer, et une modification n'était visible que chez lui.
--
-- Colonnes de gestion attendues par l'espace admin :
--   - unlock_rule : règles d'obtention affichées aux joueurs
--   - icon        : icône / emoji du badge
--   - mani_reward : récompense en jetons
--   - status      : actif / inactif (le badge inactif est masqué aux joueurs)
--   - unlocked    : obtenu ou non (affichage OBTENU / BLOQUÉ)
--   - progress / max_progress : avancement facultatif
--
-- A APPLIQUER MANUELLEMENT dans le dashboard Supabase (SQL Editor).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'prestige'
    CHECK (category IN ('combat', 'fidelite', 'social', 'prestige')),
  mani_reward numeric NOT NULL DEFAULT 0 CHECK (mani_reward >= 0),
  -- Regles d'obtention, visibles dans la fiche du badge.
  unlock_rule text NOT NULL DEFAULT '',
  -- Statut admin : un badge inactif n'est plus propose aux joueurs.
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  unlocked boolean NOT NULL DEFAULT false,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0),
  max_progress integer CHECK (max_progress IS NULL OR max_progress > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS achievements_status_idx
  ON public.achievements (status, sort_order);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Lecture publique des badges actifs, lecture de tout pour l'admin.
DROP POLICY IF EXISTS "achievements_read" ON public.achievements;
CREATE POLICY "achievements_read"
  ON public.achievements FOR SELECT
  TO anon, authenticated
  USING (status = 'active' OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "achievements_admin_write" ON public.achievements;
CREATE POLICY "achievements_admin_write"
  ON public.achievements FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- updated_at gere par le trigger cree dans 20261016.
DROP TRIGGER IF EXISTS achievements_touch ON public.achievements;
CREATE TRIGGER achievements_touch
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Les anciennes cles de community_config ne servent plus.
DO $$
BEGIN
  IF to_regclass('public.community_config') IS NOT NULL THEN
    EXECUTE $sql$DELETE FROM public.community_config WHERE key = 'achievements'$sql$;
    RAISE NOTICE 'community_config : cle achievements purgee.';
  END IF;
END;
$$;
