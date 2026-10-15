import React from 'react';
import { CyberCard } from '@/components/ui/CyberCard';

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
