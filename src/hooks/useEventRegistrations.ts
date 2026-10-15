import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { describeEventError } from '@/hooks/useCommunityEvents';
import { toast } from 'react-hot-toast';

/**
 * Demandes d'inscription aux soirees thematiques.
 *
 * Le joueur accepte les conditions -> demande 'pending'.
 * L'admin valide ('confirmed') ou refuse ('rejected'), ce qui met a jour la
 * demande et notifie le joueur. Aucun Cote client ne peut s'auto-valider : la
 * policy d'insertion impose status = 'pending' (migration 20261016).
 */

export type RegistrationStatus = 'pending' | 'confirmed' | 'rejected';
export type PaymentMethod = 'onsite' | 'remote';

export interface EventRegistrationRow {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  conditions_accepted_at: string;
  payment_method: PaymentMethod;
  payment_amount: number;
  payment_reference: string | null;
  payment_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_note: string | null;
  created_at: string;
  /** Profil du joueur, joint pour l'affichage côté admin. */
  player?: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    is_admin: boolean;
  } | null;
}

const MISSING_TABLE = /does not exist|Could not find the table|PGRST205|schema cache/i;

const invalidate = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['event_registrations'] });
  queryClient.invalidateQueries({ queryKey: ['my_event_registrations'] });
  queryClient.invalidateQueries({ queryKey: ['community_events'] });
};

/**
 * Nombre de demandes en attente, toutes soirées confondues.
 *
 * Sert au badge de la section et à la bannière admin. Passe par une fonction
 * SECURITY DEFINER car la policy de lecture de event_registrations n'ouvre que
 * l'admin, et compter ligne à ligne côté client échouerait à chaque re-rendu.
 */
export function usePendingRegistrationCount() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['pending_registrations', userId],
    enabled: !!userId,
    refetchInterval: 20000,
    queryFn: async () => {
      const { data: metadata } = await supabase
        .from('users_metadata')
        .select('is_admin')
        .eq('user_id', userId)
        .maybeSingle();

      if (!(metadata as any)?.is_admin) return 0;

      const { data } = await supabase.rpc('event_pending_count');
      return Number((data as any) || 0);
    },
  });
}

/**
 * Demandes d'une soiree. Reserve a l'admin : la policy de lecture n'autorise
 * l'admin que le detail des inscrits.
 */
export function useEventRegistrations(eventId?: string) {
  return useQuery({
    queryKey: ['event_registrations', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) return [] as EventRegistrationRow[];

      // Pas d'embed PostgREST vers users_metadata : la relation doit etre
      // nommee exactement comme la contrainte FK. On lit les demandes, puis on
      // recupere les profils a part. Plus lent en apparence, mais fiable quel
      // que soit le nom de la contrainte, et lisible si l'admin n'a pas les
      // droits (on affiche l'ID plutot que de disparaitre silencieusement).
      const { data, error } = await supabase
        .from('event_registrations')
        .select(
          'id, event_id, user_id, status, conditions_accepted_at, payment_method, payment_amount, payment_reference, payment_note, reviewed_by, reviewed_at, admin_note, created_at'
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        if (MISSING_TABLE.test(error.message || '')) return [] as EventRegistrationRow[];
        if (error.code === '42501') {
          // Policy : seul l'admin lit les demandes d'une soiree.
          throw new Error("Acces refuse : seule l'administration peut consulter les inscrits.");
        }
        throw error;
      }

      const rows = (data || []) as EventRegistrationRow[];
      if (rows.length === 0) return rows;

      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));

      const { data: profiles } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, avatar_url, is_admin')
        .in('user_id', userIds);

      const profilesById = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      return rows.map((row) => ({
        ...row,
        payment_amount: Number(row.payment_amount || 0),
        player: profilesById.get(row.user_id) || null,
      }));
    },
  });
}

