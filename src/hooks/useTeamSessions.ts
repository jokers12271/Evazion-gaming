import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

// Interface de typage des membres d'une équipe
export interface TeamMember {
  team_session_id: string
  user_id: string
  contribution_amount: number
  allocated_minutes: number
  status: 'pending' | 'validated' | 'refused'
  users_metadata?: {
    display_name: string
    avatar_url: string
  }
}

// Interface de typage de la session d'équipe
export interface TeamSession {
  id: string
  creator_id: string
  station_id: string
  start_time: string
  end_time: string
  pack_name: string
  total_price: number
  total_minutes: number
  status: 'pending_consensus' | 'pending' | 'en cours' | 'consommé' | 'cancelled'
  created_at: string
  team_session_members?: TeamMember[]
}

export function useTeamSessions() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. Créer une nouvelle session d'équipe (Leader)
  const createTeamSession = useMutation({
    mutationFn: async ({ stationId, startTime, endTime, packName, totalPrice, totalMinutes, members }: {
      stationId: string,
      startTime: string,
      endTime: string,
      packName: string,
      totalPrice: number,
      totalMinutes: number,
      members: { user_id: string, contribution_amount: number, allocated_minutes: number }[]
    }) => {
      if (!user) throw new Error("Vous devez être connecté.")

      // A. Insérer la session générale
      const { data: session, error: sessionErr } = await supabase
        .from('team_sessions')
        .insert([{
          creator_id: user.id,
          station_id: stationId,
          start_time: startTime,
          end_time: endTime,
          pack_name: packName,
          total_price: totalPrice,
          total_minutes: totalMinutes,
          status: 'pending_consensus'
        }])
        .select()
        .single()

      if (sessionErr) throw sessionErr

      // B. Préparer les données des membres d'équipe (le créateur est validé d'office)
      const membersToInsert = [
        {
          team_session_id: session.id,
          user_id: user.id,
          contribution_amount: members.find(m => m.user_id === user.id)?.contribution_amount || 0,
          allocated_minutes: members.find(m => m.user_id === user.id)?.allocated_minutes || 0,
          status: 'validated' as const
        },
        ...members.filter(m => m.user_id !== user.id).map(m => ({
          team_session_id: session.id,
          user_id: m.user_id,
          contribution_amount: m.contribution_amount,
          allocated_minutes: m.allocated_minutes,
          status: 'pending' as const
        }))
      ]

      // C. Insérer les membres
      const { error: membersErr } = await supabase
        .from('team_session_members')
        .insert(membersToInsert)

      if (membersErr) throw membersErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    }
  })

  // 2. Valider ou Refuser une invitation à rejoindre une équipe
  const respondToInvitation = useMutation({
    mutationFn: async ({ teamSessionId, status }: { teamSessionId: string, status: 'validated' | 'refused' }) => {
      if (!user) throw new Error("Vous devez être connecté.")

      // Mettre à jour l'état de vote du membre
      const { error } = await supabase
        .from('team_session_members')
        .update({ status })
        .eq('team_session_id', teamSessionId)
        .eq('user_id', user.id)

      if (error) throw error

      // Supprimer la notification d'invitation d'origine après action
      await supabase
        .from('notifications')
        .delete()
        .eq('team_session_id', teamSessionId)
        .eq('user_id', user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    }
  })

  return { createTeamSession, respondToInvitation }
}

// AJOUTÉ : Mutation pour mettre en PAUSE une session d'équipe (Admin)
export function usePauseTeamSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('pause_team_session', { team_session_id_param: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['all_team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active_team_session'] })
    }
  })
}

// AJOUTÉ : Mutation pour RELANCER (Play) une session d'équipe en pause (Admin)
export function useResumeTeamSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('resume_team_session', { team_session_id_param: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['all_team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active_team_session'] })
    }
  })
}

// AJOUTÉ : Mutation de suppression d'une session d'équipe (Admin - Avec nettoyage des clés étrangères)
export function useDeleteTeamSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // A. Supprimer d'abord les membres liés pour éviter la violation de clé étrangère
      const { error: membersErr } = await supabase
        .from('team_session_members')
        .delete()
        .eq('team_session_id', id)

      if (membersErr) throw membersErr

      // B. Supprimer ensuite la session d'équipe parente
      const { error } = await supabase
        .from('team_sessions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['all_team_sessions'] })
    }
  })
}

// AJOUTÉ : Mutation d'action de l'administrateur (Démarrer / Clôturer les cagnottes)
export function useUpdateTeamSessionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, start_time, end_time }: { id: string, status: string, start_time?: string, end_time?: string }) => {
      const updateData: any = { status }
      if (start_time) updateData.start_time = start_time
      if (end_time) updateData.end_time = end_time

      const { error } = await supabase
        .from('team_sessions')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['all_team_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active_team_session'] })
      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] })
    }
  })
}

// 3. Charger la session d'équipe active ('en cours') pour le chronomètre partagé en direct
export function useActiveTeamSession() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['active_team_session', user?.id],
    queryFn: async () => {
      if (!user) return null

      // Chercher si l'utilisateur est membre d'une session
      const { data: memberships } = await supabase
        .from('team_session_members')
        .select('team_session_id')
        .eq('user_id', user.id)

      if (!memberships || memberships.length === 0) return null
      const sessionIds = memberships.map(m => m.team_session_id)

      // Récupérer la session d'équipe active correspondante
      const { data, error } = await supabase
        .from('team_sessions')
        .select(`
          *,
          team_session_members (
            *,
            users_metadata ( display_name )
          )
        `)
        .in('id', sessionIds)
        .eq('status', 'en cours')
        .maybeSingle()

      if (error) throw error
      return data as TeamSession | null
    },
    enabled: !!user,
    refetchInterval: 10000 // Actualisation dynamique toutes les 10 secondes
  })
}