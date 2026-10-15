/**
 * Tournament Bracket, Predictions, Check-in & Rules Engine for Evazion.
 *
 * Les donnees sont persistees dans Supabase (table tournament_config) afin que
 * l'arbre arbitre par l'admin et les pronostics des joueurs soient partages
 * entre toutes les machines du hub. Un cache memoire + localStorage sert de
 * repli instantane (offline / avant hydratation) afin de conserver l'API
 * synchrone utilisee par les composants.
 */

import { useSyncExternalStore, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface BracketMatch {
  id: string;
  round: 'quarters' | 'semis' | 'final';
  round_label: string;
  player1: {
    id: string;
    name: string;
    avatar?: string;
    score?: number;
    team?: string;
  };
  player2: {
    id: string;
    name: string;
    avatar?: string;
    score?: number;
    team?: string;
  };
  winner_id?: string;
  status: 'upcoming' | 'live' | 'finished';
  station_label: string;
  scheduled_time: string;
}

export interface TournamentPrediction {
  id: string;
  user_id: string;
  user_name: string;
  match_id: string;
  predicted_winner_id: string;
  predicted_winner_name: string;
  mani_wager: number;
  potential_gain: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
}

export interface TournamentDetails {
  id: string;
  title: string;
  game: string;
  format: '1v1 Élimination Directe' | '2v2 Duo Cup' | 'Double Élimination';
  date: string;
  time: string;
  cashprize_fcfa: number;
  mani_pool: number;
  fee_fcfa: number;
  status: 'Inscriptions ouvertes' | 'En Direct (Live)' | 'Terminé';
  current_participants: number;
  max_participants: number;
  banner_url: string;
  featured: boolean;
  station_type: string;
}

const DEFAULT_MAIN_EVENT: TournamentDetails = {
  id: 't-main-fc26',
  title: 'BRAZZA CLASH MASTERS · EA SPORTS FC 26',
  game: 'EA SPORTS FC 26',
  format: '1v1 Élimination Directe',
  date: 'Samedi 4 Octobre 2026',
  time: '15h00 (Check-in 14h15)',
  cashprize_fcfa: 150000,
  mani_pool: 60,
  fee_fcfa: 5000,
  status: 'Inscriptions ouvertes',
  current_participants: 28,
  max_participants: 32,
  banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200',
  featured: true,
  station_type: 'PS5 Pro · Écrans 4K 144Hz'
};

const DEFAULT_BRACKET_MATCHES: BracketMatch[] = [
  // Quarts de finale
  {
    id: 'm-q1',
    round: 'quarters',
    round_label: 'Quart 1',
    player1: { id: 'p-1', name: 'Kratos_CG', team: 'IRON FIST CG', score: 3 },
    player2: { id: 'p-2', name: 'Ghost_Brazza', team: 'SANCTUARY SHADOWS', score: 1 },
    winner_id: 'p-1',
    status: 'finished',
    station_label: 'PS5 #1',
    scheduled_time: '15h15'
  },
  {
    id: 'm-q2',
    round: 'quarters',
    round_label: 'Quart 2',
    player1: { id: 'p-3', name: 'Apex_Sniper', team: 'FC BRAZZA', score: 4 },
    player2: { id: 'p-4', name: 'Viper_06', team: 'SANCTUARY SHADOWS', score: 2 },
    winner_id: 'p-3',
    status: 'finished',
    station_label: 'PS5 #2',
    scheduled_time: '15h30'
  },
  {
    id: 'm-q3',
    round: 'quarters',
    round_label: 'Quart 3',
    player1: { id: 'p-5', name: 'Junior_King', team: 'FC BRAZZA', score: 2 },
    player2: { id: 'p-6', name: 'Shadow_Strike', team: 'SANCTUARY SHADOWS', score: 0 },
    winner_id: 'p-5',
    status: 'finished',
    station_label: 'PS5 #3',
    scheduled_time: '15h45'
  },
  {
    id: 'm-q4',
    round: 'quarters',
    round_label: 'Quart 4',
    player1: { id: 'p-7', name: 'Brazza_Beast', team: 'IRON FIST CG', score: 1 },
    player2: { id: 'p-8', name: 'Darius_Prime', team: 'FC BRAZZA', score: 3 },
    winner_id: 'p-8',
    status: 'finished',
    station_label: 'PS5 #4',
    scheduled_time: '16h00'
  },

  // Demi-finales
  {
    id: 'm-s1',
    round: 'semis',
    round_label: 'Demi-Finale 1',
    player1: { id: 'p-1', name: 'Kratos_CG', team: 'IRON FIST CG', score: 2 },
    player2: { id: 'p-3', name: 'Apex_Sniper', team: 'FC BRAZZA', score: 1 },
    winner_id: 'p-1',
    status: 'finished',
    station_label: 'Arène Scène Centrale',
    scheduled_time: '16h30'
  },
  {
    id: 'm-s2',
    round: 'semis',
    round_label: 'Demi-Finale 2',
    player1: { id: 'p-5', name: 'Junior_King', team: 'FC BRAZZA', score: 1 },
    player2: { id: 'p-8', name: 'Darius_Prime', team: 'FC BRAZZA', score: 2 },
    winner_id: 'p-8',
    status: 'finished',
    station_label: 'Arène Scène Centrale',
    scheduled_time: '17h00'
  },

  // Grande Finale
  {
    id: 'm-f1',
    round: 'final',
    round_label: 'Grande Finale',
    player1: { id: 'p-1', name: 'Kratos_CG', team: 'IRON FIST CG', score: 2 },
    player2: { id: 'p-8', name: 'Darius_Prime', team: 'FC BRAZZA', score: 2 },
    status: 'live',
    station_label: 'Grande Scène Vidéoprojecteur 4K',
    scheduled_time: '17h45 (PROLONGATIONS EN COURS)'
  }
];

const DEFAULT_PREDICTIONS: TournamentPrediction[] = [
  {
    id: 'pred-1',
    user_id: 'user-player-1',
    user_name: 'Kratos_CG',
    match_id: 'm-f1',
    predicted_winner_id: 'p-1',
    predicted_winner_name: 'Kratos_CG',
    mani_wager: 3,
    potential_gain: 6,
    status: 'pending',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

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

const LOCAL_KEYS = {
  main_event: 'sanctuary_main_event_details',
  bracket_matches: 'sanctuary_bracket_matches',
  predictions: 'sanctuary_tournament_predictions'
} as const;

type TournamentKey = keyof typeof LOCAL_KEYS;

// --- Etat memoire -----------------------------------------------------------
const cache = {
  main_event: readLocal<TournamentDetails>(LOCAL_KEYS.main_event, DEFAULT_MAIN_EVENT),
  bracket_matches: readLocal<BracketMatch[]>(LOCAL_KEYS.bracket_matches, DEFAULT_BRACKET_MATCHES),
  predictions: readLocal<TournamentPrediction[]>(LOCAL_KEYS.predictions, DEFAULT_PREDICTIONS)
};

let version = 0;
let currentUserId: string | null = null;
let hydratedFor: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeTournament(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTournamentVersion() {
  return version;
}

// --- Persistance Supabase ---------------------------------------------------
function persistTournament(key: TournamentKey, value: unknown) {
  supabase
    .from('tournament_config')
    .upsert({ key, value }, { onConflict: 'key' })
    .then(({ error }) => {
      if (error) console.error(`[tournament] echec upsert "${key}" :`, error.message);
    });
}

function commit<K extends TournamentKey>(key: K, value: (typeof cache)[K]) {
  cache[key] = value;
  writeLocal(LOCAL_KEYS[key], value);
  notify();
  persistTournament(key, value);
}

export function setCurrentUser(userId: string | null) {
  currentUserId = userId;
}

export async function hydrateTournament(userId: string | null) {
  if (hydratedFor === userId) return;
  hydratedFor = userId;
  currentUserId = userId;

  try {
    const { data: rows } = await supabase.from('tournament_config').select('key, value');
    (rows || []).forEach((row: { key: string; value: unknown }) => {
      switch (row.key) {
        case 'main_event':
          cache.main_event = { ...DEFAULT_MAIN_EVENT, ...(row.value as object) };
          break;
        case 'bracket_matches':
          cache.bracket_matches = row.value as BracketMatch[];
          break;
        case 'predictions':
          cache.predictions = row.value as TournamentPrediction[];
          break;
      }
    });
    notify();
  } catch (e) {
    console.error('[tournament] hydratation impossible :', e);
  }
}

/** Hook React : s'abonne au store et declenche l'hydratation Supabase. */
export function useTournamentStore() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useSyncExternalStore(subscribeTournament, getTournamentVersion, getTournamentVersion);

  useEffect(() => {
    hydrateTournament(userId);
  }, [userId]);

  return tournamentDataStore;
}

// --- Store ------------------------------------------------------------------
export const tournamentDataStore = {
  getMainEvent(): TournamentDetails {
    return cache.main_event;
  },

  saveMainEvent(event: TournamentDetails) {
    commit('main_event', event);
  },

  getBracketMatches(): BracketMatch[] {
    return cache.bracket_matches;
  },

  saveBracketMatches(matches: BracketMatch[]) {
    commit('bracket_matches', matches);
  },

  updateBracketMatch(updated: BracketMatch) {
    commit('bracket_matches', cache.bracket_matches.map((m) => (m.id === updated.id ? updated : m)));
  },

  resetBracketMatches() {
    commit('bracket_matches', DEFAULT_BRACKET_MATCHES);
  },

  updateMatchScore(matchId: string, score1: number, score2: number, winnerId?: string) {
    const matches = cache.bracket_matches.map((m) => {
      if (m.id !== matchId) return m;
      const next: BracketMatch = {
        ...m,
        player1: { ...m.player1, score: score1 },
        player2: { ...m.player2, score: score2 }
      };
      if (winnerId) {
        next.winner_id = winnerId;
        next.status = 'finished';
      }
      return next;
    });
    commit('bracket_matches', matches);
  },

  getPredictions(): TournamentPrediction[] {
    return cache.predictions;
  },

  resolvePrediction(predId: string, status: 'won' | 'lost') {
    commit('predictions', cache.predictions.map((p) => (p.id === predId ? { ...p, status } : p)));
  },

  deletePrediction(predId: string) {
    commit('predictions', cache.predictions.filter((p) => p.id !== predId));
  },

  placePrediction(
    userId: string,
    userName: string,
    matchId: string,
    winnerId: string,
    winnerName: string,
    wagerMani: number
  ): TournamentPrediction {
    const newPred: TournamentPrediction = {
      id: `pred_${Date.now()}`,
      user_id: userId,
      user_name: userName,
      match_id: matchId,
      predicted_winner_id: winnerId,
      predicted_winner_name: winnerName,
      mani_wager: wagerMani,
      potential_gain: wagerMani * 2,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    commit('predictions', [newPred, ...cache.predictions]);
    return newPred;
  }
};
