-- ============================================================================
-- COMPTEUR D'INSCRITS PUBLIC
-- ----------------------------------------------------------------------------
-- Correctif de 20261016 : le hook affichait le nombre d'inscrits via un embed
-- PostgREST (confirmed_count:event_confirmed_count(id)), ce qui echoue avec
-- PGRST200 car PostgREST n'accepte que les vraies relations etrangeres pour un
-- embed, pas une fonction SQL.
--
-- Le comptage cote client ne suffit pas non plus : la policy de lecture de
-- event_registrations limite chaque joueur a ses propres demandes, donc un
-- visiteur anonyme verrait 0 inscrit partout.
--
-- Cette fonction SECURITY DEFINER ne renvoie QUE le nombre d'inscrits
-- confirmes par soiree, aucune donnee personnelle.
--
-- A APPLIQUER MANUELLEMENT dans le dashboard Supabase (SQL Editor).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.event_confirmed_counts()
RETURNS TABLE (event_id uuid, confirmed_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.event_id, count(*)::bigint AS confirmed_count
  FROM public.event_registrations r
  WHERE r.status = 'confirmed'
  GROUP BY r.event_id;
$$;

REVOKE ALL ON FUNCTION public.event_confirmed_counts() FROM public;
GRANT EXECUTE ON FUNCTION public.event_confirmed_counts() TO anon, authenticated, service_role;

-- La fonction parametree de la migration precedente n'est plus utilisee : on la
-- retire pour eviter deux sources de verite.
DROP FUNCTION IF EXISTS public.event_confirmed_count(uuid);
