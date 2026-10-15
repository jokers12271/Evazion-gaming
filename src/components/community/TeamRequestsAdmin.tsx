import React from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { Check, X, Users, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function TeamRequestsAdmin() {
  return (
    <div className="mb-10 text-left">
      <CyberCard variant="orange" hoverEffect={false} className="p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-amber-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Demandes d'Adhésions aux Teams
            </h3>
          </div>
          <span className="text-[9px] font-mono text-amber-400">0 en attente</span>
        </div>
        <p className="text-xs text-white/40 italic">
          Toutes les demandes d'adhésion actuelles ont été traitées.
        </p>
      </CyberCard>
    </div>
  );
}

export function TeamConfigsAdmin() {
  return (
    <div className="mb-10 text-left">
      <CyberCard variant="orange" hoverEffect={false} className="p-6">
        <h3 className="text-sm font-black uppercase text-white tracking-wider mb-2">
          Configuration des Cotisations de Teams
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Gérez les frais d'adhésion initiaux (5 000 FCFA) et les cotisations mensuelles (2 000 FCFA) appliquées à chaque Team.
        </p>
      </CyberCard>
    </div>
  );
}
