/**
 * Community Social, Clan Wars, LFG & Achievements Engine for Evazion.
 *
 * Mur social et LFG : chaque message est une LIGNE (tables `social_posts`,
 * `lfg_posts`, `social_post_reactions` — migration 20261015_community_posts.sql).
 * Une publication expire apres 24 h, une annonce apres 72 h, la duree etant
 * imposee par la base. L'ecriture et la suppression sont filtrees par RLS :
 * seul l'auteur (ou un admin) peut supprimer.
 *
 * Clan Wars, evenements, succes et objectif mensuel restent dans le blob
 * `community_config` (reserve a l'admin) : ils ne sont pas ecrits par les
 * membres, donc le stockage par cle suffit.
 *
 * Un cache memoire + localStorage sert de repli instantane (offline / avant
 * hydratation) ; les getters restent synchrones pour les composants.
 */

import { useSyncExternalStore, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface ClanWarScore {
  team_id: string;
  points: number;
  duels_won: number;
  hours_logged: number;
  bonus_claimed: boolean;
}

export interface AuthorProfile {
  display_name: string;
  avatar_url: string | null;
  community_team: string | null;
  is_admin: boolean;
  is_banned: boolean;
  total_hours: number;
}

export interface SocialPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  team_id?: string;
  content: string;
  type: 'exploit' | 'clip' | 'announcement' | 'duel_result';
  created_at: string;
  /** Instant d'expiration impose par la base (24 h apres publication). */
  expires_at?: string;
  game?: string;
  clip_url?: string;
  /** Profil vivant de l'auteur (users_metadata), joint a la lecture. */
  profile?: AuthorProfile | null;
  likes: {
    fire: number;
    goat: number;
    bolt: number;
    clutch: number;
  };
  user_reactions?: Record<string, string>; // userId -> reactionType
}

export interface LfgPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rank_name: string;
  game: string;
  platform: 'PS5 Pro' | 'PC Ultra' | 'VR Suite';
  mode: '1v1 Sparring' | 'Ranked Duo' | 'Squad 4v4' | 'Co-op Chill';
  schedule: string;
  note: string;
  whatsapp_number?: string;
  created_at: string;
  /** Instant d'expiration impose par la base (72 h apres publication). */
  expires_at?: string;
  /** Profil vivant de l'auteur (users_metadata), joint a la lecture. */
  profile?: AuthorProfile | null;
  is_active: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'combat' | 'fidelite' | 'social' | 'prestige';
  mani_reward: number;
  unlocked: boolean;
  progress?: number;
  max_progress?: number;
}

const DEFAULT_CLAN_WARS: ClanWarScore[] = [
  { team_id: 'fc_brazza', points: 480, duels_won: 18, hours_logged: 84, bonus_claimed: false },
  { team_id: 'iron_fist_cg', points: 445, duels_won: 22, hours_logged: 71, bonus_claimed: false },
  { team_id: 'sanctuary_shadows', points: 390, duels_won: 14, hours_logged: 65, bonus_claimed: false }
];

// Mur social et LFG : aucun contenu de demonstration. Les seules donnees
// affichees sont celles des membres, stockees en base (24 h / 72 h de vie).
const DEFAULT_SOCIAL_POSTS: SocialPost[] = [];

const DEFAULT_LFG_POSTS: LfgPost[] = [];


// Soirees thematiques et objectif communautaire : aucune donnee de
// demonstration. Tout provient des tables community_events / community_goal
// et des demandes event_registrations (voir useCommunityEvents,
// useCommunityGoal, useEventRegistrations).

const DEFAULT_ACHIEVEMENTS: Achievement[] = [];

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
  clan_wars: 'sanctuary_clan_wars',
  social_posts: 'sanctuary_social_posts',
  lfg_posts: 'sanctuary_lfg_posts',
  achievements: 'sanctuary_achievements'
} as const;

type CommunityKey = keyof typeof LOCAL_KEYS;

/** Duree de vie d'une publication / d'une annonce, alignee sur la base. */
export const SOCIAL_POST_TTL_MS = 24 * 60 * 60 * 1000;
export const LFG_POST_TTL_MS = 72 * 60 * 60 * 1000;

