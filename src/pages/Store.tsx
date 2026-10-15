import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useRewards, Reward } from '@/hooks/useRewards'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { Star, Loader2, ShoppingBag, Plus, X, Trash2, Edit2, ImageIcon, Sparkles, Diamond, Crown, Zap, Flame, Filter, ShieldCheck, Gift, Edit } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'
import { getRank } from '@/lib/ranks'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { useConfirm } from '@/hooks/useConfirm'
import { MysteryLootboxModal } from '@/components/gamification/MysteryLootboxModal'
import { ManiIcon } from '@/components/ui/ManiIcon'

export type RewardRarity = 'commun' | 'rare' | 'epique' | 'legendaire';
export type ItemRarity = 'all' | RewardRarity;

const RARITY_TYPES: RewardRarity[] = ['commun', 'rare', 'epique', 'legendaire'];

export function getItemRarity(item: any) {
  const cost = item.mani_cost || 0;
  const isLegendary = cost >= 80 || item.action_type === 'global_discount_10' || item.action_type === 'challenge_two_ranks' || item.category === 'Légendaire';
  const isEpic = cost >= 35 || item.action_type === 'pack_4h' || item.action_type === 'weekend_priority' || item.category === 'Équipement';
  const isRare = cost >= 15 || item.category === 'Temps de jeu' || item.action_type?.includes('discount');

  const fromColumn = RARITY_TYPES.includes(item?.rarity) ? (item.rarity as RewardRarity) : null;
  const type: RewardRarity = fromColumn
    ?? (isLegendary ? 'legendaire' : isEpic ? 'epique' : isRare ? 'rare' : 'commun');

  if (type === 'legendaire') {
    return {
      type: type,
      label: 'LÉGENDAIRE',
      badge: '★ LÉGENDAIRE',
      color: '#f59e0b',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
      border: 'border-amber-500/80',
      bg: 'bg-amber-500/10',
      accent: 'text-amber-400',
      foil: 'holo-foil-gold',
      btnVariant: 'orange' as const
    };
  }
  if (type === 'epique') {
    return {
      type: 'epique' as RewardRarity,
      label: 'ÉPIQUE',
      badge: '◆◆◆ ÉPIQUE',
      color: '#a855f7',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.45)]',
      border: 'border-purple-500/70',
      bg: 'bg-purple-500/10',
      accent: 'text-purple-400',
      foil: 'holo-foil',
      btnVariant: 'violet' as const
    };
  }
  if (type === 'rare') {
    return {
      type: 'rare' as RewardRarity,
      label: 'RARE',
      badge: '◆◆ RARE',
      color: '#06b6d4',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.4)]',
      border: 'border-cyan-500/60',
      bg: 'bg-cyan-500/10',
      accent: 'text-cyan-400',
      foil: 'holo-foil',
      btnVariant: 'cyan' as const
    };
  }
  return {
    type: 'commun' as RewardRarity,
    label: 'COMMUN',
    badge: '◆ COMMUN',
    color: '#94a3b8',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.25)]',
    border: 'border-slate-500/50',
    bg: 'bg-slate-500/10',
    accent: 'text-slate-300',
    foil: '',
    btnVariant: 'ghost' as const
  };
}

