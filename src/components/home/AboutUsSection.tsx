import { useState } from 'react'
import { NeonButton } from '@/components/ui/NeonButton'
import { Info, X, Zap, Award, Users, ShieldAlert } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'

export function AboutUsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    { title: "1. S'inscrire", desc: "Créez votre carte de membre numérique gratuite en quelques secondes pour démarrer votre suivi." },
    { title: "2. Jouer (Miner)", desc: "Chaque minute de jeu sur nos PS5 est enregistrée pour faire grimper votre niveau et votre Rang." },
    { title: "3. Récolter", desc: "Toutes les 4h de jeu, recevez 1 MANI. Échangez-les dans le Store contre des boissons, bonus ou cadeaux." }
  ]

  return (
    <section className="py-16 md:py-24 bg-background border-t border-white/5 relative overflow-hidden z-20 text-left">
      <div className="container mx-auto px-5 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Bloc de Gauche : Description Courte et Bouton d'action */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 text-white">
              <Info className="text-primary" size={14} />
              <span className="text-[9px] uppercase tracking-[0.2em] font-black">L'univers Evazion</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-white leading-tight">
              THE SANCTUARY : <br />
              <span className="text-primary italic">PLUS QU'UNE SALLE</span>
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
              Situé au cœur de Brazzaville, <strong>Evazion (The Sanctuary)</strong> est le repaire d'élite pour les passionnés de PS5. Plus qu'une simple salle de jeux, nous offrons un écosystème entièrement ludifié où chaque minute passée à jouer vous rapproche du statut de Légende.
            </p>

            <div className="pt-2">
              <NeonButton 
                variant="violet" 
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] font-black tracking-widest px-6 py-3"
              >
                EN SAVOIR PLUS & CHARTE
              </NeonButton>
            </div>
          </div>

          {/* Bloc de Droite ("Something Else") : Le guide de démarrage interactif */}
          <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary mb-6 flex items-center gap-2">
              <Zap size={14} className="animate-pulse" />
              GUIDE DE SURVIE EN SALLE
            </h3>

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-white",
                    activeStep === idx 
                      ? "border-secondary/40 bg-secondary/5" 
                      : "border-white/5 hover:border-white/10 bg-transparent"
                  )}
                >
                  <h4 className={cn(
                    "text-xs font-black uppercase tracking-wider mb-1",
                    activeStep === idx ? "text-secondary" : "text-white/80"
                  )}>
                    {step.title}
                  </h4>
                  {activeStep === idx && (
                    <p className="text-[11px] text-muted-foreground leading-normal mt-2 animate-fade-in font-medium">
                      {step.desc}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* FENÊTRE MODALE IMMERSIVE : CHARTE COMPLÈTE DU SANCTUARY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div className="glass p-8 md:p-10 rounded-[3rem] border-2 border-primary shadow-neon-violet max-w-2xl w-full relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors focus:outline-none"
              title="Fermer"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-2xl md:text-3xl font-black uppercase text-glow-violet text-primary">
                La Charte du Sanctuary
              </h3>
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">
                Règles et Fonctionnement d'Evazion
              </p>
            </div>

            {/* Corps de la charte */}
            <div className="space-y-6 text-left border-t border-white/5 pt-6 text-xs sm:text-sm text-white/80 leading-relaxed font-semibold">
              
              <div className="flex gap-4">
                <div className="p-2.5 bg-primary/10 rounded-xl h-fit border border-primary/20 text-primary">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-white mb-1">L'Échelle de Puissance</h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Chaque minute passée sur nos consoles PS5 est enregistrée sur votre carte de membre numérique. Progressez à travers nos Rangs (de Régulier à Divin) et débloquez des avantages en direct (recharges de temps gratuites, boissons, réductions aux tournois).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 bg-secondary/10 rounded-xl h-fit border border-secondary/20 text-secondary">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-white mb-1">Le Minage de MANI</h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Le temps de jeu se transforme en valeur. Toutes les 4 heures jouées, gagnez 1 MANI, notre monnaie interne. Utilisez vos jetons dans la Boutique pour réclamer des consommables ou des droits spéciaux d'arène.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 bg-accent/10 rounded-xl h-fit border border-accent/20 text-accent">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-white mb-1">Teams & Défis Ragnarok</h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Rejoignez une Team de jeu (FC 26, Tekken, etc.), cotisez de manière collaborative pour vos sessions d'équipe et provoquez vos rivaux directs dans l'Arène Ragnarok en mettant en jeu vos heures de rang ou vos MANI.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-6">
                <div className="p-2.5 bg-red-500/10 rounded-xl h-fit border border-red-500/20 text-red-500">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-white mb-1 text-red-400">Le Code de Conduite</h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Respect absolu, fair-play exemplaire et camaraderie sont exigés au Sanctuary. Les attitudes toxiques ou le non-respect du matériel haut de gamme entraînent des sanctions ou des suspensions administratives immédiates.
                  </p>
                </div>
              </div>

            </div>

            {/* Bouton de Fermeture Inférieur */}
            <div className="border-t border-white/5 pt-6 shrink-0">
              <NeonButton 
                variant="ghost"
                className="w-full py-4 text-xs font-black"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                onClick={() => setIsModalOpen(false)}
              >
                Retourner sur le site
              </NeonButton>
            </div>

          </div>
        </div>
      )}

    </section>
  )
}