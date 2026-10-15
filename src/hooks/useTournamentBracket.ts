import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type BracketFormat = 'single' | 'double';
export type BracketSystem = 'cup' | 'league';
export type MatchStatus = 'pending' | 'live' | 'finished';

export interface BracketMatch {
  id: string;
  bracket_id: string;
  round: number;
  position: number;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  winner: string | null;
  status: MatchStatus;
  match_date: string | null;
  leg: number;
  sort_order: number;
}

export interface BracketConfig {
  id: string;
  teams: string[];
  team_count: number;
  format: BracketFormat;
  system: BracketSystem;
  is_generated: boolean;
  updated_at?: string;
}

const DEFAULT_CONFIG: BracketConfig = {
  id: 'main',
  teams: [],
  team_count: 8,
  format: 'single',
  system: 'cup',
  is_generated: false
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Score cumulé d'une double confrontation (aller + retour).
 * Le retour inverse les camps : le joueur 1 de l'aller est joueur 2 au retour.
 */
export function aggregateTie(leg1: BracketMatch, leg2?: BracketMatch | null) {
  const s1 = leg1.score1 ?? 0;
  const s2 = leg1.score2 ?? 0;
  const r1 = leg2?.score1 ?? 0;
  const r2 = leg2?.score2 ?? 0;

  const player1Agg = s1 + r2;
  const player2Agg = s2 + r1;
  const bothPlayed = leg1.status === 'finished' && (!leg2 || leg2.status === 'finished');

  let winner: string | null = null;
  if (bothPlayed) {
    if (player1Agg > player2Agg) winner = leg1.player1;
    else if (player2Agg > player1Agg) winner = leg1.player2;
  }

  return { leg1, leg2: leg2 ?? null, player1Agg, player2Agg, winner, bothPlayed };
}

export function buildCupMatches(teams: string[], format: BracketFormat): Omit<BracketMatch, 'bracket_id'>[] {
  const size = nextPowerOfTwo(Math.max(teams.length, 2));
  const slots: (string | null)[] = [...teams];
  while (slots.length < size) slots.push(null);

  const matches: Omit<BracketMatch, 'bracket_id'>[] = [];
  const firstRoundCount = size / 2;

  for (let i = 0; i < firstRoundCount; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];
    const isBye = (p1 && !p2) || (!p1 && p2);
    const autoWinner = isBye ? (p1 || p2) : null;

    matches.push({
      id: `r1-${i}`,
      round: 1,
      position: i,
      player1: p1 || '',
      player2: p2 || '',
      score1: null,
      score2: null,
      winner: autoWinner,
      status: autoWinner ? 'finished' : 'pending',
      match_date: null,
      leg: 1,
      sort_order: i
    });

  }

  let round = 2;
  let count = firstRoundCount / 2;
  while (count >= 1) {
    for (let i = 0; i < count; i++) {
      matches.push({
        id: `r${round}-${i}`,
        round,
        position: i,
        player1: '',
        player2: '',
        score1: null,
        score2: null,
        winner: null,
        status: 'pending',
        match_date: null,
        leg: 1,
        sort_order: round * 100 + i
      });
    }
    if (count === 1) break;
    count = count / 2;
    round++;
  }

  // Aller-retour : un match retour pour CHAQUE tour SAUF la finale,
  // qui se joue toujours en un seul match décisif.
  if (format === 'double') {
    const finalRound = Math.max(...matches.map((m) => m.round));
    const returns = matches
      .filter((m) => m.round < finalRound)
      .map((m) => ({
        ...m,
        id: `${m.id}-ret`,
        player1: m.player2,
        player2: m.player1,
        score1: null,
        score2: null,
        winner: null,
        status: 'pending' as MatchStatus,
        match_date: null,
        leg: 2,
        sort_order: m.sort_order + 1000
      }));
    return [...matches, ...returns];
  }

  return matches;
}

