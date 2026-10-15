import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export function useGames() {
  const queryClient = useQueryClient();

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data } = await supabase.from('games').select('*');
      return data || [];
    }
  });

  const addGame = useMutation({
    mutationFn: async (newGame: { title: string; category: string; description: string; image_url: string }) => {
      const { data } = await supabase.from('games').insert(newGame);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success("Jeu ajouté à la ludothèque !");
    }
  });

  const deleteGame = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('games').delete().eq('id', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success("Jeu retiré de la ludothèque.");
    }
  });

  return {
    games,
    addGame,
    deleteGame,
    isLoading
  };
}
