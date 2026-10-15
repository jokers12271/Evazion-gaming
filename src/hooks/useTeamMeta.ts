import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Statut et avantages des teams.
 *
 * Colonnes prevues dans team_configs (migration 20261013_team_qg_admin.sql) mais
 * absentes des bases actuelle : on utilise donc community_settings, table
 * cle/valeur deja presente, avec une cle par team : "team_meta:<team_id>".
 * Des que la migration est appliquee, le QG lit d'abord team_configs.
 */

export interface TeamMeta {
  status?: string;
  perks?: string;
}

const PREFIX = 'team_meta:';

const keyOf = (teamId: string) => `${PREFIX}${teamId}`;

function parseMeta(raw: any): TeamMeta {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as TeamMeta;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

/** Statut + avantages de toutes les teams, indexes par team_id. */
export function useTeamMetas() {
  return useQuery({
    queryKey: ['team_metas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_settings')
        .select('key,value')
        .like('key', `${PREFIX}%`);

      if (error) throw error;

      const map: Record<string, TeamMeta> = {};
      (data || []).forEach((row: any) => {
        map[String(row.key).slice(PREFIX.length)] = parseMeta(row.value);
      });
      return map;
    },
  });
}

/** Enregistre le statut + les avantages d'une team (admin). */
export function useSaveTeamMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, meta }: { teamId: string; meta: TeamMeta }) => {
      const row = {
        key: keyOf(teamId),
        value: JSON.stringify(meta),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('community_settings')
        .upsert(row, { onConflict: 'key' });
      if (!error) return;

      // Repli si l'upsert echoue (contrainte absente ou policies restrictives).
      const { data: updated, error: updErr } = await supabase
        .from('community_settings')
        .update(row)
        .eq('key', row.key)
        .select('key');

      if (updErr) throw updErr;
      if (updated && updated.length > 0) return;

      const { error: insErr } = await supabase.from('community_settings').insert([row]);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_metas'] });
    },
  });
}