import React, { useState } from 'react';
import { User, Search, Eye, Zap } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { getRank } from '@/lib/ranks';

export function AdminPlayerList({
  users,
  boxClass,
  boxStyle,
  ManiIcon
}: {
  users?: any[];
  boxClass: string;
  boxStyle: any;
  ManiIcon: any;
}) {
  const [search, setSearch] = useState('');

  const filtered = (users || []).filter((u: any) =>
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-4 text-white">
        <h3 className="text-sm font-black uppercase flex items-center gap-2">
          <User size={18} className="text-amber-400" /> Annuaire des Joueurs ({users?.length || 0})
        </h3>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          placeholder="Rechercher par pseudo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {filtered.map((player: any) => {
          const lp = Array.isArray(player.loyalty_points) ? player.loyalty_points[0] : player.loyalty_points;
          const rank = getRank(lp?.total_hours || 0);

          return (
            <div
              key={player.user_id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all text-white"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-white/30" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase leading-tight truncate max-w-[120px]" translate="no">
                    @{player.display_name}
                  </p>
                  <span className="text-[8px] font-mono" style={{ color: rank.color }}>
                    Rang {rank.name} • {lp?.total_hours || 0}H
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/dashboard/player/${player.user_id}`}
                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/20 text-[9px] font-mono font-black uppercase flex items-center gap-1 transition-all"
                >
                  <Eye size={12} /> Fiche
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
