import React from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { Shield, Sparkles, Trophy, Cpu, Gamepad2, Users } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';

export function AboutUsSection() {
  return (
    <section className="py-16 md:py-24 bg-background relative border-t border-white/5 text-center">
      <div className="container mx-auto px-5 max-w-5xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-4">
          <Cpu className="text-secondary animate-pulse" size={14} />
          <span className="text-[9px] uppercase tracking-widest font-black text-white">Le Sanctuaire E-Sport</span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase text-white mb-6">
          À PROPOS DU <span className="text-primary italic">SANCTUARY</span>
        </h2>

        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl mx-auto uppercase tracking-wider font-bold leading-relaxed mb-12">
          Plus qu'une simple salle de jeux, The Sanctuary est le temple de la compétition et du divertissement nouvelle génération au cœur de Brazzaville.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <CyberCard variant="cyan" className="p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary mb-4 border border-secondary/30">
              <Gamepad2 size={24} />
            </div>
            <h3 className="text-xl font-display font-black uppercase text-white mb-2">Matériel de Pointe</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consoles PlayStation 5 Pro exclusives, manettes DualSense Edge et écrans 4K HDR 120Hz configurés pour la réactivité esport.
            </p>
          </CyberCard>

          <CyberCard variant="violet" className="p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4 border border-primary/30">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-display font-black uppercase text-white mb-2 flex items-center gap-2">Système de Rang & <ManiIcon className="w-5 h-5" /></h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Votre temps passé en salle est récompensé. Chaque heure vous rapproche d'un rang supérieur et débloque des <ManiIcon className="w-3.5 h-3.5" /> échangeables.
            </p>
          </CyberCard>

          <CyberCard variant="orange" className="p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/30">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-display font-black uppercase text-white mb-2">Esprit de Communauté</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rejoignez ou formez votre Team de jeu, lancez des défis Ragnarok en direct et hissez vos couleurs au sommet du classement.
            </p>
          </CyberCard>
        </div>
      </div>
    </section>
  );
}
