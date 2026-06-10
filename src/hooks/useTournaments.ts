import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Tournament {
  id: string
  title: string
  game: string
  date: string
  description: string
  status: string
  image_url: string
  is_paid?: boolean       // AJOUTÉ (Déclaré pour la base de données)
  fee_amount?: number     // AJOUTÉ (Déclaré pour la base de données)
  payment_phone?: string   // AJOUTÉ (Déclaré pour la base de données)
}

export function useTournaments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      return data as Tournament[]
    }
  })

  const addTournament = useMutation({
    mutationFn: async (newTourney: Omit<Tournament, 'id'>) => {
      const { error } = await supabase.from('tournaments').insert([newTourney]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournaments'] })
  });

  const updateTournament = useMutation({
    mutationFn: async (updatedTourney: Tournament) => {
      const { error } = await supabase
        .from('tournaments')
        .update(updatedTourney)
        .eq('id', updatedTourney.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournaments'] })
  });

  const deleteTournament = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tournaments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournaments'] })
  });

  return { 
    tournaments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addTournament, 
    updateTournament, 
    deleteTournament 
  };
}