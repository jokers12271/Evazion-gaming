import React from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { Trophy, Coins, Ticket } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useGamificationStore } from '@/lib/gamificationData';
import { cyberAudio } from '@/lib/cyberAudio';
import { toast } from 'react-hot-toast';

export function CollectiveJackpotCard({ userMani }: { userMani: number }) {
  const gamificationStore = useGamificationStore();
  const jackpot = gamificationStore.getJackpotData();

  const handleBuyTicket = () => {
    if (userMani < 2) {
      toast.error("Solde insuffisant ! 2 Jetons MANI requis par ticket de tombola.");
      return;
    }
    cyberAudio.playSuccess();
    gamificationStore.buyJackpotTicket();
    toast.success("Ticket de Tombola validé ! Bonne chance pour le tirage de fin de mois 🎟️", {
      position: 'bottom-center'
    });
  };

  return (
    <CyberCard variant="violet" hoverEffect={false} className="p-4 md:p-6 text-left font-display relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-white/10 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] md:text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
              <Trophy size={11} className="text-amber-400" /> Tombola Mensuelle du Sanctuaire
            </span>
            <span className="text-[9px] font-mono text-white/40 uppercase">
              Tirage dans 11 j
            </span>
          </div>
          <h3 className="text-base md:text-xl font-black uppercase text-white">
            Le Grand Jackpot Communautaire
          </h3>
          <p className="text-[11px] text-white/50 font-sans mt-0.5 max-w-xl">
            La cagnotte grandit à chaque ticket acheté. Un tirage au sort désigne le grand gagnant chaque fin de mois !
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 shrink-0 shadow-neon-orange">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
            <Coins size={20} />
          </div>
          <div>
            <div className="text-[8.5px] font-mono uppercase text-amber-400 font-black">
              Cagnotte Actuelle
            </div>
            <div className="text-lg font-black uppercase text-white font-mono">
              {jackpot.currentPool} <ManiIcon className="w-4 h-4" />
            </div>
            <div className="text-[9px] font-mono text-white/50">
              + Lots physiques lounge
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-center">
          <div className="text-[8.5px] font-mono uppercase text-white/40">Gros Lot en Jeu</div>
          <div className="text-[11px] font-bold text-white mt-0.5 line-clamp-2">{jackpot.prizeDesc}</div>
        </div>
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-center">
          <div className="text-[8.5px] font-mono uppercase text-white/40">Vos Tickets</div>
          <div className="text-base font-black text-secondary font-mono">{jackpot.userTickets} 🎟️</div>
        </div>
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-center">
          <div className="text-[8.5px] font-mono uppercase text-white/40">Total Tickets Salle</div>
          <div className="text-base font-black text-amber-400 font-mono">{jackpot.totalTickets} 👥</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-white/10">
        <div className="text-[11px] text-white/60 font-sans">
          Prix du ticket : <span className="text-amber-400 font-bold inline-flex items-center gap-1">2 <ManiIcon className="w-3.5 h-3.5" /></span>
        </div>

        <NeonButton
          size="sm"
          variant="violet"
          sweep
          onClick={handleBuyTicket}
          className="text-[11px] py-1.5 px-4 font-black uppercase tracking-wider"
        >
          <Ticket size={13} className="mr-1.5" /> Acheter 1 Ticket (2 <ManiIcon className="w-3.5 h-3.5" />)
        </NeonButton>
      </div>
    </CyberCard>
  );
}
