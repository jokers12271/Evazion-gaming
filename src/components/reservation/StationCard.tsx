import React from 'react';
import { cn } from '@/lib/utils';
import { Power, PowerOff, Monitor, CheckCircle2 } from 'lucide-react';
import { Station } from '@/hooks/useStations';

export function StationCard({
  station,
  isOccupied,
  isManuallyOccupied,
  isSelected,
  isAdmin,
  onSelect,
  onBlock
}: {
  station: Station;
  isOccupied: boolean;
  isManuallyOccupied?: boolean;
  isSelected?: boolean;
  isAdmin?: boolean;
  onSelect?: (id: string) => void;
  onBlock?: (id: string, blocked: boolean) => void;
}) {
  const isBlocked = isManuallyOccupied || false;

  return (
    <div
      onClick={() => {
        if (!isAdmin && !isOccupied && !isBlocked && onSelect) {
          onSelect(station.id);
        }
      }}
      className={cn(
        // Version mobile utilisateur : cartes compactées (l'admin garde la taille d'origine)
        !isAdmin && "p-2.5 md:p-4 rounded-xl md:rounded-2xl",
        isAdmin && "p-4 rounded-2xl",
        "border transition-all duration-300 relative overflow-hidden flex flex-col justify-between text-left select-none cursor-pointer",
        isSelected
          ? "border-secondary shadow-neon-cyan ring-2 ring-secondary"
          : isOccupied
          ? "border-orange-500/30 opacity-80 cursor-not-allowed"
          : isBlocked
          ? "border-red-500/30 opacity-60 cursor-not-allowed"
          : "border-white/10 hover:border-secondary/50"
      )}
    >
      {/* Image de fond — PS5 */}
      <img
        src="/PS5.jpg"
        alt=""
        aria-hidden="true"
        className={cn(
          "absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300",
          isOccupied ? "opacity-25" : isBlocked ? "opacity-15" : "opacity-45"
        )}
      />
      {/* Filtre sombre — assez pour la lisibilité, pas assez pour masquer l'image */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-colors duration-300",
          isSelected
            ? "bg-secondary/45"
            : isOccupied
            ? "bg-orange-950/70"
            : isBlocked
            ? "bg-red-950/75"
            : "bg-black/60"
        )}
      />

      <div className={cn("flex items-center justify-between relative z-10", isAdmin ? "mb-3" : "mb-2 md:mb-3")}>
        <div className={cn("rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/80", isAdmin ? "w-8 h-8" : "w-6 h-6 md:w-8 md:h-8")}>
          <Monitor size={isAdmin ? 16 : 13} />
        </div>

        <div className="flex items-center gap-1 md:gap-1.5">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isOccupied
                ? "bg-orange-500 shadow-[0_0_8px_#f97316] animate-pulse"
                : isBlocked
                ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                : "bg-emerald-400 shadow-[0_0_8px_#22c55e]"
            )}
          />
          <span
            className={cn(
              "font-mono font-bold uppercase tracking-wider",
              isAdmin ? "text-[8px]" : "text-[7px] md:text-[8px]",
              isOccupied ? "text-orange-400" : isBlocked ? "text-red-400" : "text-emerald-400"
            )}
          >
            {isOccupied ? "Occupé" : isBlocked ? "Bloqué" : "Libre"}
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <h4 className={cn("font-display font-black uppercase text-white leading-none", isAdmin ? "text-sm mb-0.5" : "text-[11px] md:text-sm md:mb-0.5")}>
          {station.name || station.id.replace('_', ' #')}
        </h4>
        <span className={cn("font-mono text-white/50 uppercase block", isAdmin ? "text-[8px]" : "text-[7px] md:text-[8px]")}>
          {station.specs || 'PS5 PRO // 4K 120HZ'}
        </span>
      </div>

      {isAdmin && onBlock && (
        <div className="relative z-10 mt-3 pt-2 border-t border-white/10 flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBlock(station.id, !isBlocked);
            }}
            className={cn(
              "w-full py-1 rounded text-[8px] font-mono font-black uppercase transition-colors flex items-center justify-center gap-1",
              isBlocked ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
          >
            {isBlocked ? <Power size={10} /> : <PowerOff size={10} />}
            {isBlocked ? "Libérer" : "Bloquer"}
          </button>
        </div>
      )}
    </div>
  );
}
