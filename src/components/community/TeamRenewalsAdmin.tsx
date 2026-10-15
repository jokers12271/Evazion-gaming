import React from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { Calendar, Check, X } from 'lucide-react';

export function TeamRenewalsAdmin() {
  return (
    <div className="mb-8 text-left">
      <CyberCard variant="orange" hoverEffect={false} className="p-6">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Renouvellements de Cotisations
            </h3>
          </div>
          <span className="text-[9px] font-mono text-amber-400">À jour</span>
        </div>
        <p className="text-xs text-white/50">
          Toutes les cotisations de membres pour le mois en cours sont à jour.
        </p>
      </CyberCard>
    </div>
  );
}
