import React from 'react';
import { CheckCircle2, Gamepad2, Calendar, Users, ShieldCheck, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ModalShell } from '@/components/ui/ModalShell';
import { NeonButton } from '@/components/ui/NeonButton';

interface TournamentRegisterModalProps {
  tourney: any;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function TournamentRegisterModal({ tourney, onClose, onConfirm, isPending }: TournamentRegisterModalProps) {
  if (!tourney) return null;

  return (
    <ModalShell isOpen onClose={onClose} title="Inscription Validee" accent="violet">
      <div className="space-y-4 text-center font-display">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shadow-neon-violet">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
        </div>

        <div>
          <h3 className="text-sm md:text-base font-black uppercase text-white leading-tight">{tourney.title}</h3>
          <p className="text-[10px] font-mono uppercase text-emerald-400 tracking-widest mt-1">
            Inscription acceptee par le staff
          </p>
        </div>

        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2 text-left">
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
            <Gamepad2 size={12} className="text-primary shrink-0" />
            <span className="text-white/40 uppercase">Discipline</span>
            <span className="text-white font-bold ml-auto truncate">{tourney.game}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
            <Calendar size={12} className="text-primary shrink-0" />
            <span className="text-white/40 uppercase">Date</span>
            <span className="text-white font-bold ml-auto text-right">
              {tourney.date ? format(new Date(tourney.date), 'dd MMMM yyyy', { locale: fr }) : 'A CONFIRMER'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
            <Users size={12} className="text-primary shrink-0" />
            <span className="text-white/40 uppercase">Type</span>
            <span className="text-white font-bold ml-auto">{tourney.is_paid ? 'Payant' : 'Gratuit'}</span>
          </div>
          {tourney.is_paid && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
              <ShieldCheck size={12} className="text-amber-400 shrink-0" />
              <span className="text-white/40 uppercase">Frais</span>
              <span className="text-amber-400 font-bold ml-auto">{(tourney.fee_amount || 0).toLocaleString()} FCFA</span>
            </div>
          )}
        </div>

        <p className="text-[10px] font-sans text-white/50 leading-relaxed">
          Votre place est confirmee. Retrievez votre Pass Check-in QR et presentez-le au staff d'accueil le jour J
          pour enregistrer votre presence sur l'arbre du tournoi.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 rounded-lg border border-white/10 text-white/50 hover:text-white text-[10px] font-black uppercase cursor-pointer transition-colors"
          >
            Fermer
          </button>
          <NeonButton
            variant="violet"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
          >
            <QrCode size={12} /> Mon Pass Check-in
          </NeonButton>
        </div>
      </div>
    </ModalShell>
  );
}
