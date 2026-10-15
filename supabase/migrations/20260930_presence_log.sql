-- ============================================================================
-- Presence : journal d'entrees/sorties + scan securise
-- ----------------------------------------------------------------------------
-- Corrige la faille du Scanner : avant, n'importe qui pouvait scanner le QR de
-- sortie depuis chez lui et obtenir "Depart valide", meme sans avoir jamais
-- entre. La regle des appairages entree/sortie est desormais appliquee
-- par la base via scan_presence() en SECURITY DEFINER, donc impossible a
-- contourner depuis le navigateur.
-- ============================================================================

-- 1. Journal de presence -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.presence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event IN ('entree', 'sortie')),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Renseigne uniquement sur la ligne d'entree, quand le joueur repart.
  closed_at timestamptz
);

CREATE INDEX IF NOT EXISTS presence_log_user_idx
  ON public.presence_log (user_id, created_at DESC);

-- Une seule entree ouverte par joueur : garantie au niveau base.
CREATE UNIQUE INDEX IF NOT EXISTS presence_log_one_open_per_user
  ON public.presence_log (user_id)
  WHERE event = 'entree' AND closed_at IS NULL;

ALTER TABLE public.presence_log ENABLE ROW LEVEL SECURITY;

-- Un joueur voit son propre journal, un admin voit tout.
DROP POLICY IF EXISTS "presence_log_select_own_or_admin" ON public.presence_log;
CREATE POLICY "presence_log_select_own_or_admin"
  ON public.presence_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 2. Compteurs d'acces -------------------------------------------------------
ALTER TABLE public.users_metadata ADD COLUMN IF NOT EXISTS visit_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.users_metadata ADD COLUMN IF NOT EXISTS last_visit_at timestamptz;

-- 3. Fonction de scan securisee ---------------------------------------------
CREATE OR REPLACE FUNCTION public.scan_presence(p_event text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_open boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  -- Une session est ouverte s'il existe une entree non cloturee.
  SELECT EXISTS (
    SELECT 1 FROM public.presence_log
    WHERE user_id = v_uid AND event = 'entree' AND closed_at IS NULL
  ) INTO v_open;

  IF p_event = 'entree' THEN
    IF v_open THEN
      -- Deja present : on ne cree pas de doublon, on ne recompte pas.
      RETURN jsonb_build_object('ok', true, 'already_present', true);
    END IF;

    INSERT INTO public.presence_log (user_id, event) VALUES (v_uid, 'entree');

    UPDATE public.users_metadata
    SET is_present = true,
        last_scanned_at = now(),
        visit_count = COALESCE(visit_count, 0) + 1,
        last_visit_at = now()
    WHERE user_id = v_uid;

    RETURN jsonb_build_object('ok', true, 'already_present', false);

  ELSIF p_event = 'sortie' THEN
    -- Securite : sans entree correspondante, la sortie est refusee.
    IF NOT v_open THEN
      RAISE EXCEPTION 'AUCUNE_SESSION_OUVERTE' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.presence_log
    SET closed_at = now()
    WHERE user_id = v_uid AND event = 'entree' AND closed_at IS NULL;

    INSERT INTO public.presence_log (user_id, event) VALUES (v_uid, 'sortie');

    UPDATE public.users_metadata
    SET is_present = false,
        last_scanned_at = now()
    WHERE user_id = v_uid;

    RETURN jsonb_build_object('ok', true);

  END IF;

  RAISE EXCEPTION 'EVENEMENT_INCONNU' USING ERRCODE = 'P0001';
END;
$$;

REVOKE ALL ON FUNCTION public.scan_presence(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scan_presence(text) TO authenticated;

-- 4. Vue de synthese pour l'historique ---------------------------------------
-- DROP + CREATE (et non CREATE OR REPLACE) : il faut poser l'option
-- security_invoker, qui n'est pas modifiable par un CREATE OR REPLACE.
--
-- Sans `security_invoker = true`, la vue s'execute avec les droits de son
-- proprietaire (postgres), qui contourne la policy RLS de presence_log :
-- n'importe quel utilisateur authentique lirait alors l'historique de tout le
-- monde. Avec cette option, les RLS de la table s'appliquent bien a celui qui
-- interroge la vue, donc seuls le joueur concerne et les admins voient des
-- lignes.
DROP VIEW IF EXISTS public.presence_history;

CREATE VIEW public.presence_history
WITH (security_invoker = true)
AS
SELECT
  pl.id,
  pl.user_id,
  pl.event,
  pl.created_at,
  pl.closed_at,
  EXTRACT(EPOCH FROM (COALESCE(pl.closed_at, now()) - pl.created_at))::bigint AS duration_seconds,
  um.display_name
FROM public.presence_log pl
LEFT JOIN public.users_metadata um ON um.user_id = pl.user_id;
