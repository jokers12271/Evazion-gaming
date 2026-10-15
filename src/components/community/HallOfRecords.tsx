import { useState } from 'react'
import { Trophy, Clock, Flame, Award, Gamepad2, Search } from 'lucide-react'
import { CyberCard } from '@/components/ui/CyberCard'
import { cn } from '@blinkdotnew/ui'

interface RecordItem {
  id: string
  game: string
  category: string
  player: string
  score: string
  date: string
  badgeColor: string
}

const MOCK_RECORDS: RecordItem[] = [
  { id: '1', game: 'Gran Turismo 7', category: 'Time Attack (Nürburgring)', player: 'Darius_B', score: '6:32.410', date: 'Hier', badgeColor: '#06b6d4' },
  { id: '2', game: 'EA Sports FC 26', category: 'Plus gros score en match', player: 'KingZlatan', score: '9 - 1', date: 'Il y a 2 jours', badgeColor: '#22c55e' },
  { id: '3', game: 'Tekken 8', category: 'Série de victoires consécutives', player: 'Kazuya99', score: '34 Victoires', date: 'Cette semaine', badgeColor: '#ef4444' },
  { id: '4', game: 'NBA 2K26', category: 'Record de points en un match', player: 'StephBizz', score: '128 PTS', date: 'La semaine dernière', badgeColor: '#eab308' },
]

export function HallOfRecords() {
  const [selectedGame, setSelectedGame] = useState('Tous')
  const [search, setSearch] = useState('')

  const games = ['Tous', 'Gran Turismo 7', 'EA Sports FC 26', 'Tekken 8', 'NBA 2K26']

  const filtered = MOCK_RECORDS.filter(r => {
    const matchGame = selectedGame === 'Tous' || r.game === selectedGame
    const matchSearch = r.player.toLowerCase().includes(search.toLowerCase()) || r.game.toLowerCase().includes(search.toLowerCase())
    return matchGame && matchSearch
  })

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-black uppercase text-white">
              Tableau des Records <span className="text-amber-400 italic">Time Attacks</span>
            </h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">
              Les chronos légendaires et records officiels du Sanctuary de Brazzaville
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Rechercher un joueur ou un jeu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {games.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGame(g)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
              selectedGame === g
                ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(record => (
          <CyberCard key={record.id} accentColor={record.badgeColor} className="p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-mono font-black uppercase px-2.5 py-1 rounded-full border bg-white/5" style={{ color: record.badgeColor, borderColor: `${record.badgeColor}40` }}>
                {record.game}
              </span>
              <span className="text-[9px] font-mono text-white/40">{record.date}</span>
            </div>

            <div className="my-2">
              <p className="text-[10px] uppercase font-bold text-white/50 mb-1">{record.category}</p>
              <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2" translate="no">
                <Award size={20} style={{ color: record.badgeColor }} />
                @{record.player}
              </h3>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40 uppercase">Performance officielle</span>
              <span className="text-xl font-display font-black font-mono tracking-wider text-amber-400">
                {record.score}
              </span>
            </div>
          </CyberCard>
        ))}
      </div>
    </div>
  )
}
