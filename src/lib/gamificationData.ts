/**
 * Gamification Engine for Evazion (ex-The Sanctuary Brazzaville)
 * Covers: Daily Lucky Spin, Warm-up Arcade, Daily Streaks & Quests,
 * Mystery Lootboxes, Lounge Jukebox, Collective Jackpot & Cyber Audio.
 *
 * Les donnees sont persistees dans Supabase :
 *   - gamification_config (configuration globale, ecrite par l'admin)
 *   - user_gamification   (etat par joueur : streak, spin, tickets, quetes)
 * Un cache memoire + localStorage sert de repli instantane (offline / avant
 * hydratation) afin de conserver l'API synchrone utilisee par les composants.
 */

import { useSyncExternalStore, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface WheelSegment {
  id?: string;
  label: string;
  color: string;
  icon: string;
  type: 'mani' | 'time' | 'drink' | 'ticket' | 'xp' | 'other';
  amount: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  mani_reward: number;
  progress: number;
  max_progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface LootboxReward {
  id: string;
  name: string;
  category: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  icon: string;
  value_text: string;
  color: string;
}

export interface JukeboxGenre {
  id: string;
  name: string;
  vibe: string;
  now_playing: string;
  votes: number;
  color: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  game: string;
}

export const DEFAULT_WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '+2 jetons', color: '#8b5cf6', icon: '🪙', type: 'mani', amount: 2 },
  { label: '15 Min PS5', color: '#06b6d4', icon: '⏳', type: 'time', amount: 15 },
  { label: 'Boisson Bar', color: '#3b82f6', icon: '🥤', type: 'drink', amount: 1 },
  { label: '+5 jetons', color: '#eab308', icon: '💎', type: 'mani', amount: 5 },
  { label: 'Ticket Jackpot', color: '#ec4899', icon: '🎟️', type: 'ticket', amount: 1 },
  { label: '+1 jeton', color: '#a855f7', icon: '🪙', type: 'mani', amount: 1 },
  { label: '30 Min PS5', color: '#10b981', icon: '⚡', type: 'time', amount: 30 },
  { label: 'Double XP 1h', color: '#f97316', icon: '👑', type: 'xp', amount: 1 }
];

export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Dans EA FC, quelle combinaison de touches active le tir puissant (Power Shot) ?",
    options: ["L1 + R1 + Tir", "L2 + R2 + Tir", "R1 + Carré", "L1 + Croix"],
    correctIndex: 0,
    game: "EA SPORTS FC"
  },
  {
    question: "Dans Tekken 8, comment s'appelle le nouveau système d'agression en combat ?",
    options: ["Rage Drive", "Heat System", "V-Trigger", "Max Mode"],
    correctIndex: 1,
    game: "TEKKEN 8"
  },
  {
    question: "Dans Call of Duty: Black Ops 6, quelle est la grande nouveauté de déplacement ?",
    options: ["Jetpack infini", "Omnimovement (Sprint 360°)", "Grappin tactique", "Téléportation"],
    correctIndex: 1,
    game: "CALL OF DUTY"
  },
  {
    question: "Quel combattant iconique de Mortal Kombat crie 'Get over here !' ?",
    options: ["Sub-Zero", "Raiden", "Scorpion", "Liu Kang"],
    correctIndex: 2,
    game: "MORTAL KOMBAT"
  },
  {
    question: "Combien de joueurs composent une équipe classique dans un tournoi Rocket League ?",
    options: ["2 joueurs", "3 joueurs", "4 joueurs", "5 joueurs"],
    correctIndex: 1,
    game: "ROCKET LEAGUE"
  }
];

export const QUIZ_QUESTIONS = DEFAULT_QUIZ_QUESTIONS;

