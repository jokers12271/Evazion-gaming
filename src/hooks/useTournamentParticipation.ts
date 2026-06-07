import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

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

  // 1. Lire uniquement les compétiteurs validés (approved) sur la carte publique
  const query = useQuery({
    queryKey: ['participants', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('user_id, display_name')
        .eq('tournament_id', tournamentId)
        .eq('status', 'approved'); // MODIFIÉ : Filtrage strict

      if (error) throw error;
      return data || [];
    }
  });

  // 2. Créer une demande d'inscription au tournoi (Joueur)
  const register = useMutation({
    mutationFn: async ({ userId, displayName }: { userId: string, displayName: string }) => {
      const { error } = await supabase
        .from('tournament_participants')
        .insert({ 
          tournament_id: tournamentId, 
          user_id: userId,
          display_name: displayName,
          status: 'pending' // Par défaut : en attente de validation admin
        });
      if (error) throw error;
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

// 4. AJOUTÉ : Charger toutes les demandes d'inscriptions de tournois en attente (Admin seulement)
export function useAllPendingTournamentRequests() {
  return useQuery({
    queryKey: ['pending_tournament_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('*, tournaments(title)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as TournamentRequest[]
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