import { Play, CheckCircle2, Timer, X, Trash2, Pause } from 'lucide-react' // AJOUTÉ Pause et Trash2
import { useReservations } from '@/hooks/useReservations'
import { supabase } from '@/lib/supabase'
import { LiveCountdown } from './LiveCountdown'
import { toast } from 'react-hot-toast'
import { cn } from '@blinkdotnew/ui'

interface Props {
  reservation: any
}

export function AdminSessionManager({ reservation }: Props) {
  // Extraction des nouvelles fonctions de pause/reprise
  const { updateStatus, deleteReservation, pauseReservation, resumeReservation } = useReservations()

  const handleStart = async () => {
    try {
      const originalDurationMs = new Date(reservation.end_time).getTime() - new Date(reservation.start_time).getTime();
      const newEndTime = new Date(Date.now() + originalDurationMs).toISOString();

      // CORRECTIF BUG : Mise à jour de start_time à l'instant du démarrage réel
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'en cours', 
          started_at: new Date().toISOString(),
          start_time: new Date().toISOString(), // MODIFIÉ : Fixe l'heure de début au clic de lecture
          end_time: newEndTime 
        })
        .eq('id', reservation.id);

      if (error) throw error;
      toast.success("Session démarrée !");
      window.location.reload(); 
    } catch (e) {
      toast.error("Erreur au démarrage");
    }
  }

  const handleStopWithCredit = async () => {
    if (reservation.status !== 'en cours') {
      return toast.error("La session doit être 'en cours' pour calculer un reste.");
    }
    if (!confirm("Arrêter la session et sauvegarder le temps restant en crédit ?")) return
    
    const { error } = await supabase.rpc('stop_session_and_calculate_credit', { 
      res_id: reservation.id 
    })
    
    if (error) toast.error("Erreur technique sur le crédit");
    else {
      toast.success("Crédit temps sauvegardé !");
      window.location.reload();
    }
  }

  // CLÔTURE DE SESSION NETTE - CONSOMMATION À 100 % DU TEMPS PRÉVU (CORRIGÉ)
  const handleComplete = async () => {
    try {
      // Nous mettons simplement à jour le statut sur 'consommé'. 
      // L'heure de fin d'origine reste intacte pour créditer 100% de la durée au joueur.
      await updateStatus.mutateAsync({ 
        id: reservation.id, 
        status: 'consommé' 
      });
      
      toast.success("Session consommée à 100 % ! Crédits attribués.");
    } catch (e: any) {
      console.error("Erreur de clôture individuelle :", e);
      toast.error(`Erreur : ${e.message || e}`, { position: "bottom-center" });
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5 shadow-xl">
      
      <div className="min-w-[100px] flex justify-center">
        {reservation.status === 'en cours' ? (
          <LiveCountdown 
            endTime={reservation.end_time} 
            isStarted={true} 
            className="shadow-neon-violet" 
            isPaused={reservation.is_paused}
            pausedRemainingSeconds={reservation.paused_remaining_seconds}
          />
        ) : (
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Terminal</span>
        )}
      </div>

      <div className="flex gap-2">
        {/* BOUTON 1 : PLAY / REPRENDRE DE PAUSE */}
        {(reservation.status === 'pending' || reservation.status === 'interrompu' || (reservation.status === 'en cours' && reservation.is_paused)) && (
          <button 
            onClick={async () => {
              if (reservation.is_paused) {
                try {
                  await resumeReservation.mutateAsync(reservation.id);
                  toast.success("Session reprise !");
                } catch (e) {
                  toast.error("Erreur de reprise");
                }
              } else {
                handleStart();
              }
            }}
            className="p-3 rounded-full bg-blue-600 text-white hover:scale-110 shadow-lg shadow-blue-500/20 transition-all"
            title={reservation.is_paused ? "Relancer le chronomètre (Play)" : "Démarrer"}
          >
            <Play size={18} fill="currentColor" />
          </button>
        )}

        {/* BOUTON 2 : FINI */}
        {reservation.status === 'en cours' && (
          <button 
            onClick={handleComplete}
            className="p-3 rounded-full bg-green-500 text-black hover:scale-110 shadow-lg shadow-green-500/20"
            title="Terminer (100%)"
          >
            <CheckCircle2 size={18} />
          </button>
        )}

        {/* BOUTON 3 : PAUSE (Jaune) */}
        {reservation.status === 'en cours' && !reservation.is_paused && (
          <button 
            onClick={async () => {
              try {
                await pauseReservation.mutateAsync(reservation.id);
                toast.success("Session mise en pause !");
              } catch (e) {
                toast.error("Erreur de pause");
              }
            }}
            className="p-3 rounded-full bg-yellow-500 text-black hover:scale-110 shadow-lg shadow-yellow-500/20"
            title="Mettre en pause"
          >
            <Pause size={18} fill="currentColor" />
          </button>
        )}

        {/* BOUTON 4 : RESTE (INTERROMPRE) */}
        {reservation.status === 'en cours' && (
          <button 
            onClick={handleStopWithCredit}
            className="p-3 rounded-full bg-orange-500 text-black hover:scale-110 shadow-lg shadow-orange-500/20"
            title="Arrêt partiel (Créditer reste)"
          >
            <Timer size={18} />
          </button>
        )}

        {/* BOUTON 5 : ANNULER / SUPPRIMER */}
        <button 
          onClick={() => {
            if(reservation.status === 'pending') {
              updateStatus.mutate({ id: reservation.id, status: 'annulé' })
            } else {
              if(confirm("Supprimer définitivement cet enregistrement ?")) deleteReservation.mutate(reservation.id)
            }
          }}
          className={cn(
            "p-3 rounded-full transition-all shadow-lg",
            reservation.status === 'pending' ? "bg-red-600 text-white shadow-red-500/20" : "bg-white/5 text-red-500 border border-red-500/20"
          )}
          title={reservation.status === 'pending' ? "Annuler" : "Supprimer de l'historique"}
        >
          {reservation.status === 'pending' ? <X size={18} /> : <Trash2 size={18} />}
        </button>
      </div>
    </div>
  )
}