// Les publications et annonces fictives (contenu de demonstration EAZTON)
// ont ete stockees dans localStorage par les versions precedentes. On purge
// ces cles une seule fois pour qu'un visiteur ne les revoi pas hors ligne.
const POSTS_LOCAL_PURGE_FLAG = 'sanctuary_posts_local_purged_v1';

// Les badges d'exemple ont ete stockes dans localStorage (et repris depuis
// community_config) par les versions precedentes. On purge la cle une seule
// fois : la table achievements (ou l'admin) est la seule source de verite.
const ACHIEVEMENTS_LOCAL_PURGE_FLAG = 'sanctuary_achievements_local_purged_v1';

// Caches de la version precedente : les soirees et l'objectif etaient des
// objets figes dans le navigateur (780h/1000h, 19 et 24 inscrits, contre 14).
// On les supprime, la base community_events / community_goal fait foi.
const LEGACY_EVENT_KEYS = ['sanctuary_community_events', 'sanctuary_monthly_hours_target'];

function purgeLegacyPostsCache() {
  try {
    LEGACY_EVENT_KEYS.forEach((key) => localStorage.removeItem(key));

    if (localStorage.getItem(ACHIEVEMENTS_LOCAL_PURGE_FLAG) !== '1') {
      localStorage.removeItem(LOCAL_KEYS.achievements);
      localStorage.setItem(ACHIEVEMENTS_LOCAL_PURGE_FLAG, '1');
    }

    if (localStorage.getItem(POSTS_LOCAL_PURGE_FLAG) === '1') return;
    localStorage.removeItem(LOCAL_KEYS.social_posts);
    localStorage.removeItem(LOCAL_KEYS.lfg_posts);
    localStorage.setItem(POSTS_LOCAL_PURGE_FLAG, '1');
  } catch {
    /* mode prive : sans consequence, la base est la source de verite */
  }
}

purgeLegacyPostsCache();

/** Retire du cache tout contenu dont la duree de vie est depassee. */
function isFresh(expiresAt: string | undefined, fallbackTtlMs: number): boolean {
  const limit = expiresAt ? new Date(expiresAt).getTime() : Date.now() + fallbackTtlMs;
  return Number.isFinite(limit) && limit > Date.now();
}

// --- Etat memoire -----------------------------------------------------------
const cache = {
  clan_wars: readLocal<ClanWarScore[]>(LOCAL_KEYS.clan_wars, DEFAULT_CLAN_WARS),
  social_posts: readLocal<SocialPost[]>(LOCAL_KEYS.social_posts, DEFAULT_SOCIAL_POSTS),
  lfg_posts: readLocal<LfgPost[]>(LOCAL_KEYS.lfg_posts, DEFAULT_LFG_POSTS),
  achievements: readLocal<Achievement[]>(LOCAL_KEYS.achievements, DEFAULT_ACHIEVEMENTS)
};

