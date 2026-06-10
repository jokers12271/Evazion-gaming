import { useState, useEffect } from 'react'
import { useLoyalty } from '@/hooks/useLoyalty'
import { getRank, RANKS } from '@/lib/ranks'
import { NeonButton } from '@/components/ui/NeonButton'
import { Trophy, ShieldAlert, Sparkles, X } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'

export function RankChangePopup() {
  const { data: loyalty } = useLoyalty()
  const [activeChange, setActiveChange] = useState<{ type: 'up' | 'down'; oldRank: any; newRank: any } | null>(null)

  useEffect(() => {
    if (!loyalty) return;

    const currentHours = loyalty.total_hours || 0;
    const currentRank = getRank(currentHours);
    
    // Lire le dernier rang connu mémorisé localement dans le navigateur
    const lastKnownRankName = localStorage.getItem('last_known_rank_name');

    if (lastKnownRankName) {
      if (lastKnownRankName !== currentRank.name) {
        // Un changement de rang (montée ou rétrogradation) a été détecté !
        const oldRank = RANKS.find(r => r.name === lastKnownRankName) || RANKS[0];
        const oldIdx = RANKS.findIndex(r => r.name === oldRank.name);
        const newIdx = RANKS.findIndex(r => r.name === currentRank.name);

        const type = newIdx > oldIdx ? ('up' as const) : ('down' as const);

        // Déclencher l'affichage du pop-up centré
        setActiveChange({ type, oldRank, newRank: currentRank });

        // Mettre à jour la mémoire du navigateur
        localStorage.setItem('last_known_rank_name', currentRank.name);
      }
    } else {
      // Première initialisation du joueur sur ce navigateur
      localStorage.setItem('last_known_rank_name', currentRank.name);
    }
  }, [loyalty])

  if (!activeChange) return null;

  const { type, newRank } = activeChange;
  const isLevelUp = type === 'up';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
      <div 
        className={cn(
          "glass p-10 rounded-[3rem] border-2 max-w-lg w-full relative overflow-hidden flex flex-col items-center justify-center"
        )}
        style={{ 
          borderColor: newRank.color, 
          boxShadow: `0 0 40px ${newRank.color}30` 
        }}
      >
        {/* Image de fond floutée et immersive propre au nouveau rang */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={newRank.image} 
            className="w-full h-full object-cover opacity-20 scale-110 blur-[2px]" 
            alt={newRank.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
        </div>

        {/* Bouton de fermeture */}
        <button 
          onClick={() => setActiveChange(null)} 
          className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-30 focus:outline-none"
        >
          <X size={20} />
        </button>

        {/* Icône animée */}
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10" 
          style={{ backgroundColor: `${newRank.color}15`, border: `2px solid ${newRank.color}40` }}
        >
          {isLevelUp ? (
            <Sparkles className="animate-pulse" size={32} style={{ color: newRank.color }} />
          ) : (
            <ShieldAlert className="animate-bounce" size={32} style={{ color: '#ef4444' }} />
          )}
        </div>

        {/* Titre principal */}
        <h3 
          className="text-3xl font-black uppercase mb-2 tracking-tight relative z-10"
          style={{ color: isLevelUp ? newRank.color : '#ef4444', textShadow: `0 0 10px ${isLevelUp ? newRank.color : '#ef4444'}30` }}
        >
          {isLevelUp ? "NOUVEAU RANG ATTEINT !" : "RANG RÉTROGRADÉ !"}
        </h3>
        
        <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.25em] mb-6 relative z-10">
          {isLevelUp ? "Progression de Puissance validée" : "Ajustement de vos heures de rang"}
        </p>

        {/* Bloc central d'identité du rang */}
        <div className="relative z-10 w-full bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
          <span className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-2">VOTRE RANG ACTUEL :</span>
          <h4 
            className="text-4xl font-black uppercase mb-4 tracking-tighter"
            style={{ color: newRank.color, textShadow: `0 0 15px ${newRank.color}40` }}
          >
            {newRank.name}
          </h4>
          
          <div className="border-t border-white/5 pt-4">
            <span className="text-[9px] font-black uppercase tracking-wider block mb-2" style={{ color: newRank.color }}>
              {isLevelUp ? "Nouveau privilège débloqué :" : "Nouveaux privilèges restreints :"}
            </span>
            
            {isLevelUp ? (
              <p 
                className="text-sm font-bold italic leading-relaxed text-white" 
                dangerouslySetInnerHTML={{ __html: `"${newRank.reward}"` }} 
              />
            ) : (
              <p className="text-sm font-bold italic leading-relaxed text-white/70">
                "Désolé, vous êtes redescendu au rang <span className="font-black" style={{ color: newRank.color }}>{newRank.name}</span>. Vous avez perdu vos privilèges précédents. Vous récupérerez ces avantages dès que vous atteindrez à nouveau ce rang."
              </p>
            )}
          </div>
        </div>

        <NeonButton 
          variant={isLevelUp ? "violet" : "ghost"}
          className="w-full py-4 text-xs font-black relative z-10 shadow-lg"
          style={isLevelUp ? { borderColor: `${newRank.color}50` } : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          onClick={() => setActiveChange(null)}
        >
          {isLevelUp ? "CONTINUER L'AVENTURE" : "RETOURNER AU SANCTUARY"}
        </NeonButton>
      </div>
    </div>
  )
}