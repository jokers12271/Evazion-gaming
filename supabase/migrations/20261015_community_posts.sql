-- ============================================================================
-- MUR SOCIAL + LFG : vraies tables, RLS par ligne, expiration automatique
-- ----------------------------------------------------------------------------
-- Les publications et les annonces ne sont plus stockees dans le blob JSON
-- `community_config`. Chaque message est une ligne, donc :
--   * pas d'ecrasement du tableau entier lors d'une ecriture concurrente ;
--   * suppression autorisee UNIQUEMENT a l'auteur ou a un admin (verifie par
--     la base, pas seulement par l'interface) ;
--   * lecture publique pour tous (anon + authenticated) ;
--   * une publication expire apres 24 h, une annonce apres 72 h.
--
-- L'expiration est appliquee cote serveur (trigger BEFORE INSERT + policy de
-- lecture), donc un client malveillant ne peut pas s'attribuer une duree
-- illimitee. Le nettoyage physique est realise par la fonction
-- `purge_expired_community_posts()` (pg_cron si disponible, sinon appel RPC
-- depuis le front au chargement).
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
-- 1. Publications du mur social (24 h)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.users_metadata(user_id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Joueur',
  author_avatar text,
  team_id text,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  type text NOT NULL DEFAULT 'exploit'
    CHECK (type IN ('exploit', 'clip', 'announcement', 'duel_result')),
  game text,
  clip_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS social_posts_created_idx
  ON public.social_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS social_posts_expires_idx
  ON public.social_posts (expires_at);
CREATE INDEX IF NOT EXISTS social_posts_author_idx
  ON public.social_posts (author_id);

-- ============================================================================
-- 2. Annonces LFG (72 h)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lfg_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users_metadata(user_id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT 'Joueur',
  user_avatar text,
  rank_name text NOT NULL DEFAULT 'Initie',
  game text NOT NULL,
  platform text NOT NULL DEFAULT 'PS5 Pro'
    CHECK (platform IN ('PS5 Pro', 'PC Ultra', 'VR Suite')),
  mode text NOT NULL DEFAULT '1v1 Sparring'
    CHECK (mode IN ('1v1 Sparring', 'Ranked Duo', 'Squad 4v4', 'Co-op Chill')),
  schedule text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 1000),
  whatsapp_number text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours')
);

CREATE INDEX IF NOT EXISTS lfg_posts_created_idx
  ON public.lfg_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS lfg_posts_expires_idx
  ON public.lfg_posts (expires_at);
CREATE INDEX IF NOT EXISTS lfg_posts_user_idx
  ON public.lfg_posts (user_id);

