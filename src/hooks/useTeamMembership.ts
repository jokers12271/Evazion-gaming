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
  subscription_expires_at?: string | null
  renewal_status?: string | null
  users_metadata?: {
    display_name: string
    avatar_url: string
  }
}

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

// 1. Charger toutes les demandes de renouvellements mensuels de cotisations en attente (Admin)
export function useAllPendingRenewals() {
  return useQuery({
    queryKey: ['pending_team_renewals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_membership_requests')
        .select('*, users_metadata(display_name, avatar_url)')
        .eq('renewal_status', 'pending_renewal')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as MembershipRequest[]
    }
  })
}

export function useTeamMembershipActions() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const createRequest = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Vous devez être connecté.")
      
      const { data: existing } = await supabase
        .from('team_membership_requests')
        .select('status, team_id')
        .eq('user_id', user.id)

      const myRequests = existing || [];

      if (myRequests.some(r => r.team_id === teamId && r.status === 'pending')) {
        throw new Error("Vous avez déjà une demande en attente pour cette Team.");
      }

      const approvedCount = myRequests.filter(r => r.status === 'approved').length;
      if (approvedCount >= 3) {
        throw new Error("Limite de Teams atteinte ! Vous ne pouvez pas rejoindre plus de 3 Teams.");
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

  // Traiter une nouvelle adhésion (Fixe l'échéance d'abonnement au 1er du mois suivant)
  const processRequest = useMutation({
    mutationFn: async ({ playerId, teamId, status }: { playerId: string, teamId: string, status: 'approved' | 'rejected' }) => {
      // Calculer le premier jour du mois suivant à 00:00:00
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);

      const updateData: any = { status }
      if (status === 'approved') {
        updateData.subscription_expires_at = nextMonth.toISOString();
        updateData.renewal_status = null;
      }

      const { error: requestErr } = await supabase
        .from('team_membership_requests')
        .update(updateData)
        .eq('user_id', playerId)
        .eq('team_id', teamId)

      if (requestErr) throw requestErr

      if (status === 'approved') {
        await supabase.from('notifications').insert([{
          user_id: playerId,
          message: `Félicitations ! Votre demande d'adhésion à la Team ${teamId} a été validée.`
        }])
      } else {
        await supabase.from('notifications').insert([{
          user_id: playerId,
          message: `Votre demande d'adhésion à la Team ${teamId} a été rejetée.`
        }])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_membership_requests'] })
      queryClient.invalidateQueries({ queryKey: ['all_team_members_list'] })
    }
  })

  // 2. Demande de renouvellement de cotisation mensuelle (Joueur)
  const requestRenewal = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Vous devez être connecté.")

      // Passer le statut de renouvellement à en attente
      const { error } = await supabase
        .from('team_membership_requests')
        .update({ renewal_status: 'pending_renewal' })
        .eq('user_id', user.id)
        .eq('team_id', teamId)

      if (error) throw error

      // Alerter l'administration du club
      const { data: admins } = await supabase
        .from('users_metadata')
        .select('user_id')
        .eq('is_admin', true)

      if (admins && admins.length > 0) {
        const adminNotifs = admins.map(admin => ({
          user_id: admin.user_id,
          message: `Le joueur de l'équipe a envoyé une demande de renouvellement de sa cotisation pour la Team ${teamId}.`
        }))
        await supabase.from('notifications').insert(adminNotifs)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_membership_requests', user?.id] })
    }
  })

  // 3. Valider administrativement le renouvellement de cotisation (Admin)
  const processRenewal = useMutation({
    mutationFn: async ({ playerId, teamId, status }: { playerId: string, teamId: string, status: 'approved' | 'rejected' }) => {
      // Repousser l'échéance de l'abonnement au 1er du mois suivant
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);

      const updateData: any = { renewal_status: null }
      if (status === 'approved') {
        updateData.subscription_expires_at = nextMonth.toISOString();
      } else {
        // En cas de refus, l'adhésion reste active mais la demande est annulée
        updateData.renewal_status = null;
      }

      const { error } = await supabase
        .from('team_membership_requests')
        .update(updateData)
        .eq('user_id', playerId)
        .eq('team_id', teamId)

      if (error) throw error

      const msg = status === 'approved'
        ? `Félicitations ! Votre demande de renouvellement de cotisation pour la Team ${teamId} a été validée.`
        : `Votre demande de renouvellement de cotisation pour la Team ${teamId} a été rejetée.`;

      await supabase.from('notifications').insert([{ user_id: playerId, message: msg }])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_team_renewals'] })
      queryClient.invalidateQueries({ queryKey: ['all_team_members_list'] })
    }
  })

  const leaveTeam = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Vous devez être connecté.")
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
      queryClient.invalidateQueries({ queryKey: ['all_team_members_list'] })
    }
  })

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

  return { createRequest, processRequest, requestRenewal, processRenewal, leaveTeam, updateConfig }
}