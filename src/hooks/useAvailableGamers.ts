import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAvailableGamers() {
  const { data: gamers = [] } = useQuery({
    queryKey: ['available_gamers'],
    queryFn: async () => {
      const { data } = await supabase.from('users_metadata').select('*');
      return data || [];
    }
  });

  return {
    gamers
  };
}
