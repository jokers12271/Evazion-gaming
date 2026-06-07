import { useTimeCredit } from '@/hooks/useTimeCredit'
import { Zap, Play } from 'lucide-react'
import { NeonButton } from '@/components/ui/NeonButton'
import { cn } from '@blinkdotnew/ui'

interface Props {
  minutes: number
  userId: string
  displayName: string
}

export function TimeCreditManager({ minutes, userId, displayName }: Props) {
  const { useMyCredit } = useTimeCredit()

  // On ne retire plus le composant si c'est 0, on l'affiche toujours
  const hasCredit = minutes > 0;

  return (
    <section 
      className={cn(
        "glass p-6 rounded-[2rem] border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl mb-10",
        hasCredit ? "border-secondary shadow-neon-cyan" : "border-white/5 opacity-60"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
          <Zap size={14} className={hasCredit ? "animate-pulse" : ""} /> 
          Mon Crédit Temps
        </h3>
      </div>
      
      <div className="flex items-baseline gap-2 mb-6">
        <span className={cn(
          "text-5xl font-display font-black",
          hasCredit ? "text-white" : "text-white/20"
        )}>
          {minutes}
        </span>
        <span className="text-xs font-bold text-secondary uppercase">Minutes</span>
      </div>

      <NeonButton 
        variant={hasCredit ? "cyan" : "ghost"}
        className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
        onClick={() => hasCredit && useMyCredit.mutate({ userId, minutes, displayName })}
        disabled={!hasCredit || useMyCredit.isPending}
      >
        <Play size={14} fill="currentColor" />
        {!hasCredit ? "AUCUN CRÉDIT DISPONIBLE" : (useMyCredit.isPending ? "TRAITEMENT..." : "UTILISER MON CRÉDIT")}
      </NeonButton>
      
      <p className="mt-3 text-[8px] text-white/30 uppercase text-center font-bold tracking-widest">
        {hasCredit 
          ? "Ce temps sera converti en une nouvelle session" 
          : "Économisez du temps lors de vos prochaines sessions"
        }
      </p>
    </section>
  )
}