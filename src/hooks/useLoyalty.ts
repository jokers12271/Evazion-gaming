import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface LoyaltyPoints {
  user_id: string
  points: number 
  total_hours: number
  total_minutes: number
  time_credit_minutes: number
}

export function useLoyalty() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['loyalty_points', user?.id],
    queryFn: async () => {
      if (!user) return null

      // 1. Déclencher silencieusement le versement mensuel automatique d'heures (Iconique/Divin)
      try {
        await supabase.rpc('credit_monthly_loyalty_hours')
      } catch (rpcErr) {
        console.warn("Échec silencieux du crédit mensuel automatique :", rpcErr)
      }

      // 2. Charger les points de fidélité depuis la base de données
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      
      // 3. Si l'utilisateur n'a pas encore de ligne, on lui en crée une PROPRE à 0
      // Utilisation du pseudo transmis lors de l'inscription pour éviter les conflits RLS
      if (!data) {
        const defaultName = user.user_metadata?.display_name || (user.email ? user.email.split('@')[0] : 'Gamer')
        const { data: newData, error: err } = await supabase
          .from('loyalty_points')
          .insert({ 
            user_id: user.id,
            display_name: defaultName,
            points: 0,
            total_hours: 0,
            total_minutes: 0,
            time_credit_minutes: 0
          })
          .select()
          .single()
        if (err) throw err
        return newData as LoyaltyPoints
      }

      return data as LoyaltyPoints
    },
    enabled: !!user
  })
}