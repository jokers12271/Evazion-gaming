import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { describeEventError } from '@/hooks/useCommunityEvents';

/**
 * Objectif communautaire.
 *
 * Ligne unique (id = 'current') dans `community_goal`, migration
 * 20261016_community_events.sql. Avant, l'objectif etait un objet fige dans
 * community_config puis recopie dans le navigateur : seule l'admin pouvait le
 * modifier et les valeurs restaient figees pour tout le monde.
 */

export interface CommunityGoalRow {
  id: string;
  label: string;
  title: string;
  current_hours: number;
  target_hours: number;
  reward_text: string;
  is_active: boolean;
  updated_at: string;
  /** Jours restants avant la fin du mois, calcule a l'affichage. */
  days_left?: number;
}

export type CommunityGoalInput = Pick<
  CommunityGoalRow,
  'label' | 'title' | 'current_hours' | 'target_hours' | 'reward_text' | 'is_active'
>;

const MISSING_TABLE = /does not exist|Could not find the table|PGRST205|schema cache/i;

/** Jours restants jusqu'a la fin du mois courant. */
export function daysLeftInMonth(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function useCommunityGoal() {
  return useQuery({
    queryKey: ['community_goal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_goal')
        .select('*')
        .eq('id', 'current')
        .maybeSingle();

      if (error) {
        if (MISSING_TABLE.test(error.message || '')) return null as CommunityGoalRow | null;
        throw error;
      }

      if (!data) return null as CommunityGoalRow | null;

      return {
        ...data,
        current_hours: Number(data.current_hours || 0),
        target_hours: Number(data.target_hours || 0),
        days_left: daysLeftInMonth(),
      } as CommunityGoalRow;
    },
  });
}

/** Cree l'objectif s'il n'existe pas encore. */
export function useCreateCommunityGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('community_goal')
        .insert({
          id: 'current',
          label: 'Objectif Communautaire',
          title: '',
          current_hours: 0,
          target_hours: 1000,
          reward_text: '',
          is_active: true,
          updated_by: userData?.user?.id || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as CommunityGoalRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community_goal'] }),
    onError: (error) => {
      console.error('[community] creation objectif impossible :', error);
    },
  });
}

/** Modifie l'objectif (admin). L'upsert cree la ligne si elle manque. */
export function useSaveCommunityGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<CommunityGoalInput>) => {
      const { data: userData } = await supabase.auth.getUser();

      const row = {
        id: 'current',
        label: payload.label?.trim() || 'Objectif Communautaire',
        title: payload.title?.trim() || '',
        current_hours: Number(payload.current_hours || 0),
        target_hours: Number(payload.target_hours || 1000),
        reward_text: payload.reward_text?.trim() || '',
        is_active: payload.is_active !== false,
        updated_by: userData?.user?.id || null,
      };

      if (row.target_hours <= 0) throw new Error("L'objectif doit etre superieur a 0.");
      if (row.current_hours < 0) throw new Error('Les heures ne peuvent pas etre negatives.');

      const { data, error } = await supabase
        .from('community_goal')
        .upsert(row, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) throw error;
      return data as CommunityGoalRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community_goal'] }),
    onError: (error) => console.error('[community] enregistrement objectif impossible :', error),
  });
}

/** Retire l'objectif de l'affichage (admin). */
export function useDeleteCommunityGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('community_goal').delete().eq('id', 'current');
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community_goal'] }),
    onError: (error) => console.error('[community] suppression objectif impossible :', error),
  });
}
