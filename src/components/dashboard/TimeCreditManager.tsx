import React from 'react';
import { Timer, Zap } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';

export function TimeCreditManager({
  minutes,
  userId,
  displayName
}: {
  minutes: number;
  userId: string;
  displayName: string;
}) {
  const handleUseCredit = () => {
    if (minutes <= 0) {
      toast.error("Vous n'avez pas de crédit de minutes disponible.");
      return;
    }
    toast.success(`Session de reprise lancée avec vos ${minutes} min de crédit !`);
  };

  return (
    <section className="glass p-4 md:p-6 rounded-[1.25rem] md:rounded-[2rem] border-2 border-secondary/30 shadow-neon-cyan text-left">
      <div className="flex items-center justify-between mb-2 text-white">
        <h4 className="font-display uppercase tracking-widest text-[9px] text-muted-foreground font-black">
          Crédit Temps (Interruptions)
        </h4>
        <Timer size={14} className="text-secondary" />
      </div>

      <div className="text-3xl md:text-4xl font-display font-black flex items-center justify-center gap-2 text-white py-1">
        {minutes} <span className="text-xs opacity-40 font-normal">MIN</span>
      </div>

      <p className="text-[9px] text-white/50 text-center uppercase tracking-tight mt-0.5 mb-3">
        Minutes sauvegardées lors d'arrêts imprévus.
      </p>

      <NeonButton
        variant="cyan"
        size="sm"
        disabled={minutes <= 0}
        onClick={handleUseCredit}
        className="w-full py-2 text-[11px] font-mono font-black"
      >
        <Zap size={13} /> Utiliser mon Crédit Temps
      </NeonButton>
    </section>
  );
}
