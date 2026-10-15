-- ============================================================================
-- NOTIFICATION ADMIN : DEMANDE D'INSCRIPTION EN ATTENTE
-- ----------------------------------------------------------------------------
-- Deux besoins :
--
--  1. Compter les demandes en attente pour le badge admin. La policy de lecture
--     de event_registrations n'ouvre que l'admin, et lister les lignes a chaque
--     rendu coute cher : on expose juste un nombre, via SECURITY DEFINER.
--
--  2. Permettre a l'admin de voir le detail depuis n'importe ou (le tableau
--     de bord), pas seulement depuis Communaute > Quetes & Soirees.
--
-- A APPLIQUER MANUELLEMENT dans le dashboard Supabase (SQL Editor).
-- ============================================================================

-- 1. Nombre de demandes en attente (toutes soirées).
CREATE OR REPLACE FUNCTION public.event_pending_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint
  FROM public.event_registrations
  WHERE status = 'pending'
    AND public.is_admin(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.event_pending_count() FROM public;
GRANT EXECUTE ON FUNCTION public.event_pending_count() TO authenticated, service_role;

-- 2. Vue admin : demandes en attente avec le titre de la soirée et le profil
--    du joueur. La lecture reste protegee par is_admin(auth.uid()), donc un
--    joueur ne voit rien sur cette vue.
DROP VIEW IF EXISTS public.event_registrations_admin;
CREATE VIEW public.event_registrations_admin
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.event_id,
  r.user_id,
  r.status,
  r.payment_method,
  r.payment_amount,
  r.payment_reference,
  r.payment_note,
  r.admin_note,
  r.created_at,
  e.title AS event_title,
  e.entry_fee AS event_entry_fee,
  um.display_name,
  um.avatar_url
FROM public.event_registrations r
JOIN public.community_events e ON e.id = r.event_id
LEFT JOIN public.users_metadata um ON um.user_id = r.user_id
WHERE public.is_admin(auth.uid());

GRANT SELECT ON public.event_registrations_admin TO authenticated, service_role;
