import React from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { X, Users, CreditCard, Loader2 } from 'lucide-react';

export function TeamMembershipModal({
  teamId,
  config,
  onClose,
  onConfirm,
  isPending
}: {
  teamId: string;
  config: any;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center font-display">
      <CyberCard variant="cyan" hoverEffect={false} className="max-w-md w-full p-8 md:p-10 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary mb-5 shadow-neon-cyan">
          <Users size={28} />
        </div>

        <h3 className="text-2xl font-black uppercase text-white mb-1">
          Adhésion Team
        </h3>
        <p className="text-[10px] uppercase font-mono font-black text-secondary tracking-widest mb-6">
          ÉQUIPE : {teamId.toUpperCase()}
        </p>

        <div className="space-y-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 text-xs text-white/80">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50 uppercase font-mono text-[10px]">Frais d'intégration :</span>
            <span className="font-bold text-white text-sm">{config?.join_fee || 5000} FCFA</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50 uppercase font-mono text-[10px]">Cotisation mensuelle :</span>
            <span className="font-bold text-secondary text-sm">{config?.monthly_fee || 2000} FCFA</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 uppercase font-mono text-[10px]">Paiement Mobile / Airtel :</span>
            <span className="font-bold font-mono text-amber-400">{config?.payment_phone || '+242 06 612 34 56'}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed mb-6">
          Après confirmation, votre demande sera soumise à l'administration du Sanctuary. Les privilèges de votre équipe seront activés dès validation.
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
            variant="cyan"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-mono"
          >
            {isPending && <Loader2 size={14} className="animate-spin mr-1" />}
            {isPending ? "Transmission..." : "CONFIRMER L'ADHÉSION"}
          </NeonButton>
        </div>
      </CyberCard>
    </div>
  );
}
