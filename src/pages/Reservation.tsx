import { useState } from 'react'
import { useReservations } from '@/hooks/useReservations'
import { useUserMetadata } from '@/hooks/useUserMetadata' 
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/hooks/useAuth'
import { Clock, Monitor, AlertCircle, Power, PowerOff, CheckCircle2, Activity, Users, Lock } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { useStationsStatus } from '@/hooks/useStationsStatus'
import { useStationManagement } from '@/hooks/useStationManagement'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePrivileges } from '@/hooks/usePrivileges'
import { getRank } from '@/lib/ranks'
import { useLoyalty } from '@/hooks/useLoyalty'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { Map, CalendarDays } from 'lucide-react'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { useNavigate } from '@tanstack/react-router'


const DURATIONS = [
  { label: '⚡ 15 min', value: 15, price: 500 },
  { label: '🔥 30 min', value: 30, price: 1000 },
  { label: '🎮 1h', value: 60, price: 1500 },
  { label: '🏆 1h30', value: 90, price: 2000 },
  { label: '📦 Pack 4h', value: 240, price: 5000 },
  { label: '👑 Pack Légende 5h', value: 300, price: 5000 }, // AJOUTÉ : Pack Légende
];

export function Reservation() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate() // AJOUTÉ ICI
  const { reservations, createReservation } = useReservations()
  const { data: metadata } = useUserMetadata() 
  const { data: occupiedStations } = useStationsStatus() 
  const { manualStates, toggleStation } = useStationManagement()
  const { checkWeeklyBonusUsed } = usePrivileges()
  const { data: loyalty } = useLoyalty()
  const isAdmin = (metadata as any)?.is_admin;

  // STATES (moved up so they are available for privilege computation)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [totalPrice, setTotalPrice] = useState<number>(1500)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string>('14:00')
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)

  // Détermination du VRAI cumul d'heures et du VRAI rang actuel
  const userHours = loyalty?.total_hours || 0
  const userRank = getRank(userHours)

  // 1. Définition de la valeur théorique du bonus hebdomadaire selon le rang
  const theoreticalBonus = 
    userRank.name === 'Novice' || userRank.name === 'Amateur' ? 15 : 
    userRank.name === 'Semi-Pro' ? 30 : 0

  // 2. Appel de la vérification dynamique sur la base de données
  const hasUsedWeeklyBonusQuery = checkWeeklyBonusUsed(theoreticalBonus)
  const hasAlreadyUsedWeeklyBonus = hasUsedWeeklyBonusQuery.data || false

  // 3. Application du bonus si éligible avec validation de durée de session d'origine
  let privilegeMinutesBonus = 0
  let privilegeAppliedLabel = ''

  if (isAuthenticated && !isAdmin) {
    if (userRank.name === 'Novice' || userRank.name === 'Amateur') {
      if (!hasAlreadyUsedWeeklyBonus) {
        privilegeMinutesBonus = 15
        privilegeAppliedLabel = '🎁 Privilège Novice/Amateur : +15 min offertes ajoutées à votre 1ère session de la semaine !'
      }
    } else if (userRank.name === 'Semi-Pro') {
      if (!hasAlreadyUsedWeeklyBonus) {
        privilegeMinutesBonus = 30
        privilegeAppliedLabel = '🎁 Privilège Semi-Pro : +30 min offertes ajoutées à votre 1ère session de la semaine !'
      }
    } else if (userRank.name === 'Pro') {
      // Uniquement si la session fait 1 heure minimum (60 min)
      if (selectedDuration >= 60) {
        privilegeMinutesBonus = 15
        privilegeAppliedLabel = '🎁 Privilège Pro : +15 min offertes sur votre session d\'une heure ou plus !'
      }
    } else if (userRank.name === 'Elite') {
      // Uniquement si la session fait 1 heure 30 minutes minimum (90 min)
      if (selectedDuration >= 90) {
        privilegeMinutesBonus = 30
        privilegeAppliedLabel = '🎁 Privilège Elite : +30 min offertes sur votre session d\'une heure 30 min ou plus !'
      }
    } else if (userRank.name === 'Légende') {
      // Uniquement si la session fait 1 heure 30 minutes minimum (90 min)
      if (selectedDuration >= 90) {
        privilegeMinutesBonus = 30
        privilegeAppliedLabel = '🎁 Privilège Légende : +30 min offertes sur votre session d\'une heure 30 min ou plus !'
      }
    } else if (userRank.name === 'Iconique') {
      // Uniquement si la session fait 2 heures minimum (120 min)
      if (selectedDuration >= 120) {
        privilegeMinutesBonus = 60
        privilegeAppliedLabel = '🎁 Privilège Iconique : +1 heure offerte sur votre session de deux heures ou plus !'
      }
    } else if (userRank.name === 'Divin') {
      // Uniquement sur l'achat du Pack Légende (300 min)
      if (selectedDuration === 300) {
        privilegeMinutesBonus = 60
        privilegeAppliedLabel = '🎁 Privilège Divin : +1 heure offerte sur votre Pack Légende !'
      }
    }
  }

  // Le reste du fichier demeure inchangé
  const stations = Array.from({ length: 10 }, (_, i) => ({
    id: `PS5_${i + 1}`,
    name: `Station ${i + 1}`,
  }))

  const totalOccupied = stations.filter(station => {
    const isManuallyOccupied = manualStates?.find(s => s.station_id === station.id)?.is_manual_occupied;
    const isAutoOccupied = occupiedStations?.includes(station.id);
    return isAutoOccupied || isManuallyOccupied;
  }).length;
  const occupancyRate = Math.round((totalOccupied / 10) * 100);

  const activeSessions = reservations?.filter((res: any) => res.status === 'en cours') || [];



  // LOGIQUE DE CONFIRMATION AVEC ENREGISTREMENT DU BONUS ET NOTIFICATIONS
  const handleBooking = async () => {
    if (!isAuthenticated || !user) { 
      toast.error("Connexion requise pour réserver une session");
      navigate({ to: '/login' }); // MODIFIÉ ICI
      return; 
    }
    if (!selectedStation) { toast.error('Choisissez un poste'); return; }

    const finalDuration = selectedDuration + privilegeMinutesBonus // Application du bonus
    const startTime = new Date(`${selectedDate}T${selectedTime}`)
    const endTime = new Date(startTime.getTime() + finalDuration * 60000) // Date de fin augmentée de la durée totale (Base + Bonus)

    const hasConflict = reservations?.some((res: any) => {
      if (res.station_id !== selectedStation || res.status === 'annulé') return false;
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      return (startTime < resEnd && endTime > resStart);
    });

    if (hasConflict) {
      toast.error("Ce créneau est déjà réservé sur ce poste.");
      return;
    }

    try {
      // 1. Créer la réservation avec enregistrement du bonus appliqué
      await createReservation.mutateAsync({
        station_id: selectedStation,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        display_name: metadata?.display_name || user?.email || 'Gamer',
        status: 'pending',
        bonus_minutes_applied: privilegeMinutesBonus // Transmission de la valeur numérique du bonus
      })

      // 2. Si un bonus a été appliqué, envoyer automatiquement les deux notifications
      if (privilegeMinutesBonus > 0) {
        const displayName = metadata?.display_name || 'Gamer'

        // A. Notification pour le joueur
        await supabase.from('notifications').insert([{
          user_id: user.id,
          message: `Félicitations ! Vos +${privilegeMinutesBonus} min de privilège de Rang ont été automatiquement ajoutées à votre session sur ${selectedStation}.`
        }])

        // B. Notification pour l'administrateur
        const { data: admins } = await supabase
          .from('users_metadata')
          .select('user_id')
          .eq('is_admin', true)

        if (admins && admins.length > 0) {
          const adminNotifs = admins.map(admin => ({
            user_id: admin.user_id,
            message: `Le joueur @${displayName} a bénéficié de +${privilegeMinutesBonus} min de privilège automatique sur sa session (${selectedStation}).`
          }))
          await supabase.from('notifications').insert(adminNotifs)
        }
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Détails de l'erreur de réservation :", error);
      toast.error(`Erreur de réservation : ${error.message || error}`);
    }
  }

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Prendre votre réservation",
      desc: "Sélectionnez votre console directement sur notre plan tactique (Ligne Nord ou Sud) et choisissez votre heure de début et votre date.",
      icon: <Map size={28} />
    },
    {
      title: "Application des privilèges",
      desc: "Vos minutes gratuites hebdomadaires (selon votre Rang actuel) sont calculées et créditées d'office sur votre ticket de réservation.",
      icon: <CalendarDays size={28} />
    }
  ]

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Verrouillage de Console",
      desc: "Cliquez sur 'Bloquer' sous un poste pour éteindre/bloquer une console (maintenance, nettoyage). Cliquez sur 'Libérer' pour la remettre disponible.",
      icon: <Power size={28} />
    }
  ]

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-center relative overflow-hidden animate-fade-in">
      {/* GUIDE DU JOUEUR */}
      <OnboardingModal pageKey="reservation" steps={onboardingSteps} />

      {/* GUIDE DU GÉRANT (AJOUTÉ) */}
      {isAdmin && <AdminOnboardingModal pageKey="reservation" steps={adminOnboardingSteps} />}
      
      {/* Fond d'écran immersif de la page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="reservation gaming backdrop"
        />
      </div>
      <div className="container mx-auto px-4 text-white relative z-20">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-16">
            <h1 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-4 text-white">
              {isAdmin ? 'GESTION DES' : 'RÉSERVER VOTRE'} <span className="text-primary italic">{isAdmin ? 'POSTES' : 'SESSION'}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto uppercase text-xs tracking-widest font-bold">
              {isAdmin ? 'Contrôlez l\'état des stations en temps réel' : 'Choisissez votre poste et votre temps de jeu.'}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-white text-left">
            
            <div className="lg:col-span-2 space-y-12">
              
              {/* NOUVELLE CARTE TACTIQUE INTERACTIVE (ÎLOTS DE JEU E-SPORT) */}
              <section className="space-y-8 animate-fade-in text-left">
                <div className={cn("flex items-center mb-6", isAdmin ? "justify-center" : "justify-between")}>
                  <div className="flex items-center gap-3">
                    <Monitor className="text-secondary animate-pulse" />
                    <h2 className="text-2xl font-display uppercase tracking-wider text-white">
                      {isAdmin ? 'Centre de Contrôle Tactique' : 'Aménagement du Sanctuary'}
                    </h2>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 animate-pulse">
                      Console Administrateur
                    </span>
                  )}
                </div>

                {/* Le Plan du Salon Virtuel (Disposé en 2 Îlots avec l'image PS5.jpg trés visible et le texte en bas) */}
                <div className="glass p-6 md:p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden bg-black/40">
                  {/* Effet de lueur centrale symbolisant le cœur du Sanctuary */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="space-y-8">
                    
                    {/* ÎLOT 1 : LIGNE NORD (Postes 1 à 5) */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-[0.25em]">🎮 ÎLOT NORD — POSTES 1 À 5</span>
                        <div className="h-[1px] flex-1 bg-white/5 ml-4" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {stations.slice(0, 5).map((station) => {
                          const isManuallyOccupied = manualStates?.find(s => s.station_id === station.id)?.is_manual_occupied;
                          const isAutoOccupied = occupiedStations?.includes(station.id);
                          const isOccupied = isAutoOccupied || isManuallyOccupied;
                          const isCurrentSelected = !isAdmin && selectedStation === station.id;

                          return (
                            <div key={station.id} className="flex flex-col gap-2">
                              <button
                                onClick={() => !isAdmin && !isOccupied && setSelectedStation(station.id)}
                                disabled={!isAdmin && isOccupied}
                                className={cn(
                                  'w-full aspect-[4/3] sm:aspect-square rounded-2xl glass border-white/5 p-4 flex flex-col justify-end transition-all relative overflow-hidden group',
                                  isCurrentSelected && 'border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
                                  isOccupied && 'border-orange-500/30 bg-orange-500/5'
                                )}
                              >
                                {/* IMAGE DE FOND PS5 TRÈS VISIBLE */}
                                <div className="absolute inset-0 z-0">
                                  <img 
                                    src="/PS5.jpg" 
                                    className={cn(
                                      "w-full h-full object-cover transition-all duration-500",
                                      isCurrentSelected ? "scale-105 opacity-100" : (isOccupied ? "opacity-45" : "opacity-80 group-hover:scale-105 group-hover:opacity-100")
                                    )} 
                                    alt="PS5 Setup" 
                                  />
                                  {/* Dégradé noir uniquement au bas pour protéger le texte */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />
                                </div>

                                {/* Voyant de disponibilité (En haut à droite) */}
                                <div className={cn(
                                  "absolute top-2.5 right-2.5 w-2 h-2 rounded-full z-10",
                                  isOccupied ? "bg-orange-500 shadow-[0_0_8px_#f97316]" : "bg-green-500 shadow-[0_0_8px_#22c55e]"
                                )} />

                                {/* CONTENU TEXTUEL FIXÉ TOUT EN BAS */}
                                <div className="absolute bottom-2.5 left-2 right-2 z-10 flex flex-col items-center">
                                  <span className={cn(
                                    "text-[13px] md:text-[14px] font-display font-black uppercase tracking-wider leading-none",
                                    isOccupied ? "text-orange-500" : "text-white"
                                  )}>
                                    {station.id.replace('_', ' #')}
                                  </span>
                                  <span className="text-[7.5px] font-black text-white/50 uppercase tracking-widest leading-none mt-1">
                                    {isOccupied ? (isManuallyOccupied ? 'BLOQUÉ' : 'OCCUPÉ') : 'DISPO'}
                                  </span>
                                </div>
                              </button>

                              {/* COMMANDES ADMIN RAPIDES */}
                              {isAdmin && (
                                <div className="flex flex-col gap-1 mt-1 animate-fade-in relative z-20">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleStation.mutate({ id: station.id, status: true }) }}
                                    className="w-full flex items-center justify-center gap-1.5 text-[8px] font-black uppercase bg-orange-600/90 hover:bg-orange-500 text-white py-1.5 rounded-lg transition-all"
                                  >
                                    Bloquer
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleStation.mutate({ id: station.id, status: false }) }}
                                    className="w-full flex items-center justify-center gap-1.5 text-[8px] font-black uppercase bg-green-600/90 hover:bg-green-500 text-white py-1.5 rounded-lg transition-all"
                                  >
                                    Libérer
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* CORRIDOR CENTRAL VISUEL */}
                    <div className="flex items-center justify-center py-1 opacity-25">
                      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
                    </div>

                    {/* ÎLOT 2 : LIGNE SUD (Postes 6 à 10) */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-[0.25em]">🎮 ÎLOT SUD — POSTES 6 À 10</span>
                        <div className="h-[1px] flex-1 bg-white/5 ml-4" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {stations.slice(5, 10).map((station) => {
                          const isManuallyOccupied = manualStates?.find(s => s.station_id === station.id)?.is_manual_occupied;
                          const isAutoOccupied = occupiedStations?.includes(station.id);
                          const isOccupied = isAutoOccupied || isManuallyOccupied;
                          const isCurrentSelected = !isAdmin && selectedStation === station.id;

                          return (
                            <div key={station.id} className="flex flex-col gap-2">
                              <button
                                onClick={() => !isAdmin && !isOccupied && setSelectedStation(station.id)}
                                disabled={!isAdmin && isOccupied}
                                className={cn(
                                  'w-full aspect-[4/3] sm:aspect-square rounded-2xl glass border-white/5 p-4 flex flex-col justify-end transition-all relative overflow-hidden group',
                                  isCurrentSelected && 'border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
                                  isOccupied && 'border-orange-500/30 bg-orange-500/5'
                                )}
                              >
                                {/* IMAGE DE FOND PS5 TRÈS VISIBLE */}
                                <div className="absolute inset-0 z-0">
                                  <img 
                                    src="/PS5.jpg" 
                                    className={cn(
                                      "w-full h-full object-cover transition-all duration-500",
                                      isCurrentSelected ? "scale-105 opacity-100" : (isOccupied ? "opacity-45" : "opacity-80 group-hover:scale-105 group-hover:opacity-100")
                                    )} 
                                    alt="PS5 Setup" 
                                  />
                                  {/* Dégradé noir uniquement au bas pour protéger le texte */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />
                                </div>

                                {/* Voyant de disponibilité (En haut à droite) */}
                                <div className={cn(
                                  "absolute top-2.5 right-2.5 w-2 h-2 rounded-full z-10",
                                  isOccupied ? "bg-orange-500 shadow-[0_0_8px_#f97316]" : "bg-green-500 shadow-[0_0_8px_#22c55e]"
                                )} />

                                {/* CONTENU TEXTUEL FIXÉ TOUT EN BAS */}
                                <div className="absolute bottom-2.5 left-2 right-2 z-10 flex flex-col items-center">
                                  <span className={cn(
                                    "text-[13px] md:text-[14px] font-display font-black uppercase tracking-wider leading-none",
                                    isOccupied ? "text-orange-500" : "text-white"
                                  )}>
                                    {station.id.replace('_', ' #')}
                                  </span>
                                  <span className="text-[7.5px] font-black text-white/50 uppercase tracking-widest leading-none mt-1">
                                    {isOccupied ? (isManuallyOccupied ? 'BLOQUÉ' : 'OCCUPÉ') : 'DISPO'}
                                  </span>
                                </div>
                              </button>

                              {/* COMMANDES ADMIN RAPIDES */}
                              {isAdmin && (
                                <div className="flex flex-col gap-1 mt-1 animate-fade-in relative z-20">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleStation.mutate({ id: station.id, status: true }) }}
                                    className="w-full flex items-center justify-center gap-1.5 text-[8px] font-black uppercase bg-orange-600/90 hover:bg-orange-500 text-white py-1.5 rounded-lg transition-all"
                                  >
                                    Bloquer
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleStation.mutate({ id: station.id, status: false }) }}
                                    className="w-full flex items-center justify-center gap-1.5 text-[8px] font-black uppercase bg-green-600/90 hover:bg-green-500 text-white py-1.5 rounded-lg transition-all"
                                  >
                                    Libérer
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* PANNEAU DE DIAGNOSTIC DE POSTE ACTIF (Pour le look technique épuré) */}
                {selectedStation && !isAdmin && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between animate-fade-in">
                    <div>
                      <p className="text-[9px] uppercase font-black text-white/40 tracking-wider">CONSOLE SÉLECTIONNÉE :</p>
                      <h4 className="text-lg font-black uppercase text-secondary tracking-wide">
                        💻 CONSOLE {selectedStation.replace('_', ' #')}
                      </h4>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                      ⚡ Équipement PS5 Pro opérationnel
                    </span>
                  </div>
                )}
              </section>

              {/* --- SECTION CACHÉE POUR L'ADMIN --- */}
              {!isAdmin && (
                <>
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <Clock className="text-secondary" />
                      <h2 className="text-2xl font-display uppercase tracking-wider text-white">Durée & Tarif</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {DURATIONS.map((dur) => {
                        const isLegendPack = dur.label.includes("Pack Légende")
                        const isLocked = isLegendPack && userRank.name !== 'Légende' && userRank.name !== 'Iconique' && userRank.name !== 'Divin'

                        return (
                          <button
                            key={dur.value}
                            disabled={isLocked}
                            onClick={() => { if(!isLocked) { setSelectedDuration(dur.value); setTotalPrice(dur.price); } }}
                            className={cn(
                              'py-4 px-2 rounded-xl glass border-white/5 flex flex-col items-center gap-2 transition-all relative',
                              selectedDuration === dur.value && 'border-secondary bg-secondary/10 shadow-neon-cyan',
                              isLocked && 'opacity-40 cursor-not-allowed border-red-500/10'
                            )}
                          >
                            {isLocked && <Lock className="absolute top-2 right-2 text-red-500" size={12} />}
                            <span className="text-sm font-bold text-white uppercase">{dur.label}</span>
                            <span className="text-[9px] font-black uppercase text-muted-foreground">{dur.price} FCFA</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Heure de début</label>
                      <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary text-center font-bold" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Date</label>
                      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary text-center font-bold" />
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* --- BARRE LATÉRALE CONDITIONNELLE (TICKET OU PANNEAU DE CONTRÔLE ADMIN) --- */}
            <div className="lg:col-span-1">
              {!isAdmin ? (
                // A. BARRE DU JOUEUR (TICKET)
                <div className="glass border-white/10 rounded-3xl p-8 sticky top-32 shadow-2xl">
                  <h3 className="text-xl font-display font-black uppercase tracking-widest mb-8 pb-4 border-b border-white/5 text-center text-white">VOTRE TICKET</h3>
                  
                  {/* AFFICHAGE DU PRIVILÈGE APPLIQUÉ (AJOUTÉ) */}
                  {privilegeMinutesBonus > 0 && (
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-[10px] font-black uppercase text-primary tracking-wider animate-pulse mb-6">
                      {privilegeAppliedLabel}
                    </div>
                  )}

                  <div className="space-y-6 mb-12">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Poste</span>
                      <span className="text-white font-black uppercase tracking-widest">{selectedStation || 'Non choisi'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Temps</span>
                      <span className="text-white font-black uppercase tracking-widest">{selectedDuration} min</span>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                      <span className="text-primary font-display font-black uppercase tracking-widest">TOTAL</span>
                      {(() => {
                        const hasGlobalDiscount = (metadata as any)?.discount_perk_until && new Date((metadata as any).discount_perk_until) > new Date();
                        const realPrice = hasGlobalDiscount ? Math.round(totalPrice * 0.9) : totalPrice;

                        return (
                          <span className="text-3xl font-display font-black text-white">
                            {hasGlobalDiscount ? (
                              <span className="flex items-baseline gap-3 mr-1">
                                <span className="line-through opacity-30 text-sm">{totalPrice}</span>
                                <span className="text-secondary text-glow-cyan font-black">{realPrice}</span>
                              </span>
                            ) : totalPrice}
                            <span className="text-sm font-normal"> FCFA</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <NeonButton onClick={handleBooking} className="w-full py-5 text-base font-black uppercase tracking-[0.2em]">Confirmer</NeonButton>
                </div>
              ) : (
                // B. BARRE DE L'ADMINISTRATEUR (PANNEAU DE CONTRÔLE LIVE)
                <div className="glass border-white/10 rounded-3xl p-8 sticky top-32 shadow-2xl text-left">
                  <h3 className="text-xl font-display font-black uppercase tracking-widest mb-8 pb-4 border-b border-white/5 text-center text-secondary text-glow-cyan flex items-center justify-center gap-2">
                    <Activity size={18} /> LIVE CONTROLE
                  </h3>
                  
                  {/* Taux d'occupation en direct du Hub */}
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-white/50">
                      <span>Occupation du Hub</span>
                      <span className="text-secondary text-glow-cyan">{occupancyRate}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full p-0.5 border border-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-secondary shadow-neon-cyan transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
                    </div>
                    <p className="text-[9px] uppercase font-bold text-white/20 tracking-wider text-center">{totalOccupied} / 10 consoles allumées</p>
                  </div>

                  {/* Liste des Sessions Solo en cours */}
                  <div className="space-y-3 mb-8 border-t border-white/5 pt-6">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Sessions en cours :</p>
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                      {activeSessions && activeSessions.length > 0 ? (
                        activeSessions.map((res: any) => (
                          <div key={res.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-white">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider">{res.station_id}</p>
                              <p className="text-[9px] text-muted-foreground uppercase font-bold" translate="no">@{res.display_name}</p>
                            </div>
                            <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">Solo Active</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] italic text-white/15 uppercase tracking-widest text-center py-4">Aucune session solo active</p>
                      )}
                    </div>
                  </div>

                  {/* Raccourcis Terminal Admin */}
              <div className="space-y-3 border-t border-white/5 pt-6">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Raccourcis Terminal :</p>
                <button 
                  onClick={() => navigate({ to: '/salon' })} // MODIFIÉ ICI
                  className="w-full py-3 bg-white/5 border border-white/10 hover:border-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center"
                >
                  Consulter le Salon Live
                </button>
                <button 
                  onClick={() => navigate({ to: '/scanner' })} // MODIFIÉ ICI
                  className="w-full py-3 bg-primary/20 border border-primary/30 hover:border-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center shadow-neon-violet"
                >
                  Lancer le Scanner
                </button>
              </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* AJOUTÉ : Pop-up centré de confirmation de réservation */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-10 rounded-[2.5rem] border-2 border-primary shadow-neon-violet max-w-md w-full relative">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-primary animate-pulse" size={40} />
            </div>
            <h3 className="text-2xl font-display font-black uppercase text-white mb-4">Réservation Enregistrée !</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Félicitations ! Votre créneau de jeu sur le poste <span className="text-primary font-bold">{selectedStation}</span> a bien été réservé. Retrouvez tous les détails sur votre espace de membre.
            </p>
            <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate({ to: '/dashboard' })} // MODIFIÉ ICI
            className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon-violet"
          >
            Accéder à mon espace
          </button>
              <button 
                onClick={() => { setShowSuccessModal(false); setSelectedStation(null); }}
                className="text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}