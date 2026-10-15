import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export function useTeams() {
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await supabase.from('teams').select('*');
      return data || [];
    }
  });

  const addTeam = useMutation({
    mutationFn: async (newTeam: any) => {
      const { data } = await supabase.from('teams').insert(newTeam);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    }
  });

  const updateTeam = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await supabase.from('teams').update(payload).eq('id', id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    }
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('teams').delete().eq('id', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    }
  });

  return {
    teams,
    isLoading,
    addTeam,
    updateTeam,
    deleteTeam
  };
}
