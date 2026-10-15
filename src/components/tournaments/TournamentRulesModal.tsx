import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';

export function TournamentRulesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-display">
      <CyberCard variant="cyan" hoverEffect={false} className="w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar p-6 md:p-8 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={18} className="text-secondary" />
          <span className="text-[10px] font-mono uppercase text-secondary font-black tracking-widest">
            Règlement Officiel E-Sport
          </span>
        </div>

        <h3 className="text-2xl md:text-3xl font-black uppercase text-white mb-4">
          Charte & Conditions des Tournois The Sanctuary
        </h3>

        <div className="space-y-4 text-xs font-sans text-white/80 leading-relaxed">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <h4 className="font-display font-black uppercase text-sm text-secondary mb-1">
              1. Format & Durée des Matchs (EA SPORTS FC 26)
            </h4>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Mi-temps de 6 minutes en vitesse de jeu normale.</li>
              <li>Météo dégagée, heure 20h00, pelouse neutre.</li>
              <li>En cas d'égalité à la fin du temps réglementaire : Prolongations classiques puis tirs au but.</li>
              <li>Pause autorisée uniquement lorsque le ballon est hors du jeu (max 30 secondes par joueur).</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <h4 className="font-display font-black uppercase text-sm text-secondary mb-1">
              2. Matériel & Manettes
            </h4>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Manettes officielles DualSense PS5 Pro fournies par le Sanctuaire et révisées avant chaque match.</li>
              <li>Les manettes personnelles sont autorisées sous réserve d'inspection par l'arbitre de salle (aucun mod ou turbo autorisé).</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <h4 className="font-display font-black uppercase text-sm text-secondary mb-1">
              3. Check-in & Retards
            </h4>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Présence physique exigée au comptoir du hub 30 minutes avant le premier coup d'envoi.</li>
              <li>Tout joueur absent 10 minutes après l'appel de son match est déclaré forfait (score technique 3 - 0).</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <h4 className="font-display font-black uppercase text-sm text-secondary mb-1">
              4. Fair-Play & Respect
            </h4>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Comportement toxique, insultes ou dégradation de matériel entraînent l'exclusion immédiate sans remboursement des frais d'inscription.</li>
              <li>La décision de l'arbitre officiel du Sanctuaire est souveraine et sans appel.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <NeonButton variant="violet" onClick={onClose} className="px-6 py-2.5 text-xs font-black">
            J'ai Lu et J'Accepte le Règlement
          </NeonButton>
        </div>
      </CyberCard>
    </div>
  );
}
