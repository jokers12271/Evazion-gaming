import { supabase } from '@/lib/supabase';

/**
 * Colonnes optionnelles de team_configs (statut / avantages).
 * Elles n'existent pas encore en base : leur ajout est joue par
 * supabase/migrations/20261013_team_qg_admin.sql. Tant qu'elles manquent,
 * le statut et les avantages sont stockes dans community_settings.
 */
export const TEAM_CONFIG_OPTIONAL_COLUMNS = ['status', 'perks'] as const;

export function isMissingColumnError(err: any): boolean {
  const message = err?.message || '';
  return (
    err?.code === '42703' ||
    err?.code === 'PGRST204' ||
    /column .* does not exist|column .* of .* in the schema cache/i.test(message)
  );
}

export type TeamConfigPayload = {
  monthly_fee: number;
  join_fee: number;
  payment_phone?: string;
  updated_at: string;
  status?: string;
  perks?: string;
};

/**
 * Ecrit une ligne de team_configs quelle que soit son etat :
 * la table peut etre vide (insert), la ligne existe deja (upsert/update),
 * la contrainte d'unicite sur team_id peut manquer, et les colonnes
 * status / perks peuvent ne pas exister sur une base non migree.
 *
 * Retourne 'team_configs' si tout a ete ecrit dans la table,
 * 'community_settings' si le repli cle/valeur a ete necessaire.
 */
export async function saveTeamConfig(teamId: string, payload: TeamConfigPayload): Promise<'team_configs' | 'community_settings'> {
  const base = {
    team_id: teamId,
    monthly_fee: Number(payload.monthly_fee) || 0,
    join_fee: Number(payload.join_fee) || 0,
    payment_phone: payload.payment_phone || '+242 06 612 34 56',
    updated_at: payload.updated_at,
  };
  const full = { ...base, status: payload.status, perks: payload.perks };

  // 1. Colonnes optionnelles absentes : uniquement les frais.
  if (isMissingColumnError(await upsertTeamConfig(full))) {
    return writeTeamConfig(base) ? 'team_configs' : 'community_settings';
  }

  // 2. Version complete.
  const written = await writeTeamConfig(full);
  return written ? 'team_configs' : 'community_settings';
}

async function upsertTeamConfig(payload: Record<string, any>) {
  const { error } = await supabase.from('team_configs').upsert(payload, { onConflict: 'team_id' });
  return error;
}

/** Retourne false si aucune ligne n'a pu etre ecrite (RLS ou table absente). */
async function writeTeamConfig(payload: Record<string, any>): Promise<boolean> {
  const { data: updated, error: updErr } = await supabase
    .from('team_configs')
    .update(payload)
    .eq('team_id', payload.team_id)
    .select('team_id');

  if (!updErr && updated && updated.length > 0) return true;
  if (updErr && !isPermissionError(updErr)) throw updErr;

  const { error: insErr } = await supabase.from('team_configs').insert([payload]);
  if (!insErr) return true;
  if (isPermissionError(insErr)) return false;
  throw insErr;
}

function isPermissionError(err: any) {
  return err?.code === '42501' || /row-level security|permission denied/i.test(err?.message || '');
}