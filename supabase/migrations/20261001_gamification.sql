-- ============================================================================
-- Gamification : roue, arcade/quizz, streaks, quetes, lootboxes, jukebox, jackpot
-- ----------------------------------------------------------------------------
-- Les donnees de gamification vivaient dans le localStorage du navigateur
-- (gamificationData.ts) : une config modifiee par l'admin n'etait visible que
-- sur SA machine et les donnees joueur n'etaient pas partagees.
--
-- Modele retenu (2 tables seulement) :
--   * gamification_config : configuration GLOBALE pilotee par l'admin
--     (segments de la roue, questions du quizz, recompenses de lootbox,
--      cout de lootbox, genres jukebox, definitions des quetes, jackpot).
--     Une ligne par cle, `value` en jsonb.
--   * user_gamification : etat PAR JOUEUR (streak, spin du jour, tickets
--     jackpot, progression des quetes).
-- ============================================================================

-- 1. Configuration globale -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gamification_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamification_config_select_all" ON public.gamification_config;
CREATE POLICY "gamification_config_select_all"
  ON public.gamification_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "gamification_config_admin_all" ON public.gamification_config;
CREATE POLICY "gamification_config_admin_all"
  ON public.gamification_config FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. Etat par joueur -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  streak_days integer NOT NULL DEFAULT 3,
  last_active_date text,
  multiplier numeric NOT NULL DEFAULT 1.2,
  last_spin_date text,
  total_spins integer NOT NULL DEFAULT 0,
  jackpot_tickets integer NOT NULL DEFAULT 0,
  quest_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_gamification_select_own" ON public.user_gamification;
CREATE POLICY "user_gamification_select_own"
  ON public.user_gamification FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_gamification_upsert_own" ON public.user_gamification;
CREATE POLICY "user_gamification_upsert_own"
  ON public.user_gamification FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_gamification_update_own" ON public.user_gamification;
CREATE POLICY "user_gamification_update_own"
  ON public.user_gamification FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_gamification_admin_delete" ON public.user_gamification;
CREATE POLICY "user_gamification_admin_delete"
  ON public.user_gamification FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. Seed de la configuration (identique aux valeurs par defaut du front) ---