export const DEFAULT_LOOTBOX_REWARDS: LootboxReward[] = [
  {
    id: 'rew-1',
    name: 'Pack Énergie Lounge',
    category: 'common',
    description: '1 Canette XXL fraîche (Red Bull ou Monster) offerte au bar du hub.',
    icon: '🥤',
    value_text: 'Boisson Offerte',
    color: '#3b82f6'
  },
  {
    id: 'rew-2',
    name: 'Bonus 30 Minutes PS5 Pro',
    category: 'rare',
    description: '30 minutes supplémentaires ajoutées immédiatement à votre solde de jeu.',
    icon: '⏳',
    value_text: '+30 min de Jeu',
    color: '#06b6d4'
  },
  {
    id: 'rew-3',
    name: 'Bourse de Jetons',
    category: 'rare',
    description: '5 jetons versés directement dans votre portefeuille numérique.',
    icon: '🪙',
    value_text: '+5 jetons',
    color: '#eab308'
  },
  {
    id: 'rew-4',
    name: 'Heure de Jeu Nocturne VIP',
    category: 'epic',
    description: '1 Heure complète offerte valable sur n\'importe quelle console de la salle.',
    icon: '👑',
    value_text: '+1 Heure Offerte',
    color: '#a855f7'
  },
  {
    id: 'rew-5',
    name: 'Golden Pass Tournoi (50% Off)',
    category: 'legendary',
    description: 'Réduction de 50% sur l\'inscription à la prochaine grande compétition du Sanctuaire.',
    icon: '🏆',
    value_text: '-50% Tournoi',
    color: '#ef4444'
  }
];

export const LOOTBOX_REWARDS_POOL = DEFAULT_LOOTBOX_REWARDS;

const DEFAULT_JUKEBOX_GENRES: JukeboxGenre[] = [
  {
    id: 'afro',
    name: 'Afro-Urbain & Brazza Beats',
    vibe: 'Ambiance dansante et chaleureuse du pays',
    now_playing: "Burna Boy, Rema, Innoss'B & Talents Locaux",
    votes: 38,
    color: '#f59e0b'
  },
  {
    id: 'trap',
    name: 'Trap & Hype Gaming',
    vibe: 'Basses lourdes pour compétiteurs 1v1',
    now_playing: 'Travis Scott, Gunna, Future & Drill',
    votes: 45,
    color: '#a855f7'
  },
  {
    id: 'synth',
    name: 'Synthwave & Cyberpunk Night',
    vibe: 'Néons rétrofuturistes et synthés 80s',
    now_playing: 'Carpenter Brut, Kavinsky, The Weeknd (80s Mix)',
    votes: 29,
    color: '#06b6d4'
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill & Focus',
    vibe: 'Détente pour session découverte et coop',
    now_playing: 'ChilledCow / Lofi Girl Gaming Session',
    votes: 19,
    color: '#10b981'
  }
];

const DEFAULT_JACKPOT = {
  currentPool: 185,
  prizeDesc: '185 jetons + 1 Manette PS5 Pro DualSense officielle gravée',
  totalTickets: 92
};

type QuestDef = Omit<DailyQuest, 'progress' | 'completed' | 'claimed'>;

const DEFAULT_DAILY_QUESTS: QuestDef[] = [
  {
    id: 'q-1',
    title: 'Entrée dans l\'Arène',
    description: 'Lancer ou disputer un défi amical dans le salon ou en face-à-face.',
    icon: '⚔️',
    mani_reward: 2,
    max_progress: 1
  },
  {
    id: 'q-2',
    title: 'Session d\'Entraînement',
    description: 'Accumuler au moins 1 heure de jeu enregistrée sur une station PS5 Pro.',
    icon: '⏳',
    mani_reward: 3,
    max_progress: 1
  },
  {
    id: 'q-3',
    title: 'Soutien du Sanctuaire',
    description: 'Encourager une Team dans les guerres de clan ou réagir sur le mur social.',
    icon: '🔥',
    mani_reward: 1,
    max_progress: 1
  }
];

interface UserGameState {
  streak_days: number;
  last_active_date: string | null;
  multiplier: number;
  last_spin_date: string | null;
  total_spins: number;
  jackpot_tickets: number;
  quest_progress: Record<string, { progress: number; completed: boolean; claimed: boolean }>;
}

const DEFAULT_USER_STATE: UserGameState = {
  streak_days: 3,
  last_active_date: null,
  multiplier: 1.2,
  last_spin_date: null,
  total_spins: 0,
  jackpot_tickets: 0,
  quest_progress: {}
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / mode prive : on ignore, Supabase reste la source de verite */
  }
}