let version = 0;
let currentUserId: string | null = null;
let hydratedFor: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeCommunity(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCommunityVersion() {
  return version;
}

// --- Persistance Supabase ---------------------------------------------------
function persistCommunity(key: CommunityKey, value: unknown) {
  supabase
    .from('community_config')
    .upsert({ key, value }, { onConflict: 'key' })
    .then(({ error }) => {
      if (error) console.error(`[community] echec upsert "${key}" :`, error.message);
    });
}

function commit<K extends CommunityKey>(key: K, value: (typeof cache)[K]) {
  cache[key] = value;
  writeLocal(LOCAL_KEYS[key], value);
  notify();
  persistCommunity(key, value);
}

// --- Mur social + LFG : lecture / ecriture en tables ------------------------
const MISSING_TABLE = /does not exist|Could not find the table|PGRST205|schema cache/i;

function isMissingTable(error: { message?: string } | null): boolean {
  return !!error && MISSING_TABLE.test(error.message || '');
}

/**
 * Etat du backend des publications/annonces, pour ne pas afficher un fil vide
 * sans explication quand la migration n'a pas ete appliquee.
 */
export type CommunityPostsBackendState = 'checking' | 'ready' | 'missing' | 'error';

let postsBackendState: CommunityPostsBackendState = 'checking';

export function getCommunityPostsBackendState(): CommunityPostsBackendState {
  return postsBackendState;
}

function setPostsBackendState(state: CommunityPostsBackendState) {
  if (postsBackendState === state) return;
  postsBackendState = state;
  notify();
}

export const POSTS_MIGRATION_FILE = '20261015_community_posts.sql';

/**
 * Traduit une erreur Supabase en message exploitable : un message generique
 * ("reconnectez-vous") faisait perdre la cause reelle a l'utilisateur.
 */
export function describeCommunityPostError(error: any): string {
  const raw = String(error?.message || error || '');
  const code = String(error?.code || '');

  if (code === 'PGRST205' || MISSING_TABLE.test(raw)) {
    return `Base non mise a jour : applique la migration ${POSTS_MIGRATION_FILE} dans Supabase (SQL Editor).`;
  }
  if (code === '42501' || /row-level security|permission denied|not authorized/i.test(raw)) {
    return "Droits insuffisants : cette action est reservee a l'auteur de la publication ou a un admin.";
  }
  if (code === '23503' || /foreign key|violates/i.test(raw)) {
    return "Ton profil est introuvable en base : reconnecte-toi pour le recreer.";
  }
  if (code === '23505' || /duplicate key|already exists/i.test(raw)) {
    return 'Cette publication existe deja.';
  }
  if (code === 'PGRST301' || /JWT|JWT expired|invalid/i.test(raw)) {
    return 'Session expiree : reconnecte-toi puis republie.';
  }
  if (/Failed to fetch|NetworkError|fetch failed/i.test(raw)) {
    return 'Connexion impossible : verifie ton reseau et reessaie.';
  }
  return raw ? `Publication impossible : ${raw}` : 'Publication impossible, reessaie.';
}

type ReactionType = 'fire' | 'goat' | 'bolt' | 'clutch';

const EMPTY_LIKES = { fire: 0, goat: 0, bolt: 0, clutch: 0 };

/**
 * Supabase renvoie un objet pour une jointure 1-1, ou un tableau selon la
 * cardinalite detectee. On normalise les deux formes en AuthorProfile.
 */
function normalizeProfile(raw: any): AuthorProfile | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;

  const loyalty = Array.isArray(row.loyalty) ? row.loyalty[0] : row.loyalty;

  return {
    display_name: row.display_name || '',
    avatar_url: row.avatar_url || null,
    community_team: row.community_team || null,
    is_admin: row.is_admin === true,
    is_banned: row.is_banned === true,
    total_hours: Number(loyalty?.total_hours || 0)
  };
}

/** Remplace le contenu du cache sans toucher a `community_config`. */
function commitLocal<K extends 'social_posts' | 'lfg_posts' | 'achievements'>(
  key: K,
  value: (typeof cache)[K]
) {
  cache[key] = value;
  writeLocal(LOCAL_KEYS[key], value);
  notify();
}

/** Declenche la purge des contenus expires (la fonction est SECURITY DEFINER). */
async function purgeExpiredPosts() {
  try {
    await supabase.rpc('purge_expired_community_posts');
  } catch {
    /* table/fonction absente : la lecture reste filtree par expires_at */
  }
}

/**
 * Charge les publications vivantes + leurs reactions.
 * La policy de lecture filtre deja `expires_at > now()` : une publication
 * depassee n'est jamais renvoyee, meme si la purge physique n'a pas tourne.
 */
