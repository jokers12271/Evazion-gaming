import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export function useTimeCredit() {
  const queryClient = useQueryClient()

  const useMyCredit = useMutation({
    mutationFn: async ({ userId, minutes, displayName }: { userId: string, minutes: number, displayName: string }) => {
      // 1. On vide immédiatement le crédit de temps sur le compte fidélité
      const { error: updateErr } = await supabase
        .from('loyalty_points')
        .update({ time_credit_minutes: 0 })
        .eq('user_id', userId);

      if (updateErr) throw updateErr;

      // 2. Détecter la dernière console d'équipe interrompue pour le joueur
      const { data: interruptedTeam } = await supabase
        .from('team_sessions')
        .select('station_id')
        .eq('status', 'interrompu')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 3. Détecter la dernière console individuelle interrompue pour le joueur
      const { data: interruptedIndividual } = await supabase
        .from('reservations')
        .select('station_id')
        .eq('user_id', userId)
        .eq('status', 'interrompu')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Utiliser en priorité la console d'équipe interrompue, sinon la console individuelle, ou 'PS5_1' en repli sécurisé
      const finalStationId = interruptedTeam?.station_id || interruptedIndividual?.station_id || 'PS5_1';

      const now = new Date();
      const endTime = new Date(now.getTime() + minutes * 60 * 1000);

      // 4. Insérer une NOUVELLE ligne de réservation individuelle propre et indépendante en attente (pending)
      // Cela évite tout conflit de dates d'historique avec l'ancienne session interrompue.
      const { error: insertErr } = await supabase
        .from('reservations')
        .insert([{
          user_id: userId,
          station_id: finalStationId,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          status: 'pending',
          is_credit_use: true,
          display_name: displayName
        }]);

      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] });
      toast.success("Demande de reprise envoyée !");
    },
    onError: (err: any) => {
      console.error("Erreur lors de l'utilisation du crédit :", err);
      toast.error(`Erreur : ${err.message || err}`);
    }
  })

  return { useMyCredit }
}