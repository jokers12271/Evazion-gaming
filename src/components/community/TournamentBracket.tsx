import { useState } from 'react'
import { Trophy, Users, Swords, Sparkles, CheckCircle2, Flame, Award } from 'lucide-react'
import { CyberCard } from '@/components/ui/CyberCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'

interface MatchNode {
  id: string
  round: '16e' | '8e' | 'Quarts' | 'Demies' | 'Finale'
  player1: string
  player2: string
  score1: number | null
  score2: number | null
  winner: string | null
  status: 'live' | 'upcoming' | 'finished'
}

const MOCK_BRACKET: MatchNode[] = [
  // Quarts
  { id: 'q1', round: 'Quarts', player1: 'Darius_B', player2: 'Kazuya99', score1: 3, score2: 1, winner: 'Darius_B', status: 'finished' },
  { id: 'q2', round: 'Quarts', player1: 'KingZlatan', player2: 'StephBizz', score1: 2, score2: 3, winner: 'StephBizz', status: 'finished' },
  { id: 'q3', round: 'Quarts', player1: 'JinKazama', player2: 'Hwoarang', score1: 1, score2: 2, winner: 'Hwoarang', status: 'finished' },
  { id: 'q4', round: 'Quarts', player1: 'NicoPro', player2: 'GamerBZV', score1: null, score2: null, winner: null, status: 'live' },
  // Demies
  { id: 's1', round: 'Demies', player1: 'Darius_B', player2: 'StephBizz', score1: 2, score2: 1, winner: 'Darius_B', status: 'live' },
  { id: 's2', round: 'Demies', player1: 'Hwoarang', player2: 'En attente', score1: null, score2: null, winner: null, status: 'upcoming' },
  // Finale
  { id: 'f1', round: 'Finale', player1: 'Darius_B', player2: 'En attente', score1: null, score2: null, winner: null, status: 'upcoming' },
]

export function TournamentBracket() {
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [voted, setVoted] = useState<Record<string, boolean>>({})

  const handleVote = (matchId: string, player: string) => {
    setPredictions({ ...predictions, [matchId]: player })
    setVoted({ ...voted, [matchId]: true })
    toast.success(`Pronostic enregistré pour ${player} ! (+2 MANI en jeu)`, { position: 'bottom-center' })
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/40 flex items-center justify-center text-secondary">
            <Swords size={24} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-black uppercase text-white">
              Arbre de Tournoi <span className="text-secondary italic">Interactif</span>
            </h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">
              Suivi des brackets en direct • Pronostiquez et gagnez des jetons
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QUARTS DE FINALE */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-secondary text-center mb-4">QUARTS DE FINALE</h3>
          {MOCK_BRACKET.filter(m => m.round === 'Quarts').map(m => (
            <CyberCard key={m.id} accentColor="#06b6d4" className="p-4 space-y-3">
              <div className="flex justify-between items-center text-[9px] font-mono text-white/40">
                <span>MATCH #{m.id.toUpperCase()}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded font-black uppercase",
                  m.status === 'finished' ? "bg-green-500/20 text-green-400" : "bg-cyan-500/20 text-cyan-400 animate-pulse"
                )}>
                  {m.status === 'finished' ? 'TERMINÉ' : 'EN COURS'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-bold uppercase">
                <div className={cn("flex justify-between p-2 rounded-xl bg-white/5", m.winner === m.player1 && "border border-secondary text-secondary")}>
                  <span>{m.player1}</span>
                  <span className="font-mono">{m.score1 ?? '-'}</span>
                </div>
                <div className={cn("flex justify-between p-2 rounded-xl bg-white/5", m.winner === m.player2 && "border border-secondary text-secondary")}>
                  <span>{m.player2}</span>
                  <span className="font-mono">{m.score2 ?? '-'}</span>
                </div>
              </div>

              {m.status !== 'finished' && !voted[m.id] && (
                <div className="pt-2 border-t border-white/5 flex gap-2">
                  <button onClick={() => handleVote(m.id, m.player1)} className="flex-1 py-1 text-[8px] font-black uppercase bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg">
                    Prono {m.player1}
                  </button>
                  <button onClick={() => handleVote(m.id, m.player2)} className="flex-1 py-1 text-[8px] font-black uppercase bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg">
                    Prono {m.player2}
                  </button>
                </div>
              )}
              {voted[m.id] && (
                <p className="text-[9px] text-center text-green-400 font-mono font-bold">✓ Prono validé ({predictions[m.id]})</p>
              )}
            </CyberCard>
          ))}
        </div>

        {/* DEMIES FINALES */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary text-center mb-4">DEMIES FINALES</h3>
          {MOCK_BRACKET.filter(m => m.round === 'Demies').map(m => (
            <CyberCard key={m.id} accentColor="#a855f7" className="p-4 space-y-3">
              <div className="flex justify-between items-center text-[9px] font-mono text-white/40">
                <span>MATCH #{m.id.toUpperCase()}</span>
                <span className="px-2 py-0.5 rounded font-black uppercase bg-purple-500/20 text-purple-400 animate-pulse">
                  {m.status === 'live' ? 'EN COURS' : 'BIENTÔT'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-bold uppercase">
                <div className={cn("flex justify-between p-2 rounded-xl bg-white/5", m.winner === m.player1 && "border border-primary text-primary")}>
                  <span>{m.player1}</span>
                  <span className="font-mono">{m.score1 ?? '-'}</span>
                </div>
                <div className={cn("flex justify-between p-2 rounded-xl bg-white/5", m.winner === m.player2 && "border border-primary text-primary")}>
                  <span>{m.player2}</span>
                  <span className="font-mono">{m.score2 ?? '-'}</span>
                </div>
              </div>
            </CyberCard>
          ))}
        </div>

        {/* GRANDE FINALE */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 text-center mb-4">GRANDE FINALE</h3>
          {MOCK_BRACKET.filter(m => m.round === 'Finale').map(m => (
            <CyberCard key={m.id} accentColor="#f59e0b" className="p-6 space-y-4 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <div className="text-center">
                <Trophy size={32} className="text-amber-400 mx-auto mb-2 animate-bounce" />
                <span className="text-[10px] font-mono font-black uppercase text-amber-400">TITRE SUPRÊME DU SANCTUARY</span>
              </div>

              <div className="space-y-2 text-xs font-bold uppercase">
                <div className="flex justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <span>{m.player1}</span>
                  <span className="font-mono">FINALISTE</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-white/5 text-white/40">
                  <span>{m.player2}</span>
                  <span className="font-mono">-</span>
                </div>
              </div>
            </CyberCard>
          ))}
        </div>
      </div>
    </div>
  )
}
