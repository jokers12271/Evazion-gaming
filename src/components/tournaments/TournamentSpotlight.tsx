import { useState, useEffect } from 'react'
import { Trophy, Users, Clock, Flame, Coins, Sparkles } from 'lucide-react'
import { NeonButton } from '@/components/ui/NeonButton'
import { CyberCard } from '@/components/ui/CyberCard'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@blinkdotnew/ui'

interface SpotlightProps {
  tournament: any
  participantsCount: number
  onRegisterClick: () => void
  isRegistered: boolean
}

export function TournamentSpotlight({ tournament, participantsCount, onRegisterClick, isRegistered }: SpotlightProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!tournament?.date) return
    const target = new Date(tournament.date).getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const difference = target - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [tournament?.date])

  if (!tournament) return null

  const maxSeats = tournament.max_participants || 32
  const fillRate = Math.min(100, Math.round((participantsCount / maxSeats) * 100))

  return (
    <CyberCard 
      accentColor="#06b6d4" 
      hoverEffect={false} 
      className="p-4 sm:p-6 md:p-10 mb-8 md:mb-16 text-left relative overflow-hidden animate-fade-in border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
      overlay={
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src={tournament.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600'} 
            className="w-full h-full object-cover opacity-35 scale-105" 
            alt="Main Event Spotlight"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        </div>
      }
    >
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Infos principales */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[9px] md:text-xs font-black uppercase tracking-widest animate-pulse">
            <Flame size={14} className="text-cyan-400" /> MAIN EVENT SPOTLIGHT // TOURNOI PHARE
          </div>

          <h2 className="text-xl sm:text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-white leading-tight">
            {tournament.title}
          </h2>

          <p className="text-xs sm:text-sm text-white/80 font-medium uppercase tracking-wide">
            Discipline : <span className="text-secondary font-bold">{tournament.game}</span> • {tournament.status}
          </p>

          <p className="text-xs text-white/60 line-clamp-2 max-w-xl font-normal">
            {tournament.description || "Affrontez l'élite e-sport de Brazzaville sur notre arène officielle. Cashprize exceptionnel et prestige du Sanctuary en jeu !"}
          </p>

          {/* Cashprize & Dotations */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300">
              <Trophy size={18} className="text-amber-400 animate-bounce" />
              <div>
                <p className="text-[8px] uppercase tracking-wider text-white/50 font-black">Cashprize Total</p>
                <p className="text-sm md:text-base font-display font-black text-amber-300">
                  {tournament.cashprize || "150 000 FCFA + 50 jetons"}
                </p>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-white/80">
              <Users size={16} className="text-secondary" />
              <div>
                <p className="text-[8px] uppercase tracking-wider text-white/50 font-black">Participants</p>
                <p className="text-xs md:text-sm font-bold">{participantsCount} / {maxSeats} Inscrits</p>
              </div>
            </div>
          </div>

          {/* Jauge de remplissage */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[9px] font-black uppercase text-white/60">
              <span>Remplissage des places</span>
              <span className="text-cyan-400">{fillRate}% ({maxSeats - participantsCount} restantes)</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-primary transition-all duration-1000 shadow-[0_0_15px_#06b6d4]"
                style={{ width: `${fillRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Colonne de Droite : Compte à rebours & Action */}
        <div className="glass p-5 rounded-2xl md:rounded-3xl border-white/10 bg-black/60 flex flex-col items-center text-center space-y-4">
          <p className="text-[10px] font-mono font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
            <Clock size={14} className="text-secondary animate-spin" style={{ animationDuration: '6s' }} /> Coup d'envoi dans :
          </p>

          <div className="grid grid-cols-4 gap-2 w-full">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <p className="text-base sm:text-xl font-display font-black text-white">{timeLeft.days}</p>
              <p className="text-[7px] uppercase font-bold text-white/40">Jours</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <p className="text-base sm:text-xl font-display font-black text-white">{timeLeft.hours}</p>
              <p className="text-[7px] uppercase font-bold text-white/40">Heures</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <p className="text-base sm:text-xl font-display font-black text-white">{timeLeft.minutes}</p>
              <p className="text-[7px] uppercase font-bold text-white/40">Min</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <p className="text-base sm:text-xl font-display font-black text-white">{timeLeft.seconds}</p>
              <p className="text-[7px] uppercase font-bold text-white/40">Sec</p>
            </div>
          </div>

          <NeonButton
            variant="cyan"
            size="md"
            sweep
            onClick={onRegisterClick}
            className="w-full py-3.5 text-xs font-black tracking-widest shadow-neon-cyan"
          >
            {isRegistered ? "✓ Inscrit au Main Event" : "S'inscrire au Tournoi Phare"}
          </NeonButton>

          <span className="text-[8px] font-mono uppercase tracking-widest text-white/30">
            * Validation instantanée après règlement
          </span>
        </div>

      </div>
    </CyberCard>
  )
}
