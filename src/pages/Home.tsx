import { useEffect, useRef } from 'react'
import { NeonButton } from '@/components/ui/NeonButton'
import { Link } from '@tanstack/react-router'
import { Gamepad2, Trophy, Users, Zap, Shield, Clock, ChevronRight, HelpCircle } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RANKS } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'

gsap.registerPlugin(ScrollTrigger)

export function Home() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-content > *', { y: 100, opacity: 0, duration: 1, stagger: 0.2, ease: 'power4.out' })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="overflow-hidden bg-background text-white">
      {/* Hero Section */}
       <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-1">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background z-10" />
          <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2000" className="hero-bg w-full h-full object-cover opacity-40" alt="bg"/>
        </div>
        <div className="container mx-auto px-4 relative z-20 flex flex-col items-center text-center">
          <div className="max-w-4xl hero-content">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-6 text-[10px] uppercase font-bold tracking-widest">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" /> Futur du gaming à Brazzaville
            </div>
             <h1 className="text-6xl md:text-8xl font-display font-black uppercase leading-none mb-8" translate="no">WELCOME TO<br /><span className="text-primary text-glow-violet italic"> THE SANCTUARY </span></h1>
            <div className="flex gap-6 justify-center">
              <Link to="/reservation"><NeonButton size="lg">Réserver</NeonButton></Link>
              <Link to="/tournaments"><NeonButton variant="cyan" size="lg">Tournois</NeonButton></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Échelle de Puissance avec Rang Mystère Flouté */}
      <section className="py-24 relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-6xl md:text-9xl font-display font-black uppercase leading-none mb-6">ÉCHELLE DE <br/> <span className="text-primary italic">PUISSANCE</span></h2>
          <p className="text-muted-foreground max-w-4xl mx-auto uppercase text-xs font-black opacity-70 flex items-center justify-center gap-2 mb-20">
            Ratio de progression : <span className="font-bold text-secondary">4 HEURES DE JEU = 1</span><img src="/mani.jpg" className="w-6 h-6 rounded-full" /> DANS VOTRE PORTEFEUILLE
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {RANKS.map((r, index) => {
              const isMystery = r.name === "Mystère";

              return (
                <div key={r.name} className={cn(
                  "group relative flex flex-col justify-end p-10 h-[500px] rounded-[2.5rem] overflow-hidden border-2 transition-all duration-700",
                  r.border,
                  !isMystery && "hover:-translate-y-4 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,1)]",
                  isMystery && "cursor-help"
                )}>
                  
                  {/* CONTENU FLOU (POUR LE MYSTÈRE) OU NORMAL */}
                  <div className={cn(
                    "absolute inset-0 z-0 transition-all duration-1000",
                    isMystery && "blur-[30px] scale-110 opacity-50" // Flou intense + zoom pour éviter les bords nets
                  )}>
                    <div className="absolute inset-0 bg-black">
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125 opacity-70" />
                      <div className="absolute inset-0 mix-blend-color opacity-60" style={{ backgroundColor: r.color }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                    </div>
                  </div>
                  
                  {/* TEXTE FLOU OU NORMAL */}
                  <div className={cn(
                    "relative z-10 text-left transition-all duration-700",
                    isMystery && "blur-xl select-none pointer-events-none opacity-40" // Rend le texte illisible
                  )}>
                    <div className={cn("text-[10px] font-black uppercase tracking-[0.4em] mb-4 drop-shadow-md", r.label)}>RANG {index + 1}</div>
                    <h3 className="text-6xl font-display font-black uppercase mb-6 leading-none">{r.name}</h3>
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                         <div className="h-[2px] w-12" style={{ backgroundColor: r.color }} />
                         <span className="text-xs font-black tracking-widest flex items-center gap-2">
                           {r.min} - {r.max >= 100000 ? '∞' : r.max} <span className="opacity-60">HEURES</span>
                         </span>
                      </div>
                      <p className="text-sm font-bold italic opacity-90 leading-snug" dangerouslySetInnerHTML={{ __html: `"${r.reward}"` }} />
                    </div>
                  </div>

                  {/* ÉLÉMENT VISIBLE UNIQUEMENT POUR LE MYSTÈRE (NON FLOUTÉ) */}
                  {isMystery && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20">
                       <HelpCircle size={120} className="text-white/10 animate-pulse stroke-[1px]" />
                       <div className="absolute font-display font-black text-4xl text-white/20 tracking-[0.5em] uppercase mt-32">
                         Locked
                       </div>
                    </div>
                  )}
                  
                  {/* LIGNE DE LUEUR NÉON (VISIBLE MÊME SI MYSTÈRE POUR LE STYLE) */}
                  <div className="absolute bottom-0 left-0 right-0 h-3 opacity-80 transition-all duration-500" 
                       style={{ 
                         backgroundColor: r.color, 
                         boxShadow: `0 0 40px 5px ${r.color}` 
                       }} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="py-24 bg-background relative border-t border-white/5 text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20 md:text-left">
            <div className="max-w-2xl mx-auto md:mx-0">
              <h2 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-4">NOS <span className="text-secondary italic">VALEURS</span></h2>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.3em]">L'ADN d'Evazion Gaming Hub</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Zap, title: 'Performance', color: 'var(--primary)', desc: 'Équipements PS5 de dernière génération.' },
              { icon: Shield, title: 'Respect', color: 'var(--secondary)', desc: 'Une communauté soudée et fair-play.' },
              { icon: Trophy, title: 'Compétition', color: 'var(--accent)', desc: 'Des tournois réguliers avec cashprizes.' }
            ].map((feature) => (
              <div key={feature.title} className="group relative p-10 rounded-[2.5rem] glass border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/20 text-left">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-white/5 border border-white/10">
                  <feature.icon size={32} style={{ color: feature.color }} />
                </div>
                <h3 className="text-3xl font-display font-black uppercase text-white mb-4">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}