import React from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { Flame, Trophy, Coins, Radio } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { Link } from '@tanstack/react-router';
import { NeonButton } from '@/components/ui/NeonButton';

export function LiveHighlights() {
  return (
    <section className="py-12 md:py-16 bg-background border-t border-white/5 text-center">
      <div className="container mx-auto px-5 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-left">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-black text-secondary tracking-widest uppercase mb-1">
              <Radio size={14} className="animate-pulse" />
              TEMPS FORTS DU SANCTUARY
            </div>
            <h3 className="text-2xl md:text-4xl font-display font-black uppercase text-white">
              ÉVÉNEMENTS & CASH PRIZES
            </h3>
          </div>
          <Link to="/tournaments">
            <NeonButton variant="cyan" size="sm" sweep cornerAccents className="text-[10px] tracking-widest py-3">
              Tous les Tournois
            </NeonButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <CyberCard variant="violet" className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/40">
                  TOURNOI DU MOIS
                </span>
                <span className="text-[9px] font-mono font-bold text-white/50">EA SPORTS FC 26</span>
              </div>
              <h4 className="text-xl md:text-2xl font-display font-black uppercase text-white mb-2">
                SANCTUARY MASTERS 2026
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Le plus grand rassemblement de joueurs de Brazzaville. 64 participants, élimination directe sur PS5 Pro et retransmission sur écrans géants.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="text-left">
                <span className="text-[8px] font-mono font-black uppercase text-white/40 block">CASH PRIZE TOTAL</span>
                <span className="text-xl font-display font-black text-amber-400">150 000 FCFA</span>
              </div>
              <Link to="/tournaments">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-secondary hover:underline">
                  Participer →
                </span>
              </Link>
            </div>
          </CyberCard>

          <CyberCard variant="orange" className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  ARÈNE RAGNAROK
                </span>
                <span className="text-[9px] font-mono font-bold text-white/50">DÉFIS 1V1 LIVE</span>
              </div>
              <h4 className="text-xl md:text-2xl font-display font-black uppercase text-white mb-2">
                DUELS & PARIS DE JETONS
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Provoquez vos rivaux sur Tekken 8 ou Mortal Kombat 1. Misez vos jetons et remportez la gloire devant les membres en salle.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="text-left">
                <span className="text-[8px] font-mono font-black uppercase text-white/40 block">MONNAIE EN JEU</span>
                <span className="text-xl font-display font-black text-amber-400 flex items-center gap-1.5">
                  <ManiIcon className="w-5 h-5" /> x1 = 4H JEU
                </span>
              </div>
              <Link to="/community">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400 hover:underline">
                  Voir l'Arène →
                </span>
              </Link>
            </div>
          </CyberCard>
        </div>
      </div>
    </section>
  );
}
