import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, HelpCircle, Trophy, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { QUIZ_QUESTIONS, QuizQuestion, useGamificationStore } from '@/lib/gamificationData';
import { cyberAudio } from '@/lib/cyberAudio';
import { toast } from 'react-hot-toast';

interface WarmupArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WarmupArcadeModal({ isOpen, onClose }: WarmupArcadeModalProps) {
  const [activeTab, setActiveTab] = useState<'reflex' | 'quiz'>('reflex');
  const gamificationStore = useGamificationStore();
  const questions: QuizQuestion[] = gamificationStore.getQuizQuestions();

  // Reflex Game State
  const [reflexState, setReflexState] = useState<'idle' | 'waiting' | 'ready' | 'result' | 'early'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestReflex, setBestReflex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Quiz Game State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // Reflex handlers
  const startReflexTest = () => {
    setReflexState('waiting');
    cyberAudio.playClick();
    const delay = Math.floor(Math.random() * 3000) + 1500; // 1.5s to 4.5s
    timerRef.current = setTimeout(() => {
      setReflexState('ready');
      startTimeRef.current = performance.now();
      cyberAudio.playClick();
    }, delay);
  };

  const handleReflexClick = () => {
    if (reflexState === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setReflexState('early');
    } else if (reflexState === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(elapsed);
      setReflexState('result');
      cyberAudio.playSuccess();
      if (!bestReflex || elapsed < bestReflex) {
        setBestReflex(elapsed);
      }
    }
  };

  // Quiz handlers
  const handleAnswer = (optionIdx: number) => {
    if (selectedOption !== null || questions.length === 0) return;
    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === questions[currentQIndex]?.correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      cyberAudio.playSuccess();
    } else {
      cyberAudio.playClick();
    }

    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        setQuizFinished(true);
        toast.success(`Quizz terminé ! Score : ${score + (isCorrect ? 1 : 0)}/${questions.length} 🏆`);
      }
    }, 1200);
  };

  const resetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in font-display">
      <CyberCard
        variant="cyan"
        hoverEffect={false}
        className="w-full max-w-xl p-6 md:p-8 relative text-left"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer z-20"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-secondary" />
          <span className="text-[10px] font-mono uppercase text-secondary font-black tracking-widest">
            Arcade d'Échauffement du Lounge
          </span>
        </div>

        <h3 className="text-2xl font-black uppercase text-white mb-4">
          Mini-Jeux des Joueurs
        </h3>

        {/* Tab switch */}
        <div className="flex gap-2 p-1 bg-black/50 border border-white/10 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('reflex')}
            className={`flex-1 py-2 text-xs font-mono uppercase font-black rounded-lg transition-all cursor-pointer ${
              activeTab === 'reflex' ? 'bg-secondary text-black shadow-neon-cyan' : 'text-white/60 hover:text-white'
            }`}
          >
            ⚡ Test Réflexes Cyber (ms)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-2 text-xs font-mono uppercase font-black rounded-lg transition-all cursor-pointer ${
              activeTab === 'quiz' ? 'bg-primary text-black shadow-neon-violet' : 'text-white/60 hover:text-white'
            }`}
          >
            🧠 Quizz E-Sport Brazza
          </button>
        </div>

        {/* JEU 1 : TEST DE RÉFLEXES */}
        {activeTab === 'reflex' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-white/60 font-sans">
              Testez votre vitesse de réaction avant de prendre la manette. Cliquez dès que l'arène s'illumine en vert !
            </p>

            <div
              onClick={handleReflexClick}
              className={`h-52 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all select-none p-4 ${
                reflexState === 'idle'
                  ? 'bg-black/60 border-white/20 hover:border-secondary'
                  : reflexState === 'waiting'
                  ? 'bg-red-500/20 border-red-500 animate-pulse'
                  : reflexState === 'ready'
                  ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.8)] text-black'
                  : reflexState === 'result'
                  ? 'bg-secondary/20 border-secondary'
                  : 'bg-amber-500/20 border-amber-500 text-amber-300'
              }`}
            >
              {reflexState === 'idle' && (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-secondary">
                    <Zap size={24} />
                  </div>
                  <div className="text-base font-black uppercase text-white">Cliquez pour Démarrer</div>
                  <div className="text-[10px] font-mono text-white/40">Attendez ensuite le signal vert...</div>
                </div>
              )}

              {reflexState === 'waiting' && (
                <div className="space-y-1">
                  <div className="text-xl font-black uppercase text-red-400">PATIENTEZ...</div>
                  <div className="text-xs font-mono text-white/60">Ne cliquez pas encore !</div>
                </div>
              )}

              {reflexState === 'ready' && (
                <div className="space-y-1">
                  <div className="text-3xl font-black uppercase text-black font-display">CLIQUEZ MAINTENANT !</div>
                </div>
              )}

              {reflexState === 'early' && (
                <div className="space-y-2">
                  <AlertCircle size={32} className="text-amber-400 mx-auto" />
                  <div className="text-lg font-black uppercase text-amber-400">FAUX DÉPART !</div>
                  <div className="text-xs text-white/70">Vous avez cliqué avant le signal vert.</div>
                </div>
              )}

              {reflexState === 'result' && reactionTime && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-white/50 uppercase">Vitesse de Réaction</div>
                  <div className="text-4xl font-mono font-black text-secondary">{reactionTime} ms</div>
                  <div className="text-xs font-bold text-white uppercase">
                    {reactionTime < 200 ? "⚡ Niveau Divin (Sniper Pro)" : reactionTime < 280 ? "🔥 Excellents Réflexes" : "🐢 Échauffement Recommandé"}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono px-2 pt-2">
              <span className="text-white/40">
                Meilleur réflexe : <span className="text-amber-400 font-bold">{bestReflex ? `${bestReflex} ms` : '-'}</span>
              </span>
              <button
                type="button"
                onClick={startReflexTest}
                className="text-secondary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} /> Réessayer
              </button>
            </div>
          </div>
        )}

        {/* JEU 2 : QUIZZ E-SPORT */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            {!quizFinished && questions.length > 0 ? (
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-2">
                  <span className="text-secondary font-bold">
                    Question {currentQIndex + 1} / {questions.length}
                  </span>
                  <span className="text-white/40">
                    Jeu : {questions[currentQIndex]?.game}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 mb-4">
                  <h4 className="text-sm md:text-base font-bold text-white font-sans">
                    {questions[currentQIndex]?.question}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {questions[currentQIndex]?.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === questions[currentQIndex]?.correctIndex;
                    let btnStyle = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10";

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                      } else if (isSelected) {
                        btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedOption !== null}
                        className={`p-3 rounded-xl border text-left text-xs font-sans transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span className="font-mono font-bold mr-2 text-white/40">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <Trophy size={48} className="text-amber-400 mx-auto animate-bounce" />
                <h4 className="text-2xl font-black uppercase text-white">Quizz Terminé !</h4>
                <div className="text-3xl font-mono font-black text-amber-400">
                  {score} / {questions.length} Bonnes Réponses
                </div>
                <p className="text-xs text-white/70 font-sans max-w-sm mx-auto">
                  {score === questions.length
                    ? "Parfait ! Véritable encyclopédie du Sanctuaire ! +2 MANI offerts."
                    : "Bien joué ! Entraînez-vous encore sur les consoles du lounge pour devenir incollable."}
                </p>
                <NeonButton variant="violet" onClick={resetQuiz} className="py-2.5 px-6 text-xs">
                  Recommencer le Quizz
                </NeonButton>
              </div>
            )}
          </div>
        )}
      </CyberCard>
    </div>
  );
}
