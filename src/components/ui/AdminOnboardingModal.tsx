import { useState, useEffect } from 'react'
import { NeonButton } from '@/components/ui/NeonButton'
import { X, ArrowRight, Check } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'

export interface AdminOnboardingStep {
  title: string
  desc: string
  icon?: React.ReactNode
}

interface Props {
  pageKey: string // 'home', 'salon', 'reservation', 'store', 'community', 'tournaments', 'news', 'dashboard', 'player_detail'
  steps: AdminOnboardingStep[]
  onClose?: () => void
}

export function AdminOnboardingModal({ pageKey, steps, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Vérifier si le gérant a déjà vu le guide pour cette page à vie sur ce navigateur
    const hasSeenTour = localStorage.getItem(`evazion_admin_tour_${pageKey}`)
    
    if (!hasSeenTour) {
      setIsOpen(true)
      
      // Déclencher la sonnerie d'accueil d'Evazion
      try {
        const audio = new Audio('/alert.mp3')
        audio.play().catch(e => console.log("Audio bloqué :", e))
      } catch (soundErr) {
        console.error("Échec son d'onboarding gérant :", soundErr)
      }
    }
  }, [pageKey])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      localStorage.setItem(`evazion_admin_tour_${pageKey}`, 'true')
      setIsOpen(false)
      if (onClose) onClose()
    }
  }

  const handleSkip = () => {
    localStorage.setItem(`evazion_admin_tour_${pageKey}`, 'true')
    setIsOpen(false)
    if (onClose) onClose()
  }

  if (!isOpen || steps.length === 0) return null

  const activeStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
      <div 
        className="glass p-8 md:p-10 rounded-[3rem] border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.25)] max-w-md w-full relative overflow-hidden flex flex-col items-center justify-center"
        style={{ borderColor: '#f59e0b' }}
      >
        {/* Halo lumineux ambre */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={handleSkip} 
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest focus:outline-none"
        >
          Passer le guide
        </button>

        {/* Icône ambre de l'étape active */}
        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30 text-amber-500">
          {activeStepData.icon || <span>👑</span>}
        </div>

        <h3 className="text-xl md:text-2xl font-black uppercase mb-3 text-amber-500 text-glow-orange leading-none tracking-tight">
          {activeStepData.title}
        </h3>
        <p className="text-xs md:text-sm text-white/70 leading-relaxed font-semibold mb-8 min-h-[60px]">
          {activeStepData.desc}
        </p>

        {steps.length > 1 && (
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentStep ? "w-6 bg-amber-500" : "w-1.5 bg-white/10"
                )}
              />
            ))}
          </div>
        )}

        <NeonButton 
          variant="orange"
          style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }}
          className="w-full py-4 text-xs font-black flex items-center justify-center gap-2"
          onClick={handleNext}
        >
          <span>{currentStep === steps.length - 1 ? "J'AI COMPRIS !" : "SUIVANT"}</span>
          {currentStep === steps.length - 1 ? <Check size={14} /> : <ArrowRight size={14} />}
        </NeonButton>

      </div>
    </div>
  )
}