-- ============================================================================
-- Purge totale des badges d'exemple.
-- Aucun badge n'a encore ete cree par l'admin : on vide la table achievements
-- et la cle legacy community_config["achievements"] qui ressuscitait les
-- anciennes donnees cote client.
-- A coller dans le SQL Editor de Supabase puis Run.
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.achievements') IS NOT NULL THEN
    DELETE FROM public.achievements;
    RAISE NOTICE 'achievements : table videe.';
  ELSE
    RAISE NOTICE 'achievements : table inexistante (migration 20261019_achievements.sql non appliquee).';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.community_config') IS NOT NULL THEN
    DELETE FROM public.community_config WHERE key = 'achievements';
    RAISE NOTICE 'community_config : cle achievements supprimee.';
  ELSE
    RAISE NOTICE 'community_config : table inexistante, rien a purger.';
  END IF;
END;
$$;
