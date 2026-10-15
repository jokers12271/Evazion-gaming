import React, { useState } from 'react';
import { X, Sparkles, Trophy, Coins, RotateCw, CheckCircle2 } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useGamificationStore } from '@/lib/gamificationData';
import { cyberAudio } from '@/lib/cyberAudio';
import { toast } from 'react-hot-toast';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHEEL_SEGMENTS = [
  { label: '+2 MANI', color: '#8b5cf6', icon: '🪙', type: 'mani', amount: 2 },
  { label: '15 Min PS5', color: '#06b6d4', icon: '⏳', type: 'time', amount: 15 },
  { label: 'Boisson Bar', color: '#3b82f6', icon: '🥤', type: 'drink', amount: 1 },
  { label: '+5 MANI', color: '#eab308', icon: '💎', type: 'mani', amount: 5 },
  { label: 'Ticket Jackpot', color: '#ec4899', icon: '🎟️', type: 'ticket', amount: 1 },
  { label: '+1 MANI', color: '#a855f7', icon: '🪙', type: 'mani', amount: 1 },
  { label: '30 Min PS5', color: '#10b981', icon: '⚡', type: 'time', amount: 30 },
  { label: 'Double XP 1h', color: '#f97316', icon: '👑', type: 'xp', amount: 1 }
];

export function LuckyWheelModal({ isOpen, onClose }: LuckyWheelModalProps) {
  const gamificationStore = useGamificationStore();
  const spinState = gamificationStore.getSpinState();
  const segments = gamificationStore.getWheelSegments();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    setWonPrize(null);
    cyberAudio.playClick();

    // Pick a random prize
    const prizeIndex = Math.floor(Math.random() * segments.length);
    const selectedPrize = segments[prizeIndex];

    // Calculate rotation: 5 full spins (1800 deg) + angle to target
    const segmentAngle = 360 / segments.length;
    // Target angle points to top (270 deg / needle position)
    const targetAngle = 360 * 5 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);
    const newRotation = rotation + targetAngle;

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(selectedPrize);
      cyberAudio.playSuccess();
      gamificationStore.recordSpin(selectedPrize.label);
      toast.success(`Félicitations ! Vous avez gagné : ${selectedPrize.label} 🎉`, {
        position: 'bottom-center'
      });
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in font-display">
      <CyberCard
        variant="violet"
        hoverEffect={false}
        className="w-full max-w-lg p-6 md:p-8 relative text-center overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer z-20"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={16} className="text-amber-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase text-amber-400 font-black tracking-widest">
            Arcade Sanctuary
          </span>
        </div>

        <h3 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight mb-1">
          La Roue de la Fortune
        </h3>
        <p className="text-xs text-white/60 font-sans mb-6">
          1 tour offert chaque jour aux membres du hub. Tournez la roue pour débloquer votre lot !
        </p>

        {/* Wheel container with pointer */}
        <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
          {/* Arrow Pointer */}
          <div className="absolute -top-3 z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          </div>

          {/* Rotating Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-[0_0_30px_rgba(168,85,247,0.4)] relative overflow-hidden transition-transform ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '4000ms' : '0ms'
            }}
          >
            {segments.map((seg, idx) => {
              const rotateDeg = (360 / segments.length) * idx;
              return (
                <div
                  key={idx}
                  className="absolute w-1/2 h-full top-0 right-0 origin-left flex items-center justify-end pr-2.5 font-bold text-[9px] uppercase tracking-wider text-white"
                  style={{
                    transform: `rotate(${rotateDeg}deg)`,
                    backgroundColor: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 27, 75, 0.95)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span className="transform -rotate-90 flex items-center gap-1 font-mono">
                    <span>{seg.icon}</span>
                    <span style={{ color: seg.color }}>{seg.label}</span>
                  </span>
                </div>
              );
            })}

            {/* Center Cap */}
            <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-purple-600 border-2 border-white flex items-center justify-center shadow-lg z-20">
              <Sparkles size={16} className="text-black" />
            </div>
          </div>
        </div>

        {/* Won Prize display */}
        {wonPrize && (
          <div className="my-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 animate-bounce text-xs font-mono text-amber-300 font-black">
            🎉 LOT OBTENU : {wonPrize.icon} {wonPrize.label} ! Crédité sur votre compte.
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
          <NeonButton
            variant="violet"
            sweep
            disabled={isSpinning || !spinState.canSpin}
            onClick={handleSpin}
            className="w-full py-3 text-xs font-black uppercase tracking-wider shadow-neon-violet"
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <RotateCw size={14} className="animate-spin" /> LA ROUE TOURNE...
              </span>
            ) : spinState.canSpin ? (
              "LANCER LA ROUE DU SANCTUAIRE"
            ) : (
              "DÉJÀ TOURNÉE AUJOURD'HUI (REVIENS DEMAIN)"
            )}
          </NeonButton>

          <span className="text-[10px] font-mono text-white/40">
            {spinState.canSpin
              ? "1 lancer quotidien disponible"
              : "Prochain lancer gratuit disponible demain à minuit"}
          </span>
        </div>
      </CyberCard>
    </div>
  );
}
