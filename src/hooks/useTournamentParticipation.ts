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

  // 1. Lire uniquement les compétiteurs validés (approved) sur la carte publique (Exclut les admins)
  const query = useQuery({
    queryKey: ['participants', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('user_id, display_name, users_metadata:user_id(is_admin)') // JOINTURE DE SÉCURITÉ ADMIN
        .eq('tournament_id', tournamentId)
        .eq('status', 'approved');

      if (error) throw error;
      
      // FILTRAGE STRICT : Exclure tout joueur ayant le statut administrateur
      return (data || []).filter((p: any) => {
        const meta = Array.isArray(p.users_metadata) ? p.users_metadata[0] : p.users_metadata;
        return meta?.is_admin !== true;
      });
    }
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

      // D. Insérer la demande d'inscription dans la table des participants
      const { error } = await supabase
        .from('tournament_participants')
        .insert({ 
          tournament_id: tournamentId, 
          user_id: userId,
          display_name: displayName,
          status: 'pending'
        });

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
          message: `Alerte Tournoi : Le joueur @${displayName} s'est inscrit au tournoi "${tourney?.title}". Prix d'inscription calculé : ${feeText}.`
        }));
        await supabase.from('notifications').insert(adminNotifs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', tournamentId] })
      queryClient.invalidateQueries({ queryKey: ['my_tournament_request', tournamentId, user?.id] })
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
    enabled: !!user
  })
}

// 4. AJOUTÉ : Charger toutes les demandes d'inscriptions de tournois en attente avec liaisons tarifs et rang (Admin)
    export function useAllPendingTournamentRequests() {
      return useQuery({
        queryKey: ['pending_tournament_requests'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('tournament_participants')
            .select('*, tournaments(title, is_paid, fee_amount), loyalty_points:user_id(total_hours)') // JOINTURE TARIFS & RANG
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
          if (error) throw error
          return data as any[]
        }
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