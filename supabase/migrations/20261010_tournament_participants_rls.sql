-- Inscriptions aux tournois : il manquait des politiques RLS pour que l'admin
-- puisse LIRE les demandes en attente et les VALIDER / REJETER.
-- La table est deja creee en base : IF NOT EXISTS ne casse rien si elle existe.

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id text NOT NULL,
  user_id       uuid NOT NULL,
  display_name  text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index utiles (idempotents)
CREATE INDEX IF NOT EXISTS tournament_participants_tournament_idx
  ON public.tournament_participants (tournament_id);
CREATE INDEX IF NOT EXISTS tournament_participants_user_idx
  ON public.tournament_participants (user_id);
CREATE INDEX IF NOT EXISTS tournament_participants_status_idx
  ON public.tournament_participants (status);

-- Un joueur ne s'inscrit qu'une fois par tournoi
CREATE UNIQUE INDEX IF NOT EXISTS tournament_participants_unique_tournament_user
  ON public.tournament_participants (tournament_id, user_id);

-- Colonnes ajoutees par l'app (harmless si deja laes)
ALTER TABLE public.tournament_participants
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Lecture publique : la carte du tournoi affiche les participants valides
DROP POLICY IF EXISTS "tpart_select_public" ON public.tournament_participants;
CREATE POLICY "tpart_select_public"
  ON public.tournament_participants FOR SELECT
  USING (true);

-- Un joueur inserer SA propre demande (toujours en attente)
DROP POLICY IF EXISTS "tpart_insert_own" ON public.tournament_participants;
CREATE POLICY "tpart_insert_own"
  ON public.tournament_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- L'admin valide / rejette
DROP POLICY IF EXISTS "tpart_admin_update" ON public.tournament_participants;
CREATE POLICY "tpart_admin_update"
  ON public.tournament_participants FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Un joueur peut annuler sa propre demande
DROP POLICY IF EXISTS "tpart_update_own_pending" ON public.tournament_participants;
CREATE POLICY "tpart_update_own_pending"
  ON public.tournament_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Suppression : admin uniquement
DROP POLICY IF EXISTS "tpart_admin_delete" ON public.tournament_participants;
CREATE POLICY "tpart_admin_delete"
  ON public.tournament_participants FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
