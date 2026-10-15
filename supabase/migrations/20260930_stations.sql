-- ============================================================================
-- Postes (stations) : catalogue editable depuis l'admin
-- ----------------------------------------------------------------------------
-- Les 10 postes etaient codes en dur dans le front :
--     useStationsStatus.ts : Array.from({ length: 10 }, (_, i) => `PS5_${i + 1}`)
--     Reservation.tsx     : name = `Station ${i + 1}`, "PS5 PRO", "4K-120Hz"
-- Ajouter une 11e console, renommer un poste ou corriger sa fiche technique
-- imposait donc un redeploiement.
--
-- `id` reste l'identifiant technique immuable : c'est la valeur stockee dans
-- reservations.station_id et team_sessions.station_id. Seul `name` est libre.
-- ============================================================================

-- 0. Fonction admin -------------------------------------------------------
-- Les migrations precedentes appellent public.is_admin(auth.uid()) alors que
-- la seule version definie dans le depot ne prenait aucun argument. On la
-- (re)declare ici pour que cette migration soit autonome : une policy dont la
-- fonction n'existe pas echoue silencieusement et laisse la table en
-- lecture seule pour tout le monde, y compris l'admin.
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

-- 1. Table des postes ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stations (
  id text PRIMARY KEY,
  name text NOT NULL,
  label text NOT NULL DEFAULT 'PS5 PRO',
  specs text,
  zone text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS stations_sort_order_idx ON public.stations (sort_order);

-- 2. RLS ------------------------------------------------------------------
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stations_select_all" ON public.stations;
CREATE POLICY "stations_select_all"
  ON public.stations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "stations_admin_all" ON public.stations;
CREATE POLICY "stations_admin_all"
  ON public.stations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. Seed des 10 postes existants -----------------------------------------
-- Reproduit a l'identique ce que le front affichait, pour qu'aucun poste ne
-- change d'apparence ni de nom au passage en base.
INSERT INTO public.stations (id, name, label, specs, zone, sort_order) VALUES
  ('PS5_1',  'Station 1',  'PS5 PRO', '4K•120Hz', 'ÎLOT NORD', 0),
  ('PS5_2',  'Station 2',  'PS5 PRO', '4K•120Hz', 'ÎLOT NORD', 1),
  ('PS5_3',  'Station 3',  'PS5 PRO', '4K•120Hz', 'ÎLOT NORD', 2),
  ('PS5_4',  'Station 4',  'PS5 PRO', '4K•120Hz', 'ÎLOT NORD', 3),
  ('PS5_5',  'Station 5',  'PS5 PRO', '4K•120Hz', 'ÎLOT NORD', 4),
  ('PS5_6',  'Station 6',  'PS5 PRO', '4K•120Hz', 'ÎLOT SUD',  5),
  ('PS5_7',  'Station 7',  'PS5 PRO', '4K•120Hz', 'ÎLOT SUD',  6),
  ('PS5_8',  'Station 8',  'PS5 PRO', '4K•120Hz', 'ÎLOT SUD',  7),
  ('PS5_9',  'Station 9',  'PS5 PRO', '4K•120Hz', 'ÎLOT SUD',  8),
  ('PS5_10', 'Station 10', 'PS5 PRO', '4K•120Hz', 'ÎLOT SUD',  9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  label = EXCLUDED.label,
  specs = EXCLUDED.specs,
  zone = EXCLUDED.zone,
  sort_order = EXCLUDED.sort_order;

-- 4. Index unique partiel sur les identifiants techniques ------------------
-- Le nom affichable est libre, donc plusieurs postes peuvent porter le meme
-- nom. L'id reste unique par construction (cle primaire).
