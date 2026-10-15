import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { getRank } from '@/lib/ranks'

export interface TournamentRequest {
  tournament_id: string
  user_id: string
  display_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  tournaments?: {
    title: string
  }
}

export function useTournamentParticipation(tournamentId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. Lire uniquement les competiteurs valides (approved) sur la carte publique.
  //    La jointure `users_metadata:user_id(is_admin)` est remplacee par un requete
  //    separee : sans cle etrangere, PostgREST fait echouer toute la requete
  //    (donc la liste des competiteurs validés restait vide).
  const query = useQuery({
    queryKey: ['participants', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('user_id, display_name, status, checked_in_at')
        .eq('tournament_id', tournamentId)
        .eq('status', 'approved');

      if (error) throw error;

      const list = (data || []) as any[];
      if (list.length === 0) return list;

      // Filtrage strict : exclure tout joueur ayant le statut administrateur
      const { data: admins } = await supabase
        .from('users_metadata')
        .select('user_id')
        .eq('is_admin', true);

      const adminIds = new Set((admins || []).map((a: any) => a.user_id));
      return list.filter((p) => !adminIds.has(p.user_id));
    },
    enabled: !!tournamentId,
    refetchInterval: 5000
  });

  // 2. Créer une demande d'inscription au tournoi avec calcul du prix selon le Rang (Joueur)
  const register = useMutation({
    mutationFn: async ({ userId, displayName }: { userId: string, displayName: string }) => {
      // A. Récupérer les détails financiers du tournoi ciblé
      const { data: tourney } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      // B. Récupérer les heures réelles de fidélité du joueur pour déterminer son Rang
      const { data: lp } = await supabase
        .from('loyalty_points')
        .select('total_hours')
        .eq('user_id', userId)
        .maybeSingle();

      const hours = lp?.total_hours || 0;
      const userRank = getRank(hours);

      // C. Calculer le tarif final avec les remises du Rang appliquées d'office
      const baseFee = tourney?.fee_amount || 0;
      const isReallyPaid = baseFee > 0;
      // Calcul du tarif réduit automatisé selon les Rang (Mis à jour selon les nouvelles règles)
      let finalFee = baseFee
      let discountLabel = ''

      if (isReallyPaid) {
    if (userRank.name === 'Pro') {
      finalFee = Math.round(baseFee * 0.85) // -15%
      discountLabel = '🎟️ -15% de réduction Rang Pro appliquée'
    } else if (userRank.name === 'Elite' || userRank.name === 'Légende') {
      finalFee = Math.round(baseFee * 0.75) // -25%
      discountLabel = `🎟️ -25% de réduction Rang ${userRank.name} appliquée`
    } else if (userRank.name === 'Iconique') {
      finalFee = Math.round(baseFee * 0.50) // -50%
      discountLabel = '🎟️ -50% de réduction Rang Iconique appliquée'
    } else if (userRank.name === 'Divin') {
      finalFee = 0 // GRATUIT
      discountLabel = '🎟️ Inscription GRATUITE Rang Divin appliquée'
    }
  } else {
    finalFee = 0
  }

      // D. Creer (ou reactiver) la demande d'inscription.
      //    Upsert sur (tournament_id, user_id) : si une demande REJETEE existe
      //    deja, elle repasse en 'pending' au lieu de lever une erreur de doublon.
      const { error } = await supabase
        .from('tournament_participants')
        .upsert({
          tournament_id: tournamentId,
          user_id: userId,
          display_name: displayName,
          status: 'pending',
          created_at: new Date().toISOString()
        }, { onConflict: 'tournament_id,user_id' });

      if (error) throw error;

      // E. Récupérer les administrateurs pour leur envoyer l'alerte
      const { data: admins } = await supabase
        .from('users_metadata')
        .select('user_id')
        .eq('is_admin', true);

      // F. Envoyer la notification d'alerte avec le prix calculé à chaque administrateur
      if (admins && admins.length > 0) {
        const feeText = finalFee > 0 ? `${finalFee} FCFA` : 'GRATUIT (Privilège de Rang)';
        const adminNotifs = admins.map(admin => ({
          user_id: admin.user_id,
          message: `Alerte Tournoi : Le joueur @${displayName} a (re)déposé une demande d'inscription au tournoi "${tourney?.title}". Prix d'inscription calculé : ${feeText}.`
        }));
        await supabase.from('notifications').insert(adminNotifs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', tournamentId] })
      queryClient.invalidateQueries({ queryKey: ['my_tournament_request', tournamentId, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['pending_tournament_requests'] })
    }
  });

  return { 
    participants: query.data ?? [], 
    isLoading: query.isLoading,
    register 
  };
}

// 3. AJOUTÉ : Charger l'état de ma demande d'inscription à ce tournoi spécifique (Joueur)
export function useMyTournamentRequest(tournamentId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my_tournament_request', tournamentId, user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data as TournamentRequest | null
    },
    enabled: !!user,
    // Permet de voir passer la demande de "pending" a "approved" en direct
    // quand l'admin valide depuis une autre machine.
    refetchInterval: 5000
  })
}

