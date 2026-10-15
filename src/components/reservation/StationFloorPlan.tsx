import React, { useState } from 'react';
import { Monitor, Tv, Trophy, Coffee, CheckCircle2, AlertCircle, Sparkles, Zap, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cyberAudio } from '@/lib/cyberAudio';

export interface StationPlanItem {
  id: string;
  name: string;
  type: 'ps5' | 'vip' | 'arena' | 'bar';
  zone: string;
  screen: string;
  status: 'available' | 'occupied' | 'tournament';
  coords: { x: number; y: number; w: number; h: number };
}

const DEFAULT_STATIONS: StationPlanItem[] = [
  { id: 'station-1', name: 'Poste 01 (Ligne Nord)', type: 'ps5', zone: 'E-Sport 144Hz', screen: 'Sony Inzone M9 4K 144Hz', status: 'available', coords: { x: 8, y: 15, w: 20, h: 22 } },
  { id: 'station-2', name: 'Poste 02 (Ligne Nord)', type: 'ps5', zone: 'E-Sport 144Hz', screen: 'Sony Inzone M9 4K 144Hz', status: 'available', coords: { x: 31, y: 15, w: 20, h: 22 } },
  { id: 'station-3', name: 'Poste 03 (Ligne Nord)', type: 'ps5', zone: 'E-Sport 144Hz', screen: 'Sony Inzone M9 4K 144Hz', status: 'occupied', coords: { x: 54, y: 15, w: 20, h: 22 } },
  { id: 'station-4', name: 'Poste 04 (Ligne Nord)', type: 'ps5', zone: 'E-Sport 144Hz', screen: 'Sony Inzone M9 4K 144Hz', status: 'available', coords: { x: 77, y: 15, w: 20, h: 22 } },

  { id: 'station-5', name: 'Poste 05 (Ligne Sud)', type: 'ps5', zone: 'Combat & Casual', screen: 'LG OLED evo C3 48"', status: 'available', coords: { x: 8, y: 44, w: 20, h: 22 } },
  { id: 'station-6', name: 'Poste 06 (Ligne Sud)', type: 'ps5', zone: 'Combat & Casual', screen: 'LG OLED evo C3 48"', status: 'occupied', coords: { x: 31, y: 44, w: 20, h: 22 } },
  { id: 'station-7', name: 'Poste 07 (Ligne Sud)', type: 'ps5', zone: 'Combat & Casual', screen: 'LG OLED evo C3 48"', status: 'available', coords: { x: 54, y: 44, w: 20, h: 22 } },
  { id: 'station-8', name: 'Poste 08 (Ligne Sud)', type: 'ps5', zone: 'Combat & Casual', screen: 'LG OLED evo C3 48"', status: 'available', coords: { x: 77, y: 44, w: 20, h: 22 } },

  { id: 'vip-lounge', name: 'Salon VIP Ragnarök', type: 'vip', zone: 'Lounge Canapé 4K', screen: 'Sony Bravia XR 85" OLED + Son Surround', status: 'available', coords: { x: 8, y: 73, w: 43, h: 20 } },
  { id: 'arena-stage', name: 'Arène 1v1 Face-à-Face', type: 'arena', zone: 'Podium Tournoi', screen: 'Double Moniteur Compétition 240Hz', status: 'tournament', coords: { x: 54, y: 73, w: 43, h: 20 } }
];

interface StationFloorPlanProps {
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
}

