import React, { useEffect, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { Swords, Trophy, ShieldQuestion, MapPin } from 'lucide-react';
import { useMyBracketNotices } from '@/hooks/useTournamentBracket';
import { supabase } from '@/lib/supabase';
import { cyberAudio } from '@/lib/cyberAudio';

/**
 * Fenetre post-tirage : montre au joueur son emplacement dans l'arbre et
 * son adversaire. Affichage unique par tirage (memo localStorage) + une
 * notification en base (cloche) une seule fois par tirage.
 */
export function BracketAssignmentModal({ userId, displayName }: { userId?: string; displayName?: string }) {
  const { data: notices = [] } = useMyBracketNotices(displayName);
  const [current, setCurrent] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId || notices.length === 0) {
      setCurrent(null);
      return;
    }
    const seenKey = `evazion_bracket_seen_${userId}`;
    let seen: Record<string, string> = {};
    try {
      seen = JSON.parse(localStorage.getItem(seenKey) || '{}');
    } catch {
      seen = {};
    }
    const idx = notices.findIndex((n) => seen[n.tournamentId] !== n.drawStamp);
    setCurrent(idx === -1 ? null : idx);
  }, [notices, userId, tick]);

  const notice = current !== null ? notices[current] : null;

  useEffect(() => {
    if (!notice || !userId) return;
    const notifKey = `evazion_bracket_notified_${userId}`;
    let done: Record<string, string> = {};
    try {
      done = JSON.parse(localStorage.getItem(notifKey) || '{}');
    } catch {
      done = {};
    }
    if (done[notice.tournamentId] === notice.drawStamp) return;
    supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          message: `Tirage "${notice.tournamentTitle}" : tu joues ${notice.matchLabel} (${notice.slot}) contre ${notice.opponent}.`
        }
      ])
      .then(() => {
        try {
          localStorage.setItem(notifKey, JSON.stringify({ ...done, [notice.tournamentId]: notice.drawStamp }));
        } catch {
          /* stockage indisponible */
        }
      });
  }, [notice, userId]);

  const handleClose = () => {
    if (userId && notice) {
      const seenKey = `evazion_bracket_seen_${userId}`;
      let seen: Record<string, string> = {};
      try {
        seen = JSON.parse(localStorage.getItem(seenKey) || '{}');
      } catch {
        seen = {};
      }
      try {
        localStorage.setItem(seenKey, JSON.stringify({ ...seen, [notice.tournamentId]: notice.drawStamp }));
      } catch {
        /* stockage indisponible */
      }
    }
    cyberAudio.playClick();
    setTick((t) => t + 1);
  };

  if (!notice) return null;

  return (
    <ModalShell isOpen onClose={handleClose} title="Ton Poste dans l'Arbre" accent="cyan">
      <div className="space-y-4 text-left font-display">
        <div className="flex items-center gap-2 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-black tracking-widest">
            Tirage au sort effectué
          </span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
            <Trophy size={14} />
            <span className="text-[11px] font-black uppercase tracking-wider">{notice.tournamentTitle}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-white/15 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-white/40 uppercase flex items-center gap-1.5">
              <MapPin size={12} className="text-secondary" /> Position
            </span>
            <span className="text-white font-black">
              {notice.matchLabel} · {notice.slot}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-white/10">
            <span className="text-white/40 uppercase flex items-center gap-1.5">
              <Swords size={12} className="text-primary" /> Adversaire
            </span>
            <span className={`font-black truncate ${notice.opponent === 'Exempt (bye)' ? 'text-emerald-300' : 'text-red-300'}`}>
              {notice.opponent}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-sans text-white/50 leading-relaxed">
          <ShieldQuestion size={13} className="shrink-0 text-secondary" />
          <span>Présente-toi 15 minutes avant l'heure de ton match avec ton Pass Check-in.</span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-neon-violet"
        >
          J'ai compris
        </button>
      </div>
    </ModalShell>
  );
}
