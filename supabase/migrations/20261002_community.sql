-- ============================================================================
-- Communaute : Guerres de Clan, Mur Social, Annonces LFG, Events, Achievements
-- ----------------------------------------------------------------------------
-- Les donnees communautaires vivaient dans le localStorage du navigateur
-- (communityData.ts). Chaque membre voyait donc un contenu different (ou celui
-- de sa propre machine). On les centralise ici pour tout le hub.
--
-- Modele retenu (1 seule table, coherent avec gamification_config) :
--   * community_config : contenu GLOBAL, une ligne par cle, `value` en jsonb
--     (clan_wars, social_posts, lfg_posts, community_events, achievements,
--      monthly_hours_target).
--   - Lecture : tout le monde.
--   - Ecriture : l'admin pilote tout ; les membres peuvent en plus alimenter
--     le mur social et les annonces LFG (cles social_posts & lfg_posts).
-- ============================================================================

-- 0. Trigger updated_at (recree au cas ou la migration gamification n'a pas tourne)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Table de configuration communautaire -----------------------------------
CREATE TABLE IF NOT EXISTS public.community_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_config_select_all" ON public.community_config;
CREATE POLICY "community_config_select_all"
  ON public.community_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "community_config_admin_all" ON public.community_config;
CREATE POLICY "community_config_admin_all"
  ON public.community_config FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Les membres alimentent le mur social et les annonces LFG
DROP POLICY IF EXISTS "community_config_member_insert" ON public.community_config;
CREATE POLICY "community_config_member_insert"
  ON public.community_config FOR INSERT
  TO authenticated
  WITH CHECK (key IN ('social_posts', 'lfg_posts'));

DROP POLICY IF EXISTS "community_config_member_update" ON public.community_config;
CREATE POLICY "community_config_member_update"
  ON public.community_config FOR UPDATE
  TO authenticated
  USING (key IN ('social_posts', 'lfg_posts'))
  WITH CHECK (key IN ('social_posts', 'lfg_posts'));

-- 2. Trigger updated_at ------------------------------------------------------
DROP TRIGGER IF EXISTS community_config_touch ON public.community_config;
CREATE TRIGGER community_config_touch
  BEFORE UPDATE ON public.community_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Seed (identique aux valeurs par defaut du front) ------------------------
INSERT INTO public.community_config (key, value) VALUES
  ('clan_wars', $json$[
    {"team_id":"fc_brazza","points":480,"duels_won":18,"hours_logged":84,"bonus_claimed":false},
    {"team_id":"iron_fist_cg","points":445,"duels_won":22,"hours_logged":71,"bonus_claimed":false},
    {"team_id":"sanctuary_shadows","points":390,"duels_won":14,"hours_logged":65,"bonus_claimed":false}
  ]$json$::jsonb),
  ('social_posts', $json$[
    {
      "id":"post-1",
      "author_id":"user-player-1",
      "author_name":"Kratos_CG",
      "author_avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      "team_id":"iron_fist_cg",
      "content":"Victorieux 3-0 en finale du défi 1v1 Tekken 8 face à Ghost_Brazza ! Le Heat Dash de Jin est imbattable dans le Sanctuaire ⚡👊",
      "type":"duel_result",
      "game":"TEKKEN 8",
      "created_at":"2026-10-01T18:00:00.000Z",
      "likes":{"fire":14,"goat":8,"bolt":19,"clutch":6}
    },
    {
      "id":"post-2",
      "author_id":"user-player-3",
      "author_name":"Apex_Sniper",
      "author_avatar":"https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=200",
      "team_id":"fc_brazza",
      "content":"Enroulé du pied gauche pleine lucarne à la 92ème minute sur la PS5 #2 ! Qui ose me défier sur EA FC 26 ce soir ? ⚽🔥",
      "type":"exploit",
      "game":"EA SPORTS FC 26",
      "created_at":"2026-10-01T15:00:00.000Z",
      "likes":{"fire":22,"goat":11,"bolt":7,"clutch":15}
    },
    {
      "id":"post-3",
      "author_id":"user-player-2",
      "author_name":"Ghost_Brazza",
      "author_avatar":"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
      "team_id":"sanctuary_shadows",
      "content":"Clutch 1v3 sécurisé sur Black Ops 6 en recherche et destruction. Vidéo des highlights disponible au terminal !",
      "type":"clip",
      "game":"CALL OF DUTY: BO6",
      "created_at":"2026-10-01T11:00:00.000Z",
      "likes":{"fire":9,"goat":5,"bolt":12,"clutch":18}
    }
  ]$json$::jsonb),
  ('lfg_posts', $json$[
    {
      "id":"lfg-1",
      "user_id":"user-player-1",
      "user_name":"Kratos_CG",
      "user_avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      "rank_name":"Élite",
      "game":"TEKKEN 8",
      "platform":"PS5 Pro",
      "mode":"1v1 Sparring",
      "schedule":"Aujourd'hui 18h30 - 20h30",
      "note":"Cherche adversaire niveau Initié ou Élite pour perfectionner les punitions et le match-up contre Kazuya & Reina.",
      "whatsapp_number":"+242 06 612 34 56",
      "created_at":"2026-10-01T18:10:00.000Z",
      "is_active":true
    },
    {
      "id":"lfg-2",
      "user_id":"user-player-2",
      "user_name":"Ghost_Brazza",
      "user_avatar":"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
      "rank_name":"Pro",
      "game":"CALL OF DUTY: BO6",
      "platform":"PS5 Pro",
      "mode":"Ranked Duo",
      "schedule":"Ce soir 20h00",
      "note":"Cherche un duo vocal communicatif pour monter en division Platine/Diamant. Casque et micro disponibles sur place.",
      "whatsapp_number":"+242 05 555 12 34",
      "created_at":"2026-10-01T16:00:00.000Z",
      "is_active":true
    },
    {
      "id":"lfg-3",
      "user_id":"user-player-3",
      "user_name":"Apex_Sniper",
      "user_avatar":"https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=200",
      "rank_name":"Initié",
      "game":"EA SPORTS FC 26",
      "platform":"PS5 Pro",
      "mode":"1v1 Sparring",
      "schedule":"Samedi après-midi dès 15h",
      "note":"Entraînement tactique 1v1 avant le Grand Tournoi. Matchs de 6 min avec mise amicale de 1 MANI possible !",
      "whatsapp_number":"+242 06 999 88 77",
      "created_at":"2026-10-01T13:00:00.000Z",
      "is_active":true
    }
  ]$json$::jsonb),
  ('community_events', $json$[
    {
      "id":"evt-1",
      "title":"Vendredi Fight Night : Tekken 8 & MK1",
      "category":"Fight Night",
      "game":"TEKKEN 8 / MK1",
      "date_str":"Vendredi 3 Octobre",
      "time_str":"19h00 - 23h30",
      "image_url":"https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800",
      "description":"Arène ouverte en continu. Le champion en place garde le siège, les challengers défilent ! Boissons fraîches offertes à chaque série de 5 victoires.",
      "reward_text":"Trophée Roi de la Salle + 15 MANI",
      "participants_count":19,
      "user_is_registered":true
    },
    {
      "id":"evt-2",
      "title":"Champions League Brazza : 2v2 EA FC 26",
      "category":"Champions League",
      "game":"EA SPORTS FC 26",
      "date_str":"Samedi 4 Octobre",
      "time_str":"15h00 - 19h00",
      "image_url":"https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800",
      "description":"Constituez votre binôme d'attaque pour le tournoi en double sur écran géant 4K. Format poules + élimination directe.",
      "reward_text":"Cashprize 50 000 FCFA + 20 MANI",
      "participants_count":24,
      "user_is_registered":false
    },
    {
      "id":"evt-3",
      "title":"Dimanche Chill & Découverte Coop",
      "category":"Co-op Chill",
      "game":"MULTI-JEUX COOP & VR",
      "date_str":"Dimanche 5 Octobre",
      "time_str":"16h00 - 21h00",
      "image_url":"https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
      "description":"Ambiance lounge décontractée. Sessions It Takes Two, Overcooked, Gran Turismo 7 en volant à retour de force et démos VR.",
      "reward_text":"1 heure offerte par heure achetée",
      "participants_count":14,
      "user_is_registered":false
    }
  ]$json$::jsonb),
  ('achievements', $json$[
    {"id":"ach-1","title":"Oiseau de Nuit","description":"Jouer au moins 5 sessions complètes au Sanctuary après 21h00.","icon":"🌙","category":"fidelite","mani_reward":10,"unlocked":true,"progress":5,"max_progress":5},
    {"id":"ach-2","title":"Brazza Striker","description":"Enchaîner une série de 5 victoires consécutives en duel 1v1 d'arène.","icon":"⚡","category":"combat","mani_reward":15,"unlocked":true,"progress":5,"max_progress":5},
    {"id":"ach-3","title":"Pilier du Sanctuaire","description":"Cumuler plus de 100 heures de jeu enregistrées sur votre Gamer Pass.","icon":"🛡️","category":"prestige","mani_reward":25,"unlocked":true,"progress":112,"max_progress":100},
    {"id":"ach-4","title":"Chasseur de Cashprize","description":"Atteindre la finale ou le podium d'un tournoi e-sport officiel.","icon":"🏆","category":"prestige","mani_reward":30,"unlocked":false,"progress":0,"max_progress":1},
    {"id":"ach-5","title":"Frère d'Armes (Ambassadeur)","description":"Parrainer 2 nouveaux joueurs qui effectuent leur première session.","icon":"🤝","category":"social","mani_reward":20,"unlocked":false,"progress":1,"max_progress":2},
    {"id":"ach-6","title":"Maître du MANI","description":"Dépenser ou collecter plus de 50 jetons MANI dans le Lounge Store.","icon":"🪙","category":"prestige","mani_reward":15,"unlocked":false,"progress":28,"max_progress":50}
  ]$json$::jsonb),
  ('monthly_hours_target', $json${
    "current":780,
    "target":1000,
    "daysLeft":12,
    "rewardText":"Grande Nuit Boissons Offertes + Tournoi Cashprize Spécial 100 000 FCFA"
  }$json$::jsonb)
ON CONFLICT (key) DO NOTHING;
