import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface TeamConfig {
  team_id: string
  join_fee: number
  monthly_fee: number
  payment_phone: string
  updated_at: string
}

export interface MembershipRequest {
  user_id: string
  team_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  users_metadata?: {
    display_name: string
    avatar_url: string
  }
}

// 1. Charger les configurations financières de toutes les teams
export function useTeamConfigs() {
  return useQuery({
    queryKey: ['team_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_configs').select('*')
      if (error) throw error
      return data as TeamConfig[]
    }
  })
}

// 2. MODIFIÉ : Charger l'ensemble de mes demandes et adhésions d'équipes (Multi-teams)
export function useMyMembershipRequests() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my_membership_requests', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('team_membership_requests')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      return data as MembershipRequest[]
    },
    enabled: !!user
  })
}

// 3. Charger toutes les demandes en attente (Admin seulement)
export function useAllPendingRequests() {
  return useQuery({
    queryKey: ['pending_membership_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_membership_requests')
        .select('*, users_metadata(display_name, avatar_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as MembershipRequest[]
    }
  })
}

// 4. Mutations de gestion d'adhésion
export function useTeamMembershipActions() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // A. Créer une demande d'adhésion (Joueur)
  const createRequest = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Vous devez être connecté.")
      
      // Récupérer toutes mes demandes actuelles
      const { data: existing } = await supabase
        .from('team_membership_requests')
        .select('status, team_id')
        .eq('user_id', user.id)

      const myRequests = existing || [];

      // Vérifier s'il y a déjà une demande en attente pour cette même team
      if (myRequests.some(r => r.team_id === teamId && r.status === 'pending')) {
        throw new Error("Vous avez déjà une demande en attente pour cette Team.");
      }

      // Vérifier si la limite absolue de 3 Teams approuvées est atteinte
      const approvedCount = myRequests.filter(r => r.status === 'approved').length;
      if (approvedCount >= 3) {
        throw new Error("Limite de Teams atteinte ! Vous ne pouvez pas rejoindre plus de 3 Teams de jeux.");
      }

      const { error } = await supabase
        .from('team_membership_requests')
        .insert([{ user_id: user.id, team_id: teamId, status: 'pending' }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_membership_requests', user?.id] })
    }
  })

  // B. Traiter une demande d'adhésion (Admin : Approuver ou Rejeter)
  const processRequest = useMutation({
    mutationFn: async ({ playerId, teamId, status }: { playerId: string, teamId: string, status: 'approved' | 'rejected' }) => {
      // 1. Mettre à jour le statut de la demande d'adhésion
      const { error: requestErr } = await supabase
        .from('team_membership_requests')
        .update({ status })
        .eq('user_id', playerId)
        .eq('team_id', teamId)

      if (requestErr) throw requestErr

      // 2. Envoyer une notification personnalisée au joueur
      if (status === 'approved') {
        await supabase.from('notifications').insert([{
          user_id: playerId,
          message: `Félicitations ! Votre demande d'adhésion à la Team ${teamId} a été validée par l'administration.`
        }])
      } else {
        await supabase.from('notifications').insert([{
          user_id: playerId,
          message: `Votre demande d'adhésion à la Team ${teamId} a été rejetée par l'administration (paiement non validé).`
        }])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_membership_requests'] })
      queryClient.invalidateQueries({ queryKey: ['all_members'] })
      queryClient.invalidateQueries({ queryKey: ['user_metadata'] })
    }
  })

  // C. MODIFIÉ : Quitter une Team spécifique d'équipe (Joueur)
  const leaveTeam = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Vous devez être connecté.")

      // Supprimer la demande approuvée pour cette team spécifique (multi-teams)
      const { error } = await supabase
        .from('team_membership_requests')
        .delete()
        .eq('user_id', user.id)
        .eq('team_id', teamId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_membership_requests', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['user_metadata', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['all_members'] })
    }
  })

  // D. Mettre à jour la configuration d'une team (Admin)
  const updateConfig = useMutation({
    mutationFn: async ({ teamId, joinFee, monthlyFee, paymentPhone }: { teamId: string, joinFee: number, monthlyFee: number, paymentPhone: string }) => {
      const { error } = await supabase
        .from('team_configs')
        .update({ join_fee: joinFee, monthly_fee: monthlyFee, payment_phone: paymentPhone, updated_at: new Date().toISOString() })
        .eq('team_id', teamId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_configs'] })
    }
  })

  return { createRequest, processRequest, leaveTeam, updateConfig }
}