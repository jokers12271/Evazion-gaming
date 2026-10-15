-- ============================================================================
-- Teams de jeu : sort du code vers la base
-- ----------------------------------------------------------------------------
-- Les 7 teams etaient codees en dur dans src/pages/Community.tsx. Ajouter une
-- team imposait de redployer le site.
--
-- IMPORTANT : la colonne id reste un TEXT reprenant exactement les valeurs
-- historiques ('FC 26', 'Tekken', ...). Ces identifiants sont deja references
-- dans team_configs.team_id et team_requests.team_id : les changer casserait
-- les adhesions et les retombees de tous les membres.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id text PRIMARY KEY,
  name text NOT NULL,
  tagline text,
  color text,
  image text,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les teams" ON public.teams;
CREATE POLICY "Tout le monde peut voir les teams"
  ON public.teams FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Seuls les admins gerent les teams" ON public.teams;
CREATE POLICY "Seuls les admins gerent les teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Donnees initiales, extraites du code. Idempotent.
INSERT INTO public.teams (id, name, tagline, color, image, sort_order) VALUES
  ('FC 26', 'Team - FC26', 'Pour les rois de la pelouse et du ballon rond.', '#22c55e', 'https://image.api.playstation.com/vulcan/ap/rnd/202507/2511/19ad6574090b6a71c88f0e6152ae5a668cc85882d87c51b5.png', 0),
  ('Tekken', 'Team - Tekken', 'L''arène suprême des combattants au poing d''acier.', '#ef4444', 'https://image.api.playstation.com/vulcan/ap/rnd/202212/1621/rCvLik1PKDSoCaEvTIx42H3Q.png', 1),
  ('GTA', 'Team - GTA', 'Les braqueurs et pilotes hors-pair de Los Santos.', '#a855f7', 'https://www.keycense.com/_next/image?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fkeycense.appspot.com%2Fo%2Fproducts%252F6826e508ef47456f98f21bb9.jpg%3Falt%3Dmedia%26token%3Dca4d55bd-6f96-4fd5-b0fc-5d9c64cc1a59&w=3840&q=60', 2),
  ('Naruto', 'Team - Naruto', 'Ninja de Konoha, maîtrisez votre chakra au combat.', '#f97316', 'https://image.api.playstation.com/vulcan/ap/rnd/202307/3118/20233826622f18fdc7d19d4138a67323050dc44f23d0dc26.jpg', 3),
  ('Fortnite', 'Team - Fortnite', 'Construction rapide, top 1 et danses légendaires.', '#06b6d4', 'https://cms-assets.unrealengine.com/cm6l5gfpm05kr07my04cqgy2x/output=format:webp/cmhkq5qwo2mid07on940m6a7k', 4),
  ('2K NBA', 'Team - 2K NBA', 'Dunk, drible et paniers à trois points sur le parquet.', '#eab308', 'https://www.lockercodes.com/wp-content/uploads/NBA-2K26-Locker-Codes.jpg', 5),
  ('Mortal Kombat', 'Team - Mortal Kombat', 'Rejoignez le combat suprême de l’Earthrealm. Fatality !', '#dc2626', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900.jpg', 6)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  tagline    = EXCLUDED.tagline,
  color      = EXCLUDED.color,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;