// --- Etat memoire -----------------------------------------------------------
const cache = {
  wheel_segments: readLocal<WheelSegment[]>('sanctuary_wheel_segments', DEFAULT_WHEEL_SEGMENTS),
  lootbox_cost: readLocal<number>('sanctuary_lootbox_cost', 5),
  lootbox_rewards: readLocal<LootboxReward[]>('sanctuary_lootbox_rewards', DEFAULT_LOOTBOX_REWARDS),
  jukebox_genres: readLocal<JukeboxGenre[]>('sanctuary_jukebox_genres', DEFAULT_JUKEBOX_GENRES),
  quiz_questions: readLocal<QuizQuestion[]>('sanctuary_quiz_questions', DEFAULT_QUIZ_QUESTIONS),
  daily_quests: readLocal<QuestDef[]>('sanctuary_daily_quests', DEFAULT_DAILY_QUESTS),
  jackpot: readLocal<typeof DEFAULT_JACKPOT>('sanctuary_jackpot_data', DEFAULT_JACKPOT),
  user: readLocal<UserGameState>('sanctuary_user_game_state', DEFAULT_USER_STATE)
};

let version = 0;
let currentUserId: string | null = null;
let hydratedFor: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeGamification(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGamificationVersion() {
  return version;
}

// --- Persistance Supabase ---------------------------------------------------
type ConfigKey =
  | 'wheel_segments'
  | 'lootbox_cost'
  | 'lootbox_rewards'
  | 'jukebox_genres'
  | 'quiz_questions'
  | 'daily_quests'
  | 'jackpot';

async function persistConfig(key: ConfigKey, value: unknown) {
  const { error } = await supabase
    .from('gamification_config')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) console.error(`[gamification] echec upsert config "${key}" :`, error.message);
}

function persistUser(patch: Partial<UserGameState>) {
  if (!currentUserId) return;
  const row: Record<string, unknown> = { user_id: currentUserId, ...patch };
  supabase
    .from('user_gamification')
    .upsert(row, { onConflict: 'user_id' })
    .then(({ error }) => {
      if (error) console.error('[gamification] echec upsert joueur :', error.message);
    });
}

export function setCurrentUser(userId: string | null) {
  currentUserId = userId;
}

export async function hydrateGamification(userId: string | null) {
  if (hydratedFor === userId) return;
  hydratedFor = userId;
  currentUserId = userId;

  try {
    const { data: configRows } = await supabase
      .from('gamification_config')
      .select('key, value');
    (configRows || []).forEach((row: { key: string; value: unknown }) => {
      switch (row.key) {
        case 'wheel_segments':
          cache.wheel_segments = row.value as WheelSegment[];
          break;
        case 'lootbox_cost':
          cache.lootbox_cost = Number(row.value);
          break;
        case 'lootbox_rewards':
          cache.lootbox_rewards = row.value as LootboxReward[];
          break;
        case 'jukebox_genres':
          cache.jukebox_genres = row.value as JukeboxGenre[];
          break;
        case 'quiz_questions':
          cache.quiz_questions = row.value as QuizQuestion[];
          break;
        case 'daily_quests':
          cache.daily_quests = row.value as QuestDef[];
          break;
        case 'jackpot':
          cache.jackpot = { ...DEFAULT_JACKPOT, ...(row.value as object) };
          break;
      }
    });

    if (userId) {
      const { data: userRow } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (userRow) {
        cache.user = {
          streak_days: userRow.streak_days ?? DEFAULT_USER_STATE.streak_days,
          last_active_date: userRow.last_active_date ?? null,
          multiplier: Number(userRow.multiplier ?? DEFAULT_USER_STATE.multiplier),
          last_spin_date: userRow.last_spin_date ?? null,
          total_spins: userRow.total_spins ?? 0,
          jackpot_tickets: userRow.jackpot_tickets ?? 0,
          quest_progress: (userRow.quest_progress as UserGameState['quest_progress']) || {}
        };
      }
    }
    notify();
  } catch (e) {
    console.error('[gamification] hydratation impossible :', e);
  }
}

/** Hook React : s'abonne au store et declenche l'hydratation Supabase. */
export function useGamificationStore() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useSyncExternalStore(subscribeGamification, getGamificationVersion, getGamificationVersion);

  useEffect(() => {
    hydrateGamification(userId);
  }, [userId]);

  return gamificationStore;
}

