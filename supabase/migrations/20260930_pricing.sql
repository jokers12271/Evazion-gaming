-- ============================================================================
-- Tarifs : packs de cagnotte d'equipe + durees de reservation
-- ----------------------------------------------------------------------------
-- Ces deux listes etaient codees en dur (TEAM_PACKS dans Dashboard.tsx,
-- DURATIONS dans Reservation.tsx). Modifier un prix imposait un redeploiement.
-- ============================================================================

-- 1. Packs de cagnotte d'equipe ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_packs (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL,
  minutes integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.team_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_packs_select_all" ON public.team_packs;
CREATE POLICY "team_packs_select_all"
  ON public.team_packs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "team_packs_admin_all" ON public.team_packs;
CREATE POLICY "team_packs_admin_all"
  ON public.team_packs FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.team_packs (id, name, price, minutes, sort_order) VALUES
  ('pack_1h',   '🎮 Pack 1h',    1500,  60, 0),
  ('pack_1h30', '🏆 Pack 1h30',  2000,  90, 1),
  ('pack_4h',   '📦 Pack 4h',    5000, 240, 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  minutes = EXCLUDED.minutes,
  sort_order = EXCLUDED.sort_order;

-- 2. Durees et tarifs de reservation -----------------------------------------
CREATE TABLE IF NOT EXISTS public.reservation_durations (
  id text PRIMARY KEY,
  label text NOT NULL,
  minutes integer NOT NULL,
  price integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.reservation_durations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservation_durations_select_all" ON public.reservation_durations;
CREATE POLICY "reservation_durations_select_all"
  ON public.reservation_durations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "reservation_durations_admin_all" ON public.reservation_durations;
CREATE POLICY "reservation_durations_admin_all"
  ON public.reservation_durations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.reservation_durations (id, label, minutes, price, sort_order) VALUES
  ('d15',  '⚡ 15 min',         15,  500, 0),
  ('d30',  '🔥 30 min',         30, 1000, 1),
  ('d60',  '🎮 1h',             60, 1500, 2),
  ('d90',  '🏆 1h30',           90, 2000, 3),
  ('d240', '📦 Pack 4h',       240, 5000, 4),
  ('d300', '👑 Pack Légende 5h', 300, 5000, 5)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  minutes = EXCLUDED.minutes,
  price = EXCLUDED.price,
  sort_order = EXCLUDED.sort_order;