/**
 * Demande d'inscription du joueur connecte, toutes soirees confondues.
 * Permet d'afficher "Presence confirmee" ou "Demande en attente" sans que le
 * joueur ait a re-cliquer.
 */
export function useMyEventRegistrations() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['my_event_registrations', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [] as EventRegistrationRow[];

      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, event_id, user_id, status, payment_amount, payment_method, admin_note, created_at')
        .eq('user_id', userId);

      if (error) {
        if (MISSING_TABLE.test(error.message || '')) return [] as EventRegistrationRow[];
        throw error;
      }

      return (data || []).map((row: any) => ({
        ...row,
        payment_amount: Number(row.payment_amount || 0),
      })) as EventRegistrationRow[];
    },
  });
}

/**
 * Previent chaque administrateur qu'une demande d'inscription attend une
 * validation. Ne leve jamais : la demande est deja enregistree, une
 * notification manquante ne doit pas faire croire a l'echec au joueur.
 */
async function notifyAdminsOfRegistration({
  eventId,
  playerName,
  entryFee,
  paymentMethod,
  isUpdate = false,
}: {
  eventId: string;
  playerName: string;
  entryFee: number;
  paymentMethod: PaymentMethod;
  isUpdate?: boolean;
}) {
  try {
    // Titre de la soiree : le message doit rester lisible dans la liste.
    const { data: event } = await supabase
      .from('community_events')
      .select('title')
      .eq('id', eventId)
      .maybeSingle();

    const eventTitle = (event as any)?.title || 'une soirée';

    const { data: admins } = await supabase
      .from('users_metadata')
      .select('user_id')
      .eq('is_admin', true);

    if (!admins || admins.length === 0) return;

    const payment = paymentMethod === 'remote' ? 'paiement a distance' : 'reglement sur place';
    const fee = entryFee > 0 ? ` - ${entryFee.toFixed(0)} credits (${payment})` : ' (gratuit)';

    const message = isUpdate
      ? `Demande mise a jour : @${playerName} a modifie sa demande pour "${eventTitle}"${fee}. A valider dans Communaute > Quetes & Soirees.`
      : `Nouvelle demande d'inscription : @${playerName} souhaite rejoindre "${eventTitle}"${fee}. A valider dans Communaute > Quetes & Soirees.`;

    const { error } = await supabase.from('notifications').insert(
      admins.map((admin: any) => ({ user_id: admin.user_id, message }))
    );

    if (error) {
      console.error('[community] notification admin non envoyee :', error.message);
    }
  } catch (e) {
    console.error('[community] notification admin impossible :', e);
  }
}

export interface SubmitRegistrationInput {
  eventId: string;
  entryFee: number;
  remotePaymentAllowed: boolean;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentNote?: string;
}

