import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { communityDataStore } from '@/lib/communityData';

/**
 * Badges & Trophées.
 *
 * Table `achievements` (migration 20261019_achievements.sql). Les badges
 * vivaient auparavant dans community_config puis dans le localStorage de
 * chaque navigateur : impossible pour l'en admin de créer, modifier ou
 * masquer un badge, et son édition n'était visible que chez lui.
 *
 * `status = 'inactive'` masque le badge aux joueurs, la policy de lecture
 * garde la ligne visible pour l'admin.
 */

export type AchievementCategory = 'combat' | 'fidelite' | 'social' | 'prestige';
export type AchievementStatus = 'active' | 'inactive';

export interface AchievementRow {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  mani_reward: number;
  /** Regles d'obtention affichees aux joueurs. */
  unlock_rule: string;
  status: AchievementStatus;
  unlocked: boolean;
  progress: number;
  max_progress: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AchievementInput = Omit<AchievementRow, 'id' | 'created_at' | 'updated_at'>;

const MISSING_TABLE = /does not exist|Could not find the table|PGRST205|schema cache/i;

function isMissingTable(error: { message?: string } | null) {
  return !!error && MISSING_TABLE.test(error.message || '');
}

/**
 * Repli si la migration n'est pas encore appliquee : on lit les badges du
 * store local plutot que d'ouvrir une vitrine vide. L'admin ne peut rien
 * editer dans cet etat, ce qui est signale par describeAchievementError.
 */
function readLocalFallback(): AchievementRow[] {
  try {
    return communityDataStore.getAchievements().map((ach, index) => ({
      id: ach.id,
      title: ach.title,
      description: ach.description || '',
      icon: ach.icon || '🏆',
      category: ach.category,
      mani_reward: Number(ach.mani_reward || 0),
      unlock_rule: '',
      status: 'active' as const,
      unlocked: ach.unlocked === true,
      progress: Number(ach.progress || 0),
      max_progress: typeof ach.max_progress === 'number' ? ach.max_progress : null,
      sort_order: index + 1,
      created_at: '',
      updated_at: '',
    }));
  } catch {
    return [];
  }
}

/** Traduit une erreur Supabase en message francais exploitable. */
export function describeAchievementError(error: any): string {
  const raw = String(error?.message || error || '');
  const code = String(error?.code || '');

  if (code === 'PGRST205' || MISSING_TABLE.test(raw)) {
    return 'Base non mise a jour : applique la migration 20261019_achievements.sql dans Supabase (SQL Editor).';
  }
  if (code === '42501' || /row-level security|permission denied/i.test(raw)) {
    return 'Action reservee a un administrateur.';
  }
  if (code === '23505' || /duplicate key|unique/i.test(raw)) {
    return 'Ce badge existe deja.';
  }
  if (/Failed to fetch|NetworkError/i.test(raw)) {
    return 'Connexion impossible : verifie ton reseau.';
  }
  return raw || 'Operation impossible.';
}

/**
 * Liste des badges.
 *
 * @param includeInactive lit aussi les badges masques (admin).
 */
export function useAchievements(includeInactive = false) {
  return useQuery({
    queryKey: ['achievements', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('achievements')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      // Hors migration, la policy ne renvoie que les badges actifs : le
      // filtre client evite un etat "masque" qui n'est pas un vrai etat.
      if (!includeInactive) query = query.eq('status', 'active');

      const { data, error } = await query;

      if (error) {
        if (isMissingTable(error)) return readLocalFallback();
        throw error;
      }

      return ((data || []) as any[]).map((row) => ({
        ...row,
        mani_reward: Number(row.mani_reward || 0),
        progress: Number(row.progress || 0),
        max_progress: row.max_progress === null ? null : Number(row.max_progress),
      })) as AchievementRow[];
    },
  });
}

/** Cree un badge (admin). */
export function useCreateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<AchievementInput>) => {
      const { data, error } = await supabase
        .from('achievements')
        .insert({
          title: payload.title?.trim() || 'Nouveau badge',
          description: payload.description?.trim() || '',
          icon: payload.icon?.trim() || '🏆',
          category: payload.category || 'prestige',
          mani_reward: Number(payload.mani_reward || 0),
          unlock_rule: payload.unlock_rule?.trim() || '',
          status: payload.status || 'active',
          unlocked: payload.unlocked === true,
          progress: Number(payload.progress || 0),
          max_progress: payload.max_progress ? Number(payload.max_progress) : null,
          sort_order: Number(payload.sort_order || 0),
        })
        .select('*')
        .single();

      if (error) {
        if (isMissingTable(error)) {
          const list = communityDataStore.getAchievements();
          const newAch = {
            id: `local_${Date.now()}`,
            title: payload.title?.trim() || 'Nouveau badge',
            description: payload.description?.trim() || '',
            icon: payload.icon?.trim() || '🏆',
            category: payload.category || 'prestige',
            mani_reward: Number(payload.mani_reward || 0),
            unlocked: false,
            progress: Number(payload.progress || 0),
            max_progress: payload.max_progress ? Number(payload.max_progress) : undefined,
          };
          communityDataStore.saveAchievements([...list, newAch]);
          return {
            ...newAch,
            unlock_rule: payload.unlock_rule?.trim() || '',
            status: payload.status || 'active',
            max_progress: newAch.max_progress ?? null,
            sort_order: list.length + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as AchievementRow;
        }
        throw error;
      }
      return data as AchievementRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

/** Modifie un badge (admin). */
export function useUpdateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<AchievementInput> }) => {
      const patch: Record<string, unknown> = { ...payload };

      if (payload.mani_reward !== undefined) patch.mani_reward = Number(payload.mani_reward || 0);
      if (payload.progress !== undefined) patch.progress = Number(payload.progress || 0);
      if (payload.max_progress !== undefined) {
        patch.max_progress = payload.max_progress ? Number(payload.max_progress) : null;
      }

      const { data, error } = await supabase
        .from('achievements')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        if (isMissingTable(error)) {
          const list = communityDataStore.getAchievements();
          const updated = list.map((a) => (a.id === id ? { ...a, ...payload } : a));
          communityDataStore.saveAchievements(updated);
          const found = updated.find((a) => a.id === id);
          return {
            id,
            title: found?.title || '',
            description: found?.description || '',
            icon: found?.icon || '🏆',
            category: found?.category || 'prestige',
            mani_reward: Number(found?.mani_reward || 0),
            unlock_rule: (payload as any).unlock_rule || '',
            status: (payload as any).status || 'active',
            unlocked: found?.unlocked === true,
            progress: Number(found?.progress || 0),
            max_progress: typeof found?.max_progress === 'number' ? found.max_progress : null,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as AchievementRow;
        }
        throw error;
      }
      return data as AchievementRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

/** Supprime un badge (admin). */
export function useDeleteAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('achievements').delete().eq('id', id);
      if (error) {
        if (isMissingTable(error)) {
          const list = communityDataStore.getAchievements();
          communityDataStore.saveAchievements(list.filter((a) => a.id !== id));
          return;
        }
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['achievements'] }),
  });
}
