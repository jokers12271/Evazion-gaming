import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function usePrivileges() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. Lire toutes les réclamations de privilèges du joueur (historique à vie)
  const myClaims = useQuery({
    queryKey: ['my_privilege_claims', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('user_privilege_claims')
        .select('*')
        .eq('user_id', user.id)
      if (error) throw error
      return data || []
    },
    enabled: !!user
  })

  // 2. Lire toutes les réclamations en attente (Admin seulement)
  const pendingClaims = useQuery({
    queryKey: ['all_pending_privilege_claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_privilege_claims')
        .select('*, users_metadata(display_name)')
        .eq('status', 'pending')
        .order('claimed_at', { ascending: true })
      if (error) throw error
      return data || []
    }
  })

  // 3. Soumettre une demande de consommation de privilège (Joueur)
  const claimPrivilege = useMutation({
    mutationFn: async ({ privilegeKey, message }: { privilegeKey: string, message: string }) => {
      if (!user) throw new Error("Vous devez être connecté.")

      const { error: claimErr } = await supabase
        .from('user_privilege_claims')
        .insert([{
          user_id: user.id,
          privilege_key: privilegeKey,
          status: 'pending'
        }])

      if (claimErr) throw claimErr

      const { data: admins } = await supabase
        .from('users_metadata')
        .select('user_id')
        .eq('is_admin', true)

      if (admins && admins.length > 0) {
        const notifs = admins.map(admin => ({
          user_id: admin.user_id,
          message: message
        }))
        await supabase.from('notifications').insert(notifs)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_privilege_claims', user?.id] })
    }
  })

  // 4. Valider la distribution d'un privilège (Admin)
  const approveClaim = useMutation({
    mutationFn: async ({ claimId, userId, privilegeTitle }: { claimId: string, userId: string, privilegeTitle: string }) => {
      const { error } = await supabase
        .from('user_privilege_claims')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', claimId)

      if (error) throw error

      await supabase.from('notifications').insert([{
        user_id: userId,
        message: `Votre privilège "${privilegeTitle}" a bien été validé et consommé !`
      }])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_pending_privilege_claims'] })
      queryClient.invalidateQueries({ queryKey: ['my_privilege_claims'] })
    }
  })

  // 5. CORRIGÉ : Vérifier si le joueur a déjà eu son bonus de minutes précis cette semaine (avec support d'ID cible)
  const checkWeeklyBonusUsed = (bonusMinutes: number, targetUserId?: string) => {
    const finalUserId = targetUserId || user?.id; // Utilise le joueur ciblé s'il est fourni
    return useQuery({
      queryKey: ['weekly_bonus_used', finalUserId, bonusMinutes],
      queryFn: async () => {
        if (!finalUserId || bonusMinutes <= 0) return false

        // Calcul du lundi de la semaine civile en cours
        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(now.setDate(diff))
        monday.setHours(0, 0, 0, 0)

        // Cherche s'il existe une réservation non annulée de ce joueur cette semaine avec ce bonus précis
        const { data, error } = await supabase
          .from('reservations')
          .select('id')
          .eq('user_id', finalUserId)
          .neq('status', 'annulé')
          .eq('bonus_minutes_applied', bonusMinutes)
          .gte('start_time', monday.toISOString())

        if (error) throw error
        return (data || []).length > 0
      },
      enabled: !!finalUserId && bonusMinutes > 0
    })
  }

  return { myClaims, pendingClaims, claimPrivilege, approveClaim, checkWeeklyBonusUsed }
}