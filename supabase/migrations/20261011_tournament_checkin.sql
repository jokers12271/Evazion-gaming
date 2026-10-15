-- Check-in des competiteurs aux tournois (colonne ajoutee par l'app).
-- Le scanner admin lit le QR "EVZ-PASS|<tournament_id>|<user_id>" puis ecrit
-- l'horodatage de presence dans checked_in_at.

ALTER TABLE public.tournament_participants
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

CREATE INDEX IF NOT EXISTS tournament_participants_checked_in_idx
  ON public.tournament_participants (checked_in_at);

-- L'admin doit pouvoir ecrire checked_in_at (recouvert par tpart_admin_update,
-- on le recree au cas ou la migration precedente n'aurait pas tourne).
DROP POLICY IF EXISTS "tpart_admin_checkin" ON public.tournament_participants;
CREATE POLICY "tpart_admin_checkin"
  ON public.tournament_participants FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
