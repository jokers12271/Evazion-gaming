import { useLiveTimer } from '@/hooks/useLiveTimer'
import { Timer, Pause } from 'lucide-react' // MODIFIÉ : Ajout de l'icône de Pause
import { cn } from '@blinkdotnew/ui'

interface LiveCountdownProps {
  endTime: string
  isStarted: boolean
  className?: string
  isPaused?: boolean // AJOUTÉ
  pausedRemainingSeconds?: number // AJOUTÉ
}

export function LiveCountdown({ endTime, isStarted, className, isPaused, pausedRemainingSeconds }: LiveCountdownProps) {
  const { display, isOver } = useLiveTimer(endTime, isStarted)

  if (!isStarted) return null;

  // Calcul du format d'affichage statique si la session est en pause
  let displayValue = display;
  if (isPaused && pausedRemainingSeconds !== undefined && pausedRemainingSeconds !== null) {
    const mins = Math.floor(pausedRemainingSeconds / 60);
    const secs = pausedRemainingSeconds % 60;
    displayValue = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-lg font-black font-display text-lg shadow-lg animate-fade-in",
      isOver ? "bg-red-500 text-white animate-pulse" : (isPaused ? "bg-yellow-500 text-black shadow-yellow-500/20" : "bg-primary text-black"), // Couleur jaune en pause
      className
    )}>
      {isPaused ? <Pause size={18} className="animate-pulse" /> : <Timer size={18} className={isOver ? "animate-spin" : ""} />}
      <span>{isPaused ? `PAUSÉ : ${displayValue}` : (isOver ? "TEMPS ÉCOULÉ" : displayValue)}</span>
    </div>
  )
}