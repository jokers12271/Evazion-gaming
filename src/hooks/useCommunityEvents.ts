import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Soirees thematiques du Sanctuary.
 *
 * Table `community_events` (migration 20261016_community_events.sql) : une
 * ligne par soiree, donc plus de compteur d'inscrits fabrique en dur. Les
 * frais d'inscription et le paiement a distance sont des colonnes, pas du
 * texte libre.
 *
 * Si la migration n'est pas encore appliquee, le hook renvoie une liste vide
 * plutot que de lever : le bloc affiche alors son etat vide.
 */

export interface CommunityEventRow {
  id: string;
  title: string;
  category: string;
  game: string;
  date_str: string;
  time_str: string;
  image_url: string | null;
  description: string;
  reward_text: string;
  /** Conditions affichees au joueur avant qu'il accepte sa demande. */
  conditions: string;
  /** Frais d'inscription (0 = gratuit). */
  entry_fee: number;
  /** Le joueur peut-il regler a distance ? */
  remote_payment_allowed: boolean;
  max_slots: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Nombre d'inscrits confirmes, fourni par la fonction SQL. */
  confirmed_count?: number;
}

export type CommunityEventInput = Omit<
  CommunityEventRow,
  'id' | 'created_at' | 'updated_at' | 'confirmed_count'
>;

const MISSING_TABLE = /does not exist|Could not find the table|PGRST205|schema cache/i;

function isMissingTable(error: { message?: string } | null) {
  return !!error && MISSING_TABLE.test(error.message || '');
}

/** Traduit une erreur Supabase en message francais exploitable. */
export function describeEventError(error: any): string {
  const raw = String(error?.message || error || '');
  const code = String(error?.code || '');

  if (code === 'PGRST205' || MISSING_TABLE.test(raw)) {
    return "Base non mise a jour : applique la migration 20261016_community_events.sql dans Supabase (SQL Editor).";
  }
  if (code === '42501' || /row-level security|permission denied/i.test(raw)) {
    return 'Action reservee a un administrateur.';
  }
  if (code === '23505' || /duplicate key|unique/i.test(raw)) {
    return 'Cet element existe deja.';
  }
  if (/Failed to fetch|NetworkError/i.test(raw)) {
    return 'Connexion impossible : verifie ton reseau.';
  }
  return raw || 'Operation impossible.';
}

export function useCommunityEvents() {
  return useQuery({
    queryKey: ['community_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTable(error)) return [] as CommunityEventRow[];
        throw error;
      }

      const rows = (data || []) as CommunityEventRow[];

      // Le nombre d'inscrits vient d'une fonction SECURITY DEFINER : on ne peut
      // pas compter via event_registrations car un visiteur anonyme n'a pas le
      // droit de lire les demandes des autres (policy limitee a l'admin et au
      // proprietaire).
      let counts: Record<string, number> = {};

      const { data: countRows } = await supabase.rpc('event_confirmed_counts');

      if (countRows) {
        counts = (countRows as any[]).reduce((acc: Record<string, number>, row: any) => {
          acc[row.event_id] = Number(row.confirmed_count || 0);
          return acc;
        }, {});
      }

      return rows.map((row) => ({
        ...row,
        entry_fee: Number(row.entry_fee || 0),
        confirmed_count: counts[row.id] || 0,
      }));
    },
  });
}

/** Cree une soiree (admin). */
export function useCreateCommunityEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<CommunityEventInput>) => {
      const { data: userData } = await supabase.auth.getUser();
      const row = {
        title: payload.title || 'Nouvelle soirée',
        category: payload.category || 'Fight Night',
        game: payload.game || '',
        date_str: payload.date_str || '',
        time_str: payload.time_str || '',
        image_url: payload.image_url || null,
        description: payload.description || '',
        reward_text: payload.reward_text || '',
        conditions: payload.conditions || '',
        entry_fee: Number(payload.entry_fee || 0),
        remote_payment_allowed: payload.remote_payment_allowed === true,
        max_slots: payload.max_slots ? Number(payload.max_slots) : null,
        is_active: payload.is_active !== false,
        created_by: userData?.user?.id || null,
      };

      const { data, error } = await supabase
        .from('community_events')
        .insert(row)
        .select('id')
        .single();

      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community_events'] }),
  });
}

/** Met a jour une soiree (admin). */
export function useUpdateCommunityEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CommunityEventInput> }) => {
      const patch: Record<string, unknown> = { ...payload };
      if (payload.entry_fee !== undefined) patch.entry_fee = Number(payload.entry_fee || 0);
      if (payload.max_slots !== undefined) {
        patch.max_slots = payload.max_slots ? Number(payload.max_slots) : null;
      }

      const { data, error } = await supabase
        .from('community_events')
        .update(patch)
        .eq('id', id)
        .select('id')
        .single();

      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community_events'] }),
  });
}

/** Supprime une soiree (admin). Les demandes liees partent en cascade. */
export function useDeleteCommunityEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('community_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community_events'] }),
  });
}
