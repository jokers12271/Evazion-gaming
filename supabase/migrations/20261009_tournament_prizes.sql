-- Podium / dotations des tournois (modifiable par l'admin, lisible par tous).

CREATE TABLE IF NOT EXISTS public.tournament_prizes (
  place      integer PRIMARY KEY CHECK (place BETWEEN 1 AND 3),
  title      text    NOT NULL DEFAULT '',
  badge      text    NOT NULL DEFAULT '',
  cashprize  integer NOT NULL DEFAULT 0 CHECK (cashprize >= 0),
  mani       integer NOT NULL DEFAULT 0 CHECK (mani >= 0),
  ps5_hours  integer NOT NULL DEFAULT 0 CHECK (ps5_hours >= 0),
  extra      text    NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_prizes ENABLE ROW LEVEL SECURITY;

-- Lecture publique (anon + connectes)
DROP POLICY IF EXISTS "tprizes_select_public" ON public.tournament_prizes;
CREATE POLICY "tprizes_select_public"
  ON public.tournament_prizes FOR SELECT
  USING (true);

-- Ecriture reservee a l'admin
DROP POLICY IF EXISTS "tprizes_admin_all" ON public.tournament_prizes;
CREATE POLICY "tprizes_admin_all"
  ON public.tournament_prizes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Podium par defaut : 150 000 FCFA / 60 jetons MANI au total
INSERT INTO public.tournament_prizes (place, title, badge, cashprize, mani, ps5_hours, extra)
VALUES
  (1, '1ère Place', 'CHAMPION',      90000, 30, 5, '+ Trophée Officiel The Sanctuary gravé'),
  (2, '2ème Place', 'VICE-CHAMPION', 45000, 18, 2, ''),
  (3, '3ème Place', 'PODIUM',        15000, 12, 1, '')
ON CONFLICT (place) DO NOTHING;
