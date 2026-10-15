import React, { useState } from 'react';
import { Coins, Clock, Zap, Sparkles, ArrowRight, ShieldCheck, Flame, Gift } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { Link } from '@tanstack/react-router';
import { getRank, getRankProgress } from '@/lib/ranks';
import { useLoyalty } from '@/hooks/useLoyalty';
import { cyberAudio } from '@/lib/cyberAudio';

export function ManiSimulator() {
  const [hours, setHours] = useState<number>(3);
  const { data: loyalty } = useLoyalty();

  const currentTotalHours = loyalty?.total_hours || 0;
  const projectedHours = currentTotalHours + hours;

  const currentRank = getRank(currentTotalHours);
  const projectedRank = getRank(projectedHours);

  // MANI generation rule: 1 MANI every 4 hours of gameplay
  const currentMani = Math.floor(currentTotalHours / 4);
  const projectedMani = Math.floor(projectedHours / 4);
  const maniGained = projectedMani - currentMani;

  // Pricing logic (FCFA)
  // 1h = 1,500 FCFA. 4h+ = 1,350 FCFA/h. 8h+ = 1,200 FCFA/h
  const hourlyRate = hours >= 8 ? 1200 : hours >= 4 ? 1350 : 1500;
  const standardPrice = hours * 1500;
  const actualPrice = hours * hourlyRate;
  const savings = standardPrice - actualPrice;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHours(parseInt(e.target.value, 10));
    cyberAudio.playClick();
  };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background Cyber Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-secondary/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-[10px] font-mono font-black uppercase tracking-widest mb-3">
            <Coins size={13} />
            <span className="inline-flex items-center gap-1">Simulateur Économique & Mineur de <ManiIcon className="w-3.5 h-3.5" /></span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-white">
            Planifiez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-accent">Session</span>
          </h2>
          <p className="text-sm md:text-base text-white/60 mt-3 font-sans">
            Au Sanctuary, chaque heure sur nos PS5 Pro accumule de l'XP et mine automatiquement des pièces de <strong className="text-white inline-flex items-center gap-1"><ManiIcon className="w-4 h-4" /></strong> échangeables contre des boissons et récompenses réelles.
          </p>
        </div>

        {/* Interactive Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#07090e]/80 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative">
          {/* Left: Interactive Controls */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-display font-black uppercase tracking-wider text-white/80 flex items-center gap-2">
                  <Clock size={16} className="text-secondary" />
                  Durée de session estimée
                </label>
                <span className="text-2xl sm:text-3xl font-display font-black text-secondary">
                  {hours} {hours === 1 ? 'Heure' : 'Heures'}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={hours}
                onChange={handleSliderChange}
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary transition-all"
              />

              <div className="flex justify-between text-[11px] font-mono text-white/40 mt-2 px-1">
                <span>1h (Express)</span>
                <span className="inline-flex items-center gap-1">4h (Pack <ManiIcon className="w-3 h-3" /> +1)</span>
                <span>8h (Session Intense)</span>
                <span>10h (Marathon)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 w-full mb-1">
                Packs populaires :
              </span>
              {[2, 4, 6, 8].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setHours(preset);
                    cyberAudio.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    hours === preset
                      ? 'border-secondary bg-secondary/20 text-white shadow-neon-cyan'
                      : 'border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset}h {preset >= 4 && '⚡ Booster'}
                </button>
              ))}
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1 flex items-center gap-1.5">
                  <Coins size={12} className="text-amber-400" />
                  Jetons <ManiIcon className="w-4 h-4" />
                </div>
                <div className="text-xl font-display font-black text-amber-400">
                  +{maniGained} <ManiIcon className="w-4 h-4" />
                </div>
                <div className="text-[9px] text-white/40 mt-1">
                  <span className="inline-flex items-center gap-1"><ManiIcon className="w-3.5 h-3.5" /> x1 / 4h jouées</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1 flex items-center gap-1.5">
                  <Zap size={12} className="text-secondary" />
                  XP & Points
                </div>
                <div className="text-xl font-display font-black text-secondary">
                  +{hours * 100} <span className="text-xs font-sans font-normal text-white/60">PTS</span>
                </div>
                <div className="text-[9px] text-white/40 mt-1">
                  +100 pts par heure
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1 flex items-center gap-1.5">
                  <Gift size={12} className="text-purple-400" />
                  Bonus Temps
                </div>
                <div className="text-xl font-display font-black text-purple-400">
                  +{hours >= 4 ? '30' : '15'} <span className="text-xs font-sans font-normal text-white/60">min</span>
                </div>
                <div className="text-[9px] text-white/40 mt-1">
                  Offertes selon rang
                </div>
              </div>
            </div>
          </div>

          {/* Right: Projected Summary & Instant Booking */}
          <div className="lg:col-span-5 bg-gradient-to-b from-white/[0.06] to-transparent border border-white/15 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-xs font-mono uppercase tracking-widest text-white/60">
                  Tarif Estimé (FCFA)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {savings > 0 ? `Économie : -${savings.toLocaleString('fr-FR')} F` : 'Tarif standard'}
                </span>
              </div>

              <div className="my-5">
                <div className="text-4xl sm:text-5xl font-display font-black text-white">
                  {actualPrice.toLocaleString('fr-FR')}{' '}
                  <span className="text-lg font-mono text-secondary">FCFA</span>
                </div>
                <div className="text-xs text-white/40 font-mono mt-1">
                  Soit {(actualPrice / hours).toLocaleString('fr-FR')} FCFA par heure
                </div>
              </div>

              {/* Projected Rank evolution */}
              <div className="bg-black/40 rounded-xl p-3.5 border border-white/10 mb-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/60">Évolution de Rang :</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {currentRank.name} <ArrowRight size={12} className="text-secondary" /> {projectedRank.name}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-secondary to-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (projectedHours / (projectedRank.max || 100)) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-white/40 mt-2 flex items-center justify-between">
                  <span>Actuel : {currentTotalHours}h</span>
                  <span className="text-secondary">Après session : {projectedHours}h</span>
                </div>
              </div>
            </div>

            <Link to="/reservation">
              <NeonButton
                size="lg"
                variant="cyan"
                sweep
                cornerAccents
                className="w-full py-4 text-xs font-black tracking-widest shadow-neon-cyan"
              >
                Réserver cette session ({hours}h)
              </NeonButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
