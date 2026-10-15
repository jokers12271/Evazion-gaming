import React from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { CyberCard } from '@/components/ui/CyberCard';
import { Crown, Sparkles, Coins } from 'lucide-react';

export function MonthlyRewardCard({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <div className="mb-12 text-left">
      <CyberCard variant="violet" hoverEffect={false} className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] shrink-0">
              <Crown size={20} className="md:size-[32px] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  RÉCOMPENSE MENSUELLE
                </span>
                <span className="text-[8px] font-mono text-white/40">Échéance : 1er du mois</span>
              </div>
              <h3 className="text-sm md:text-2xl font-display font-black uppercase text-white">
                LE TITRE DE JOUEUR DU MOIS
              </h3>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                Le joueur accumulant le plus d'heures et de victoires d'arène remporte 50 jetons et son nom gravé au Sanctuaire.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[8px] font-mono uppercase font-black text-white/40 block">PRIX GAGNANT</span>
              <span className="text-sm md:text-xl font-display font-black text-amber-400 flex items-center gap-1.5 justify-end">
                <ManiIcon className="w-4 h-4 md:w-5 md:h-5" /> x50 <Sparkles size={14} />
              </span>
            </div>
          </div>
        </div>
      </CyberCard>
    </div>
  );
}
