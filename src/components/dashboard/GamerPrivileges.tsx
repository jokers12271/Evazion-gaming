import { usePrivileges } from '@/hooks/usePrivileges'
import { getRank } from '@/lib/ranks'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Props {
  totalHours: number
  displayName: string
}

export function GamerPrivileges({ totalHours, displayName }: Props) {
  const currentRank = getRank(totalHours)
  const { myClaims, claimPrivilege } = usePrivileges()

  const PRIVILEGES_CONFIG: Record<string, { key: string; label: string; type: 'manual' | 'auto'; desc: string }[]> = {
    "Régulier": [
      { key: "regulier_water", label: "🥤 1 Bouteille d'eau offerte", type: "manual", desc: "À récupérer à l'accueil (Une seule fois à vie)." }
    ],
    "Débutant": [
      { key: "debutant_beverage", label: "🥤 1 Boisson offerte", type: "manual", desc: "Choisissez votre boisson préférée à l'accueil (Une seule fois à vie)." }
    ],
    "Novice": [
      { key: "novice_weekly_bonus", label: "⚡ +15 min offertes sur la première session de la semaine", type: "auto", desc: "Créditées d'office lors de votre 1ère session de la semaine." }
    ],
    "Amateur": [
      { key: "amateur_priority", label: "🗓️ Priorité de réservation les week-ends", type: "manual", desc: "Droit d'accès prioritaire en cas de forte affluence le samedi et dimanche." },
      { key: "novice_weekly_bonus", label: "⚡ +15 min offertes sur la première session de la semaine", type: "auto", desc: "Bénéficiez du bonus hebdomadaire de temps (Hérité de Novice)." }
    ],
    "Semi-Pro": [
      { key: "amateur_priority", label: "🗓️ Priorité de réservation les week-ends", type: "manual", desc: "Droit d'accès prioritaire les week-ends (Hérité de Amateur)." },
      { key: "semipro_weekly_bonus", label: "⚡ +30 min offertes sur la première session de la semaine", type: "auto", desc: "Créditées d'office lors de votre 1ère session (Remplace et améliore le +15 min)." }
    ],
    "Pro": [
      { key: "pro_discount", label: "🎟️ Réduction de 25% aux tournois & événements", type: "auto", desc: "Tarifs réduits automatiquement appliqués sur le Store." },
      { key: "pro_permanent_bonus", label: "⚡ +15 min offertes sur TOUTES vos sessions", type: "auto", desc: "Toutes vos sessions sont prolongées d'office de 15 min." }
    ],
    "Elite": [
      { key: "elite_priority_booking", label: "👑 Accès exclusif aux réservations prioritaires de consoles", type: "manual", desc: "Votre réservation passe prioritaire auprès de l'administrateur de salle." },
      { key: "pro_discount", label: "🎟️ Réduction de 25% aux tournois & événements", type: "auto", desc: "Tarifs réduits automatiquement appliqués (Hérité de Pro)." },
      { key: "pro_permanent_bonus", label: "⚡ +15 min offertes sur TOUTES vos sessions", type: "auto", desc: "Toutes vos sessions prolongées d'office de 15 min (Hérité de Pro)." }
    ],
    "Légende": [
      { key: "legende_priority_all", label: "🗓️ Priorité de réservation tous les jours", type: "manual", desc: "Droit d'accès prioritaire n'importe quel jour de la semaine." },
      { key: "legende_tourney_discount", label: "🎟️ Réduction de 50% aux tournois & événements", type: "auto", desc: "Tarifs réduits automatiquement appliqués (Remplace le 25%)." },
      { key: "legende_community_discount", label: "🏆 25% de réduction sur les frais de communauté", type: "auto", desc: "Mensualités de vos Teams réduites de 25%." },
      { key: "legende_hours_pack", label: "📦 Accès au Pack Spécial Légende : 5h = 5000 FCFA", type: "auto", desc: "Débloque le droit d'achat de ce pack d'heures exclusif." },
      { key: "legende_cake", label: "🍰 Gâteau d'accueil offert une fois", type: "manual", desc: "À récupérer à l'accueil (Une seule fois à vie)." },
      { key: "legende_permanent_bonus", label: "⚡ +30 min offertes sur TOUTES vos sessions", type: "auto", desc: "Toutes vos sessions prolongées d'office de 30 min (Remplace le +15 min)." }
    ],
    "Iconique": [
      { key: "iconique_free_tourneys", label: "🎟️ Inscription GRATUITE aux tournois & événements", type: "auto", desc: "Inscriptions gratuites d'office sur tous les tournois (Remplace le 50%)." },
      { key: "iconique_community_discount", label: "🏆 50% de réduction sur les frais de communauté", type: "auto", desc: "Mensualités de vos Teams réduites de 50% (Remplace le 25%)." },
      { key: "iconique_cake_yogurt", label: "🍰🥤 Gâteau et Yaourt offerts une fois", type: "manual", desc: "À récupérer à l'accueil (Une seule fois à vie)." },
      { key: "iconique_weekly_hour", label: "⚡ 1h de session offerte CHAQUE SEMAINE", type: "auto", desc: "Crédit de temps de 60 minutes offert chaque début de semaine." },
      { key: "iconique_permanent_bonus", label: "⚡ +60 min (1h) offertes sur TOUTES vos sessions", type: "auto", desc: "Toutes vos sessions prolongées de 60 min (Remplace le +30 min)." }
    ],
    "Divin": [
      { key: "iconique_free_tourneys", label: "🎟️ Inscription GRATUITE aux tournois", type: "auto", desc: "Inscriptions gratuites d'office (Hérité de Iconique)." },
      { key: "iconique_community_discount", label: "🏆 50% de réduction sur les frais de communauté", type: "auto", desc: "Mensualités de vos Teams réduites de 50% (Hérité de Iconique)." },
      { key: "iconique_cake_yogurt", label: "🍰🥤 Gâteau et Yaourt offerts", type: "manual", desc: "À récupérer à l'accueil (Hérité de Iconique)." },
      { key: "divin_weekly_hours", label: "⚡ 5h de session offertes CHAQUE SEMAINE", type: "auto", desc: "Crédit de temps de 300 minutes offert chaque début de semaine (Remplace l'heure d'Iconique)." },
      { key: "divin_free_session", label: "👑 1 Session d'honneur Divin offerte", type: "manual", desc: "Une session offerte à vie (Manuel unique)." },
      { key: "iconique_permanent_bonus", label: "⚡ +60 min (1h) offertes sur TOUTES vos sessions", type: "auto", desc: "Toutes vos sessions prolongées de 60 min (Hérité de Iconique)." }
    ]
  };

  const currentPrivileges = PRIVILEGES_CONFIG[currentRank.name] || []

  const handleClaimSubmit = async (key: string, label: string) => {
    const claimMsg = `Le joueur @${displayName} (Rang ${currentRank.name}) souhaite consommer son privilège : "${label}".`
    try {
      await claimPrivilege.mutateAsync({ privilegeKey: key, message: claimMsg })
      toast.success("Demande envoyée à l'administrateur !")
    } catch (e) {
      toast.error("Vous avez déjà demandé ou consommé ce privilège à vie.")
    }
  }

  return (
    <section className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl text-left">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-6 flex items-center gap-2">
        <span>⭐ PRIVILÈGES DU RANG ({currentRank.name})</span>
      </h4>

      {myClaims.isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-secondary" size={20} /></div>
      ) : (
        <div className="space-y-4">
          {currentPrivileges.map((priv) => {
            const claimRecord = myClaims.data?.find((c: any) => c.privilege_key === priv.key)
            const isApproved = claimRecord?.status === 'approved'
            const isPending = claimRecord?.status === 'pending'

            return (
              <div 
                key={priv.key}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={isApproved}
                      disabled
                      className="w-4 h-4 rounded border-white/10 text-secondary focus:ring-0 cursor-not-allowed"
                    />
                    <span className={`text-xs font-bold ${isApproved ? "line-through opacity-40 text-green-500" : "text-white"}`}>
                      {priv.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 ml-7">{priv.desc}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2 pl-7 sm:pl-0">
                  {priv.type === 'manual' ? (
                    isApproved ? (
                      <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                        Consommé à vie
                      </span>
                    ) : isPending ? (
                      <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse">
                        En attente
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimSubmit(priv.key, priv.label)}
                        className="px-3 py-1.5 bg-secondary text-black hover:bg-secondary/80 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
                      >
                        Consommer
                      </button>
                    )
                  ) : (
                    <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded bg-white/5 text-white/40 border border-white/5">
                      Automatique
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}