export function StationFloorPlan({ selectedStationId, onSelectStation }: StationFloorPlanProps) {
  const [hoveredStation, setHoveredStation] = useState<StationPlanItem | null>(null);

  const handleStationClick = (station: StationPlanItem) => {
    if (station.status === 'occupied') {
      cyberAudio.playClick();
      return;
    }
    cyberAudio.playSuccess();
    onSelectStation(station.id);
  };

  return (
    <div className="bg-[#05070c] border border-white/10 rounded-3xl p-5 sm:p-7 backdrop-blur-xl relative overflow-hidden font-display">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-secondary">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
            Plan Architectural Interactif
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-1">
            The Sanctuary <span className="text-white/40">· Brazzaville Hub</span>
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-white/70">Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
            <span className="text-white/70">Occupé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="text-white/70">Arène Tournoi</span>
          </div>
        </div>
      </div>

      {/* Interactive Blueprint Map */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#030408] rounded-2xl border border-white/10 my-5 overflow-hidden p-2">
        {/* Radar Sweep Line */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Center Sanctuary Logo Ambient Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <span className="text-7xl font-black tracking-widest text-white">SANCTUARY</span>
        </div>

        {/* Stations Elements */}
        {DEFAULT_STATIONS.map((st) => {
          const isSelected = selectedStationId === st.id;
          const isOccupied = st.status === 'occupied';
          const isTournament = st.status === 'tournament';

          return (
            <button
              key={st.id}
              onClick={() => handleStationClick(st)}
              onMouseEnter={() => {
                setHoveredStation(st);
                cyberAudio.playClick();
              }}
              onMouseLeave={() => setHoveredStation(null)}
              style={{
                left: `${st.coords.x}%`,
                top: `${st.coords.y}%`,
                width: `${st.coords.w}%`,
                height: `${st.coords.h}%`
              }}
              disabled={isOccupied}
              className={cn(
                "absolute rounded-xl border transition-all duration-300 flex flex-col justify-between p-2 text-left group cursor-pointer",
                isOccupied && "border-red-500/30 bg-red-500/10 opacity-70 cursor-not-allowed",
                isTournament && "border-amber-500/40 bg-amber-500/10",
                !isOccupied && !isTournament && "border-emerald-500/30 bg-emerald-500/5 hover:border-secondary hover:bg-secondary/15 hover:shadow-neon-cyan",
                isSelected && "border-secondary bg-secondary/25 shadow-neon-cyan ring-2 ring-secondary/50 scale-[1.02]"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] sm:text-[11px] font-mono font-black text-white/90 truncate">
                  {st.name.replace(' (Ligne Nord)', '').replace(' (Ligne Sud)', '')}
                </span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isOccupied ? "bg-red-400" : isTournament ? "bg-amber-400 animate-pulse" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                  )}
                />
              </div>

              <div className="flex items-center gap-1.5 text-[8px] sm:text-[9.5px] font-mono text-white/60 truncate">
                {st.type === 'vip' ? (
                  <Tv size={12} className="text-secondary shrink-0" />
                ) : st.type === 'arena' ? (
                  <Trophy size={12} className="text-amber-400 shrink-0" />
                ) : (
                  <Monitor size={12} className="text-white/60 shrink-0" />
                )}
                <span className="truncate">{st.zone}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hovered / Selected Station Specs Inspector */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {hoveredStation || selectedStationId ? (
          (() => {
            const current = hoveredStation || DEFAULT_STATIONS.find((s) => s.id === selectedStationId);
            if (!current) return null;
            return (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{current.name}</span>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/80">
                      {current.zone}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-mono uppercase px-2 py-0.5 rounded border",
                        current.status === 'occupied'
                          ? "text-red-400 border-red-500/30 bg-red-500/10"
                          : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      )}
                    >
                      {current.status === 'occupied' ? 'Occupé' : 'Disponible'}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 font-sans flex items-center gap-2">
                    <span>Écran : <strong className="text-white">{current.screen}</strong></span>
                    <span>·</span>
                    <span>Matériel : <strong className="text-secondary">PS5 Pro + Manette DualSense Edge</strong></span>
                  </div>
                </div>

                {current.status !== 'occupied' && (
                  <button
                    onClick={() => {
                      onSelectStation(current.id);
                      cyberAudio.playSuccess();
                    }}
                    className="px-4 py-2 rounded-xl bg-secondary text-black font-black text-xs uppercase tracking-wider hover:bg-secondary/90 transition-all cursor-pointer shadow-neon-cyan shrink-0"
                  >
                    Choisir ce poste
                  </button>
                )}
              </>
            );
          })()
        ) : (
          <div className="text-xs text-white/50 flex items-center gap-2 py-1">
            <Info size={14} className="text-secondary" />
            <span>Survolez ou cliquez sur un poste sur le plan pour inspecter ses caractéristiques et le réserver.</span>
          </div>
        )}
      </div>
    </div>
  );
}