async function loadSocialPosts(): Promise<void> {
  const { data, error } = await supabase
    .from('social_posts')
    .select(`
      id, author_id, author_name, author_avatar, team_id, content, type, game,
      clip_url, created_at, expires_at,
      profile:users_metadata!social_posts_author_id_fkey(
        display_name, avatar_url, community_team, is_admin, is_banned,
        loyalty:loyalty_points(total_hours)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  // Migration pas encore appliquee : on affiche un fil vide plutot que de
  // laisser les anciennes donnees de demonstration.
  if (error) {
    if (isMissingTable(error)) {
      commitLocal('social_posts', []);
      setPostsBackendState('missing');
    } else {
      setPostsBackendState('error');
      console.error('[community] lecture social_posts :', error.message);
    }
    return;
  }
  setPostsBackendState('ready');

  const rows = data || [];
  const ids = rows.map((r: any) => r.id);
  let reactionRows: any[] = [];

  if (ids.length > 0) {
    const { data: reactions, error: reactErr } = await supabase
      .from('social_post_reactions')
      .select('post_id, user_id, reaction')
      .in('post_id', ids);

    if (!reactErr && reactions) reactionRows = reactions;
    else if (reactErr && !isMissingTable(reactErr)) {
      console.error('[community] lecture reactions :', reactErr.message);
    }
  }

  const now = Date.now();
  const posts: SocialPost[] = rows
    .filter((r: any) => isFresh(r.expires_at, SOCIAL_POST_TTL_MS))
    .map((r: any) => {
      const likes = { ...EMPTY_LIKES };
      const user_reactions: Record<string, string> = {};

      for (const reaction of reactionRows) {
        if (reaction.post_id !== r.id) continue;
        if (reaction.reaction in likes) likes[reaction.reaction as ReactionType] += 1;
        user_reactions[reaction.user_id] = reaction.reaction;
      }

      return {
        id: r.id,
        author_id: r.author_id,
        // Le profil vivant prime : un changement de pseudo ou d'avatar se
        // répercute immédiatement. Le snapshot sert de repli.
        author_name: normalizeProfile(r.profile)?.display_name || r.author_name,
        author_avatar: normalizeProfile(r.profile)?.avatar_url || r.author_avatar || undefined,
        team_id: r.team_id || undefined,
        content: r.content,
        type: r.type,
        game: r.game || undefined,
        clip_url: r.clip_url || undefined,
        created_at: r.created_at,
        expires_at: r.expires_at || new Date(now + SOCIAL_POST_TTL_MS).toISOString(),
        profile: normalizeProfile(r.profile),
        likes,
        user_reactions
      };
    });

  commitLocal('social_posts', posts);
}
/** Charge les annonces LFG vivantes. */
async function loadLfgPosts(): Promise<void> {
  const { data, error } = await supabase
    .from('lfg_posts')
    .select(`
      id, user_id, user_name, user_avatar, rank_name, game, platform, mode,
      schedule, note, whatsapp_number, is_active, created_at, expires_at,
      profile:users_metadata!lfg_posts_user_id_fkey(
        display_name, avatar_url, community_team, is_admin, is_banned,
        loyalty:loyalty_points(total_hours)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    if (isMissingTable(error)) commitLocal('lfg_posts', []);
    else console.error('[community] lecture lfg_posts :', error.message);
    return;
  }

  const posts: LfgPost[] = (data || [])
    .filter((r: any) => isFresh(r.expires_at, LFG_POST_TTL_MS))
    .map((r: any) => {
      const profile = normalizeProfile(r.profile);

      return {
        id: r.id,
        user_id: r.user_id,
        user_name: profile?.display_name || r.user_name,
        user_avatar: profile?.avatar_url || r.user_avatar || undefined,
        rank_name: r.rank_name,
        game: r.game,
        platform: r.platform,
        mode: r.mode,
        schedule: r.schedule,
        note: r.note,
        whatsapp_number: r.whatsapp_number || undefined,
        is_active: r.is_active !== false,
        created_at: r.created_at,
        expires_at: r.expires_at || new Date(Date.now() + LFG_POST_TTL_MS).toISOString(),
        profile
      };
    });

  commitLocal('lfg_posts', posts);
}

/** Rafraichit les deux flux (publie + annonces). */
export async function refreshCommunityPosts() {
  await Promise.all([purgeExpiredPosts(), loadSocialPosts(), loadLfgPosts()]);
}

// Rafraichissement periodique : un message expire doit disparaitre de l'ecran
// sans rechargement de la page. Singleton pour ne pas multiplier les timers.
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function ensurePostsRefreshTimer() {
  if (refreshTimer !== null) return;
  refreshTimer = setInterval(() => {
    void refreshCommunityPosts();
  }, 60_000);
}

export function setCurrentUser(userId: string | null) {
  currentUserId = userId;
}

export async function hydrateCommunity(userId: string | null) {
  if (hydratedFor === userId) return;
  hydratedFor = userId;
  currentUserId = userId;

  try {
    const { data: rows } = await supabase.from('community_config').select('key, value');
    (rows || []).forEach((row: { key: string; value: unknown }) => {
      switch (row.key) {
        case 'clan_wars':
          cache.clan_wars = row.value as ClanWarScore[];
          break;
        // social_posts, lfg_posts, community_events, monthly_hours_target et
        // achievements ne vivent plus dans community_config : ils sont lus
        // depuis leurs tables (hooks useCommunityEvents, useCommunityGoal,
        // useAchievements). La cle achievements a en plus ete purgee car elle
        // ressuscitait les badges d'exemple.
        break;
      }
    });
    notify();
  } catch (e) {
    console.error('[community] hydratation impossible :', e);
  }

  ensurePostsRefreshTimer();
  await refreshCommunityPosts();
}

/** Hook React : s'abonne au store et declenche l'hydratation Supabase. */
export function useCommunityStore() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useSyncExternalStore(subscribeCommunity, getCommunityVersion, getCommunityVersion);

  useEffect(() => {
    hydrateCommunity(userId);
  }, [userId]);

  return communityDataStore;
}

