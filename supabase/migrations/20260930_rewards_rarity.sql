-- ============================================================================
-- Boutique : vraie colonne de rarete
-- ----------------------------------------------------------------------------
-- Jusqu'ici la rarete d'un article etait devinee dans getItemRarity() a partir
-- de son prix (>= 80 = legendaire, >= 35 = epique, >= 15 = rare). Consequence :
-- baisser le prix d'un article le faisait changer de rarete tout seul.
--
-- Le backfill ci-dessous reproduit EXACTEMENT la regle existante : a la suite de
-- cette migration, aucun article ne change d'apparence. Ensuite, seul le champ
-- `rarity` compte, et l'admin peut le fixer explicitement.
-- ============================================================================

ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS rarity text;

-- Backfill : meme hierarchie que le TypeScript (legendaire > epique > rare)
UPDATE public.rewards
SET rarity = CASE
  WHEN COALESCE(mani_cost, 0) >= 80
    OR action_type IN ('global_discount_10', 'challenge_two_ranks')
    OR category = 'Légendaire'
    THEN 'legendaire'
  WHEN COALESCE(mani_cost, 0) >= 35
    OR action_type IN ('pack_4h', 'weekend_priority')
    OR category = 'Équipement'
    THEN 'epique'
  WHEN COALESCE(mani_cost, 0) >= 15
    OR category = 'Temps de jeu'
    OR action_type LIKE '%discount%'
    THEN 'rare'
  ELSE 'commun'
END
WHERE rarity IS NULL;

-- Articles sans prix connu : on ne force rien, le code garde son repli.
UPDATE public.rewards SET rarity = 'commun' WHERE rarity IS NULL;

-- Contrainte : seules les valeurs attendues par l'UI sont acceptees.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rewards_rarity_check'
  ) THEN
    ALTER TABLE public.rewards
      ADD CONSTRAINT rewards_rarity_check
      CHECK (rarity IN ('commun', 'rare', 'epique', 'legendaire'));
  END IF;
END;
$$;