// --- Store ------------------------------------------------------------------
export const gamificationStore = {
  // 1. Roue de la fortune
  getWheelSegments(): WheelSegment[] {
    return cache.wheel_segments;
  },

  saveWheelSegments(segments: WheelSegment[]) {
    cache.wheel_segments = segments;
    writeLocal('sanctuary_wheel_segments', segments);
    notify();
    persistConfig('wheel_segments', segments);
  },

  getSpinState(): { canSpin: boolean; lastSpinDate: string | null; totalSpins: number } {
    const today = new Date().toDateString();
    return {
      canSpin: cache.user.last_spin_date !== today,
      lastSpinDate: cache.user.last_spin_date,
      totalSpins: cache.user.total_spins
    };
  },

  recordSpin(rewardLabel: string) {
    const today = new Date().toDateString();
    cache.user = {
      ...cache.user,
      last_spin_date: today,
      total_spins: cache.user.total_spins + 1
    };
    notify();
    persistUser({
      last_spin_date: today,
      total_spins: cache.user.total_spins
    });
    return { canSpin: false, lastSpinDate: today, totalSpins: cache.user.total_spins, lastReward: rewardLabel };
  },

  resetSpinsForAll() {
    cache.user = { ...cache.user, last_spin_date: null, total_spins: 0 };
    notify();
    persistUser({ last_spin_date: null, total_spins: 0 });
  },

  // 4. Daily Streaks & Quetes
  getStreakData(): { days: number; lastActiveDate: string; multiplier: number } {
    return {
      days: cache.user.streak_days,
      lastActiveDate: cache.user.last_active_date || '',
      multiplier: cache.user.multiplier
    };
  },

  saveStreakData(data: { days: number; lastActiveDate: string; multiplier: number }) {
    cache.user = {
      ...cache.user,
      streak_days: data.days,
      last_active_date: data.lastActiveDate,
      multiplier: data.multiplier
    };
    notify();
    persistUser({
      streak_days: data.days,
      last_active_date: data.lastActiveDate,
      multiplier: data.multiplier
    });
  },

  getDailyQuests(): DailyQuest[] {
    return cache.daily_quests.map((q) => {
      const p = cache.user.quest_progress[q.id];
      return {
        ...q,
        progress: p?.progress ?? 0,
        completed: p?.completed ?? false,
        claimed: p?.claimed ?? false
      };
    });
  },

  saveDailyQuests(quests: DailyQuest[]) {
    const defs = quests.map(({ progress, completed, claimed, ...rest }) => rest);
    cache.daily_quests = defs;
    writeLocal('sanctuary_daily_quests', defs);
    notify();
    persistConfig('daily_quests', defs);
  },

  addDailyQuest(quest: Omit<DailyQuest, 'id' | 'progress' | 'completed' | 'claimed'>): DailyQuest {
    const newQuest = { ...quest, id: `quest_${Date.now()}` };
    this.saveDailyQuests([
      ...this.getDailyQuests(),
      { ...newQuest, progress: 0, completed: false, claimed: false }
    ]);
    return { ...newQuest, progress: 0, completed: false, claimed: false };
  },

  deleteDailyQuest(id: string) {
    const defs = cache.daily_quests.filter((q) => q.id !== id);
    cache.daily_quests = defs;
    writeLocal('sanctuary_daily_quests', defs);
    notify();
    persistConfig('daily_quests', defs);
  },

  claimQuest(questId: string) {
    const current = cache.user.quest_progress[questId] || { progress: 1, completed: true, claimed: false };
    cache.user = {
      ...cache.user,
      quest_progress: {
        ...cache.user.quest_progress,
        [questId]: { ...current, progress: current.progress || 1, completed: true, claimed: true }
      }
    };
    notify();
    persistUser({ quest_progress: cache.user.quest_progress });
  },

  // 5. Lootboxes
  getLootboxCost(): number {
    return cache.lootbox_cost;
  },

  setLootboxCost(cost: number) {
    cache.lootbox_cost = cost;
    notify();
    persistConfig('lootbox_cost', cost);
  },

  getLootboxRewards(): LootboxReward[] {
    return cache.lootbox_rewards;
  },

  saveLootboxRewards(rewards: LootboxReward[]) {
    cache.lootbox_rewards = rewards;
    notify();
    persistConfig('lootbox_rewards', rewards);
  },

  addLootboxReward(rew: Omit<LootboxReward, 'id'>): LootboxReward {
    const newRew: LootboxReward = { ...rew, id: `rew_${Date.now()}` };
    this.saveLootboxRewards([...cache.lootbox_rewards, newRew]);
    return newRew;
  },

  deleteLootboxReward(id: string) {
    this.saveLootboxRewards(cache.lootbox_rewards.filter((r) => r.id !== id));
  },

  // 6. Jukebox
  getJukeboxGenres(): JukeboxGenre[] {
    return cache.jukebox_genres;
  },

  saveJukeboxGenres(genres: JukeboxGenre[]) {
    cache.jukebox_genres = genres;
    notify();
    persistConfig('jukebox_genres', genres);
  },

  addJukeboxGenre(genre: Omit<JukeboxGenre, 'id' | 'votes'>): JukeboxGenre {
    const newG: JukeboxGenre = { ...genre, id: `genre_${Date.now()}`, votes: 1 };
    this.saveJukeboxGenres([...cache.jukebox_genres, newG]);
    return newG;
  },

  deleteJukeboxGenre(id: string) {
    this.saveJukeboxGenres(cache.jukebox_genres.filter((g) => g.id !== id));
  },

  resetJukeboxVotes() {
    const genres = cache.jukebox_genres.map((g) => ({ ...g, votes: 0 }));
    this.saveJukeboxGenres(genres);
    return genres;
  },

  voteGenre(genreId: string) {
    const genres = cache.jukebox_genres.map((g) =>
      g.id === genreId ? { ...g, votes: g.votes + 1 } : g
    );
    this.saveJukeboxGenres(genres);
    return genres;
  },

  // 7. Jackpot collectif
  getJackpotData(): { currentPool: number; prizeDesc: string; userTickets: number; totalTickets: number } {
    return {
      currentPool: cache.jackpot.currentPool,
      prizeDesc: cache.jackpot.prizeDesc,
      userTickets: cache.user.jackpot_tickets,
      totalTickets: cache.jackpot.totalTickets
    };
  },

  saveJackpotData(data: { currentPool: number; prizeDesc: string; userTickets: number; totalTickets: number }) {
    cache.jackpot = {
      currentPool: data.currentPool,
      prizeDesc: data.prizeDesc,
      totalTickets: data.totalTickets
    };
    cache.user = { ...cache.user, jackpot_tickets: data.userTickets };
    notify();
    persistConfig('jackpot', cache.jackpot);
    persistUser({ jackpot_tickets: data.userTickets });
  },

  buyJackpotTicket() {
    cache.jackpot = {
      ...cache.jackpot,
      currentPool: cache.jackpot.currentPool + 2,
      totalTickets: cache.jackpot.totalTickets + 1
    };
    cache.user = { ...cache.user, jackpot_tickets: cache.user.jackpot_tickets + 1 };
    notify();
    persistConfig('jackpot', cache.jackpot);
    persistUser({ jackpot_tickets: cache.user.jackpot_tickets });
    return this.getJackpotData();
  },

  resetJackpot(newPool: number = 50, newDesc: string = '50 jetons + Goodies Lounge') {
    cache.jackpot = { currentPool: newPool, prizeDesc: newDesc, totalTickets: 0 };
    cache.user = { ...cache.user, jackpot_tickets: 0 };
    notify();
    persistConfig('jackpot', cache.jackpot);
    persistUser({ jackpot_tickets: 0 });
    return this.getJackpotData();
  },

  // 3. Quizz Questions
  getQuizQuestions(): QuizQuestion[] {
    return cache.quiz_questions;
  },

  saveQuizQuestions(questions: QuizQuestion[]) {
    cache.quiz_questions = questions;
    notify();
    persistConfig('quiz_questions', questions);
  },

  addQuizQuestion(question: QuizQuestion): QuizQuestion {
    this.saveQuizQuestions([...cache.quiz_questions, question]);
    return question;
  },

  deleteQuizQuestion(index: number) {
    this.saveQuizQuestions(cache.quiz_questions.filter((_, i) => i !== index));
  }
};