// --- Store ------------------------------------------------------------------
export const communityDataStore = {
  getClanWars(): ClanWarScore[] {
    return cache.clan_wars;
  },

  getSocialPosts(): SocialPost[] {
    return cache.social_posts.filter((p) => isFresh(p.expires_at, SOCIAL_POST_TTL_MS));
  },

  /**
   * Publie une publication (duree de vie 24 h imposee par la base).
   * L'API est asynchrone : le cache est mis a jour de facon optimiste, puis
   * recharge depuis la table pour refleter l'id et l'expiration reelles.
   */
  async addSocialPost(
    post: Omit<SocialPost, 'id' | 'created_at' | 'likes' | 'expires_at'>
  ): Promise<SocialPost> {
    const now = Date.now();
    const optimistic: SocialPost = {
      ...post,
      id: `tmp_${now}`,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + SOCIAL_POST_TTL_MS).toISOString(),
      likes: { ...EMPTY_LIKES },
      user_reactions: {}
    };
    commitLocal('social_posts', [optimistic, ...cache.social_posts]);

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          author_id: post.author_id,
          author_name: post.author_name,
          author_avatar: post.author_avatar ?? null,
          team_id: post.team_id ?? null,
          content: post.content,
          type: post.type,
          game: post.game ?? null,
          clip_url: post.clip_url ?? null
        })
        .select('id, created_at, expires_at')
        .single();

      if (error) throw error;

      commitLocal(
        'social_posts',
        cache.social_posts.map((p) =>
          p.id === optimistic.id
            ? {
                ...p,
                id: (data as any).id,
                created_at: (data as any).created_at,
                expires_at: (data as any).expires_at
              }
            : p
        )
      );

      // Recharge en arriere-plan pour rattacher le profil vivant de l'auteur.
      void loadSocialPosts();

      return cache.social_posts.find((p) => p.id === (data as any).id) || optimistic;
    } catch (e) {
      // Echec d'insertion : on retire la publication optimiste pour ne pas
      // laisser un message que personne d'autre ne voit.
      commitLocal('social_posts', cache.social_posts.filter((p) => p.id !== optimistic.id));
      throw e;
    }
  },

  /**
   * Ajoute / retire / remplace la reaction d'un joueur.
   * Une ligne par (post, joueur) en base : pas d'ecrasement des votes des autres.
   */
  async reactToPost(postId: string, reaction: ReactionType, userId: string): Promise<void> {
    const target = cache.social_posts.find((p) => p.id === postId);
    if (!target) return;

    const previous = target.user_reactions?.[userId];
    const wasSame = previous === reaction;

    // Mise a jour optimiste du cache.
    const likes = { ...(target.likes || EMPTY_LIKES) };
    const reactions = { ...(target.user_reactions || {}) };

    if (wasSame) {
      likes[reaction] = Math.max(0, likes[reaction] - 1);
      delete reactions[userId];
    } else {
      if (previous && likes[previous as ReactionType] > 0) likes[previous as ReactionType] -= 1;
      likes[reaction] += 1;
      reactions[userId] = reaction;
    }
    commitLocal(
      'social_posts',
      cache.social_posts.map((p) => (p.id === postId ? { ...p, likes, user_reactions: reactions } : p))
    );

    // Persistance : DELETE puis INSERT garantissent le "toggle" et le
    // changement de type sans dependre d'un upsert partiel.
    try {
      const { error: delErr } = await supabase
        .from('social_post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (delErr) throw delErr;

      if (!wasSame) {
        const { error: insErr } = await supabase
          .from('social_post_reactions')
          .insert({ post_id: postId, user_id: userId, reaction });

        if (insErr) throw insErr;
      }
    } catch (e: any) {
      // Rollback du cache puis rechargement depuis la base (source de verite).
      await loadSocialPosts();
      console.error('[community] reaction refusee :', e?.message || e);
      throw e;
    }
  },

  /** Supprime une publication. La base n'autorise que l'auteur ou un admin. */
  async deleteSocialPost(postId: string): Promise<void> {
    const backup = cache.social_posts;
    commitLocal('social_posts', backup.filter((p) => p.id !== postId));

    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', postId);
      if (error) throw error;
    } catch (e) {
      commitLocal('social_posts', backup);
      throw e;
    }
  },

  getLfgPosts(): LfgPost[] {
    return cache.lfg_posts.filter((p) => isFresh(p.expires_at, LFG_POST_TTL_MS));
  },

  /** Publie une annonce (duree de vie 72 h imposee par la base). */
  async addLfgPost(
    post: Omit<LfgPost, 'id' | 'created_at' | 'is_active' | 'expires_at'>
  ): Promise<LfgPost> {
    const now = Date.now();
    const optimistic: LfgPost = {
      ...post,
      id: `tmp_${now}`,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + LFG_POST_TTL_MS).toISOString(),
      is_active: true
    };
    commitLocal('lfg_posts', [optimistic, ...cache.lfg_posts]);

    try {
      const { data, error } = await supabase
        .from('lfg_posts')
        .insert({
          user_id: post.user_id,
          user_name: post.user_name,
          user_avatar: post.user_avatar ?? null,
          rank_name: post.rank_name,
          game: post.game,
          platform: post.platform,
          mode: post.mode,
          schedule: post.schedule,
          note: post.note,
          whatsapp_number: post.whatsapp_number ?? null
        })
        .select('id, created_at, expires_at')
        .single();

      if (error) throw error;

      commitLocal(
        'lfg_posts',
        cache.lfg_posts.map((p) =>
          p.id === optimistic.id
            ? {
                ...p,
                id: (data as any).id,
                created_at: (data as any).created_at,
                expires_at: (data as any).expires_at
              }
            : p
        )
      );

      // Recharge en arriere-plan pour rattacher le profil vivant de l'auteur.
      void loadLfgPosts();

      return cache.lfg_posts.find((p) => p.id === (data as any).id) || optimistic;
    } catch (e) {
      commitLocal('lfg_posts', cache.lfg_posts.filter((p) => p.id !== optimistic.id));
      throw e;
    }
  },

  /** Supprime une annonce. La base n'autorise que l'auteur ou un admin. */
  async deleteLfgPost(id: string): Promise<void> {
    const backup = cache.lfg_posts;
    commitLocal('lfg_posts', backup.filter((p) => p.id !== id));

    try {
      const { error } = await supabase.from('lfg_posts').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      commitLocal('lfg_posts', backup);
      throw e;
    }
  },

  // Les soirées et l'objectif communautaire ne passent plus par ce store :
  // lecture via useCommunityEvents / useCommunityGoal, inscriptions via
  // useEventRegistrations. Aucun compteur d'inscrits n'est calculé en local.

  getAchievements(): Achievement[] {
    return cache.achievements;
  },

  saveClanWars(scores: ClanWarScore[]) {
    commit('clan_wars', scores);
  },

  updateClanWar(teamId: string, points: number, duelsWon: number, hoursLogged: number) {
    const scores = cache.clan_wars.map((s) =>
      s.team_id === teamId ? { ...s, points, duels_won: duelsWon, hours_logged: hoursLogged } : s
    );
    commit('clan_wars', scores);
  },

  resetClanWars() {
    commit('clan_wars', DEFAULT_CLAN_WARS);
  },

  // Repli local uniquement (table achievements absente) : on n'ecrit plus
  // dans community_config pour ne pas ressusciter ces valeurs cote client.
  saveAchievements(achievements: Achievement[]) {
    commitLocal('achievements', achievements);
  },

  addAchievement(ach: Omit<Achievement, 'id'>): Achievement {
    const newAch: Achievement = { ...ach, id: `ach_${Date.now()}` };
    commitLocal('achievements', [...cache.achievements, newAch]);
    return newAch;
  },

  deleteAchievement(id: string) {
    commitLocal('achievements', cache.achievements.filter((a) => a.id !== id));
  }
};
