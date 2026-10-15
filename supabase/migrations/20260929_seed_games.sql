-- Seed initial de la ludotheque Sanctuary (genere depuis src/lib/gamesData.ts)
-- 29 jeux. Script idempotent : peut etre rejoue sans dupliquer.

-- 1. Table (no-op si elle existe deja)
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  category text NOT NULL,
  description text,
  image_url text
);

-- 2. Colonnes attendues par l'application (no-op si deja presentes)
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Unicite sur le titre -> permet le ON CONFLICT ci-dessous
CREATE UNIQUE INDEX IF NOT EXISTS games_title_key ON public.games (title);

-- 4. Lecture publique / ecriture admin
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les jeux" ON public.games;
CREATE POLICY "Tout le monde peut voir les jeux"
  ON public.games FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Seuls les admins gerent les jeux" ON public.games;
CREATE POLICY "Seuls les admins gerent les jeux"
  ON public.games FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. Donnees initiales
INSERT INTO public.games (title, category, description, image_url) VALUES
  ('EA Sports FC 26', 'Sport', 'La simulation de football de référence pour régner sur le terrain du Sanctuary.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqJtv0QJEprKjtcXGui-8LkT6kwRHdySVEiMHX4STjFny-UI5JpJFQMy7q&s=10'),
  ('Naruto x Boruto Connections', 'Combat', 'Célébrez l''histoire des ninjas avec des combats ultra-rapides et des combos dantesques.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1020790/library_600x900.jpg'),
  ('Fortnite', 'Tir', 'Construisez, combattez et dansez pour décrocher le Top 1 en équipe.', 'https://gamewave.fr/static/images/games/a5685-fortnite.jpg'),
  ('Gran Turismo 7', 'Sport', 'La simulation de course automobile ultime pour les pilotes les plus exigeants.', 'https://upload.wikimedia.org/wikipedia/en/1/14/Gran_Turismo_7_cover_art.jpg'),
  ('Demon Slayer 2', 'Combat', 'Revivez les affrontements mythiques des pourfendeurs de démons avec une fluidité divine.', 'https://i.redd.it/uak77rqto2me1.jpeg'),
  ('Dragon Ball: Sparking! ZERO', 'Combat', 'L''héritier spirituel de Budokai Tenkaichi. Repoussez les limites de votre Ki.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1790600/library_600x900.jpg'),
  ('Tekken 8', 'Combat', 'Le roi du poing d''acier revient pour un nouvel affrontement de clans viscéral.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/library_600x900.jpg'),
  ('Mortal Kombat 1', 'Combat', 'Un nouvel univers façonné par le Dieu du feu Liu Kang. Fatality !', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900.jpg'),
  ('NBA 2K25', 'Sport', 'Prenez le contrôle des parquets et dunker sur vos rivaux avec style.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/library_600x900.jpg'),
  ('Battlefield 6', 'Tir', 'Des théâtres de guerre massifs et destructibles pour des tactiques militaires en escouade.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1517290/library_600x900.jpg'),
  ('God of War Ragnarök', 'Aventure', 'Accompagnez Kratos et Atreus dans les neuf royaumes nordiques face au destin.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2322010/library_600x900.jpg'),
  ('Ghost of Tsushima', 'Aventure', 'Défendez l''île de Tsushima sous la voie du Samouraï ou la doctrine du Fantôme.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2215430/library_600x900.jpg'),
  ('Marvel’s Spider-Man 2', 'Aventure', 'Voltigez à travers New York avec Peter Parker et Miles Morales face à Venom.', 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png'),
  ('Uncharted: Legacy of Thieves', 'Aventure', 'Suivez Nathan Drake et Chloe Frazer dans des quêtes de trésors à couper le souffle.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1659420/library_600x900.jpg'),
  ('It Takes Two', 'Coop', 'L''aventure coopérative par excellence où la coordination est la clé de la survie.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/library_600x900.jpg'),
  ('Monster Hunter Wilds', 'Aventure', 'Traquez des monstres titanesques dans un écosystème dynamique et sauvage.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2246340/library_600x900.jpg'),
  ('Final Fantasy XVI', 'Aventure', 'Une épopée de vengeance et d''action pure portée par les Primordiaux de Valisthéa.', 'https://live.staticflickr.com/65535/50542067131_762c2f45e2_o.png'),
  ('The Last of Us Part I', 'Aventure', 'L''aventure originelle de Joel et Ellie, sublimée pour la puissance de la PS5.', 'https://upload.wikimedia.org/wikipedia/en/thumb/8/86/The_Last_of_Us_Part_I_cover.jpg/250px-The_Last_of_Us_Part_I_cover.jpg'),
  ('The Last of Us Part II', 'Aventure', 'Affrontez les conséquences d''un cycle de violence implacable dans un monde déchu.', 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/TLOU_P2_Box_Art_2.png/250px-TLOU_P2_Box_Art_2.png'),
  ('Attack on Titan 2', 'Action', 'Fendez les airs avec votre équipement tridimensionnel pour abattre les Titans.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd1EyfhX-ZEUAvMCEuYdI4SXQTQTBP8Nwb5mQ6IYO46bSlK7bMSTIGsUUm&s=10'),
  ('Resident Evil 4 Remake', 'Aventure', 'Sauvez la fille du président dans un village reculé contrôlé par une secte d''un autre âge.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2050650/library_600x900.jpg'),
  ('Call of Duty: Black Ops 6', 'Tir', 'Une campagne d''action d''espionnage intense et des affrontements multijoueurs nerveux.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyT1n7Pf4nofii2QkSzdH1QnJjTEbguDdLnLREmpVbhA&s=10'),
  ('Grand Theft Auto V', 'Aventure', 'Explorez les rues animées de Los Santos pour planifier les braquages du siècle.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg'),
  ('EA Sports UFC 5', 'Combat', 'La référence du combat MMA virtuel. Montez dans l''Octogone du Sanctuary.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTaQBbclQLMkxmBCZY509ivb1TAREhNOc1RrkSHb1rebRTGNn5vkNCqO0&s=10'),
  ('EA Sports WRC', 'Sport', 'Affrontez la boue, l''asphalte et la neige dans la simulation officielle du championnat du monde de rallye.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1849250/library_600x900.jpg'),
  ('Hogwarts Legacy', 'Aventure', 'Écrivez votre propre légende à Poudlard dans ce RPG d''action dans le monde magique d''Harry Potter.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/990080/library_600x900.jpg'),
  ('Resident Evil Village', 'Aventure', 'Affrontez des créatures mythologiques et la redoutable Lady Dimitrescu dans ce château d''épouvante.', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1196590/library_600x900.jpg'),
  ('Need for Speed Unbound', 'Sport', 'Pilotez des bolides customisés à l''extrême dans des courses urbaines de rue.', 'https://m.media-amazon.com/images/M/MV5BMWE0YWQ3ZWEtNDUxZi00YjczLTgyOGItMDA0YzgzOTVkOGI0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'),
  ('Assassin’s Creed Mirage', 'Aventure', 'Suivez Basim dans le Bagdad du IXe siècle pour une quête de justice et d''infiltration classique.', 'https://image.api.playstation.com/vulcan/ap/rnd/202208/1718/NFf86jgU4AeVYgJBEoEKBpxW.jpg')
ON CONFLICT (title) DO UPDATE SET
  category    = EXCLUDED.category,
  description = EXCLUDED.description,
  image_url   = EXCLUDED.image_url;