export function buildLeagueMatches(teams: string[], format: BracketFormat): Omit<BracketMatch, 'bracket_id'>[] {
  const matches: Omit<BracketMatch, 'bracket_id'>[] = [];
  let idx = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `lg-${i}-${j}`,
        round: 1,
        position: idx,
        player1: teams[i],
        player2: teams[j],
        score1: null,
        score2: null,
        winner: null,
        status: 'pending',
        match_date: null,
        leg: 1,
        sort_order: idx
      });
      if (format === 'double') {
        matches.push({
          id: `lg-${i}-${j}-ret`,
          round: 1,
          position: idx,
          player1: teams[j],
          player2: teams[i],
          score1: null,
          score2: null,
          winner: null,
          status: 'pending',
          match_date: null,
          leg: 2,
          sort_order: idx + 1000
        });
      }
      idx++;
    }
  }
  return matches;
}

export function makeDraw(teams: string[], format: BracketFormat, system: BracketSystem) {
  const shuffledTeams = shuffle(teams);
  const matches = system === 'league'
    ? buildLeagueMatches(shuffledTeams, format)
    : buildCupMatches(shuffledTeams, format);
  return { teams: shuffledTeams, matches };
}

export function useTournamentBracket(bracketId = 'main') {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['tb_config', bracketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_bracket_config')
        .select('*')
        .eq('id', bracketId)
        .maybeSingle();
      if (error || !data) return DEFAULT_CONFIG;
      return data as BracketConfig;
    },
    refetchInterval: 4000
  });

  const matchesQuery = useQuery({
    queryKey: ['tb_matches', bracketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('bracket_id', bracketId)
        .order('sort_order', { ascending: true });
      if (error) return [];
      return (data || []) as BracketMatch[];
    },
    refetchInterval: 4000
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tb_config', bracketId] });
    queryClient.invalidateQueries({ queryKey: ['tb_matches', bracketId] });
  };

  const saveConfig = async (config: Partial<BracketConfig>) => {
    const payload = { id: bracketId, ...config, updated_at: new Date().toISOString() };
    await supabase.from('tournament_bracket_config').upsert(payload, { onConflict: 'id' });
    invalidate();
  };

  const runDraw = async (teams: string[], format: BracketFormat, system: BracketSystem) => {
    const { teams: shuffled, matches } = makeDraw(teams, format, system);

    const { error: cfgError } = await supabase.from('tournament_bracket_config').upsert({
      id: bracketId,
      teams: shuffled,
      team_count: shuffled.length,
      format,
      system,
      is_generated: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (cfgError) throw new Error(`Configuration : ${cfgError.message}`);

    const { error: delError } = await supabase.from('tournament_matches').delete().eq('bracket_id', bracketId);
    if (delError) throw new Error(`Suppression : ${delError.message}`);

    const batch = Date.now().toString(36);
    const rows = matches.map((m) => ({ ...m, id: `${bracketId}-${batch}-${m.id}`, bracket_id: bracketId }));
    if (rows.length > 0) {
      const { error: insError } = await supabase.from('tournament_matches').insert(rows);
      if (insError) throw new Error(`Insertion : ${insError.message}`);
    }
    invalidate();
    return rows.length;
  };

  const updateMatch = async (match: BracketMatch, allMatches: BracketMatch[]) => {
    const { error } = await supabase.from('tournament_matches').upsert({
      ...match,
      bracket_id: bracketId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) throw new Error(error.message);

    const format = configQuery.data?.format ?? 'single';

    let tieWinner: string | null = null;
    let tieFinished = false;

    if (format === 'double') {
      const leg1 = match.leg === 1
        ? match
        : allMatches.find((m) => m.round === match.round && m.position === match.position && m.leg === 1);
      const leg2 = match.leg === 2
        ? match
        : allMatches.find((m) => m.round === match.round && m.position === match.position && m.leg === 2);
      if (leg1) {
        const agg = aggregateTie(leg1, leg2 ?? undefined);
        tieWinner = agg.winner;
        tieFinished = agg.bothPlayed && Boolean(agg.winner);
      }
    } else if (match.status === 'finished') {
      tieWinner = match.winner;
      tieFinished = Boolean(tieWinner);
    }

    if (tieFinished && tieWinner) {
      const nextRound = match.round + 1;
      const nextPosition = Math.floor(match.position / 2);
      const isFirstSlot = match.position % 2 === 0;

      const nextLeg1 = allMatches.find(
        (m) => m.round === nextRound && m.position === nextPosition && m.leg === 1
      );
      if (nextLeg1) {
        const slot = isFirstSlot ? { player1: tieWinner } : { player2: tieWinner };
        const { error: p1 } = await supabase
          .from('tournament_matches')
          .update({ ...slot, updated_at: new Date().toISOString() })
          .eq('id', nextLeg1.id);
        if (p1) throw new Error(p1.message);
      }

      if (format === 'double') {
        const nextLeg2 = allMatches.find(
          (m) => m.round === nextRound && m.position === nextPosition && m.leg === 2
        );
        if (nextLeg2) {
          const inverseSlot = isFirstSlot ? { player2: tieWinner } : { player1: tieWinner };
          await supabase
            .from('tournament_matches')
            .update({ ...inverseSlot, updated_at: new Date().toISOString() })
            .eq('id', nextLeg2.id);
        }
      }
    }
    invalidate();
  };

  const resetScores = async () => {
    const { error } = await supabase.from('tournament_matches')
      .update({ score1: null, score2: null, winner: null, status: 'pending' })
      .eq('bracket_id', bracketId);
    if (error) throw new Error(error.message);
    invalidate();
  };

  /** Supprime entierement l'arbre : matchs + configuration. */
  const deleteBracket = async () => {
    const { error: delError } = await supabase
      .from('tournament_matches')
      .delete()
      .eq('bracket_id', bracketId);
    if (delError) throw new Error(delError.message);

    const { error: cfgError } = await supabase
      .from('tournament_bracket_config')
      .update({ teams: [], team_count: 0, is_generated: false, updated_at: new Date().toISOString() })
      .eq('id', bracketId);
    if (cfgError) throw new Error(cfgError.message);

    invalidate();
  };

  return {
    config: configQuery.data ?? DEFAULT_CONFIG,
    matches: matchesQuery.data ?? [],
    isLoading: configQuery.isLoading || matchesQuery.isLoading,
    saveConfig,
    runDraw,
    updateMatch,
    resetScores,
    deleteBracket
  };
}

/** Supprime l'arbre (matchs + config) d'un tournoi donne (sans instance de hook). */
export async function deleteBracketData(bracketId: string) {
  await supabase.from('tournament_matches').delete().eq('bracket_id', bracketId);
  await supabase.from('tournament_bracket_config').delete().eq('id', bracketId);
}

export interface BracketNotice {
  tournamentId: string;
  tournamentTitle: string;
  drawStamp: string;
  matchLabel: string;
  slot: string;
  opponent: string;
}

/**
 * Notices de placement apres tirage : pour chaque arbre genere ou le joueur
 * apparait, on renvoie son 1er match (position + adversaire).
 */
export function useMyBracketNotices(displayName?: string) {
  return useQuery({
    queryKey: ['bracket_notices', displayName],
    queryFn: async (): Promise<BracketNotice[]> => {
      if (!displayName) return [];

      const { data: configs, error } = await supabase
        .from('tournament_bracket_config')
        .select('*')
        .eq('is_generated', true);
      if (error) return [];

      const mine = (configs || []).filter((c: any) => (c.teams || []).includes(displayName));
      if (mine.length === 0) return [];

      const ids = mine.map((c: any) => c.id as string);

      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('*')
        .in('bracket_id', ids)
        .eq('leg', 1)
        .eq('round', 1)
        .order('position', { ascending: true });

      const { data: tourneys } = await supabase
        .from('tournaments')
        .select('id, title')
        .in('id', ids);
      const titleMap = new Map((tourneys || []).map((t: any) => [t.id, t.title]));

      const notices: BracketNotice[] = [];
      for (const cfg of mine) {
        const first = (matches || []).find(
          (m: any) => m.bracket_id === cfg.id && (m.player1 === displayName || m.player2 === displayName)
        );
        if (!first) continue;
        const isP1 = first.player1 === displayName;
        const opponent = (isP1 ? first.player2 : first.player1) || '';
        notices.push({
          tournamentId: cfg.id,
          tournamentTitle: titleMap.get(cfg.id) || 'Tournoi',
          drawStamp: cfg.updated_at || '',
          matchLabel: `Match ${first.position + 1}`,
          slot: isP1 ? 'Équipe 1' : 'Équipe 2',
          opponent: opponent || 'Exempt (bye)'
        });
      }
      return notices;
    },
    enabled: !!displayName,
    refetchInterval: 8000
  });
}
