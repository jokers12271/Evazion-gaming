import { useState, useEffect } from 'react'
import { Sparkles, Zap, Trophy, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const GAMING_QUOTES = [
  "⚡ Tournoi Tekken 8 ce samedi à 15h !",
  "🔥 Plus que 2 heures de jeu pour gagner 1 MANI de bonus !",
  "🏆 @Darius_B vient d'atteindre le rang LÉGENDE !",
  "🎮 Les nouveaux postes PS5 Pro sont configurés en 4K 120Hz."
]

export function FloatingCyberTicker() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % GAMING_QUOTES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/80 border border-secondary/40 backdrop-blur-xl shadow-[0_0_25px_rgba(6,182,212,0.25)] text-white pointer-events-none">
      <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
      <div className="overflow-hidden h-5 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[10px] font-mono font-black uppercase tracking-wider text-secondary whitespace-nowrap"
          >
            {GAMING_QUOTES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
