import { useEffect, useMemo, useRef, useState } from 'react'
import { NeonButton } from '@/components/ui/NeonButton'
import { Link } from '@tanstack/react-router'
import { Gamepad2, Trophy, Users, Zap, Shield, HelpCircle, Flame, Filter, Sparkles, Crown, Lock, X, Trash2, Plus, Loader2 } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RANKS, getRankProgress, type Rank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { AboutUsSection } from '@/components/home/AboutUsSection'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useSanctuaryStatus } from '@/hooks/useSanctuaryStatus'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useAuth } from '@/hooks/useAuth'
import { useGames } from '@/hooks/useGames'
import { useNews, newsImage } from '@/hooks/useNews'
import { useConfirm } from '@/hooks/useConfirm'
import { useTournaments } from '@/hooks/useTournaments'
import { toast } from 'react-hot-toast'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { Coins } from 'lucide-react'
import { ManiIcon } from '@/components/ui/ManiIcon'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { KeyRound } from 'lucide-react'
import { CyberCard } from '@/components/ui/CyberCard'
import { motion, AnimatePresence } from 'framer-motion'
import { RankPerkList } from '@/components/home/RankPerks'


import { ImageUploadInput } from '@/components/ui/ImageUploadInput'

if (typeof window !== 'undefined') {
  try {
    gsap.registerPlugin(ScrollTrigger)
  } catch {}
}

/** Une diapositive du carrousel d'accueil : actualite ou tournoi. */
interface HeroSlide {
  id: string
  kind: 'news' | 'tournament'
  title: string
  excerpt: string
  image: string
  tag: string
  isPinned?: boolean
  to: string
}

