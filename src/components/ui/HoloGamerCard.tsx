import React, { useState, useRef } from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { Shield, Sparkles, QrCode, Crown, Zap, Flame, Award, Gamepad2 } from 'lucide-react';
import { getRank } from '@/lib/ranks';
import { cn } from '@/lib/utils';

interface HoloGamerCardProps {
  displayName: string;
  avatarUrl?: string;
  totalHours: number;
  maniBalance?: number;
  userId?: string;
  isVip?: boolean;
}

export function HoloGamerCard({
  displayName,
  avatarUrl,
  totalHours,
  maniBalance = 0,
  userId = 'GMR-BZV-2026',
  isVip = false
}: HoloGamerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const rank = getRank(totalHours);
  const isGoldTier = rank.name === 'Légende' || rank.name === 'Ragnarök' || isVip;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlareX((x / rect.width) * 100);
    setGlareY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="w-full max-w-md mx-auto py-2 font-display select-none"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out'
        }}
        className={cn(
          "relative aspect-[1.586/1] rounded-3xl p-6 sm:p-7 border overflow-hidden cursor-pointer shadow-2xl flex flex-col justify-between",
          isGoldTier
            ? "border-amber-400/40 bg-[#0c0904] shadow-[0_0_35px_rgba(234,179,8,0.25)]"
            : "border-white/20 bg-[#060810] shadow-[0_0_35px_rgba(6,182,212,0.2)]"
        )}
      >
        {/* Holographic Iridescent Foil Overlay */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay transition-opacity",
            isGoldTier ? "holo-foil-gold" : "holo-foil",
            isHovered ? "opacity-70" : "opacity-35"
          )}
        />

        {/* Dynamic Light Glare */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0
          }}
        />

        {/* Top Header of the Pass */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center text-secondary">
              <Gamepad2 size={22} />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-white/50 uppercase">
                MEMBRE OFFICIEL
              </div>
              <div className="text-base sm:text-lg font-black text-white tracking-wider">
                THE SANCTUARY
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border",
                isGoldTier
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                  : "bg-secondary/20 text-secondary border-secondary/40"
              )}
            >
              {rank.name.toUpperCase()}
            </span>
            <div className="text-[8px] font-mono text-white/40 mt-1">
              BRAZZAVILLE · CONGO
            </div>
          </div>
        </div>

        {/* Center Chip & Security Hologram */}
        <div className="relative z-10 flex items-center justify-between my-2">
          {/* Smartcard Gold Chip */}
          <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border border-amber-300/60 p-1 flex flex-col justify-between shadow-inner">
            <div className="w-full h-0.5 bg-black/30 rounded" />
            <div className="w-full h-0.5 bg-black/30 rounded" />
            <div className="w-full h-0.5 bg-black/30 rounded" />
          </div>

          {/* Member NFC / Hologram Icon */}
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-mono">
            <Sparkles size={14} className={isGoldTier ? "text-amber-400" : "text-secondary"} />
            <span>PASS SÉCURISÉ NFC</span>
          </div>
        </div>

        {/* Bottom Details & QR Code */}
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <div className="text-xs sm:text-sm font-black text-white tracking-wide truncate max-w-[180px]">
              {displayName || 'Gamer Élite'}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/60 mt-1">
              <span>{totalHours}h de jeu</span>
              <span>·</span>
              <span className="text-amber-400 font-bold inline-flex items-center gap-1.5">{maniBalance} <ManiIcon className="w-4 h-4" /></span>
            </div>
            <div className="text-[8.5px] font-mono text-white/30 tracking-widest mt-0.5">
              ID: {userId.slice(0, 14)}
            </div>
          </div>

          {/* Mini QR Code Stamp for Lounge Reception */}
          <div className="w-14 h-14 rounded-xl bg-white p-1 shadow-lg shrink-0 flex items-center justify-center">
            <QrCode size={46} className="text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
