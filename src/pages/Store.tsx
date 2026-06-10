import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRewards, Reward } from '@/hooks/useRewards'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { Star, Loader2, ShoppingBag, Plus, X, Trash2, Edit2, ImageIcon } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'
import { getRank } from '@/lib/ranks'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { Gift } from 'lucide-react'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { Edit } from 'lucide-react'

export function Store() {
  const { user } = useAuth()
  const { data: loyalty } = useLoyalty()
  const { data: metadata } = useUserMetadata()
  const { rewards, addReward, updateReward, deleteReward, claimReward } = useRewards()
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
  const [purchasedItem, setPurchasedItem] = useState<any | null>(null) // AJOUTÉ

  // États pour la gestion Admin
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '', description: '', mani_cost: 0, category: 'Consommable', image_url: '',
    action_type: 'none', action_value: '' // AJOUTÉS
  })

  const handleEdit = (item: Reward) => {
    setFormData({
      name: item.name,
      description: item.description,
      mani_cost: item.mani_cost,
      category: item.category,
      image_url: item.image_url,
      action_type: item.action_type || 'none', // AJOUTÉ
      action_value: item.action_value || '' // AJOUTÉ
    })
    setEditingId(item.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateReward.mutateAsync({ ...formData, id: editingId } as Reward)
      } else {
        await addReward.mutateAsync(formData)
      }
      setShowForm(false); setEditingId(null)
      setFormData({ name: '', description: '', mani_cost: 0, category: 'Consommable', image_url: '', action_type: 'none', action_value: '' })
    } catch (err) {
      toast.error("Erreur de sauvegarde")
    }
  }

  const handleBuy = (reward: any) => {
    if (!user) return
    
    // Vérifier si la réduction de 10% globale est active sur son compte
    const hasGlobalDiscount = (metadata as any)?.discount_perk_until && new Date((metadata as any).discount_perk_until) > new Date();
    const realCost = hasGlobalDiscount ? Math.round(reward.mani_cost * 0.9) : reward.mani_cost;

    if (confirm(`Échanger ${realCost} MANI contre "${reward.name}" ?`)) {
      claimReward.mutate({
        rewardId: reward.id,
        userId: user.id,
        displayName: metadata?.display_name || user.email || 'Gamer'
      }, {
        onSuccess: () => {
          setPurchasedItem(reward); // Ouvre la modale de réussite
        }
      })
    }
  }

  const ManiIcon = ({ size = "w-5 h-5" }) => (
    <div className={cn("rounded-full overflow-hidden border border-primary/40 bg-background shadow-neon-violet", size)}>
      <img src="/mani.jpg" alt="M" className="w-full h-full object-cover scale-110" />
    </div>
  )

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "La Boutique d'Evazion",
      desc: "Dépensez vos jetons MANI accumulés en salle. Échangez-les contre des consommables (boissons, gâteaux) ou des privilèges d'arène virtuels.",
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
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-center relative overflow-hidden animate-fade-in">
      {/* GUIDE DU JOUEUR */}
      <OnboardingModal pageKey="store" steps={onboardingSteps} />

      {/* GUIDE DU GÉRANT (AJOUTÉ) */}
      {isAdmin && <AdminOnboardingModal pageKey="store" steps={adminOnboardingSteps} />}
      
      {/* Fond d'écran immersif de la page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="store gear backdrop"
        />
      </div>
      <div className="container mx-auto px-4 max-w-6xl relative z-20">
        
        <header className="mb-16">
          <h1 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter text-white">
            EVAZION <span className="text-primary italic">STORE</span>
          </h1>
          
          {/* LE SOLDE / LOG DE VENTES MINIATURISÉ ET RÉACTIF SUR MOBILE (CORRIGÉ) */}
          {user ? (
            isAdmin ? (
              /* A. VUE ADMIN : VENTES TOTALES */
              <div className="mt-6 md:mt-8 inline-flex items-center gap-4 glass px-5 md:px-10 py-3 md:py-5 rounded-2xl md:rounded-full border-white/5 shadow-2xl animate-fade-in">
                <div className="flex items-baseline gap-2 md:gap-4 font-display font-black uppercase tracking-widest text-white">
                  <span className="text-xl md:text-3xl opacity-80">VENDU =</span>
                  <span className="text-3xl md:text-5xl flex items-center gap-2 text-green-500">
                    {claims?.filter((c: any) => c.status === 'livré').length || 0}
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-primary shadow-neon-violet shrink-0 relative">
                       <img src="/mani.jpg" alt="M" className="w-full h-full object-cover scale-110" />
                       <div className="absolute inset-0 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)] pointer-events-none" />
                    </div>
                  </span>
                </div>
              </div>
            ) : (
              /* B. VUE JOUEUR : SOLDE DE MANI */
              <div className="mt-6 md:mt-8 inline-flex items-center gap-4 glass px-5 md:px-10 py-3 md:py-5 rounded-2xl md:rounded-full border-white/5 shadow-2xl animate-fade-in">
                <div className="flex items-baseline gap-2 md:gap-4 font-display font-black uppercase tracking-widest text-white">
                  <span className="text-xl md:text-3xl opacity-80">SOLDE =</span>
                  <span className="text-3xl md:text-5xl flex items-center gap-2" style={{ color: currentRank.color }}>
                    {points}
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-primary shadow-neon-violet shrink-0 relative">
                       <img src="/mani.jpg" alt="M" className="w-full h-full object-cover scale-110" />
                       <div className="absolute inset-0 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)] pointer-events-none" />
                    </div>
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="mt-6 md:mt-8 inline-flex items-center gap-4 glass px-5 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-full border-white/5 shadow-2xl animate-fade-in text-white/60 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
              <span>Connectez-vous pour voir vos MANI et échanger des récompenses !</span>
            </div>
          )}

          {isAdmin && (
            <button 
              onClick={() => { setShowForm(!showForm); setEditingId(null); }}
              className="mt-12 flex items-center gap-2 mx-auto bg-white text-black px-8 py-4 rounded-full font-black uppercase text-xs hover:bg-primary transition-all shadow-xl"
            >
              {showForm ? <X size={18}/> : <Plus size={18}/>}
              {showForm ? "Fermer l'éditeur" : "Ajouter un article"}
            </button>
          )}
        </header>

        {/* FORMULAIRE ADMIN */}
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
                  <option value="Boisson">Boisson</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1 text-primary">Coût en MANI</label>
                <input required type="number" className="w-full bg-white/5 border border-primary/20 rounded-2xl p-4 text-white focus:border-primary transition-all" value={formData.mani_cost} onChange={e => setFormData({...formData, mani_cost: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">URL de l'image</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>

              {/* AJOUTÉ : Sélection de l'effet virtuel de l'article de Boutique */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[10px] uppercase font-black text-muted-foreground ml-1 text-primary">Effet Spécial (Droit / Action d'activation)</label>
                <select 
                  className="w-full bg-white/5 border border-primary/20 rounded-2xl p-4 text-white focus:border-primary focus:outline-none"
                  value={formData.action_type} 
                  onChange={e => setFormData({...formData, action_type: e.target.value, action_value: ''})}
                >
                  <option value="none" className="bg-background">Aucun effet (Objet physique standard)</option>
                  <option value="challenge_two_ranks" className="bg-background">Droit d'affronter un joueur de 2 rangs supérieurs (PVP)</option>
                  <option value="global_discount_10" className="bg-background">10% de réduction sur tout pendant 1 semaine</option>
                  <option value="pack_4h" className="bg-background">Créditer un Pack de temps de 4 heures (240 min)</option>
                  <option value="buy_mani" className="bg-background">Acheter / Recharger des jetons MANI</option>
                  <option value="buy_minutes" className="bg-background">Acheter / Recharger du crédit temps minutes</option>
                  <option value="weekend_priority" className="bg-background">Droit de priorité de réservation de week-end</option>
                  <option value="community_discount" className="bg-background">Réduction sur frais de communauté mensuels</option>
                  <option value="tournament_discount" className="bg-background">Réduction sur inscription de tournoi</option>
                </select>
              </div>

              {/* AJOUTÉ : Saisie de la valeur numérique de l'effet (ex: le pourcentage de réduction) */}
              {formData.action_type !== 'none' && formData.action_type !== 'challenge_two_ranks' && formData.action_type !== 'global_discount_10' && formData.action_type !== 'pack_4h' && formData.action_type !== 'weekend_priority' && (
                <div className="space-y-2 col-span-1 md:col-span-2 animate-fade-in">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Valeur numérique de l'effet (ex: Saisir '50' pour 50%, ou '60' pour 60 Min/MANI)</label>
                  <input 
                    required
                    type="number"
                    placeholder="Ex: 50"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary" 
                    value={formData.action_value || ''} 
                    onChange={e => setFormData({...formData, action_value: e.target.value})} 
                  />
                </div>
              )}

              <textarea placeholder="Description de la récompense..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white col-span-1 md:col-span-2 h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <NeonButton className="col-span-1 md:col-span-2 py-5 font-black uppercase tracking-widest">
                {editingId ? 'Mettre à jour l\'article' : 'Ajouter au Store'}
              </NeonButton>
            </form>
          </div>
        )}

        {/* LISTE DES ARTICLES */}
        {rewards.isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="mx-auto animate-spin text-primary" size={40} />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Synchronisation...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {rewards.data?.map((item: any) => (
              /* CARTE D'ARTICLE : p-4 rounded-[1.75rem] sur mobile pour gagner de la place (CORRIGÉ) */
              <div key={item.id} className="glass border-white/5 p-4 md:p-6 rounded-[1.75rem] md:rounded-[2.5rem] flex flex-col relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
                
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-1.5 z-20">
                    <button onClick={() => handleEdit(item)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20 shadow-lg"><Edit2 size={12}/></button>
                    <button onClick={() => { if(confirm("Supprimer cet article ?")) deleteReward.mutate(item.id) }} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-lg"><Trash2 size={12}/></button>
                  </div>
                )}

                {/* Cadre de l'image aminci sur mobile (mb-4 et coins rounded-2xl) */}
                <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden mb-4 md:mb-6 bg-white/5">
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" alt={item.name} />
                </div>

                {/* Infos textuelles de l'article miniaturisées réactivement */}
                <div className="flex-1 px-1 text-left">
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">{item.category}</span>
                  <h3 className="text-lg md:text-2xl font-display font-black text-white mt-1 uppercase tracking-tighter leading-none">{item.name}</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                </div>

                {/* Bas de carte : mt-6 pt-4 pour réduire l'épaisseur verticale, boutons et prix affinés */}
                <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between px-1 text-white">
                  {(() => {
                    const hasGlobalDiscount = (metadata as any)?.discount_perk_until && new Date((metadata as any).discount_perk_until) > new Date();
                    const realCost = hasGlobalDiscount ? Math.round(item.mani_cost * 0.9) : item.mani_cost;

                    return (
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-black opacity-40 uppercase tracking-widest leading-none">Coût</span>
                        <span className="text-lg md:text-2xl font-display font-black flex items-center gap-1.5 mt-1">
                          {hasGlobalDiscount ? (
                            <span className="flex items-center gap-1.5">
                              <span className="line-through opacity-30 text-xs">{item.mani_cost}</span>
                              <span className="text-secondary text-glow-cyan font-black">{realCost}</span>
                            </span>
                          ) : item.mani_cost} 
                          <ManiIcon size="w-4 h-4 md:w-5 md:h-5" />
                        </span>
                      </div>
                    );
                  })()}
                  
                  <NeonButton 
                    variant={user ? (points >= item.mani_cost ? "violet" : "ghost") : "violet"}
                    disabled={user ? (!loyalty || points < item.mani_cost || claimReward.isPending || isAdmin) : false}
                    onClick={() => {
                      if (!user) {
                        window.location.href = '/login';
                      } else {
                        handleBuy(item);
                      }
                    }}
                    className="px-4 py-2.5 md:px-6 md:py-2 text-[9px] md:text-[10px] font-black tracking-widest uppercase shrink-0"
                  >
                    {isAdmin ? "MODE ADMIN" : (!user ? "ÉCHANGER" : (points >= item.mani_cost ? "ÉCHANGER" : "SOLDE BAS"))}
                  </NeonButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AJOUTÉ : Pop-up de confirmation d'achat de la boutique */}
      {purchasedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-10 rounded-[2.5rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="text-secondary animate-pulse" size={40} />
            </div>
            <h3 className="text-2xl font-display font-black uppercase text-white mb-4">Achat Validé !</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Félicitations ! Vous avez échangé vos MANI contre l'article <span className="text-secondary font-bold">{purchasedItem.name}</span>. Présentez-vous à l'accueil de la salle de jeux pour le récupérer.
            </p>
            <NeonButton 
              variant="cyan"
              className="w-full py-4 text-xs font-black tracking-widest"
              onClick={() => setPurchasedItem(null)}
            >
              Fermer
            </NeonButton>
          </div>
        </div>
      )}

    </div>
  )
}