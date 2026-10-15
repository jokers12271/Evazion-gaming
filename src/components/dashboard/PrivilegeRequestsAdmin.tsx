import React from 'react';

export function PrivilegeRequestsAdmin() {
  return (
    <section className="glass p-6 rounded-[2rem] border-2 border-amber-500/30 text-left mb-6">
      <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2">
        Demandes de Privilèges Joueurs (Comptoir)
      </h4>
      <p className="text-[10px] text-white/50">
        Les demandes de boissons ou collations réclamées par les membres apparaissent ici pour remise physique.
      </p>
    </section>
  );
}
