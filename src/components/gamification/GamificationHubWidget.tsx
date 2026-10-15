import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { WarmupArcadeModal } from './WarmupArcadeModal';
import { useAuth } from '@/hooks/useAuth';
import { useUserMetadata } from '@/hooks/useUserMetadata';

export function GamificationHubWidget() {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const isAdmin = metadata?.is_admin || user?.user_metadata?.is_admin || false;

  const [isArcadeOpen, setIsArcadeOpen] = useState(false);

  // The Admin is strictly the operator and does not participate in gamer streaks or spins
  if (isAdmin) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 font-display">
        {/* Warm-up Arcade trigger */}
        <button
          type="button"
          onClick={() => setIsArcadeOpen(true)}
          className="p-2.5 rounded-2xl bg-[#050608]/90 backdrop-blur-xl border border-secondary/40 text-secondary hover:text-white hover:bg-secondary/20 transition-all cursor-pointer shadow-neon-cyan flex items-center gap-2 text-xs font-mono font-black active:scale-95"
          title="Mini-Jeux d'Attente & Test Réflexes"
        >
          <Zap size={16} />
          <span className="hidden md:inline">WARM-UP ARCADE</span>
        </button>
      </div>

      <WarmupArcadeModal
        isOpen={isArcadeOpen}
        onClose={() => setIsArcadeOpen(false)}
      />
    </>
  );
}
