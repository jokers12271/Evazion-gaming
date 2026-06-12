import { usePrivileges } from '@/hooks/usePrivileges'
import { getRank } from '@/lib/ranks'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface Props {
  totalHours: number
  displayName: string
}

export function GamerPrivileges({ totalHours, displayName }: Props) {
  const currentRank = getRank(totalHours)
  const { myClaims, claimPrivilege, checkWeeklyBonusUsed } = usePrivileges()

  // Déterminer la valeur en minutes du privilège hebdomadaire
  let weeklyBonusMinutes = 0
  if (currentRank.name === 'Novice' || currentRank.name === 'Amateur') {
    weeklyBonusMinutes = 15
  } else if (currentRank.name === 'Semi-Pro') {
    weeklyBonusMinutes = 30
  }

  // Interroger l'usage du bonus hebdomadaire d'un clic
  const hasUsedWeeklyBonusQuery = checkWeeklyBonusUsed(weeklyBonusMinutes)
  const hasUsedWeeklyBonus = hasUsedWeeklyBonusQuery.data || false

  // Générer la clé de privilège d'honneur Divin pour le mois en cours (ex: divin_honor_session_06-2026)
  const currentMonthYear = format(new Date(), 'MM-yyyy')
  const divinHonorKey = `divin_honor_session_${currentMonthYear}`

  const PRIVILEGES_CONFIG: Record<string, { key: string; label: string; type: 'manual' | 'auto'; desc: string }[]> = {
    "Régulier": [
      { key: "regulier_matchmaking", label: "💬 Accès au Salon de Discussion & Matchmaking", type: "auto", desc: "Communiquez librement avec les joueurs présents dans la salle." }
    ],
    "Débutant": [
      { key: "debutant_beverage", label: "🥤 1 Boisson offerte", type: "manual", desc: "Choisissez votre boisson préférée à l'accueil (Une seule fois à vie)." }
    ],
    "Novice": [
      { key: "novice_weekly_bonus", label: "⚡ +15 min offertes sur la première session de la semaine", type: "auto", desc: "Créditées d'office lors de votre 1ère session de la semaine." }
    ],
    "Amateur": [
      { key: "amateur_priority", label: "🗓️ Priorité de réservation les week-ends", type: "manual", desc: "Droit d'accès prioritaire le samedi et dimanche en cas d'affluence." },
      { key: "novice_weekly_bonus", label: "⚡ +15 min offertes sur la première session de la semaine", type: "auto", desc: "Bénéficiez du bonus hebdomadaire de temps (Hérité de Novice)." }
    ],
    "Semi-Pro": [
      { key: "amateur_priority", label: "🗓️ Priorité de réservation les week-ends", type: "manual", desc: "Droit d'accès prioritaire le samedi et dimanche (Hérité d'Amateur)." },
      { key: "semipro_weekly_bonus", label: "⚡ +30 min offertes sur la première session de la semaine", type: "auto", desc: "Créditées d'office lors de votre 1ère session de la semaine." }
    ],
    "Pro": [
      { key: "pro_discount", label: "🎟️ Réduction de 15% aux tournois & événements", type: "auto", desc: "Tarifs réduits automatiquement appliqués sur le Store." },
      { key: "pro_permanent_bonus", label: "⚡ +15 min offertes sur TOUTES vos sessions (d'une heure minimum)", type: "auto", desc: "Toutes vos sessions d'une heure ou plus sont prolongées d'office." }
    ],
    "Elite": [
      { key: "elite_priority_booking", label: "👑 Accès réservations prioritaires de consoles", type: "manual", desc: "Votre demande passe prioritaire auprès du gérant de salle." },
      { key: "elite_discount", label: "🎟️ Réduction de 25% aux tournois", type: "auto", desc: "Tarifs réduits automatiquement appliqués sur le Store." },
      { key: "elite_community_discount", label: "🏆 15% de réduction sur les frais de communauté", type: "auto", desc: "Mensualités de vos Teams réduites de 15%." },
      { key: "elite_permanent_bonus", label: "⚡ +30 min offertes sur TOUTES vos sessions (d'une heure 30 min minimum)", type: "auto", desc: "Toutes vos sessions d'une heure 30 min ou plus sont prolongées d'office." }
    ],
    "Légende": [
      { key: "legende_priority_all", label: "🗓️ Priorité de réservation tous les jours", type: "manual", desc: "Droit d'accès prioritaire n'importe quel jour de la semaine." },
      { key: "legende_tourney_discount", label: "🎟️ Réduction de 25% aux tournois", type: "auto", desc: "Tarifs réduits automatiquement appliqués." },
      { key: "legende_community_discount", label: "🏆 25% de réduction sur les frais de communauté", type: "auto", desc: "Mensualités de vos Teams réduites de 25%." },
      { key: "legende_hours_pack", label: "📦 Accès au Pack Spécial Légende : 5h = 5000 FCFA", type: "auto", desc: "Débloque le droit d'achat de ce pack d'heures exclusif." },
      { key: "legende_cake", label: "🍰 Gâteau d'accueil offert une fois", type: "manual", desc: "À récupérer à l'accueil (Une seule fois à vie)." },
      { key: "legende_permanent_bonus", label: "⚡ +30 min offertes sur TOUTES vos sessions (d'une heure 30 min minimum)", type: "auto", desc: "Toutes vos sessions d'une heure 30 min ou plus sont prolongées d'office." }
    ],
    "Iconique": [
      { key: "iconique_free_tourneys", label: "🎟️ Inscription GRATUITE aux tournois", type: "auto", desc: "Inscriptions gratuites d'office sur tous les tournois." },
      { key: "iconique_community_discount", label: "🏆 50% de réduction sur les frais de communauté", type: "auto", desc: "Mensualités de vos Teams réduites de 50%." },
      { key: "iconique_cake_yogurt", label: "🍰🥤 Formule Goûter offerte une fois (Gâteau + Yaourt)", type: "manual", desc: "À récupérer à l'accueil (Une seule fois à vie)." },
      { key: "iconique_monthly_hours", label: "⚡ 4h de session offertes CHAQUE MOIS", type: "auto", desc: "Crédit de temps versé automatiquement chaque 1er du mois." },
      { key: "iconique_permanent_bonus", label: "⚡ +1h offerte sur TOUTES vos sessions (de deux heures minimum)", type: "auto", desc: "Toutes vos sessions de deux heures ou plus sont prolongées d'office." }
    ],
    "Divin": [
      { key: "iconique_free_tourneys", label: "🎟️ Inscription GRATUITE aux tournois", type: "auto", desc: "Inscriptions gratuites d'office." },
      { key: "iconique_community_discount", label: "🏆 50% de réduction sur les frais de communauté", type: "auto", desc: "Mensualités de vos Teams réduites de 50%." },
      { key: "iconique_cake_yogurt", label: "🍰🥤 Formule Goûter offerte une fois", type: "manual", desc: "À récupérer à l'accueil (Hérité d'Iconique)." },
      { key: "divin_monthly_hours", label: "⚡ 5h de session offertes CHAQUE MOIS", type: "auto", desc: "Crédit de temps versé automatiquement chaque 1er du mois." },
      { key: divinHonorKey, label: "👑 1 Session d'Honneur Divin de 3h offerte ce mois-ci", type: "manual", desc: "Session d'honneur gratuite de 3 heures consécutives, réclamable chaque mois." },
      { key: "divin_permanent_bonus", label: "⚡ +1h offerte sur TOUTES vos sessions (sur le Pack Légende uniquement)", type: "auto", desc: "Vos sessions sur le Pack Légende uniquement sont prolongées d'office d'une heure." }
    ]
  };

  const currentPrivileges = PRIVILEGES_CONFIG[currentRank.name] || []

  const handleClaimSubmit = async (key: string, label: string) => {
    const claimMsg = `Le joueur @${displayName} (Rang ${currentRank.name}) souhaite consommer son privilège : "${label}".`
    try {
      await claimPrivilege.mutateAsync({ privilegeKey: key, message: claimMsg })
      toast.success("Demande envoyée à l'administrateur !")
    } catch (e: any) {
      console.error("Erreur de réclamation de privilège :", e)
      if (e.message?.includes("unique") || e.code === '23505') {
        toast.error("Vous avez déjà demandé ou consommé ce privilège ce mois-ci (ou à vie).")
      } else {
        toast.error(e.message || "Impossible de réclamer le privilège.")
      }
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

            // DÉTERMINATION DE LA COCHE DYNAMIQUE :
            // A. Si privilège manuel : coché si approuvé par l'admin
            // B. Si privilège hebdomadaire automatique : coché si consommé cette semaine
            // C. Si privilège permanent : coché actif d'office
            const isWeeklyKey = priv.key === 'novice_weekly_bonus' || priv.key === 'semipro_weekly_bonus';
            const isChecked = priv.type === 'manual' 
              ? isApproved 
              : (isWeeklyKey ? hasUsedWeeklyBonus : true);

            return (
              <div 
                key={priv.key}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      disabled
                      className="w-4 h-4 rounded border-white/10 text-secondary focus:ring-0 cursor-not-allowed"
                    />
                    <span className={`text-xs font-bold ${isChecked ? "line-through opacity-40 text-green-500" : "text-white"}`}>
                      {priv.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 ml-7">{priv.desc}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2 pl-7 sm:pl-0">
                  {priv.type === 'manual' ? (
                    isApproved ? (
                      <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                        Consommé
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
                      {isWeeklyKey ? (hasUsedWeeklyBonus ? "Consommé cette semaine" : "Disponible") : "Actif d'office"}
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