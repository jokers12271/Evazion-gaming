import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type BetStatus = 'open' | 'matched' | 'settled' | 'cancelled';

export interface TournamentBet {
  id: string;
  match_id: string;
  match_label: string;
  challenger_id: string;
  challenger_name: string;
  challenger_pick: string;
  acceptor_id: string | null;
  acceptor_name: string | null;
  acceptor_pick: string | null;
  stake: number;
  status: BetStatus;
  winner_side: string | null;
  created_at: string | null;
  matched_at: string | null;
  settled_at: string | null;
}

async function getMyBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('points')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.points ?? 0;
}

async function setMyBalance(userId: string, points: number) {
  const { error } = await supabase
    .from('loyalty_points')
    .update({ points })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export function useTournamentBets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tournament_bets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_bets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data || []) as TournamentBet[];
    },
    refetchInterval: 4000
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tournament_bets'] });
    queryClient.invalidateQueries({ queryKey: ['loyalty'] });
  };

  /**
   * Cree un pari. Le solde du createur est verifie puis debite (mise bloquee).
   */
  const createBet = async (
    challengerId: string,
    challengerName: string,
    matchId: string,
    matchLabel: string,
    pick: string,
    stake: number
  ) => {
    const balance = await getMyBalance(challengerId);
    if (balance < stake) throw new Error('Solde MANI insuffisant pour cette mise.');

    const { error } = await supabase.from('tournament_bets').insert({
      match_id: matchId,
      match_label: matchLabel,
      challenger_id: challengerId,
      challenger_name: challengerName,
      challenger_pick: pick,
      stake,
      status: 'open'
    });
    if (error) throw new Error(error.message);

    // Debit de la mise du createur (bloquee jusqu'au reglement).
    await setMyBalance(challengerId, balance - stake);
    invalidate();
  };

  /**
   * Accepte un pari. Verrou anti-concurrence : seul le premier a accepter
   * (status encore 'open') reussit. Le solde de l'accepteur est verifie et debite.
   */
  const acceptBet = async (
    betId: string,
    acceptorId: string,
    acceptorName: string,
    acceptorPick: string
  ) => {
    const { data: bet, error: readErr } = await supabase
      .from('tournament_bets')
      .select('*')
      .eq('id', betId)
      .maybeSingle();
    if (readErr || !bet) throw new Error('Pari introuvable.');
    if (bet.status !== 'open') throw new Error('Ce pari a deja ete accepte.');
    if (bet.challenger_id === acceptorId) throw new Error('Vous ne pouvez pas accepter votre propre pari.');
    if (bet.challenger_pick === acceptorPick) throw new Error("Vous devez miser sur l'equipe adverse.");

    const balance = await getMyBalance(acceptorId);
    if (balance < bet.stake) throw new Error('Solde MANI insuffisant pour accepter ce pari.');

    // Update conditionnel : garantit qu'un seul accepteur gagne la course.
    const { data: updated, error: upErr } = await supabase
      .from('tournament_bets')
      .update({
        acceptor_id: acceptorId,
        acceptor_name: acceptorName,
        acceptor_pick: acceptorPick,
        status: 'matched',
        matched_at: new Date().toISOString()
      })
      .eq('id', betId)
      .eq('status', 'open')
      .select();

    if (upErr) throw new Error(upErr.message);
    if (!updated || updated.length === 0) throw new Error('Ce pari vient d\'etre accepte par un autre joueur.');

    await setMyBalance(acceptorId, balance - bet.stake);
    invalidate();
  };

  /** Annule un pari encore ouvert (createur) : rembourse la mise. */
  const cancelBet = async (betId: string) => {
    const { data: bet } = await supabase
      .from('tournament_bets')
      .select('*')
      .eq('id', betId)
      .maybeSingle();
    if (!bet || bet.status !== 'open') throw new Error('Ce pari ne peut plus etre annule.');

    const { error } = await supabase
      .from('tournament_bets')
      .update({ status: 'cancelled', settled_at: new Date().toISOString() })
      .eq('id', betId)
      .eq('status', 'open');
    if (error) throw new Error(error.message);

    // Remboursement du createur.
    const balance = await getMyBalance(bet.challenger_id);
    await setMyBalance(bet.challenger_id, balance + bet.stake);
    invalidate();
  };

  /**
   * Regle un pari quand le match est termine.
   * winnerSide = equipe gagnante. Le perdant transfere sa mise au gagnant.
   * En cas de match nul (winnerSide vide), les deux mises sont remboursees.
   */
  const settleBet = async (betId: string, winnerSide: string | null) => {
    const { data: bet, error: readErr } = await supabase
      .from('tournament_bets')
      .select('*')
      .eq('id', betId)
      .maybeSingle();
    if (readErr || !bet) throw new Error('Pari introuvable.');
    if (bet.status !== 'matched') throw new Error('Ce pari ne peut pas etre regle.');

    const challengerWon = winnerSide === bet.challenger_pick;
    const acceptorWon = winnerSide === bet.acceptor_pick;

    if (winnerSide === null) {
      // Match nul : remboursement des deux mises.
      const cb = await getMyBalance(bet.challenger_id);
      await setMyBalance(bet.challenger_id, cb + bet.stake);
      const ab = await getMyBalance(bet.acceptor_id);
      await setMyBalance(bet.acceptor_id, ab + bet.stake);
    } else if (challengerWon) {
      const wb = await getMyBalance(bet.challenger_id);
      await setMyBalance(bet.challenger_id, wb + bet.stake * 2);
    } else if (acceptorWon) {
      const wb = await getMyBalance(bet.acceptor_id);
      await setMyBalance(bet.acceptor_id, wb + bet.stake * 2);
    }

    const { error } = await supabase
      .from('tournament_bets')
      .update({ status: 'settled', winner_side: winnerSide, settled_at: new Date().toISOString() })
      .eq('id', betId);
    if (error) throw new Error(error.message);
    invalidate();
  };

  /** Supprime un pari (admin uniquement). */
  const deleteBet = async (betId: string) => {
    const { error } = await supabase.from('tournament_bets').delete().eq('id', betId);
    if (error) throw new Error(error.message);
    invalidate();
  };

  return {
    bets: query.data ?? [],
    openBets: (query.data ?? []).filter((b) => b.status === 'open'),
    isLoading: query.isLoading,
    createBet,
    acceptBet,
    cancelBet,
    settleBet,
    deleteBet
  };
}
