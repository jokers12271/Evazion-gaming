import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HallOfFameEntry {
  id: number;
  user_id: string;
  title: string;
  month_label: string | null;
  position: number;
  created_at: string;
}

export interface HallOfFameRow extends HallOfFameEntry {
  profile: {
    display_name: string;
    avatar_url: string;
    community_team: string | null;
    total_hours: number;
    is_admin: boolean;
  } | null;
}

/**
 * Hall of Fame du Sanctuary.
 *
 * Table alimentee uniquement par l'admin (migration 20261014_hall_of_fame.sql).
 * Chaque entree reference un vrai compte users_metadata, donc pas de gagnants
 * fictifs : le profil, le pseudo, la team, le rang et le compteur viennent de
 * la base. Si la table n'existe pas encore, le module renvoie une liste vide
 * plutot que de lever une erreur.
 */
export function useHallOfFame() {
  return useQuery({
    queryKey: ['hall_of_fame'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hall_of_fame')
        .select(`
          id, user_id, title, month_label, position, created_at,
          profile:users_metadata!hall_of_fame_user_id_fkey(
            display_name, avatar_url, community_team, is_admin,
            loyalty_points:loyalty_points(total_hours)
          )
        `)
        .order('position', { ascending: true });

      if (error) {
        // Table absente (migration non appliquee) : pas de Hall of Fame.
        if (/does not exist|Could not find the table|PGRST205/i.test(error.message)) return [];
        throw error;
      }

      return (data || [])
        .map((row: any) => {
          const meta = Array.isArray(row.profile) ? row.profile[0] : row.profile;
          const loyalty = meta?.loyalty_points;
          const hours = Array.isArray(loyalty) ? loyalty[0]?.total_hours : loyalty?.total_hours;

          return {
            ...row,
            profile: meta
              ? {
                  display_name: meta.display_name || 'Gamer',
                  avatar_url: meta.avatar_url || '',
                  community_team: meta.community_team || null,
                  total_hours: hours || 0,
                  is_admin: meta.is_admin === true,
                }
              : null,
          } as HallOfFameRow;
        })
        // Les comptes administrateurs n'ont pas leur place au Hall of Fame.
        .filter((row) => !row.profile || !row.profile.is_admin);
    },
  });
}

/** Ajoute un joueur au Hall of Fame (admin). */
export function useAddHallOfFame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, position, title, monthLabel }: {
      userId: string;
      position: number;
      title: string;
      monthLabel?: string;
    }) => {
      const { error } = await supabase.from('hall_of_fame').insert([{
        user_id: userId,
        position,
        title,
        month_label: monthLabel || null,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hall_of_fame'] });
    },
  });
}

/** Retire un joueur du Hall of Fame (admin). */
export function useRemoveHallOfFame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('hall_of_fame').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hall_of_fame'] });
    },
  });
}