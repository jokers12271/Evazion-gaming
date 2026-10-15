-- ============================================================================
-- Événement Phare (Spotlight) de la page Tournois : stocké en base
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hub_spotlight (
  id text PRIMARY KEY DEFAULT 'main_spotlight',
  title text NOT NULL,
  subtitle text NOT NULL,
  date text NOT NULL,
  description text NOT NULL,
  cashprize text NOT NULL,
  mani text NOT NULL,
  slots text NOT NULL,
  image_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hub_spotlight ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_spotlight_select_all" ON public.hub_spotlight;
CREATE POLICY "hub_spotlight_select_all"
  ON public.hub_spotlight FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "hub_spotlight_admin_all" ON public.hub_spotlight;
CREATE POLICY "hub_spotlight_admin_all"
  ON public.hub_spotlight FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.hub_spotlight (id, title, subtitle, date, description, cashprize, mani, slots, image_url, is_active)
VALUES (
  'main_spotlight',
  'EA SPORTS FC 26',
  'SANCTUARY MASTERS',
  'Samedi 4 Octobre · 15h00',
  'Le plus grand tournoi 1v1 de Brazzaville sur consoles PS5 Pro et écrans 4K. Affrontez les meilleurs attaquants de la ville pour décrocher le cashprize suprême et le trophée gravé.',
  '150 000 FCFA',
  '+60 JETONS MANI',
  '28/32 Places Réservées (4 Restantes)',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200',
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  date = EXCLUDED.date,
  description = EXCLUDED.description,
  cashprize = EXCLUDED.cashprize,
  mani = EXCLUDED.mani,
  slots = EXCLUDED.slots,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();
