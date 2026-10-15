import React from 'react';
import { getRank } from '@/lib/ranks';
import { RankPerkList } from '@/components/home/RankPerks';
import { Star, Gift } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';

export function GamerPrivileges({
  totalHours,
  displayName
}: {
  totalHours: number;
  displayName: string;
}) {
  const currentRank = getRank(totalHours);

  const handleClaimPerk = (perkLabel: string) => {
    toast.success(`Demande de privilège physique (« ${perkLabel} ») transmise à l'accueil du Sanctuary !`);
  };

  return (
    <section className="glass p-4 md:p-6 rounded-[1.25rem] md:rounded-[2rem] border-2 border-primary/30 shadow-neon-violet text-left">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display uppercase tracking-widest text-[9px] text-muted-foreground font-black flex items-center gap-1.5">
          <Star size={12} className="text-amber-400" />
          Mes Privilèges Actifs
        </h4>
        <span className="text-[9px] font-mono font-bold" style={{ color: currentRank.color }}>
          RANG {currentRank.name}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <RankPerkList rank={currentRank} size="sm" />
      </div>

      <NeonButton
        variant="ghost"
        size="sm"
        onClick={() => handleClaimPerk("Boisson / Collation de Rang")}
        className="w-full text-[9px] font-mono tracking-wider py-1.5 border-primary/40 text-primary hover:bg-primary/10"
      >
        <Gift size={11} /> Réclamer ma collation au comptoir
      </NeonButton>
    </section>
  );
}

export function PrivilegeRequestsAdmin() {
  return (
    <section className="glass p-5 rounded-[1.5rem] border-2 border-amber-500/30 text-left mb-6">
      <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2">
        Demandes de Privilèges Joueurs (Comptoir)
      </h4>
      <p className="text-[10px] text-white/50">
        Les demandes de boissons ou collations réclamées par les membres apparaissent ici pour remise physique.
      </p>
    </section>
  );
}
