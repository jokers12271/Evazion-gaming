import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { getRankProgress } from '@/lib/ranks';
import { Link } from '@tanstack/react-router';
import { Trophy, Zap, ArrowRight } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';

export function RankProgressWidget() {
  const { user } = useAuth();
  const { data: loyalty } = useLoyalty();

  if (!user) return null;

  const totalHours = loyalty?.total_hours || 0;
  const { current, next, progress, hoursRemaining } = getRankProgress(totalHours);

  return (
    <section className="py-12 bg-background border-t border-white/5">
      <div className="container mx-auto px-5 max-w-4xl">
        <CyberCard variant="violet" className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-2xl border-2 shrink-0 shadow-lg"
                style={{
                  borderColor: current.color,
                  backgroundColor: `${current.color}15`,
                  color: current.color
                }}
              >
                <Trophy size={28} />
              </div>
              <div>
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-white/50 block">
                  VOTRE STATUT ACTUEL
                </span>
                <h3 className="text-2xl font-display font-black uppercase text-white tracking-tight" style={{ color: current.color }}>
                  RANG {current.name} • {totalHours}H
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {next ? `Plus que ${hoursRemaining}H pour débloquer le Rang ${next.name}` : 'Rang Ultime atteint !'}
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-xs w-full">
              <div className="flex justify-between text-[10px] font-mono font-black uppercase mb-1.5 text-white/80">
                <span>Progression</span>
                <span style={{ color: current.color }}>{progress}%</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: current.color,
                    boxShadow: `0 0 12px ${current.color}`
                  }}
                />
              </div>
            </div>

            <Link to="/dashboard">
              <NeonButton variant="violet" size="sm" sweep cornerAccents className="text-[10px] tracking-widest py-3">
                Mon Espace <ArrowRight size={14} />
              </NeonButton>
            </Link>
          </div>
        </CyberCard>
      </div>
    </section>
  );
}