/** Date de tournoi formatee en francais, avec repli si la date est invalide. */
function formatHeroDate(value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<string>('Tous')
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null)
  const [hoveredRank, setHoveredRank] = useState<string | null>(null)

  const { data: metadata } = useUserMetadata()
  const { currentStatus, toggleStatus } = useSanctuaryStatus()
  const { games, addGame, deleteGame } = useGames()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const { news } = useNews()
  const { tournaments } = useTournaments()
  const isAdmin = metadata?.is_admin || false
  const [showAddGame, setShowAddGame] = useState(false)
  const [newGame, setNewGame] = useState({ title: '', category: '', description: '', image_url: '' })

  const { user } = useAuth()
  const { data: loyalty } = useLoyalty()
  const myRank = getRankProgress(loyalty?.total_hours || 0)
  const nextRankName = myRank.next?.name ?? null

  const categories = useMemo(
    () => ['Tous', ...Array.from(new Set(games.map((g: any) => g.category))).sort() as string[]],
    [games]
  )

  useEffect(() => {
    try {
      const ctx = gsap.context(() => {
        gsap.from('.hero-content > *', { y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' })
      })
      return () => ctx.revert()
    } catch {}
  }, [])

  useEffect(() => {
    if (!selectedRank) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedRank(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedRank])

  const heroSlides = useMemo<HeroSlide[]>(() => {
    const slides: HeroSlide[] = (news.data ?? []).map((n: any) => ({
      id: `news-${n.id}`,
      kind: 'news',
      title: n.title,
      excerpt: n.excerpt,
      image: newsImage(n),
      tag: n.category,
      isPinned: Boolean(n.is_pinned),
      to: '/news',
    }))

    const live = tournaments.filter(
      (t) => t.status === 'Upcoming' || t.status === 'Active'
    )

    for (const t of live) {
      slides.push({
        id: `tournament-${t.id}`,
        kind: 'tournament',
        title: t.title,
        excerpt: [t.game, formatHeroDate(t.date)].filter(Boolean).join(' · '),
        image: t.image_url?.trim() ? t.image_url : 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
        tag: t.status === 'Active' ? 'En cours' : 'Bientôt',
        to: '/tournaments',
      })
    }

    return slides
  }, [news.data, tournaments])

  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    if (heroSlides.length < 2) return
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length)
    }, 6000)
    return () => window.clearInterval(id)
  }, [heroSlides.length])

  useEffect(() => {
    if (heroIndex >= heroSlides.length) setHeroIndex(0)
  }, [heroSlides.length, heroIndex])

  const currentSlide = heroSlides[heroIndex] ?? null

  const filteredGames = activeCategory === 'Tous'
    ? games
    : games.filter((g: any) => g.category === activeCategory)

  const marqueeGames = [...games, ...games]

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Bienvenue au Sanctuary !",
      desc: "Découvrez le repaire d'élite de Brazzaville équipé de consoles PS5 Pro de dernière génération. Votre expérience de membre commence ici.",
      icon: <Gamepad2 size={28} />
    },
    {
      title: "L'Échelle de Puissance",
      desc: "Ici, jouer vous rend plus fort ! Chaque minute passée en salle accumule des heures sur votre compte pour débloquer de nouveaux Rangs et privilèges à vie.",
      icon: <Trophy size={28} />
    },
    {
      title: "Mineur de Jetons",
      desc: "Toutes les 4 heures de jeu cumulées, gagnez automatiquement 1 jeton, notre monnaie exclusive échangeable contre des cadeaux réels.",
      icon: <ManiIcon className="w-7 h-7" />
    }
  ]

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Interrupteur de Salle",
      desc: "Utilisez l'interrupteur ON/OFF en direct sous le titre. Glisser de vert à rouge va fermer le Sanctuary et informer immédiatement tous les joueurs en ligne.",
      icon: <KeyRound size={28} />
    }
  ]

  return (
    <div className="overflow-hidden bg-background text-white">
      <OnboardingModal pageKey="home" steps={onboardingSteps} />
      {isAdmin && <AdminOnboardingModal pageKey="home" steps={adminOnboardingSteps} />}
      {confirmDialog}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. Hero Section */}
      <section ref={heroRef} className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden animate-fade-in">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background z-10" />
          <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2000" className="hero-bg w-full h-full object-cover opacity-70" alt="bg"/>
        </div>
        
        <div className="container mx-auto px-5 relative z-20 flex flex-col items-center text-center">
          <div className="max-w-3xl hero-content">
            <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[7.5px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] border border-white/10 bg-background/60 backdrop-blur-md inline-flex items-center gap-1.5 md:gap-2 shadow-lg mb-4 md:mb-5 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Futur du jeu à Brazzaville
            </div>
             
             <h1 className="text-3xl sm:text-6xl md:text-8xl font-display font-black uppercase leading-tight md:leading-none mb-8 md:mb-8 tracking-tight" translate="no">
               WELCOME TO<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-primary to-secondary text-glow-violet italic">
                 THE SANCTUARY
               </span>
             </h1>
             
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center w-fit mx-auto">
                <Link to="/reservation" className="sm:flex-1">
                  <NeonButton 
                    size="lg" 
                    sweep
                    cornerAccents
                    className="w-full h-8 sm:h-auto text-[9.5px] sm:text-xs md:text-sm tracking-widest whitespace-nowrap sm:whitespace-normal py-1.5 sm:py-3 md:py-4 px-4 md:px-7 shadow-neon-violet bg-primary/60 hover:bg-primary backdrop-blur-md"
                  >
                    Réserver un Poste
                  </NeonButton>
                </Link>
                <Link to="/tournaments" className="sm:flex-1">
                  <NeonButton 
                    variant="cyan" 
                    size="lg" 
                    sweep
                    cornerAccents
                    className="w-full h-8 sm:h-auto text-[9.5px] sm:text-xs md:text-sm tracking-widest whitespace-nowrap sm:whitespace-normal py-1.5 sm:py-3 md:py-4 px-4 md:px-7 shadow-neon-cyan bg-secondary/60 hover:bg-secondary backdrop-blur-md"
                  >
                    Voir les Tournois
                  </NeonButton>
                </Link>
              </div>

              {currentSlide && (
                <Link
                  to={currentSlide.to}
                  className="mt-8 block w-full max-w-2xl mx-auto group"
                  aria-label={`${currentSlide.kind === 'news' ? 'Actualité' : 'Tournoi'} : ${currentSlide.title}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 sm:p-4 text-left transition-all duration-300 hover:border-secondary/40 hover:bg-white/[0.06]">
                    <div className="h-16 w-12 sm:h-20 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      <img
                        src={currentSlide.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-[8px] font-black uppercase tracking-[0.2em]',
                            currentSlide.kind === 'tournament' ? 'text-amber-400' : 'text-secondary'
                          )}
                        >
                          {currentSlide.kind === 'tournament' ? 'Tournoi' : currentSlide.tag}
                        </span>
                        {currentSlide.kind === 'tournament' && (
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400/70">
                            · {currentSlide.tag}
                          </span>
                        )}
                        {currentSlide.isPinned && (
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">
                            · Épinglé
                          </span>
                        )}
                      </div>

                      <div className="relative overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.p
                            key={currentSlide.id}
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -12, opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="text-xs sm:text-sm font-black uppercase text-white leading-snug line-clamp-2"
                          >
                            {currentSlide.title}
                          </motion.p>
                        </AnimatePresence>
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={currentSlide.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35, delay: 0.05 }}
                          className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5"
                        >
                          {currentSlide.excerpt}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {heroSlides.length > 1 && (
                      <div className="hidden sm:flex flex-col items-center gap-1.5 shrink-0">
                        {heroSlides.map((s, i) => (
                          <span
                            key={s.id}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full transition-all duration-300',
                              i === heroIndex
                                ? s.kind === 'tournament' ? 'bg-amber-400 h-4' : 'bg-secondary h-4'
                                : 'bg-white/20'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )}

              <div className="mt-8 flex flex-col items-center justify-center w-full relative z-30">
                {user && (
                  isAdmin ? (
                    <div className="flex flex-col items-center gap-2 animate-fade-in">
                      <span className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em]">Interrupteur Sanctuary (Admin) :</span>
                      <button 
                        onClick={async () => {
                          const nextStatus = (currentStatus || 'ouvert') === 'ouvert' ? 'fermé' : 'ouvert';
                          try {
                            await toggleStatus.mutateAsync(nextStatus);
                            toast.success(`Le Sanctuary est maintenant ${nextStatus.toUpperCase()} !`, { position: "bottom-center" });
                          } catch (e) {
                            toast.error("Erreur de modification.");
                          }
                        }}
                        className={cn(
                          "w-16 h-7 rounded-full border p-1 transition-all duration-300 relative flex items-center shadow-lg cursor-pointer",
                          (currentStatus || 'ouvert') === 'ouvert'
                            ? "border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)] justify-start" 
                            : "border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)] justify-end"
                        )}
                      >
                        <div 
                          className={cn(
                            "w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-[8px] font-black",
                            currentStatus === 'ouvert' ? "bg-green-500 text-black" : "bg-red-500 text-white"
                          )}
                        >
                          {currentStatus === 'ouvert' ? 'ON' : 'OFF'}
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <span 
                        className={cn(
                          "px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[7.5px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] border inline-flex items-center gap-1.5 md:gap-2 shadow-lg",
                          (currentStatus || 'ouvert') === 'ouvert'
                            ? "border-green-500/30 bg-green-500/5 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                            : "border-red-500/30 bg-red-500/5 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                        )}
                      >
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full animate-ping",
                          currentStatus === 'ouvert' ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span>SANCTUAIRE : {(currentStatus || 'ouvert').toUpperCase()}</span>
                      </span>
                    </div>
                  )
                )}
              </div>

          </div>
        </div>
      </section>

      {/* 2. Ticker de jeux */}
      <section className="py-8 bg-black/40 border-y border-white/5 relative overflow-hidden z-20">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-hidden w-full">
          <div className="animate-marquee gap-6">
            {marqueeGames.map((game, idx) => (
              <Link
                to="/reservation"
                key={`${game.id}-${idx}`}
                title={`${game.title} — réserver un poste`}
                className="w-24 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-lg shrink-0 relative group hover:border-secondary/50 transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <img 
                  src={game.image_url} 
                  alt={game.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider truncate text-white w-full text-center">
                    {game.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Échelle de Puissance */}
      <section className="py-12 md:py-12 relative overflow-hidden bg-background border-t border-white/5">
        <div className="container mx-auto px-5 text-center">
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-display font-black uppercase leading-none mb-2">
            ÉCHELLE DE <br/> 
            <span className="text-primary italic">PUISSANCE</span>
          </h2>
          
          <p className="text-muted-foreground max-w-xl mx-auto uppercase text-[12px] sm:text-xs font-black opacity-70 text-center leading-relaxed mb-12 md:mb-20">
            Ratio de progression : <span className="font-bold text-secondary inline-flex items-center gap-1.5">4 heures de jeu = x1 <ManiIcon className="w-4 h-4" /></span> dans votre portefeuille
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {RANKS.map((r, index) => {
              const isMystery = r.name === "Mystère";
              const isTopTier = r.name === "Divin" || r.name === "Iconique" || r.name === "Légende";
              const cardNumber = String(index + 1).padStart(2, '0');
              const isNextRank = nextRankName === r.name;

              return (
                <div 
                  key={r.name} 
                  onClick={() => !isMystery && setSelectedRank(r)}
                  role={isMystery ? undefined : 'button'}
                  tabIndex={isMystery ? undefined : 0}
                  onKeyDown={(e) => {
                    if (isMystery) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedRank(r)
                    }
                  }}
                  onMouseEnter={() => !isMystery && setHoveredRank(r.name)}
                  onMouseLeave={() => setHoveredRank(null)}
                  onFocus={() => !isMystery && setHoveredRank(r.name)}
                  onBlur={() => setHoveredRank(null)}
                  aria-label={isMystery ? undefined : `Voir les avantages du rang ${r.name}`}
                  className={cn(
                    "group relative flex flex-col items-center justify-center md:justify-between aspect-square md:aspect-auto md:min-h-[420px] p-3 md:p-5 rounded-[1.25rem] md:rounded-[2rem] overflow-hidden transition-all duration-500",
                    "border md:border-2 bg-gradient-to-b from-white/[0.08] via-black/80 to-black/95 shadow-2xl",
                    !isMystery && "hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer",
                    isMystery && "cursor-help border-white/20",
                    isNextRank && "outline outline-2 outline-secondary/40 outline-offset-2",
                    selectedRank?.name === r.name && "outline outline-2 outline-secondary/70 outline-offset-2",
                    hoveredRank !== null && hoveredRank !== r.name && "opacity-40 saturate-50"
                  )}
                  style={{
                    borderColor: `${r.color}60`,
                    boxShadow: !isMystery ? `0 10px 30px -10px ${r.color}30, inset 0 0 20px ${r.color}15` : undefined
                  }}
                >
                  <div className={cn(
                    "absolute inset-0 pointer-events-none z-10 transition-opacity duration-700",
                    isTopTier ? "holo-foil-gold opacity-30 group-hover:opacity-60" : "holo-foil opacity-20 group-hover:opacity-50"
                  )} />

                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none z-20 skew-x-12" />

                  <span className="absolute top-1.5 left-1.5 md:top-2 md:left-2 w-2.5 h-2.5 md:w-3 md:h-3 border-t md:border-t-2 border-l md:border-l-2 pointer-events-none z-20 transition-colors" style={{ borderColor: r.color }} />
                  <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2.5 h-2.5 md:w-3 md:h-3 border-t md:border-t-2 border-r md:border-r-2 pointer-events-none z-20 transition-colors" style={{ borderColor: r.color }} />
                  <span className="absolute bottom-1.5 left-1.5 md:bottom-2 md:left-2 w-2.5 h-2.5 md:w-3 md:h-3 border-b md:border-b-2 border-l md:border-l-2 pointer-events-none z-20 transition-colors" style={{ borderColor: r.color }} />
                  <span className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 w-2.5 h-2.5 md:w-3 md:h-3 border-b md:border-b-2 border-r md:border-r-2 pointer-events-none z-20 transition-colors" style={{ borderColor: r.color }} />

                  <div className={cn(
                    "absolute inset-0 z-0 transition-all duration-1000",
                    isMystery && "blur-[25px] scale-110 opacity-40"
                  )}>
                    <img 
                      src={r.image} 
                      alt={r.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-115 opacity-45" 
                    />
                    <div className="absolute inset-0 mix-blend-color opacity-50" style={{ backgroundColor: r.color }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95" />
                  </div>

                  <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-2.5 pt-2 md:px-4 md:pt-4">
                    <div className="flex items-center gap-0.5 md:gap-1.5">
                      <Sparkles size={8} className="md:hidden animate-pulse" style={{ color: r.color }} />
                      <Sparkles size={12} className="hidden md:block animate-pulse" style={{ color: r.color }} />
                      <span className="text-[6px] md:text-[8.5px] font-mono font-black uppercase tracking-[0.15em] md:tracking-[0.25em] text-white/70 md:text-white/80">
                        FOIL <span className="md:hidden"> </span><span className="hidden md:inline">#</span>{cardNumber}/11
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 md:gap-1">
                      {isMystery ? (
                        <span className="px-1.5 py-px md:px-2 md:py-0.5 rounded-full bg-white/10 text-white/60 text-[6.5px] md:text-[8px] font-mono font-black uppercase tracking-widest border border-white/20">
                          SECRET
                        </span>
                      ) : (
                        <span 
                          className="px-1.5 py-px md:px-2 md:py-0.5 rounded-full text-[6.5px] md:text-[8px] font-mono font-black uppercase tracking-widest border shadow-sm"
                          style={{
                            backgroundColor: `${r.color}20`,
                            color: r.color,
                            borderColor: `${r.color}50`
                          }}
                        >
                          {isTopTier && <Crown size={7} className="hidden md:inline mr-0.5 md:mr-1 -mt-0.5" />}
                          {isTopTier && <Crown size={9} className="md:hidden inline mr-0.5 -mt-0.5" />}
                          {r.name.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-20 flex flex-col items-center justify-center text-center gap-1.5 md:gap-0 md:my-auto md:py-4">
                    <div className="relative">
                      <div 
                        className="w-11 h-11 md:w-24 md:h-24 rounded-lg md:rounded-2xl overflow-hidden border md:border-2 p-0.5 md:p-1 relative z-10 bg-black/60 shadow-lg md:shadow-xl transition-transform duration-500 group-hover:scale-110"
                        style={{
                          borderColor: r.color,
                          boxShadow: `0 0 15px ${r.color}40, inset 0 0 10px ${r.color}20`
                        }}
                      >
                        <img 
                          src={r.image} 
                          alt={r.name} 
                          className={cn(
                            "w-full h-full object-cover rounded-md md:rounded-xl transition-all duration-700",
                            isMystery ? "blur-md opacity-30" : "opacity-90 group-hover:opacity-100"
                          )} 
                        />
                      </div>

                      <div 
                        className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 px-1 py-px md:px-1.5 md:py-0.5 rounded bg-black/90 md:rounded-md border text-[5.5px] md:text-[7.5px] font-mono font-black uppercase tracking-wider z-20 shadow md:shadow-lg flex items-center gap-0.5 md:gap-1"
                        style={{ borderColor: r.color, color: r.color }}
                      >
                        <span>EVZ</span>
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-ping" style={{ backgroundColor: r.color }} />
                      </div>
                    </div>

                    <h3 
                      className="text-[13px] md:text-3xl font-display font-black uppercase tracking-tight md:tracking-tight leading-none transition-all group-hover:scale-105"
                      style={{ color: r.color, textShadow: `0 0 10px md:0 0 16px ${r.color}60` }}
                    >
                      {r.name}
                    </h3>

                    <div className="flex items-center gap-1 md:gap-2 px-1.5 py-0.5 md:px-3 md:py-1 rounded-full bg-white/5 border border-white/10">
                      <span className="text-[7px] md:text-[8.5px] font-mono font-bold tracking-widest text-white/50 md:text-white/60">H<span className="hidden md:inline">EURES :</span></span>
                      <span className="text-[7.5px] md:text-[9px] font-mono font-black text-white" style={{ color: r.color }}>
                        {r.min}<span className="hidden md:inline"> — </span>{r.max >= 100000 ? '∞' : r.max}<span className="md:hidden">H</span><span className="hidden md:inline">H</span>
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:block relative z-20 pt-3 border-t border-white/10 text-left">
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase font-black text-white/40 mb-1.5 tracking-wider">
                      <span>Pouvoir de Carte</span>
                      <span style={{ color: r.color }}>Passif Actif</span>
                    </div>

                    <div className="text-[9px] md:text-[10px] font-medium leading-relaxed text-white/90 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="italic line-clamp-2">
                        {isMystery
                          ? "Accès classifié. Débloqué aux explorateurs suprêmes du Sanctuary."
                          : `${r.perks[0].icon} ${r.perks[0].label}`}
                      </p>
                      {!isMystery && r.perks.length > 1 && (
                        <p className="text-[9px] font-mono font-black uppercase tracking-widest text-white/35 mt-1.5 pt-1.5 border-t border-white/5">
                          + {r.perks.length - 1} autre{r.perks.length - 2 > 0 ? 's' : ''} avantage{r.perks.length - 2 > 0 ? 's' : ''} →
                        </p>
                      )}
                    </div>
                  </div>

                  

                  {isMystery && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center shadow-lg mb-1">
                        <Lock size={13} className="text-white/60 animate-pulse" />
                      </div>
                      <span className="font-display font-black text-[8px] text-white/60 tracking-[0.25em] uppercase">
                        CLASSIFIÉ
                      </span>
                      <span className="text-[6px] font-mono text-white/30 uppercase tracking-widest mt-0.5">
                        Rang Ultime Inconnu
                      </span>
                    </div>
                  )}

                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-500 opacity-90 group-hover:h-1.5" 
                    style={{ 
                      backgroundColor: r.color, 
                      boxShadow: `0 0 20px 3px ${r.color}` 
                    }} 
                  />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Ludothèque Interactive avec ImageUploadInput */}
      <section className="py-12 md:py-24 bg-background relative border-t border-white/5">
        <div className="container mx-auto px-5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-4">
              <Flame className="text-secondary animate-pulse" size={14} />
              <span className="text-[9px] uppercase tracking-widest font-black text-white">Prêt pour le combat</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase text-white mb-4">
              EXPLORER LA <span className="text-secondary italic">LUDOTHÈQUE</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-widest font-bold">
              {games.length} titre{games.length > 1 ? 's' : ''} d'exception disponible{games.length > 1 ? 's' : ''} en salle
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-2xl mx-auto">
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer",
                  activeCategory === cat
                    ? "border-secondary bg-secondary/15 text-secondary shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "border-white/5 bg-white/5 text-white/60 hover:text-white hover:border-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {isAdmin && (
            <div className="mb-8 flex justify-center">
              <NeonButton onClick={() => setShowAddGame(!showAddGame)} variant={showAddGame ? 'danger' : 'emerald'}>
                {showAddGame ? 'Annuler' : 'Ajouter un jeu'}
              </NeonButton>
            </div>
          )}
          
          {showAddGame && (
             <CyberCard className="mb-8 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Titre" className="p-3 bg-white/5 rounded-xl border border-white/10 text-white" value={newGame.title} onChange={e => setNewGame({...newGame, title: e.target.value})} />
                <input placeholder="Catégorie" className="p-3 bg-white/5 rounded-xl border border-white/10 text-white" value={newGame.category} onChange={e => setNewGame({...newGame, category: e.target.value})} />
                <textarea placeholder="Description" className="p-3 bg-white/5 rounded-xl border border-white/10 text-white col-span-2" value={newGame.description} onChange={e => setNewGame({...newGame, description: e.target.value})} />
                
                <div className="col-span-2">
                  <ImageUploadInput
                    value={newGame.image_url}
                    onChange={(url) => setNewGame({ ...newGame, image_url: url })}
                    label="Affiche du jeu (URL ou Fichier)"
                  />
                </div>

                <NeonButton onClick={() => addGame.mutate(newGame)} className="col-span-2">Enregistrer</NeonButton>
             </CyberCard>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredGames.map((game: any) => (
              <CyberCard
                key={game.id}
                variant="cyan"
                className="p-4 flex flex-col justify-between group"
              >
                {isAdmin && (
                  <button onClick={() => confirm({ title: 'Supprimer ce jeu', subject: game.title, message: 'Le jeu sera retire de la ludotheque.', isPending: deleteGame.isPending, onConfirm: () => deleteGame.mutate(game.id) })} className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg hover:bg-red-600 z-10 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-white/5 relative">
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 bg-black/60 text-secondary text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-secondary/20">
                    {game.category}
                  </span>
                </div>
                
                <div className="text-left mt-2">
                  <h4 className="font-display font-black text-sm uppercase text-white truncate leading-tight mb-1">
                    {game.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>
                </div>
              </CyberCard>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Valeurs Section */}
      <section className="py-12 md:py-24 bg-background relative border-t border-white/5 text-center">
        <div className="container mx-auto px-5">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12 md:mb-20 md:text-left text-center">
            <div className="max-w-2xl mx-auto md:mx-0">
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-3 md:mb-4">
                NOS <span className="text-secondary italic">VALEURS</span>
              </h2>
              <p className="text-muted-foreground uppercase text-[8px] sm:text-[10px] font-bold tracking-[0.3em]">L'ADN d'Evazion Gaming Hub</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {[
              { icon: Zap, title: 'Perf', color: '#22d3ee', desc: 'Équipements PS5 de dernière génération.' },
              { icon: Shield, title: 'Respect', color: '#a855f7', desc: 'Une communauté soudée et fair-play.' },
              { icon: Trophy, title: 'Compéte', color: '#f97316', desc: 'Des tournois réguliers avec cashprizes.' }
            ].map((feature) => (
              <CyberCard
                key={feature.title}
                variant="violet"
                className="p-3 md:p-5 text-left rounded-2xl md:rounded-[1.75rem]"
              >
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center mb-2 md:mb-3 bg-white/5 border border-white/10">
                  <feature.icon size={14} className="md:hidden" style={{ color: feature.color }} />
                  <feature.icon size={18} className="hidden md:block" style={{ color: feature.color }} />
                </div>
                <h3 className="text-[9.5px] md:text-sm font-display font-black uppercase text-white mb-1.5 md:mb-2 leading-tight tracking-tight break-words hyphens-none">{feature.title}</h3>
                <p className="text-[8px] md:text-[9px] text-muted-foreground leading-relaxed">{feature.desc}</p>
              </CyberCard>
            ))}
          </div>
        </div>
      </section>

      <AboutUsSection />

      {selectedRank && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedRank(null) }}
        >
          <CyberCard
            hoverEffect={false}
            className="p-8 md:p-10 max-w-lg w-full text-left"
            style={{ borderColor: `${selectedRank.color}60` }}
            topRight={
              <button
                onClick={() => setSelectedRank(null)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-30 cursor-pointer"
                title="Fermer"
              >
                <X size={24} />
              </button>
            }
          >
            <div className="flex items-start gap-5 mb-7">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0"
                style={{ borderColor: selectedRank.color, boxShadow: `0 0 25px ${selectedRank.color}40` }}
              >
                <img src={selectedRank.image} alt={selectedRank.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-white/40 block mb-1">
                  Pouvoir de carte
                </span>
                <h3
                  className="text-3xl font-display font-black uppercase tracking-tight leading-none mb-2"
                  style={{ color: selectedRank.color, textShadow: `0 0 16px ${selectedRank.color}50` }}
                >
                  {selectedRank.name}
                </h3>
                <span className="text-[9px] font-mono font-bold text-white/50">
                  HEURES : {selectedRank.min} — {selectedRank.max >= 100000 ? '∞' : selectedRank.max}H
                </span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-white/40 block mb-4">
                {selectedRank.perks.length} avantage{selectedRank.perks.length > 1 ? 's' : ''} actif{selectedRank.perks.length > 1 ? 's' : ''}
              </span>
              <RankPerkList rank={selectedRank} size="md" />
            </div>

            <p className="mt-7 pt-5 border-t border-white/5 text-[10px] text-white/30 leading-relaxed">
              Tous les avantages sont cumulatifs et définitifs une fois le rang atteint.
            </p>
          </CyberCard>
        </div>
      )}
    </div>
  )
}
