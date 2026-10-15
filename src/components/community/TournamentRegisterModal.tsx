import React from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { X, Trophy, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { Tournament } from '@/hooks/useTournaments';

export function TournamentRegisterModal({
  tourney,
  onClose,
  onConfirm,
  isPending
}: {
  tourney: Tournament;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center font-display">
      <CyberCard variant="violet" hoverEffect={false} className="max-w-md w-full p-8 md:p-10 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary mb-5 shadow-neon-violet">
          <Trophy size={28} />
        </div>

        <h3 className="text-2xl font-black uppercase text-white mb-1">
          Règlement Tournoi
        </h3>
        <p className="text-[10px] uppercase font-mono font-black text-secondary tracking-widest mb-6">
          {tourney.title}
        </p>

        <div className="space-y-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 text-xs text-white/80">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50 uppercase font-mono text-[10px]">Frais de compétition :</span>
            <span className="font-bold text-amber-400 text-sm">{(tourney as any).fee_amount || 0} FCFA</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 uppercase font-mono text-[10px]">Numéro de paiement :</span>
            <span className="font-bold font-mono text-white">{(tourney as any).payment_phone || '+242 06 612 34 56'}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed mb-6">
          Veuillez régler vos frais d'inscription auprès du numéro indiqué ci-dessus ou directement à l'accueil physique du Sanctuary.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-mono uppercase font-black text-white/50 hover:text-white transition-colors"
          >
            Annuler
          </button>
          <NeonButton
            variant="violet"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-mono"
          >
            {isPending && <Loader2 size={14} className="animate-spin mr-1" />}
            {isPending ? "Transmission..." : "CONFIRMER L'INSCRIPTION"}
          </NeonButton>
        </div>
      </CyberCard>
    </div>
  );
}

export function TournamentRequestsAdmin() {
  return (
    <div className="mb-10 text-left">
      <CyberCard variant="orange" hoverEffect={false} className="p-6">
        <h3 className="text-sm font-black uppercase text-white tracking-wider mb-2">
          Demandes d'inscriptions aux tournois (Admin)
        </h3>
        <p className="text-xs text-white/40">
          Les demandes des joueurs apparaissent ici en temps réel pour validation de paiement.
        </p>
      </CyberCard>
    </div>
  );
}
