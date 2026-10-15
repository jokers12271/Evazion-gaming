import React, { useState, useEffect, ReactNode } from 'react';
import { X, ChevronRight, KeyRound } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { NeonButton } from './NeonButton';

export interface AdminOnboardingStep {
  title: string;
  desc: string;
  icon: ReactNode;
}

export function AdminOnboardingModal({
  pageKey,
  steps
}: {
  pageKey: string;
  steps: AdminOnboardingStep[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(`sanctuary_admin_guide_${pageKey}`);
    if (!seen) {
      setIsOpen(true);
    }
  }, [pageKey]);

  const handleClose = () => {
    localStorage.setItem(`sanctuary_admin_guide_${pageKey}`, 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  return (
    <>
      {/* Floating admin guide badge */}
      <button
        onClick={() => {
          setCurrentStep(0);
          setIsOpen(true);
        }}
        title="Guide d'administration"
        className="fixed bottom-6 left-6 z-40 p-3 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:text-white hover:bg-amber-500 shadow-neon-orange transition-all hover:scale-110"
      >
        <KeyRound size={20} className="animate-pulse" />
      </button>

      {isOpen && steps[currentStep] && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <CyberCard variant="orange" hoverEffect={false} className="max-w-md w-full p-8 md:p-10 relative">
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-neon-orange">
              {steps[currentStep].icon}
            </div>

            <div className="flex items-center justify-center gap-1.5 mb-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? 'w-6 bg-amber-500' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 block mb-1">
              PANNEAU D'ADMINISTRATION ({currentStep + 1}/{steps.length})
            </span>

            <h3 className="text-2xl font-display font-black uppercase text-white mb-3 tracking-tight">
              {steps[currentStep].title}
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed mb-8">
              {steps[currentStep].desc}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 text-xs font-mono uppercase font-black text-white/50 hover:text-white transition-colors"
              >
                Passer
              </button>
              <NeonButton
                variant="orange"
                onClick={handleNext}
                className="flex-1 py-3 text-xs font-mono"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Suivant <ChevronRight size={14} />
                  </>
                ) : (
                  'Bien compris !'
                )}
              </NeonButton>
            </div>
          </CyberCard>
        </div>
      )}
    </>
  );
}
