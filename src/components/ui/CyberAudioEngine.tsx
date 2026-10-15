import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Sparkles } from 'lucide-react';
import { cyberAudio } from '@/lib/cyberAudio';
import { cn } from '@/lib/utils';

export function CyberAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    const active = cyberAudio.toggleMusic();
    setIsPlaying(active);
    cyberAudio.playClick();
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleToggle}
        title={isPlaying ? "Couper l'ambiance sonore du Lounge" : "Activer l'ambiance sonore Lounge Synthwave"}
        className={cn(
          "px-2.5 py-1.5 rounded-lg border text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all",
          isPlaying
            ? "border-secondary/60 bg-secondary/15 text-secondary shadow-neon-cyan animate-pulse"
            : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
        )}
      >
        <Music size={13} className={cn(isPlaying && "animate-spin text-secondary")} />
        
        {/* Animated Sound Bars */}
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-3 px-0.5">
            <span className="w-0.5 bg-secondary rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '80%' }} />
            <span className="w-0.5 bg-secondary rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.1s]" style={{ height: '100%' }} />
            <span className="w-0.5 bg-secondary rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.2s]" style={{ height: '50%' }} />
            <span className="w-0.5 bg-secondary rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.15s]" style={{ height: '90%' }} />
          </div>
        ) : (
          <span className="hidden sm:inline">Lounge Audio</span>
        )}

        <span className="text-[7.5px] font-black px-1 rounded bg-black/40 text-white/70">
          {isPlaying ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
