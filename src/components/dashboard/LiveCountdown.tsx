import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Pause } from 'lucide-react';

export function LiveCountdown({
  endTime,
  isStarted = true,
  isPaused = false,
  pausedRemainingSeconds = 0,
  className
}: {
  endTime: string;
  isStarted?: boolean;
  isPaused?: boolean;
  pausedRemainingSeconds?: number;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number>(() => {
    if (isPaused && pausedRemainingSeconds > 0) return pausedRemainingSeconds;
    const end = new Date(endTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  });

  useEffect(() => {
    if (isPaused) {
      if (pausedRemainingSeconds > 0) setRemaining(pausedRemainingSeconds);
      return;
    }

    const interval = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, isPaused, pausedRemainingSeconds]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const formatted = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ]
    .filter(Boolean)
    .join(':');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-black text-sm',
        isPaused
          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
          : remaining < 300
          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
          : 'bg-secondary/20 text-secondary border border-secondary/40 shadow-neon-cyan',
        className
      )}
    >
      {isPaused ? <Pause size={14} /> : <Clock size={14} className="animate-spin" style={{ animationDuration: '4s' }} />}
      <span>{formatted}</span>
      {isPaused && <span className="text-[8px] uppercase tracking-wider">PAUSE</span>}
    </div>
  );
}
