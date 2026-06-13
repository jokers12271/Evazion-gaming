import { useEffect, useRef, useState } from 'react'
import { NeonButton } from '@/components/ui/NeonButton'
import { Link } from '@tanstack/react-router'
import { Gamepad2, Trophy, Users, Zap, Shield, HelpCircle, Flame, Filter } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RANKS } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { GAMES_DATABASE } from '@/lib/gamesData'
import { AboutUsSection } from '@/components/home/AboutUsSection'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useSanctuaryStatus } from '@/hooks/useSanctuaryStatus'
import { toast } from 'react-hot-toast'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { Coins } from 'lucide-react'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { KeyRound } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<string>('Tous')

  // AJOUTÉ : Chargement du profil et de l'état de la salle en direct
  const { data: metadata } = useUserMetadata()
  const { currentStatus, toggleStatus } = useSanctuaryStatus()
  const isAdmin = metadata?.is_admin || false

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-content > *', { y: 100, opacity: 0, duration: 1, stagger: 0.2, ease: 'power4.out' })
    })
    return () => ctx.revert()
  }, [])

  // Filtrer les jeux pour la bibliothèque interactive
  const filteredGames = activeCategory === 'Tous'
    ? GAMES_DATABASE
    : GAMES_DATABASE.filter(g => g.category === activeCategory)

  // Duplication de la liste pour le défilement infini sans coupure (Ticker)
  const marqueeGames = [...GAMES_DATABASE.slice(0, 15), ...GAMES_DATABASE.slice(0, 15)]

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
      title: "Mineur de MANI",
      desc: "Toutes les 4 heures de jeu cumulées, gagnez automatiquement 1 MANI, notre monnaie exclusive échangeable contre des cadeaux réels.",
      icon: <Coins size={28} />
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
      {/* GUIDE DE BIENVENUE DU JOUEUR */}
      <OnboardingModal pageKey="home" steps={onboardingSteps} />

      {/* GUIDE DE BIENVENUE DU GÉRANT (AJOUTÉ) */}
      {isAdmin && <AdminOnboardingModal pageKey="home" steps={adminOnboardingSteps} />}
      
      <OnboardingModal pageKey="home" steps={onboardingSteps} />
      {/* Balise de style intégrée pour animer le défilé infini proprement */}
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
          
          {/* Début du conteneur d'animation GSAP */}
          <div className="max-w-3xl hero-content">
            
            {/* TEXTE D'ACCUEIL (Taille de boîte et épaisseur identiques à "SANCTUAIRE : OUVERT" — CORRIGÉ) */}
            <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border border-white/10 bg-background/60 backdrop-blur-md inline-flex items-center gap-2 shadow-lg mb-5 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Futur du jeu à Brazzaville
            </div>
             
             <h1 className="text-5xl sm:text-5xl md:text-8xl font-display font-black uppercase leading-none mb-6 md:mb-8" translate="no">
               WELCOME TO<br />
               <span className="text-primary text-glow-violet italic"> THE SANCTUARY </span>
             </h1>
             
             {/* LES DEUX BOUTONS D'APPEL À L'ACTION */}
             <div className="flex gap-3 sm:gap-6 justify-center w-full max-w-sm mx-auto">
               <Link to="/reservation" className="flex-1 max-w-[150px]">
                 <NeonButton size="lg" className="w-full px-3 sm:px-5 py-2.5 sm:py-4 text-[9px] sm:text-lg font-black tracking-widest">
                   Réserver
                 </NeonButton>
               </Link>
               <Link to="/tournaments" className="flex-1 max-w-[150px]">
                 <NeonButton variant="cyan" size="lg" className="w-full px-3 sm:px-5 py-2.5 sm:py-4 text-[9px] sm:text-lg font-black tracking-widest">
                   Tournois
                 </NeonButton>
               </Link>
             </div>

             {/* ========================================================================= */}
             {/* L'INTERRUPTEUR INTÉGRÉ ICI (SOUS LES DEUX BOUTONS, DANS UN CONTENEUR FIXE) */}
             {/* ========================================================================= */}
             <div className="mt-8 flex flex-col items-center justify-center w-full relative z-30">
               {isAdmin ? (
                 /* A. INTERRUPTEUR DE COMMANDE ADMIN EN DIRECT */
                 <div className="flex flex-col items-center gap-2 animate-fade-in">
                   <span className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em]">Interrupteur Sanctuary (Admin) :</span>
                   <button 
                     onClick={async () => {
                   const nextStatus = (currentStatus || 'ouvert') === 'ouvert' ? 'fermé' : 'ouvert'; // SÉCURISÉ
                       try {
                         await toggleStatus.mutateAsync(nextStatus);
                         const audio = new Audio('/alert.mp3');
                         audio.play().catch(e => console.log(e));
                         toast.success(`Le Sanctuary est maintenant ${nextStatus.toUpperCase()} !`, { position: "bottom-center" });
                       } catch (e) {
                         toast.error("Erreur de modification.");
                       }
                     }}
                     className={cn(
                   "w-16 h-7 rounded-full border p-1 transition-all duration-300 relative flex items-center shadow-lg",
                   (currentStatus || 'ouvert') === 'ouvert' // SÉCURISÉ
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
                 /* B. VOYANT NÉON PULSATIF PUBLIC */
                 <div className="animate-fade-in">
                   <span 
                     className={cn(
                   "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border inline-flex items-center gap-2 shadow-lg",
                   (currentStatus || 'ouvert') === 'ouvert' // SÉCURISÉ
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
               )}
             </div>

          </div>
        </div>
      </section>

      {/* 2. Nouveau Défilé Infini (Ticker) de la bibliothèque de jeux */}
      <section className="py-8 bg-black/40 border-y border-white/5 relative overflow-hidden z-20">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-hidden w-full">
          <div className="animate-marquee gap-6">
            {marqueeGames.map((game, idx) => (
              <div 
                key={`${game.id}-${idx}`}
                className="w-24 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-lg shrink-0 relative group hover:border-secondary/50 transition-all duration-300 hover:scale-105"
              >
                <img 
                  src={game.image} 
                  alt={game.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider truncate text-white w-full text-center">
                    {game.title}
                  </span>
                </div>
              </div>
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
            Ratio de progression : <span className="font-bold text-secondary">4 heures de jeu = 1 </span>
            <img src="/mani.jpg" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full inline-block align-middle mx-1" alt="Mani" /> 
            dans votre portefeuille
          </p>

          {/* Grille des Rangs (Taille des boîtes réduite, plus compacte et harmonieuse) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {RANKS.map((r, index) => {
              const isMystery = r.name === "Mystère";

              return (
                <div key={r.name} className={cn(
                  "group relative flex flex-col justify-end p-5 md:p-6 h-[260px] md:h-[360px] rounded-3xl overflow-hidden border-2 transition-all duration-700", // Boîtes miniaturisées (360px max)
                  r.border,
                  !isMystery && "hover:-translate-y-3 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,1)]",
                  isMystery && "cursor-help"
                )}>
                  
                  {/* Arrière-plan */}
                  <div className={cn(
                    "absolute inset-0 z-0 transition-all duration-1000",
                    isMystery && "blur-[30px] scale-110 opacity-50"
                  )}>
                    <div className="absolute inset-0 bg-black">
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125 opacity-60" />
                      <div className="absolute inset-0 mix-blend-color opacity-60" style={{ backgroundColor: r.color }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                    </div>
                  </div>
                  
                  {/* Contenu textuel */}
                  <div className={cn(
                    "relative z-10 text-left transition-all duration-700",
                    isMystery && "blur-xl select-none pointer-events-none opacity-40"
                  )}>
                    <div className={cn("text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 drop-shadow-md", r.label)}>RANG {index + 1}</div>
                    
                    {/* LE NOM DU RANG PREND LA COULEUR DE SON CERCLE (AJOUTÉ) */}
                    <h3 
                      className="text-3xl md:text-4xl font-display font-black uppercase mb-2 leading-none"
                      style={{ color: r.color, textShadow: `0 0 10px ${r.color}30` }}
                    >
                      {r.name}
                    </h3>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2">
                         <div className="h-[1.5px] w-6 md:w-8" style={{ backgroundColor: r.color }} />
                         <span className="text-[9px] md:text-[10px] font-black tracking-widest flex items-center gap-1.5">
                           {r.min} - {r.max >= 100000 ? '∞' : r.max} <span className="opacity-60">HEURES</span>
                         </span>
                      </div>
                      <p className="text-[9px] md:text-xs font-bold italic opacity-95 leading-relaxed" dangerouslySetInnerHTML={{ __html: `"${r.reward}"` }} />
                    </div>
                  </div>

                  {/* Cache de cadenas pour le mystère */}
                  {isMystery && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40">
                       <HelpCircle size={40} className="text-white/10 animate-pulse stroke-[1px]" />
                       <div className="absolute font-display font-black text-sm text-white/20 tracking-[0.4em] uppercase mt-12">
                         Locked
                       </div>
                    </div>
                  )}
                  
                  {/* Ligne laser néon affinée sous la boîte */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 opacity-80 transition-all duration-500" 
                       style={{ 
                         backgroundColor: r.color, 
                         boxShadow: `0 0 20px 2px ${r.color}` 
                       }} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Nouvelle Section : Bibliothèque de Jeux Interactive */}
      <section className="py-12 md:py-24 bg-background relative border-t border-white/5">
        <div className="container mx-auto px-5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-4">
              <Flame className="text-secondary animate-pulse" size={14} />
              <span className="text-[9px] uppercase tracking-widest font-black text-white">Prêt pour le combat</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase text-white mb-4">
              EXPLORER LA <span className="text-secondary italic">LUDOTHÈQUE</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-widest font-bold">
              {GAMES_DATABASE.length}+ titres d'exception disponibles en salle
            </p>
          </div>

          {/* Onglets de filtrage */}
          <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-2xl mx-auto">
            {['Tous', 'Combat', 'Sport', 'Tir', 'Aventure', 'Coop'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                  activeCategory === cat
                    ? "border-secondary bg-secondary/15 text-secondary shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "border-white/5 bg-white/5 text-white/60 hover:text-white hover:border-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grille de jeux filtrée */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="group glass border-white/5 p-4 rounded-3xl flex flex-col justify-between transition-all duration-500 hover:border-secondary/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden"
              >
                <div className="aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-white/5 relative">
                  <img
                    src={game.image}
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
              </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {[
              { icon: Zap, title: 'Performance', color: 'var(--primary)', desc: 'Équipements PS5 de dernière génération.' },
              { icon: Shield, title: 'Respect', color: 'var(--secondary)', desc: 'Une communauté soudée et fair-play.' },
              { icon: Trophy, title: 'Compétition', color: 'var(--accent)', desc: 'Des tournois réguliers avec cashprizes.' }
            ].map((feature) => (
              <div key={feature.title} className="group relative p-6 md:p-10 rounded-[2.5rem] glass border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/20 text-left">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 bg-white/5 border border-white/10">
                  <feature.icon size={24} className="md:hidden" style={{ color: feature.color }} />
                  <feature.icon size={32} className="hidden md:block" style={{ color: feature.color }} />
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-black uppercase text-white mb-3 md:mb-4">{feature.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 5. Section À Propos & Fonctionnement */}
      <AboutUsSection />

      {/* 6. Valeurs Section */}
      <section className="py-12 md:py-24 bg-background relative border-t border-white/5 text-center"></section>
    </div>
  )
}