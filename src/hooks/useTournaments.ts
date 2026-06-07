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
}

export function useTournaments() {
  const queryClient = useQueryClient();

  // On extrait "data" et on lui donne une valeur par défaut []
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
    tournaments: query.data ?? [], // Retourne un tableau vide si pas encore chargé
    isLoading: query.isLoading,
    isError: query.isError,
    addTournament, 
    updateTournament, 
    deleteTournament 
  };
}