// 4. Charger toutes les demandes d'inscription en attente (Admin)
//    Les Requetes sont faites en 3 temps pour ne dependre d'aucune cle etrangere
//    (une jointure PostgREST silencieusement vide le tableau si la FK n'existe pas).
export function useAllPendingTournamentRequests() {
  return useQuery({
    queryKey: ['pending_tournament_requests'],
    queryFn: async () => {
      // A. Demandes en attente
      const { data: rows, error } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      const list = (rows || []) as any[]
      if (list.length === 0) return []

      // B. Tournois concernes
      const tourneyIds = [...new Set(list.map((r) => r.tournament_id).filter(Boolean))] as string[]
      const { data: tourneys } = await supabase
        .from('tournaments')
        .select('id, title, is_paid, fee_amount')
        .in('id', tourneyIds.length > 0 ? tourneyIds : ['__none__'])

      // C. Heures de fidelite des joueurs
      const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))] as string[]
      const { data: loyalty } = await supabase
        .from('loyalty_points')
        .select('user_id, total_hours')
        .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

      const tourneyMap = new Map((tourneys || []).map((t: any) => [t.id, t]))
      const loyaltyMap = new Map((loyalty || []).map((l: any) => [l.user_id, l]))

      return list.map((r) => ({
        ...r,
        tournaments: tourneyMap.get(r.tournament_id) || null,
        loyalty_points: loyaltyMap.get(r.user_id) || null
      }))
    },
    refetchInterval: 5000
  })
}

// 5. AJOUTÉ : Traiter une inscription au tournoi (Admin : Approuver ou Rejeter)
export function useProcessTournamentRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tournamentId, playerId, status, tournamentTitle }: { tournamentId: string, playerId: string, status: 'approved' | 'rejected', tournamentTitle?: string }) => {
      const { error } = await supabase
        .from('tournament_participants')
        .update({ status })
        .eq('tournament_id', tournamentId)
        .eq('user_id', playerId)

      if (error) throw error

      // Envoyer une notification d'état au joueur
      const message = status === 'approved'
        ? `Félicitations ! Votre inscription au tournoi "${tournamentTitle || 'du Hub'}" a été validée.`
        : `Votre demande d'inscription au tournoi "${tournamentTitle || 'du Hub'}" a été rejetée (règlement non reçu).`;

      await supabase.from('notifications').insert([{ user_id: playerId, message }]);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending_tournament_requests'] })
      queryClient.invalidateQueries({ queryKey: ['participants', variables.tournamentId] })
    }
  })
}

// 6. Check-in d'un competiteur via son Pass QR (Admin)
export type CheckinReason = 'ok' | 'already' | 'not_registered' | 'pending' | 'rejected'

export interface CheckinResult {
  ok: boolean
  reason: CheckinReason
  display_name?: string
  tournament?: { id: string; title: string; game: string; date: string; cashprize_fcfa?: number } | null
  checked_in_at?: string | null
}

/** Decode le contenu du QR : "EVZ-PASS|<tournament_id>|<user_id>|<cashprize>" */
export function parseTournamentPass(raw: string): { tournamentId: string; userId: string; cashprize?: number } | null {
  const text = (raw || '').trim()
  const m = text.match(/^EVZ-PASS\|([^|]+)\|([0-9a-fA-F-]{8,36})(?:\|(\d+))?$/)
  return m ? { tournamentId: m[1], userId: m[2], cashprize: m[3] ? Number(m[3]) : undefined } : null
}

/** Detecte un Pass tournoi sans avoir a le decoder completement */
export function isTournamentPass(raw: string): boolean {
  const text = (raw || '').trim().toUpperCase()
  return text.startsWith('EVZ-PASS|') || text.startsWith('SNCT-PASS-')
}

export function useTournamentCheckin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tournamentId, userId }: { tournamentId: string; userId: string }): Promise<CheckinResult> => {
      // A. Lire la demande du joueur pour ce tournoi
      const { data: req, error } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      if (!req) return { ok: false, reason: 'not_registered' }
      if (req.status === 'rejected') return { ok: false, reason: 'rejected', display_name: req.display_name }
      if (req.status === 'pending') return { ok: false, reason: 'pending', display_name: req.display_name }

      // B. Recuperer le tournoi pour l'afficher sur l'ecran de validation
      const { data: tourney } = await supabase
        .from('tournaments')
        .select('id, title, game, date, cashprize_fcfa')
        .eq('id', tournamentId)
        .maybeSingle()

      // C. Deja present -> on ne rejoue pas l'ecriture
      if (req.checked_in_at) {
        return {
          ok: true,
          reason: 'already',
          display_name: req.display_name,
          tournament: tourney || null,
          checked_in_at: req.checked_in_at
        }
      }

      // D. Marquer la presence
      const stamp = new Date().toISOString()
      const { error: upErr } = await supabase
        .from('tournament_participants')
        .update({ checked_in_at: stamp })
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)

      if (upErr) throw upErr

      return {
        ok: true,
        reason: 'ok',
        display_name: req.display_name,
        tournament: tourney || null,
        checked_in_at: stamp
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
      queryClient.invalidateQueries({ queryKey: ['my_tournament_request'] })
    }
  })
}

// 7. Inscrits valides, dans l'ordre d'inscription (pre-remplissage de l'arbre).
//    Exclut les administrateurs pour coller a la liste des competiteurs confirmees.
export function useTournamentRoster(tournamentId: string) {
  return useQuery({
    queryKey: ['tournament_roster', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('user_id, display_name, status, created_at')
        .eq('tournament_id', tournamentId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      const list = (data || []) as any[];
      if (list.length === 0) return [] as string[];

      const { data: admins } = await supabase
        .from('users_metadata')
        .select('user_id')
        .eq('is_admin', true);
      const adminIds = new Set((admins || []).map((a: any) => a.user_id));

      return list
        .filter((p) => !adminIds.has(p.user_id))
        .map((p) => (p.display_name || '').trim())
        .filter(Boolean) as string[];
    },
    enabled: !!tournamentId,
    refetchInterval: 5000
  })
}