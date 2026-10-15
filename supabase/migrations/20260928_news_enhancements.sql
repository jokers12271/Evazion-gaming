-- =============================================================================
-- Evazion Hub — Améliorations de la page Actualités
-- Étapes A → K : épinglage, corps d'article, compteur de lectures, upload d'image.
--
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase (ou via supabase db push).
-- Toutes les commandes sont idempotentes (IF NOT EXISTS / DROP ... IF EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. COLONNES MANQUANTES SUR `news`
-- -----------------------------------------------------------------------------
-- `content` : corps complet de l'article, séparé du résumé `excerpt`.
--   Nullable : les articles publiés avant cette migration gardent NULL et le
--   popup affiche alors le résumé (voir newsSummary / fallback dans News.tsx).
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS content text;

-- `is_pinned` : épinglage. Les news épinglées remontent en tête de liste.
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- `view_count` : compteur de lectures incrémenté par le RPC ci-dessous.
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Colonnes utilisées par les vignettes de duel / vainqueur Ragnarok.
-- Elles étaient référencées par News.tsx mais n'existaient pas en base :
-- les branches correspondantes ne pouvaient donc jamais s'afficher.
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS challenger_avatar_url text;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS challenged_avatar_url text;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS winner_avatar_url text;

-- Index de tri (épinglé d'abord, puis antéchronologique) : évite un tri en mémoire
-- sur lesRequêtes déjà filtrées par le client.
CREATE INDEX IF NOT EXISTS news_is_pinned_created_at_idx
  ON public.news (is_pinned DESC, created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. BACKFILL
-- -----------------------------------------------------------------------------
-- Les articles historiques n'ont pas de corps : on dérive un contenu du résumé
-- pour éviter un popup vide.
UPDATE public.news
SET content = excerpt
WHERE (content IS NULL OR content = '')
  AND excerpt IS NOT NULL
  AND excerpt <> '';

-- -----------------------------------------------------------------------------
-- 3. FONCTION D'AIDE « EST ADMIN »
--    Source de vérité : users_metadata.is_admin (utilisée par toute l'application).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT um.is_admin FROM public.users_metadata um WHERE um.user_id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. COMPTEUR DE LECTURES
--    SECURITY DEFINER : la page Actualités est publique, donc `update` direct
--    sur `news` serait bloqué par la RLS pour les visiteurs non connectés.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_news_views(news_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.news
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = news_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_news_views(uuid) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. RLS SUR `news`
--    Lecture publique (page Actualités accessible à tous).
--    Écriture réservée aux administrateurs — auparavant, les mutations partaient
--    du client et dépendaient entièrement des policies existantes.
-- -----------------------------------------------------------------------------
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "News public read" ON public.news;
CREATE POLICY "News public read"
  ON public.news FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert news" ON public.news;
CREATE POLICY "Admins can insert news"
  ON public.news FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update news" ON public.news;
CREATE POLICY "Admins can update news"
  ON public.news FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete news" ON public.news;
CREATE POLICY "Admins can delete news"
  ON public.news FOR DELETE
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. BUCKET DE STOCKAGE `news` (upload des images d'articles)
--    Le bucket `avatars` utilise déjà la même mécanique.
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('news', 'news', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read news images" ON storage.objects;
CREATE POLICY "Public read news images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news');

DROP POLICY IF EXISTS "Admins upload news images" ON storage.objects;
CREATE POLICY "Admins upload news images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'news' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update news images" ON storage.objects;
CREATE POLICY "Admins update news images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'news' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete news images" ON storage.objects;
CREATE POLICY "Admins delete news images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'news' AND public.is_admin());

-- =============================================================================
-- VÉRIFICATIONS APRÈS EXÉCUTION
-- =============================================================================
-- SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'news'
--   ORDER BY ordinal_position;
--
-- SELECT proname FROM pg_proc
--  WHERE proname IN ('increment_news_views', 'is_admin');
--
-- SELECT id, name, public FROM storage.buckets WHERE id = 'news';
