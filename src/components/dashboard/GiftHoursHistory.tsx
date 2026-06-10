import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Gift, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  boxClass: string
  boxStyle: any
}

export function GiftHoursHistory({ boxClass, boxStyle }: Props) {
  const queryClient = useQueryClient()

  // Charger en temps réel l'historique des crédits d'heures offertes
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['gift_hours_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_hours_logs')
        .select('*, users_metadata:user_id(display_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Mutation pour supprimer définitivement une ligne d'historique
  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('gift_hours_logs')
        .delete()
        .eq('id', logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift_hours_logs'] });
      toast.success("Ligne d'historique effacée avec succès !");
    }
  });

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8 text-white text-left">
        <Gift className="text-yellow-500 animate-bounce" size={28} />
        <h2 className="text-3xl font-display uppercase tracking-wider">Historique des Crédits Offerts</h2>
      </div>

      {logsLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>
      ) : logs && logs.length > 0 ? (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar text-left text-white">
          {logs.map((log: any) => (
            <div key={log.id} className="p-5 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between gap-6 hover:border-yellow-500/20 transition-all duration-300">
              <div>
                <p className="font-bold text-sm">Vous avez offert <span className="text-yellow-500 font-black">{(log.hours * 60)} minutes</span></p>
                <div className="flex items-center gap-4 mt-1.5 text-[10px] text-white/30 font-black uppercase tracking-wider">
                  <span translate="no">Bénéficiaire : @{log.users_metadata?.display_name}</span>
                  <span>•</span>
                  <span>Le {format(new Date(log.created_at), 'dd/MM à HH:mm', { locale: fr })}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (confirm("Voulez-vous supprimer définitivement cette ligne d'historique de la base de données ?")) {
                    deleteLogMutation.mutate(log.id);
                  }
                }}
                className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white border border-red-500/20 transition-all shrink-0 shadow-lg"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-center text-white/20 uppercase tracking-widest py-8">Aucun historique de cadeaux disponible</p>
      )}
    </section>
  )
}