/** Le joueur accepte les conditions et envoie sa demande. */
export function useSubmitEventRegistration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitRegistrationInput) => {
      if (!user) throw new Error('Connectez-vous pour vous inscrire.');

      // Le reglement a distance n'est propose que si l'admin l'autorise.
      const method: PaymentMethod =
        input.remotePaymentAllowed && input.paymentMethod === 'remote' ? 'remote' : 'onsite';

      const row = {
        event_id: input.eventId,
        user_id: user.id,
        status: 'pending',
        conditions_accepted_at: new Date().toISOString(),
        payment_method: method,
        payment_amount: input.entryFee || 0,
        payment_reference: method === 'remote' ? input.paymentReference?.trim() || null : null,
        payment_note: input.paymentNote?.trim() || null,
      };

      // UNIQUE (event_id, user_id) : si une demande existe deja, on la met a
      // jour plutot que d'echouer, sauf si elle a deja ete traitee.
      const { data: existing, error: readErr } = await supabase
        .from('event_registrations')
        .select('id, status')
        .eq('event_id', input.eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (readErr && !MISSING_TABLE.test(readErr.message || '')) throw readErr;

      // Pseudo du demandeur, pour que la notification soit lisible par l'admin.
      const { data: profile } = await supabase
        .from('users_metadata')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      const playerName = (profile as any)?.display_name || '';

      if (existing) {
        if (existing.status !== 'pending') {
          throw new Error(
            existing.status === 'confirmed'
              ? 'Tu es deja inscrit a cette soiree.'
              : 'Ta demande precedente a ete refusee. Contacte un admin.'
          );
        }
        const { error } = await supabase
          .from('event_registrations')
          .update({
            payment_method: row.payment_method,
            payment_amount: row.payment_amount,
            payment_reference: row.payment_reference,
            payment_note: row.payment_note,
            conditions_accepted_at: row.conditions_accepted_at,
          })
          .eq('id', existing.id);
        if (error) throw error;

        // Mise a jour d'une demande deja en attente : on previent quand meme,
        // car le changement de reglement (montant, numero de paiement) doit
        // etre vu par l'admin. La notification cite le renvoi.
        await notifyAdminsOfRegistration({
          eventId: input.eventId,
          playerName: playerName || 'Un joueur',
          entryFee: Number(input.entryFee || 0),
          paymentMethod: method,
          isUpdate: true,
        });

        return { id: existing.id, updated: true };
      }

      const { data, error } = await supabase
        .from('event_registrations')
        .insert(row)
        .select('id')
        .single();

      if (error) throw error;

      // Notification a chaque administrateur : une demande en attente ne doit
      // pas rester invisible jusqu'a ce que l'admin ouvre la page Communaute.
      await notifyAdminsOfRegistration({
        eventId: input.eventId,
        playerName: playerName || 'Un joueur',
        entryFee: Number(input.entryFee || 0),
        paymentMethod: method,
      });

      return { id: (data as any).id, updated: false };
    },
    onSuccess: (result) => {
      invalidate(queryClient);
      toast.success(
        result.updated
          ? 'Demande mise a jour, en attente de validation.'
          : 'Demande envoyee ! Un admin doit maintenant la valider.'
      );
    },
    onError: (error) => toast.error(describeEventError(error)),
  });
}

/** L'admin valide une demande : le joueur recoit une notification. */
export function useReviewEventRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registrationId,
      eventTitle,
      playerId,
      playerName,
      status,
      adminNote,
    }: {
      registrationId: string;
      eventTitle: string;
      playerId: string;
      playerName: string;
      status: Exclude<RegistrationStatus, 'pending'>;
      adminNote?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('event_registrations')
        .update({
          status,
          admin_note: adminNote?.trim() || null,
          reviewed_by: userData?.user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', registrationId)
        .eq('status', 'pending');

      if (error) throw error;

      const confirmed = status === 'confirmed';
      const message = confirmed
        ? `Ta presence est confirmee pour "${eventTitle}". ${adminNote ? `Note : ${adminNote}` : 'Rendez-vous au Sanctuary !'}`
        : `Ta demande pour "${eventTitle}" n'a pas ete retenue. ${adminNote ? `Motif : ${adminNote}` : ''}`.trim();

      // Notification au joueur. Meme forme que le reste du projet
      // (user_id + message) pour ne dependre d'aucune colonne type.
      const { error: notifErr } = await supabase.from('notifications').insert([
        {
          user_id: playerId,
          message,
        },
      ]);

      if (notifErr) {
        console.error('[community] notification non envoyee :', notifErr.message);
      }
    },
    onSuccess: (_data, variables) => {
      invalidate(queryClient);
      toast.success(
        variables.status === 'confirmed' ? 'Presence confirmee, joueur notifie.' : 'Demande refusee, joueur notifie.'
      );
    },
    onError: (error) => toast.error(describeEventError(error)),
  });
}

/** L'admin supprime une demande. */
export function useDeleteEventRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase.from('event_registrations').delete().eq('id', registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success('Demande supprimee.');
    },
    onError: (error) => toast.error(describeEventError(error)),
  });
}
