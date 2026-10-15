import React, { useState } from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { X, Gift, Sparkles, Coins, RefreshCw, Trophy } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { LOOTBOX_REWARDS_POOL, LootboxReward, useGamificationStore } from '@/lib/gamificationData';
import { cyberAudio } from '@/lib/cyberAudio';
import { toast } from 'react-hot-toast';

interface MysteryLootboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMani: number;
}

export function MysteryLootboxModal({ isOpen, onClose, userMani }: MysteryLootboxModalProps) {
  const gamificationStore = useGamificationStore();
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<LootboxReward | null>(null);
  const cost = gamificationStore.getLootboxCost();

  if (!isOpen) return null;

  const handleOpenChest = () => {
    if (opening) return;
    if (userMani < cost) {
      toast.error(`Solde insuffisant ! ${cost} Jetons MANI requis pour ouvrir un coffre mystère.`);
      return;
    }

    setOpening(true);
    setReward(null);
    cyberAudio.playClick();

    // Select random reward from dynamic pool
    setTimeout(() => {
      const pool = gamificationStore.getLootboxRewards();
      const selected = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : LOOTBOX_REWARDS_POOL[0];
      setReward(selected);
      setOpening(false);
      cyberAudio.playSuccess();
      toast.success(`Butin débloqué : ${selected.name} ! 🎁`, { position: 'bottom-center' });
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in font-display">
      <CyberCard
        variant="violet"
        hoverEffect={false}
        className="w-full max-w-md p-4 pt-5 md:p-8 relative text-center overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 text-white/50 hover:text-white cursor-pointer z-20"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-1.5 md:mb-2">
          <Gift size={16} className="text-primary animate-pulse" />
          <span className="text-[9px] md:text-[10px] font-mono uppercase text-primary font-black tracking-widest">
            Coffre de Butin Mystère
          </span>
        </div>

        <h3 className="text-lg md:text-2xl font-black uppercase text-white mb-1">
          Lootbox du Sanctuaire
        </h3>
        <p className="text-[10px] md:text-xs text-white/60 font-sans mb-3 md:mb-6">
          Coût d'ouverture : <span className="text-amber-400 font-bold inline-flex items-center gap-1.5">5 <ManiIcon className="w-4 h-4" /></span>.
          Tentez de remporter des heures gratuites, des boissons ou des réductions tournoi !
        </p>

        {/* Chest Animation Visual */}
        <div className="py-3 md:py-6 relative flex flex-col items-center justify-center">
          <div
            className={`w-24 h-24 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br from-purple-600/30 via-black to-cyan-500/20 border-2 border-primary/50 flex items-center justify-center shadow-neon-violet relative transition-all ${
              opening ? 'scale-110 animate-bounce border-amber-400 shadow-[0_0_50px_rgba(234,179,8,0.8)]' : ''
            }`}
          >
            <div className="text-4xl md:text-6xl select-none">
              {opening ? '⚡' : reward ? reward.icon : '🎁'}
            </div>
            {opening && (
              <div className="absolute inset-0 bg-white/20 rounded-3xl animate-ping pointer-events-none" />
            )}
          </div>

          {reward && (
            <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-white/20 animate-fade-in w-full text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded text-black" style={{ backgroundColor: reward.color }}>
                  {reward.category.toUpperCase()}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {reward.value_text}
                </span>
              </div>
              <h4 className="text-base font-black uppercase text-white mb-1">
                {reward.name}
              </h4>
              <p className="text-xs text-white/70 font-sans">
                {reward.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-3 md:mt-4 md:pt-4 border-t border-white/10 space-y-2">
          <NeonButton
            variant="violet"
            sweep
            disabled={opening}
            onClick={handleOpenChest}
            className="w-full py-2.5 md:py-3.5 text-[10px] md:text-xs font-black uppercase tracking-wider shadow-neon-violet"
          >
            {opening ? "DÉVERROUILLAGE EN COURS..." : <>OUVRIR UN COFFRE (5 <ManiIcon className="w-3.5 h-3.5" />)</>}
          </NeonButton>

          <div className="text-[10px] font-mono text-white/40">
            Votre solde actuel : <span className="text-amber-400 font-bold inline-flex items-center gap-1.5">{userMani} <ManiIcon className="w-4 h-4" /></span>
          </div>
        </div>
      </CyberCard>
    </div>
  );
}
