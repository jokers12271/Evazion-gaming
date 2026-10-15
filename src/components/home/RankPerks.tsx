import React from 'react';
import { Rank } from '@/lib/ranks';
import { Check } from 'lucide-react';

export function RankPerkList({ rank, size = 'md' }: { rank: Rank; size?: 'sm' | 'md' | 'lg' }) {
  if (!rank || !rank.perks) return null;

  const isSmall = size === 'sm';

  return (
    <div className="space-y-2">
      {rank.perks.map((perk, i) => (
        <div key={i} className="flex items-center gap-2.5 text-left">
          <span className="text-base select-none shrink-0">{perk.icon}</span>
          <span
            className={`font-medium leading-tight text-white/90 ${
              isSmall ? 'text-[10px]' : 'text-xs md:text-sm'
            }`}
          >
            {perk.label}
          </span>
        </div>
      ))}
    </div>
  );
}
