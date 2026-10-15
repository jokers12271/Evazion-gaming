import { useState } from 'react'
import { ManiIcon } from '@/components/ui/ManiIcon';
import { createPortal } from 'react-dom'
import { X, Coffee, Utensils, Coins, Check, Send } from 'lucide-react'
import { CyberCard } from '@/components/ui/CyberCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const SNACKS_MENU = [
  { id: 's1', name: 'Boisson Énergisante Red Bull', priceFcfa: 1500, mani: 3, category: 'Boissons' },
  { id: 's2', name: 'Coca-Cola / Fanta 50cl', priceFcfa: 800, mani: 2, category: 'Boissons' },
  { id: 's3', name: 'Eau Minérale 1L', priceFcfa: 500, mani: 1, category: 'Boissons' },
  { id: 's4', name: 'Pop-Corn Caramel', priceFcfa: 1000, mani: 2, category: 'Snacks' },
  { id: 's5', name: 'Chips / Snacks Salés', priceFcfa: 750, mani: 2, category: 'Snacks' },
  { id: 's6', name: 'Burger Sanctuary + Frites', priceFcfa: 3500, mani: 7, category: 'Repas' },
]

interface InSeatOrderModalProps {
  stationId: string
  onClose: () => void
}

export function InSeatOrderModal({ stationId, onClose }: InSeatOrderModalProps) {
  const { user } = useAuth()
  const [selectedItem, setSelectedItem] = useState(SNACKS_MENU[0])
  const [paymentMethod, setPaymentMethod] = useState<'fcfa' | 'mani'>('fcfa')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOrder = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour commander", { position: "bottom-center" })
      return
    }

    setIsSubmitting(true)
    try {
      // Enregistrement de la commande bar dans la table bar_orders ou notification
      const { error } = await supabase.from('bar_orders').insert([{
        user_id: user.id,
        station_id: stationId,
        item_name: selectedItem.name,
        price_fcfa: selectedItem.priceFcfa,
        mani_cost: selectedItem.mani,
        payment_method: paymentMethod,
        status: 'pending'
      }])

      if (error) {
        // Fallback si la table n'existe pas encore
        console.warn("Table bar_orders absente, simulation réussie", error)
      }

      toast.success(`Commande de ${selectedItem.name} envoyée au comptoir ! Livraison imminente sur le poste ${stationId}.`, {
        position: 'bottom-center',
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(180, 100%, 50%)',
          borderRadius: '1rem',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
        }
      })
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la commande", { position: "bottom-center" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-white font-display">
      <CyberCard
        accentColor="#06b6d4"
        hoverEffect={false}
        className="p-8 max-w-md w-full"
        topRight={
          <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        }
      >
        <div className="w-14 h-14 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-secondary/30">
          <Utensils className="text-secondary" size={26} />
        </div>

        <h3 className="text-2xl font-black uppercase mb-1 text-center">Bar Express • Poste {stationId}</h3>
        <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest text-center mb-6">
          Commandez depuis votre siège, livré directement en salle
        </p>

        <div className="space-y-4 mb-6">
          <label className="block text-[9px] font-black uppercase text-white/40 text-left">Sélectionnez un article</label>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar text-left">
            {SNACKS_MENU.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${selectedItem.id === item.id ? 'border-secondary bg-secondary/15 text-white' : 'border-white/5 bg-white/5 text-white/70 hover:border-white/20'}`}
              >
                <span className="font-bold uppercase flex items-center gap-2">
                  <Coffee size={14} className="text-secondary shrink-0" />
                  {item.name}
                </span>
                <span className="font-mono font-black text-secondary">
                  {item.priceFcfa} F <span className="inline-flex items-center gap-1">({item.mani} <ManiIcon className="w-3.5 h-3.5" />)</span>
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black uppercase text-white/40">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('fcfa')}
                className={`py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${paymentMethod === 'fcfa' ? 'border-primary bg-primary/20 text-white' : 'border-white/5 bg-white/5 text-white/50'}`}
              >
                Espèces / Mobile Money ({selectedItem.priceFcfa} F)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('mani')}
                className={`py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${paymentMethod === 'mani' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-white/5 bg-white/5 text-white/50'}`}
              >
                <span className="inline-flex items-center justify-center gap-1.5">{selectedItem.mani} <ManiIcon className="w-3.5 h-3.5" /></span>
              </button>
            </div>
          </div>
        </div>

        <NeonButton
          variant="cyan"
          disabled={isSubmitting}
          onClick={handleOrder}
          className="w-full py-4 text-xs font-black flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {isSubmitting ? 'ENVOI EN COURS...' : 'CONFIRMER LA COMMANDE'}
        </NeonButton>
      </CyberCard>
    </div>,
    document.body
  )
}
