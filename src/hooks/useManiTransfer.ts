import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useManiTransfer() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const transferMani = useMutation({
    mutationFn: async ({ receiverId, amount }: { receiverId: string, amount: number }) => {
      if (!user) throw new Error("Vous devez être connecté.")
      if (user.id === receiverId) throw new Error("Vous ne pouvez pas vous transférer des MANI à vous-même.")

      // Appel de la fonction de transaction atomique sécurisée en base de données
      const { error } = await supabase.rpc('transfer_mani', {
        sender_id_param: user.id,
        receiver_id_param: receiverId,
        amount_param: amount
      })

      if (error) throw error
    },
    onSuccess: () => {
      // Rafraîchir les soldes de points et de cagnottes
      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    }
  })

  return { transferMani }
}