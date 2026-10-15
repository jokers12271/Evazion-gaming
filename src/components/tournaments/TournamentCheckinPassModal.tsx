import React from 'react';
import { X, QrCode, Shield, CheckCircle2, Gamepad2, Calendar, MapPin } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';

interface TournamentCheckinPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: any;
  user: any;
  rankName: string;
}

export function TournamentCheckinPassModal({ isOpen, onClose, tournament, user, rankName }: TournamentCheckinPassModalProps) {
  if (!isOpen || !tournament) return null;

  // Payload lisible par le scanner admin : EVZ-PASS|<id tournoi>|<id joueur>|<cashprize>
  const payload = `EVZ-PASS|${tournament.id}|${user?.id || ''}|${tournament.cashprize_fcfa ?? 0}`;
  const passId = `SNCT-PASS-${(tournament.id || 't1').toUpperCase()}-${(user?.id || 'demo').slice(-4)}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-display">
      <CyberCard variant="violet" hoverEffect={false} className="w-full max-w-md p-6 md:p-8 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-black tracking-widest">
            Pass Compétiteur Validé
          </span>
        </div>

        <h3 className="text-xl font-black uppercase text-white mb-1">
          {tournament.title}
        </h3>
        <p className="text-[10px] font-mono text-secondary uppercase mb-6">
          Check-in Numérique au Comptoir The Sanctuary
        </p>

        {/* Badge Pass Design */}
        <div className="p-6 rounded-2xl bg-black/60 border border-white/15 relative overflow-hidden mb-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/20 to-transparent pointer-events-none" />

          {/* QR Code généré via API SVG */}
          <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-xl shadow-neon-violet mb-4 flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}&color=050608`}
              alt="QR Check-in"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="font-mono text-xs font-black text-amber-400 tracking-wider mb-2">
            {passId}
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-3 border-t border-white/10 text-[10px] font-mono">
            <div>
              <span className="text-white/40 block">JOUEUR</span>
              <span className="text-white font-bold">{user?.user_metadata?.display_name || user?.email || 'Gamer'}</span>
            </div>
            <div>
              <span className="text-white/40 block">RANG HUB</span>
              <span className="text-secondary font-bold">{rankName}</span>
            </div>
            <div>
              <span className="text-white/40 block">STATION DÉDIÉE</span>
              <span className="text-white font-bold">PS5 Pro #01 à #08</span>
            </div>
            <div>
              <span className="text-white/40 block">LIEU</span>
              <span className="text-emerald-400 font-bold">Brazzaville Hub</span>
            </div>
            <div>
              <span className="text-white/40 block">CASHPRIZE</span>
              <span className="text-amber-400 font-bold">{(tournament.cashprize_fcfa || 0).toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-sans text-white/60 mb-5">
          Présentez ce QR Code au staff d'accueil à votre arrivée dans la salle pour confirmer immédiatement votre présence sur l'arbre de tournoi.
        </p>

        <NeonButton variant="ghost" onClick={onClose} className="w-full py-2.5 text-xs font-black">
          Fermer mon Pass
        </NeonButton>
      </CyberCard>
    </div>
  );
}