export function Store() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: loyalty } = useLoyalty()
  const { data: metadata } = useUserMetadata()
  const { rewards, addReward, updateReward, deleteReward, claimReward } = useRewards()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const { data: claims } = useQuery({
    queryKey: ['reward_claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_claims')
        .select('*')
      if (error) throw error
      return data
    }
  })

  const isAdmin = (metadata as any)?.is_admin
  const points = loyalty?.points || 0
  const currentRank = getRank(points)
  const [purchasedItem, setPurchasedItem] = useState<any | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity>('all')
  const [isLootboxOpen, setIsLootboxOpen] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '', description: '', mani_cost: 0, category: 'Consommable', image_url: '',
    action_type: 'none', action_value: '', rarity: 'commun' as RewardRarity
  })

  const handleEdit = (item: Reward) => {
    setFormData({
      name: item.name,
      description: item.description,
      mani_cost: item.mani_cost,
      category: item.category,
      image_url: item.image_url,
      action_type: item.action_type || 'none',
      action_value: item.action_value || '',
      rarity: getItemRarity(item).type
    })
    setEditingId(item.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateReward.mutateAsync({ ...formData, id: editingId } as unknown as Reward)
      } else {
        await addReward.mutateAsync(formData)
      }
      setShowForm(false); setEditingId(null)
      setFormData({ name: '', description: '', mani_cost: 0, category: 'Consommable', image_url: '', action_type: 'none', action_value: '', rarity: 'commun' })
    } catch (err) {
      toast.error("Erreur de sauvegarde")
    }
  }

  const handleBuy = (reward: any) => {
    if (!user) return

    const hasGlobalDiscount = (metadata as any)?.discount_perk_until && new Date((metadata as any).discount_perk_until) > new Date();
    const realCost = hasGlobalDiscount ? Math.round(reward.mani_cost * 0.9) : reward.mani_cost;

    confirm({
      title: 'Confirmer l\'échange',
      subject: reward.name,
      message: `${realCost} jetons seront retirés de votre solde.${hasGlobalDiscount ? ' Réduction de 10% appliquée.' : ''}`,
      confirmLabel: 'ÉCHANGER',
      onConfirm: () => {
        claimReward.mutate({
          rewardId: reward.id,
          userId: user.id,
          displayName: metadata?.display_name || user.email || 'Gamer'
        }, {
          onSuccess: () => {
            setPurchasedItem(reward);
          }
        })
      }
    })
  }

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "La Boutique d'Evazion",
      desc: "Dépensez vos jetons accumulés en salle. Échangez-les contre des consommables (boissons, gâteaux) ou des privilèges d'arène virtuels.",
      icon: <ShoppingBag size={28} />
    },
    {
      title: "Récupération à l'Accueil",
      desc: "Une fois votre échange en ligne validé, présentez-vous simplement à l'accueil du Sanctuaire pour récupérer vos consommables auprès du gérant.",
      icon: <Gift size={28} />
    }
  ]

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Gestionnaire d'Articles",
      desc: "Utilisez le bouton 'Ajouter un article' pour publier de nouvelles boissons ou gâteaux. Vous pouvez modifier ou supprimer les articles d'un clic.",
      icon: <Edit size={28} />
    },
    {
      title: "Registre des Ventes",
      desc: "Consultez en haut le nombre total d'articles vendus dans la salle. Dès qu'un joueur récupère son achat physique, cliquez sur la coche de livraison.",
      icon: <ShoppingBag size={28} />
    }
  ]

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-center relative overflow-hidden animate-fade-in font-display">
      <OnboardingModal pageKey="store" steps={onboardingSteps} />
      {isAdmin && <AdminOnboardingModal pageKey="store" steps={adminOnboardingSteps} />}
      {confirmDialog}
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="store gear backdrop"
        />
      </div>
      <div className="container mx-auto px-4 max-w-6xl relative z-20">
        
        <header className="mb-16">
          <h1 className="text-3xl md:text-7xl font-display font-black uppercase tracking-tighter text-white">
            EVAZION <span className="text-primary italic">STORE</span>
          </h1>
          
          {user ? (
            isAdmin ? (
              <div className="mt-6 md:mt-8 inline-flex items-center gap-4 glass px-5 md:px-10 py-3 md:py-5 rounded-2xl md:rounded-full border-white/5 shadow-2xl animate-fade-in">
                <div className="flex items-baseline gap-2 md:gap-4 font-display font-black uppercase tracking-widest text-white">
                  <span className="text-xl md:text-3xl opacity-80">VENTES =</span>
                  <span className="text-3xl md:text-5xl flex items-center gap-2 text-green-500">
                    {claims?.filter((c: any) => c.status === 'livré').length || 0} ARTICLES
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 md:mt-6 inline-flex items-center gap-2 md:gap-3 glass px-4 md:px-6 py-2 md:py-3 rounded-2xl md:rounded-full border-white/5 shadow-2xl animate-fade-in">
                <div className="flex items-baseline gap-1.5 md:gap-2 font-display font-black uppercase tracking-widest text-white">
                  <span className="text-sm md:text-lg opacity-80">SOLDE =</span>
                  <span className="text-xl md:text-2xl flex items-center gap-1.5" style={{ color: currentRank.color }}>
                    {points} <ManiIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="mt-6 md:mt-8 inline-flex items-center gap-4 glass px-5 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-full border-white/5 shadow-2xl animate-fade-in text-white/60 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
              <span>Connectez-vous pour voir vos <ManiIcon className="w-3 h-3" /> et échanger des récompenses !</span>
            </div>
          )}

          {isAdmin && (
            <button 
              onClick={() => { setShowForm(!showForm); setEditingId(null); }}
              className="mt-12 flex items-center gap-2 mx-auto bg-white text-black px-8 py-4 rounded-full font-black uppercase text-xs hover:bg-primary transition-all shadow-xl cursor-pointer"
            >
              {showForm ? <X size={18}/> : <Plus size={18}/>}
              {showForm ? "Fermer l'éditeur" : "Ajouter un article"}
            </button>
          )}
        </header>

        {isAdmin && showForm && (
          <div className="mb-20 glass p-10 rounded-[3rem] border-primary/20 text-left max-w-4xl mx-auto animate-fade-in shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-8 text-primary flex items-center gap-3">
              <ShoppingBag size={24}/> {editingId ? 'Modifier l\'article' : 'Nouvel Article Store'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Nom de l'article</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Catégorie</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Consommable">Consommable</option>
                  <option value="Temps de jeu">Temps de jeu</option>
                  <option value="Équipement">Équipement</option>
                  <option value="Légendaire">Légendaire</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1 text-primary flex items-center gap-1.5">Coût en <ManiIcon className="w-3 h-3" /></label>
                <input required type="number" className="w-full bg-white/5 border border-primary/20 rounded-2xl p-4 text-white focus:border-primary transition-all" value={formData.mani_cost} onChange={e => setFormData({...formData, mani_cost: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1 text-primary">Rareté</label>
                <select
                  className="w-full bg-white/5 border border-primary/20 rounded-2xl p-4 text-white focus:border-primary focus:outline-none"
                  value={formData.rarity}
                  onChange={e => setFormData({...formData, rarity: e.target.value as RewardRarity})}
                >
                  <option value="commun" className="bg-background">◆ Commun</option>
                  <option value="rare" className="bg-background">◆◆ Rare</option>
                  <option value="epique" className="bg-background">◆◆◆ Épique</option>
                  <option value="legendaire" className="bg-background">★ Légendaire</option>
                </select>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">URL de l'image</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>

              <textarea placeholder="Description de la récompense..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white col-span-1 md:col-span-2 h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <NeonButton className="col-span-1 md:col-span-2 py-5 font-black uppercase tracking-widest">
                {editingId ? 'Mettre à jour l\'article' : 'Ajouter au Store'}
              </NeonButton>
            </form>
          </div>
        )}

        {/* COFFRE MYSTÈRE GAMIFICATION CARD */}
        <div className="mb-12 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-900/30 via-black to-cyan-900/30 border border-primary/40 shadow-neon-violet flex flex-col md:flex-row items-center justify-between gap-6 text-left relative overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-black/60 border border-amber-400/50 flex items-center justify-center text-4xl shadow-neon-orange shrink-0 animate-pulse">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-mono font-black uppercase tracking-wider">
                  NOUVEAU
                </span>
                <span className="text-[10px] font-mono uppercase text-white/50">
                  Lootbox du Sanctuaire
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase text-white font-display">
                Coffre de Butin Mystère
              </h3>
              <p className="text-xs text-white/70 font-sans max-w-lg mt-0.5">
                Tentez votre chance pour remporter des heures PS5 Pro gratuites, des canettes au bar ou des réductions tournoi !
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {isAdmin ? (
              <span className="px-5 py-3 rounded-2xl bg-amber-400/10 border border-amber-400/40 text-amber-300 font-mono font-black text-xs uppercase tracking-wider text-center">
                Mode Arbitre (Lots gérés via Centre Global)
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsLootboxOpen(true)}
                className="w-auto px-4 py-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-primary text-black font-mono font-black text-[10px] sm:text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-neon-violet active:scale-95 flex items-center justify-center gap-1.5"
              >
                Ouvrir un Coffre (5 <ManiIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />)
              </button>
            )}
          </div>
        </div>

        <div className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-secondary animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-white/60">
              FILTRE DE RARETÉ DE L'INVENTAIRE
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
            {[
              { id: 'all', label: 'TOUS LES OBJETS', color: 'border-white/20 text-white', activeBg: 'bg-white/10' },
              { id: 'legendaire', label: '★ LÉGENDAIRE', color: 'border-amber-500/50 text-amber-400', activeBg: 'bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.35)]' },
              { id: 'epique', label: '◆◆◆ ÉPIQUE', color: 'border-purple-500/50 text-purple-400', activeBg: 'bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.35)]' },
              { id: 'rare', label: '◆◆ RARE', color: 'border-cyan-500/50 text-cyan-400', activeBg: 'bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.35)]' },
              { id: 'commun', label: '◆ COMMUN', color: 'border-slate-400/50 text-slate-300', activeBg: 'bg-slate-500/20 shadow-[0_0_15px_rgba(148,163,184,0.2)]' }
            ].map(tab => {
              const isSelected = selectedRarity === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRarity(tab.id as ItemRarity)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9.5px] font-mono font-black uppercase tracking-wider border transition-all duration-300 cursor-pointer",
                    tab.color,
                    isSelected ? tab.activeBg + " border-current scale-105" : "bg-white/[0.03] hover:bg-white/[0.08] opacity-75 hover:opacity-100"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {rewards.isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="mx-auto animate-spin text-primary" size={40} />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Synchronisation de l'inventaire...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 max-w-5xl mx-auto text-left">
            {rewards.data
              ?.filter((item: any) => {
                if (selectedRarity === 'all') return true;
                const r = getItemRarity(item);
                return r.type === selectedRarity;
              })
              .map((item: any, idx: number) => {
                const rarity = getItemRarity(item);
                const hasGlobalDiscount = (metadata as any)?.discount_perk_until && new Date((metadata as any).discount_perk_until) > new Date();
                const realCost = hasGlobalDiscount ? Math.round(item.mani_cost * 0.9) : item.mani_cost;
                const slotCode = String(idx + 1).padStart(2, '0');

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Voir le detail de ${item.name}`}
                    onClick={() => setSelectedItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedItem(item);
                      }
                    }}
                    className={cn(
                      "relative rounded-[1.5rem] md:rounded-[2rem] border-2 p-2.5 md:p-3.5 flex flex-col items-center text-center transition-all duration-500 overflow-hidden group cursor-pointer",
                      "bg-gradient-to-b from-white/[0.06] via-black/85 to-black/95",
                      rarity.border,
                      rarity.glow,
                      "hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99]"
                    )}
                  >
                    {rarity.foil && (
                      <div className={cn("absolute inset-0 pointer-events-none z-10 opacity-30 group-hover:opacity-60 transition-opacity duration-700", rarity.foil)} />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-[200%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none z-20 skew-x-12" />

                    <span className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none z-20" style={{ borderColor: rarity.color }} />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none z-20" style={{ borderColor: rarity.color }} />
                    <span className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none z-20" style={{ borderColor: rarity.color }} />
                    <span className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none z-20" style={{ borderColor: rarity.color }} />

                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex gap-1.5 z-30">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/30 shadow-lg cursor-pointer"><Edit2 size={12}/></button>
                        <button onClick={(e) => { e.stopPropagation(); confirm({ title: 'Supprimer cet article', subject: item.name, message: 'Cet article sera retiré de la boutique.', isPending: deleteReward.isPending, onConfirm: () => deleteReward.mutate(item.id) }); }} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/30 shadow-lg cursor-pointer"><Trash2 size={12}/></button>
                      </div>
                    )}

                    <div className="relative z-20 flex items-center justify-between mb-1.5 md:mb-2 border-b border-white/10 pb-1 md:pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-wider border shadow-md flex items-center gap-1"
                          style={{
                            backgroundColor: `${rarity.color}20`,
                            color: rarity.color,
                            borderColor: `${rarity.color}60`
                          }}
                        >
                          {rarity.type === 'legendaire' && <Crown size={10} />}
                          {rarity.type === 'epique' && <Sparkles size={10} />}
                          {rarity.type === 'rare' && <Zap size={10} />}
                          {rarity.type === 'commun' && <Diamond size={9} />}
                          {rarity.badge}
                        </span>
                      </div>

                      <span className="hidden sm:inline text-[8px] font-mono font-bold uppercase tracking-widest text-white/40">
                        SLOT #{slotCode}
                      </span>
                    </div>

                    <div className="relative h-24 w-24 md:h-32 md:w-32 mx-auto rounded-xl overflow-hidden mb-2 md:mb-3 bg-black/60 border border-white/10 p-1.5 group-hover:border-white/20 transition-all z-20">
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity blur-xl pointer-events-none"
                        style={{ backgroundColor: rarity.color }}
                      />

                      <div className="w-full h-full rounded-lg overflow-hidden relative">
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400'} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                          alt={item.name} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      </div>

                      <span className="absolute bottom-2 left-2 bg-black/80 text-white/90 text-[7px] font-mono font-black uppercase px-1.5 py-0.5 rounded border border-white/20 backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>

                    <h3 
                      className="relative z-20 text-[11px] md:text-sm font-display font-black text-white uppercase tracking-tight leading-tight line-clamp-2 text-center transition-colors group-hover:text-glow-violet"
                      style={{ textShadow: `0 0 12px ${rarity.color}40` }}
                    >
                      {item.name}
                    </h3>

                    <div className="relative z-20 mt-1.5 md:mt-2 text-[11px] md:text-sm font-display font-black text-amber-400 flex items-center gap-1">
                      {realCost} <ManiIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>

                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1 opacity-80 transition-all duration-500 group-hover:h-1.5"
                      style={{ 
                        backgroundColor: rarity.color, 
                        boxShadow: `0 0 15px 2px ${rarity.color}` 
                      }} 
                    />
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {selectedItem && (() => {
        const modalRarity = getItemRarity(selectedItem);
        const discountActive = !!(metadata as any)?.discount_perk_until && new Date((metadata as any).discount_perk_until) > new Date();
        const modalCost = discountActive ? Math.round(selectedItem.mani_cost * 0.9) : selectedItem.mani_cost;

        return (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className={cn(
                "relative w-full max-w-md rounded-[2rem] border-2 p-5 md:p-6 text-left animate-fade-in",
                "bg-gradient-to-b from-[#0d1119] via-black to-black",
                modalRarity.border,
                modalRarity.glow
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {modalRarity.foil && (
                <div className={cn("absolute inset-0 pointer-events-none opacity-20 rounded-[2rem]", modalRarity.foil)} />
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
              >
                <X size={16} />
              </button>

              <div className="relative z-20">
                <div className="flex items-center gap-2 mb-3 pr-10">
                  <span
                    className="px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-wider border flex items-center gap-1"
                    style={{
                      backgroundColor: `${modalRarity.color}20`,
                      color: modalRarity.color,
                      borderColor: `${modalRarity.color}60`
                    }}
                  >
                    {modalRarity.type === 'legendaire' && <Crown size={10} />}
                    {modalRarity.type === 'epique' && <Sparkles size={10} />}
                    {modalRarity.type === 'rare' && <Zap size={10} />}
                    {modalRarity.type === 'commun' && <Diamond size={9} />}
                    {modalRarity.badge}
                  </span>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-white/40 truncate">
                    {selectedItem.category}
                  </span>
                </div>

                <div className="relative aspect-square w-full max-w-[240px] mx-auto rounded-2xl overflow-hidden mb-4 bg-black/60 border border-white/10 p-2">
                  <div
                    className="absolute inset-0 rounded-2xl opacity-25 blur-xl pointer-events-none"
                    style={{ backgroundColor: modalRarity.color }}
                  />
                  <img
                    src={selectedItem.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400'}
                    className="relative w-full h-full object-contain rounded-xl"
                    alt={selectedItem.name}
                  />
                </div>

                <h3
                  className="text-lg md:text-xl font-display font-black uppercase text-white tracking-tight leading-tight mb-2"
                  style={{ textShadow: `0 0 14px ${modalRarity.color}40` }}
                >
                  {selectedItem.name}
                </h3>

                <p className="text-[11px] md:text-xs text-white/60 font-sans leading-relaxed mb-5">
                  {selectedItem.description || 'Aucune description detaillee pour cet article.'}
                </p>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex flex-col items-start">
                    <span className="text-[7px] md:text-[8px] font-mono uppercase font-black tracking-widest text-white/40 leading-none">
                      VALEUR D'ECHANGE
                    </span>
                    <span className="text-base md:text-lg font-display font-black flex items-center gap-1.5 mt-1 text-white">
                      {modalCost} <ManiIcon className="w-5 h-5" />
                    </span>
                  </div>

                  <NeonButton
                    variant={user ? (points >= modalCost ? (modalRarity.type === 'legendaire' ? 'orange' : (modalRarity.type === 'rare' ? 'cyan' : 'violet')) : 'ghost') : 'violet'}
                    sweep
                    cornerAccents
                    disabled={user ? (!loyalty || points < modalCost || claimReward.isPending || isAdmin) : false}
                    onClick={() => {
                      if (!user) {
                        navigate({ to: '/login' });
                      } else {
                        setSelectedItem(null);
                        handleBuy(selectedItem);
                      }
                    }}
                    className="px-4 py-2.5 text-[9px] font-mono font-black tracking-widest uppercase shrink-0 shadow-lg"
                  >
                    {isAdmin ? "MODE ADMIN" : (!user ? "ECHANGER" : (points >= modalCost ? "ACQUERIR" : "SOLDE BAS"))}
                  </NeonButton>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {purchasedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-10 rounded-[2.5rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative" style={{ borderColor: 'var(--secondary)' }}>
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-secondary/30">
              <ShoppingBag className="text-secondary animate-pulse" size={40} />
            </div>
            <h3 className="text-2xl font-display font-black uppercase text-white mb-4">
              Commande Enregistrée !
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Félicitations ! Votre commande pour l'article <span className="text-secondary font-bold">{purchasedItem.name}</span> a été prise en compte. Présentez-vous à l'accueil physique du Sanctuary pour la récupérer.
            </p>
            <NeonButton 
              variant="cyan"
              className="w-full py-4 text-xs font-black shadow-neon-cyan"
              onClick={() => setPurchasedItem(null)}
            >
              Fermer
            </NeonButton>
          </div>
        </div>
      )}

      <MysteryLootboxModal
        isOpen={isLootboxOpen}
        onClose={() => setIsLootboxOpen(false)}
        userMani={points}
      />
    </div>
  )
}
