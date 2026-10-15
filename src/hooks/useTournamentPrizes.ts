import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TournamentPrize {
  tournament_id?: string;
  place: number;
  title: string;
  badge: string;
  cashprize: number;
  mani: number;
  ps5_hours: number;
  extra: string;
}

export const DEFAULT_PRIZE_TEMPLATES: TournamentPrize[] = [
  { place: 1, title: '1ère Place', badge: 'CHAMPION', cashprize: 90000, mani: 30, ps5_hours: 5, extra: '+ Trophée Officiel The Sanctuary gravé' },
  { place: 2, title: '2ème Place', badge: 'VICE-CHAMPION', cashprize: 45000, mani: 18, ps5_hours: 2, extra: '' },
  { place: 3, title: '3ème Place', badge: 'PODIUM', cashprize: 15000, mani: 12, ps5_hours: 1, extra: '' }
];

export function useTournamentPrizes(tournamentId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tournament_prizes', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_prizes')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('place', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as TournamentPrize[];
    },
    enabled: !!tournamentId
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tournament_prizes', tournamentId] });
  };

  /** Enregistre le podium (1, 2 ou 3 places) et supprime les places en trop. */
  const savePrizes = async (prizes: TournamentPrize[]) => {
    if (!tournamentId) throw new Error('Tournoi introuvable');
    const now = new Date().toISOString();
    const { error } = await supabase.from('tournament_prizes').upsert(
      prizes.map((p) => ({ ...p, tournament_id: tournamentId, updated_at: now })),
      { onConflict: 'tournament_id,place' }
    );
    if (error) throw new Error(error.message);

    const keep = prizes.map((p) => p.place);
    const { data: existing } = await supabase
      .from('tournament_prizes')
      .select('place')
      .eq('tournament_id', tournamentId);
    const obsolete = (existing || []).map((r) => r.place as number).filter((pl) => !keep.includes(pl));
    if (obsolete.length > 0) {
      const { error: delErr } = await supabase
        .from('tournament_prizes')
        .delete()
        .eq('tournament_id', tournamentId)
        .in('place', obsolete);
      if (delErr) throw new Error(delErr.message);
    }

    invalidate();
  };

  /** Supprime un prix unique. */
  const deletePrize = async (place: number) => {
    const { error } = await supabase
      .from('tournament_prizes')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('place', place);
    if (error) throw new Error(error.message);
    invalidate();
  };

  /** Supprime tout le podium de ce tournoi. */
  const deleteAllPrizes = async () => {
    const { error } = await supabase
      .from('tournament_prizes')
      .delete()
      .eq('tournament_id', tournamentId);
    if (error) throw new Error(error.message);
    invalidate();
  };

  return {
    prizes: query.data ?? [],
    isLoading: query.isLoading,
    savePrizes,
    deletePrize,
    deleteAllPrizes
  };
}