-- ============================================================================
-- 3. Reactions : une ligne par (post, joueur)
--    Impose par la cle primaire : impossible d'ecraser les reactions des
--    autres ni d'accumuler plusieurs votes depuis le meme compte.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_post_reactions (
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users_metadata(user_id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('fire', 'goat', 'bolt', 'clutch')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS social_post_reactions_post_idx
  ON public.social_post_reactions (post_id);

-- ============================================================================
-- 4. Expiration forcee cote serveur
--    La valeur envoyee par le navigateur est systematiquement remplacee.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.social_posts_lock_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_at := now();
  NEW.expires_at := now() + interval '24 hours';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lfg_posts_lock_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_at := now();
  NEW.expires_at := now() + interval '72 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS social_posts_lock_expiry_trg ON public.social_posts;
CREATE TRIGGER social_posts_lock_expiry_trg
  BEFORE INSERT ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.social_posts_lock_expiry();

DROP TRIGGER IF EXISTS lfg_posts_lock_expiry_trg ON public.lfg_posts;
CREATE TRIGGER lfg_posts_lock_expiry_trg
  BEFORE INSERT ON public.lfg_posts
  FOR EACH ROW EXECUTE FUNCTION public.lfg_posts_lock_expiry();

-- ============================================================================
-- 5. RLS : lecture publique non expiree, ecriture auteur, suppression
--    auteur OU admin
-- ============================================================================
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_reactions ENABLE ROW LEVEL SECURITY;

-- Publications ---------------------------------------------------------------
DROP POLICY IF EXISTS "social_posts_read" ON public.social_posts;
CREATE POLICY "social_posts_read"
  ON public.social_posts FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

DROP POLICY IF EXISTS "social_posts_insert" ON public.social_posts;
CREATE POLICY "social_posts_insert"
  ON public.social_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "social_posts_update" ON public.social_posts;
CREATE POLICY "social_posts_update"
  ON public.social_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = author_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "social_posts_delete" ON public.social_posts;
CREATE POLICY "social_posts_delete"
  ON public.social_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

-- Annonces LFG ---------------------------------------------------------------
DROP POLICY IF EXISTS "lfg_posts_read" ON public.lfg_posts;
CREATE POLICY "lfg_posts_read"
  ON public.lfg_posts FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

DROP POLICY IF EXISTS "lfg_posts_insert" ON public.lfg_posts;
CREATE POLICY "lfg_posts_insert"
  ON public.lfg_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lfg_posts_update" ON public.lfg_posts;
CREATE POLICY "lfg_posts_update"
  ON public.lfg_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "lfg_posts_delete" ON public.lfg_posts;
CREATE POLICY "lfg_posts_delete"
  ON public.lfg_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Reactions ------------------------------------------------------------------
DROP POLICY IF EXISTS "social_post_reactions_read" ON public.social_post_reactions;
CREATE POLICY "social_post_reactions_read"
  ON public.social_post_reactions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "social_post_reactions_insert" ON public.social_post_reactions;
CREATE POLICY "social_post_reactions_insert"
  ON public.social_post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_post_reactions_update" ON public.social_post_reactions;
CREATE POLICY "social_post_reactions_update"
  ON public.social_post_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "social_post_reactions_delete" ON public.social_post_reactions;
CREATE POLICY "social_post_reactions_delete"
  ON public.social_post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================================================
-- 6. Nettoyage physique des contenus expires
-- ============================================================================
CREATE OR REPLACE FUNCTION public.purge_expired_community_posts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.social_posts WHERE expires_at <= now();
  DELETE FROM public.lfg_posts WHERE expires_at <= now();
$$;

REVOKE ALL ON FUNCTION public.purge_expired_community_posts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_community_posts() TO anon, authenticated, service_role;

-- Tâche planifiee toutes les 10 minutes si pg_cron est disponible.
-- Sinon, les contenus restent invisibles grace aux policies de lecture et le
-- front appelle la fonction RPC au chargement.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('purge-community-posts');
    EXCEPTION WHEN others THEN
      NULL; -- la tache n'existe pas encore
    END;
    PERFORM cron.schedule(
      'purge-community-posts',
      '*/10 * * * *',
      'select public.purge_expired_community_posts()'
    );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'pg_cron indisponible : purge assuree par RLS expires_at + appel RPC au chargement.';
END;
$$;

-- ============================================================================
-- 7. Retrait des publications et annonces fictives
--    - purge du blob JSON (contenu de demo EAZTON : Kratos_CG, Apex_Sniper...)
--    - suppression des policies larges qui laissaient n'importe quel membre
--      ecraser le tableau complet
--
--    `community_config` n'existe pas sur tous les deploiements (migration
--    20261002_community.sql non appliquee). On teste donc son existence et on
--    executes les ordres en SQL dynamique : le parseur resout la relation a la
--    compilation, un simple IF ne suffirait pas.
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.community_config') IS NULL THEN
    RAISE NOTICE 'community_config absent : purge du blob JSON ignoree.';
    RETURN;
  END IF;

  EXECUTE $sql$DELETE FROM public.community_config WHERE key IN ('social_posts', 'lfg_posts')$sql$;
  EXECUTE $sql$DROP POLICY IF EXISTS "community_config_member_update" ON public.community_config$sql$;
  EXECUTE $sql$DROP POLICY IF EXISTS "community_config_member_insert" ON public.community_config$sql$;

  RAISE NOTICE 'community_config purge : publications/annonces fictives retirees.';
END;
$$;

-- Filet de securite : si des lignes fictives subsistent (donnee injectee
-- manuellement), on les supprime. Les auteur_id fictifs ('user-player-1'...)
-- n'existent pas dans users_metadata.
DELETE FROM public.social_posts sp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users_metadata um WHERE um.user_id = sp.author_id
  );

DELETE FROM public.lfg_posts lp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users_metadata um WHERE um.user_id = lp.user_id
  );