INSERT INTO public.gamification_config (key, value) VALUES
  ('wheel_segments', '[
    {"label":"+2 MANI","color":"#8b5cf6","icon":"🪙","type":"mani","amount":2},
    {"label":"15 Min PS5","color":"#06b6d4","icon":"⏳","type":"time","amount":15},
    {"label":"Boisson Bar","color":"#3b82f6","icon":"🥤","type":"drink","amount":1},
    {"label":"+5 MANI","color":"#eab308","icon":"💎","type":"mani","amount":5},
    {"label":"Ticket Jackpot","color":"#ec4899","icon":"🎟️","type":"ticket","amount":1},
    {"label":"+1 MANI","color":"#a855f7","icon":"🪙","type":"mani","amount":1},
    {"label":"30 Min PS5","color":"#10b981","icon":"⚡","type":"time","amount":30},
    {"label":"Double XP 1h","color":"#f97316","icon":"👑","type":"xp","amount":1}
  ]'::jsonb),
  ('lootbox_cost', '5'::jsonb),
  ('lootbox_rewards', '[
    {"id":"rew-1","name":"Pack Énergie Lounge","category":"common","description":"1 Canette XXL fraîche (Red Bull ou Monster) offerte au bar du hub.","icon":"🥤","value_text":"Boisson Offerte","color":"#3b82f6"},
    {"id":"rew-2","name":"Bonus 30 Minutes PS5 Pro","category":"rare","description":"30 minutes supplémentaires ajoutées immédiatement à votre solde de jeu.","icon":"⏳","value_text":"+30 min de Jeu","color":"#06b6d4"},
    {"id":"rew-3","name":"Bourse de MANI","category":"rare","description":"5 Jetons MANI versés directement dans votre portefeuille numérique.","icon":"🪙","value_text":"+5 MANI","color":"#eab308"},
    {"id":"rew-4","name":"Heure de Jeu Nocturne VIP","category":"epic","description":"1 Heure complète offerte valable sur n''importe quelle console de la salle.","icon":"👑","value_text":"+1 Heure Offerte","color":"#a855f7"},
    {"id":"rew-5","name":"Golden Pass Tournoi (50% Off)","category":"legendary","description":"Réduction de 50% sur l''inscription à la prochaine grande compétition du Sanctuaire.","icon":"🏆","value_text":"-50% Tournoi","color":"#ef4444"}
  ]'::jsonb),
  ('jukebox_genres', '[
    {"id":"afro","name":"Afro-Urbain & Brazza Beats","vibe":"Ambiance dansante et chaleureuse du pays","now_playing":"Burna Boy, Rema, Innoss''B & Talents Locaux","votes":38,"color":"#f59e0b"},
    {"id":"trap","name":"Trap & Hype Gaming","vibe":"Basses lourdes pour compétiteurs 1v1","now_playing":"Travis Scott, Gunna, Future & Drill","votes":45,"color":"#a855f7"},
    {"id":"synth","name":"Synthwave & Cyberpunk Night","vibe":"Néons rétrofuturistes et synthés 80s","now_playing":"Carpenter Brut, Kavinsky, The Weeknd (80s Mix)","votes":29,"color":"#06b6d4"},
    {"id":"lofi","name":"Lo-Fi Chill & Focus","vibe":"Détente pour session découverte et coop","now_playing":"ChilledCow / Lofi Girl Gaming Session","votes":19,"color":"#10b981"}
  ]'::jsonb),
  ('daily_quests', '[
    {"id":"q-1","title":"Entrée dans l''Arène","description":"Lancer ou disputer un défi amical dans le salon ou en face-à-face.","icon":"⚔️","mani_reward":2,"max_progress":1},
    {"id":"q-2","title":"Session d''Entraînement","description":"Accumuler au moins 1 heure de jeu enregistrée sur une station PS5 Pro.","icon":"⏳","mani_reward":3,"max_progress":1},
    {"id":"q-3","title":"Soutien du Sanctuaire","description":"Encourager une Team dans les guerres de clan ou réagir sur le mur social.","icon":"🔥","mani_reward":1,"max_progress":1}
  ]'::jsonb),
  ('quiz_questions', '[
    {"question":"Dans EA FC, quelle combinaison de touches active le tir puissant (Power Shot) ?","options":["L1 + R1 + Tir","L2 + R2 + Tir","R1 + Carré","L1 + Croix"],"correctIndex":0,"game":"EA SPORTS FC"},
    {"question":"Dans Tekken 8, comment s''appelle le nouveau système d''agression en combat ?","options":["Rage Drive","Heat System","V-Trigger","Max Mode"],"correctIndex":1,"game":"TEKKEN 8"},
    {"question":"Dans Call of Duty: Black Ops 6, quelle est la grande nouveauté de déplacement ?","options":["Jetpack infini","Omnimovement (Sprint 360°)","Grappin tactique","Téléportation"],"correctIndex":1,"game":"CALL OF DUTY"},
    {"question":"Quel combattant iconique de Mortal Kombat crie ''Get over here !'' ?","options":["Sub-Zero","Raiden","Scorpion","Liu Kang"],"correctIndex":2,"game":"MORTAL KOMBAT"},
    {"question":"Combien de joueurs composent une équipe classique dans un tournoi Rocket League ?","options":["2 joueurs","3 joueurs","4 joueurs","5 joueurs"],"correctIndex":1,"game":"ROCKET LEAGUE"}
  ]'::jsonb),
  ('jackpot', '{"currentPool":185,"prizeDesc":"185 Jetons MANI + 1 Manette PS5 Pro DualSense officielle gravée","totalTickets":92}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Trigger updated_at ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gamification_config_touch ON public.gamification_config;
CREATE TRIGGER gamification_config_touch
  BEFORE UPDATE ON public.gamification_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS user_gamification_touch ON public.user_gamification;
CREATE TRIGGER user_gamification_touch
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
