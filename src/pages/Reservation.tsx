import { useState, Fragment, useCallback } from 'react'
import { ModalShell } from '@/components/ui/ModalShell'
import { useReservations } from '@/hooks/useReservations'
import { useUserMetadata } from '@/hooks/useUserMetadata' 
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/hooks/useAuth'
import { Clock, Monitor, AlertCircle, Power, PowerOff, CheckCircle2, Activity, Users, Lock, Radio, Cpu, Sparkles } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { useStationsStatus } from '@/hooks/useStationsStatus'
import { useStations, groupStationsByZone } from '@/hooks/useStations'
import { StationCard } from '@/components/reservation/StationCard'
import { AdminStationsManager } from '@/components/reservation/AdminStationsManager'
import { AdminPricingManager } from '@/components/reservation/AdminPricingManager'
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
import { useReservationDurations } from '@/hooks/usePricing'

export function Reservation() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { reservations, createReservation } = useReservations()
  const { durations } = useReservationDurations()
  const { data: metadata } = useUserMetadata() 
  const { data: occupiedStations } = useStationsStatus() 
  const { manualStates, toggleStation } = useStationManagement()
  const { checkWeeklyBonusUsed } = usePrivileges()
  const { data: loyalty } = useLoyalty()
  const isAdmin = metadata?.is_admin || user?.user_metadata?.is_admin || false;

  const [stationsModalOpen, setStationsModalOpen] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)
  const closeStationsModal = useCallback(() => setStationsModalOpen(false), [])
  const closePricingModal = useCallback(() => setPricingModalOpen(false), [])
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [totalPrice, setTotalPrice] = useState<number>(1500)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string>('14:00')
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)

  const userHours = loyalty?.total_hours || 0
  const userRank = getRank(userHours)

  const theoreticalBonus = 
    userRank.name === 'Novice' || userRank.name === 'Amateur' ? 15 : 
    userRank.name === 'Semi-Pro' ? 30 : 0

  const hasUsedWeeklyBonusQuery = checkWeeklyBonusUsed(theoreticalBonus)
  const hasAlreadyUsedWeeklyBonus = hasUsedWeeklyBonusQuery.data || false

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
      if (selectedDuration >= 60) {
        privilegeMinutesBonus = 15
        privilegeAppliedLabel = '🎁 Privilège Pro : +15 min offertes sur votre session d\'une heure ou plus !'
      }
    } else if (userRank.name === 'Elite') {
      if (selectedDuration >= 90) {
        privilegeMinutesBonus = 30
        privilegeAppliedLabel = '🎁 Privilège Elite : +30 min offertes sur votre session d\'une heure 30 min ou plus !'
      }
    } else if (userRank.name === 'Légende') {
      if (selectedDuration >= 90) {
        privilegeMinutesBonus = 30
        privilegeAppliedLabel = '🎁 Privilège Légende : +30 min offertes sur votre session d\'une heure 30 min ou plus !'
      }
    } else if (userRank.name === 'Iconique') {
      if (selectedDuration >= 120) {
        privilegeMinutesBonus = 60
        privilegeAppliedLabel = '🎁 Privilège Iconique : +1 heure offerte sur votre session de deux heures ou plus !'
      }
    } else if (userRank.name === 'Divin') {
      if (selectedDuration === 300) {
        privilegeMinutesBonus = 60
        privilegeAppliedLabel = '🎁 Privilège Divin : +1 heure offerte sur votre Pack Légende !'
      }
    }
  }

  const { stations } = useStations()
  const stationGroups = groupStationsByZone(stations)

  const isStationOccupied = (stationId: string) => occupiedStations?.includes(stationId) ?? false

  const totalOccupied = stations.filter(station => isStationOccupied(station.id)).length;
  const totalStations = stations.length;
  const occupancyRate = totalStations
    ? Math.round((totalOccupied / totalStations) * 100)
    : 0;

  const activeSessions = reservations?.filter((res: any) => res.status === 'en cours') || [];

  const handleBooking = async () => {
    if (!isAuthenticated || !user) { 
      toast.error("Connexion requise pour réserver une session");
      navigate({ to: '/login' });
      return; 
    }
    if (!selectedStation) { toast.error('Choisissez un poste'); return; }

    const finalDuration = selectedDuration + privilegeMinutesBonus
    const startTime = new Date(`${selectedDate}T${selectedTime}`)
    const endTime = new Date(startTime.getTime() + finalDuration * 60000)

    try {
      await createReservation.mutateAsync({
        station_id: selectedStation,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        display_name: metadata?.display_name || user?.email || 'Gamer',
        status: 'pending',
        bonus_minutes_applied: privilegeMinutesBonus
      })

      if (privilegeMinutesBonus > 0) {
        toast.success(`Bonus de ${privilegeMinutesBonus} min appliqué à votre session !`);
      }

      setShowSuccessModal(true);
    } catch (error: any) {
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
      <OnboardingModal pageKey="reservation" steps={onboardingSteps} />
      {isAdmin && <AdminOnboardingModal pageKey="reservation" steps={adminOnboardingSteps} />}
      
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
          
          <header className="mb-8 md:mb-16">
            <h1 className="text-3xl md:text-7xl font-display font-black uppercase tracking-tighter mb-3 md:mb-4 text-white">
              {isAdmin ? 'GESTION DES' : 'RÉSERVER VOTRE'} <span className="text-primary italic">{isAdmin ? 'POSTES' : 'SESSION'}</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-lg max-w-2xl mx-auto uppercase text-[9px] md:text-xs tracking-widest font-bold">
              {isAdmin ? 'Contrôlez l\'état des stations en temps réel' : 'Choisissez votre poste et votre temps de jeu.'}
            </p>
          </header>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
              <button
                onClick={() => {
                  setStationsModalOpen(true);
                  cyberAudio.playClick();
                }}
                className="py-3 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 hover:bg-amber-500/20 transition-all cursor-pointer shadow-neon-orange"
              >
                <Monitor size={16} /> Configurer les Stations
              </button>
              <button
                onClick={() => {
                  setPricingModalOpen(true);
                  cyberAudio.playClick();
                }}
                className="py-3 px-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 hover:bg-orange-500/20 transition-all cursor-pointer shadow-neon-orange"
              >
                <Clock size={16} /> Grille Tarifaire du Hub
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12 text-white text-left">
            
            <div className="lg:col-span-2 space-y-6 md:space-y-12">
              
              <section className="space-y-5 md:space-y-8 animate-fade-in text-left">
                <div className={cn("flex items-center mb-4 md:mb-6", isAdmin ? "justify-center" : "justify-between")}>
                  <div className="flex items-center gap-2 md:gap-3">
                    <Monitor className="text-secondary animate-pulse" size={18} />
                    <h2 className="text-sm md:text-2xl font-display uppercase tracking-wider text-white">
                      {isAdmin ? 'Centre de Contrôle Tactique' : 'Aménagement du Sanctuary'}
                    </h2>
                  </div>
                  {isAdmin && (
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 md:px-3 py-1 rounded-full border border-primary/20 animate-pulse">
                      Console Administrateur
                    </span>
                  )}
                </div>

                <div className="glass p-3.5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/5 relative overflow-hidden bg-black/40">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="space-y-5 md:space-y-8">
                    {stationGroups.map((group, groupIndex) => (
                      <Fragment key={group.zone}>
                        {groupIndex > 0 && (
                          <div className="flex items-center justify-center py-2 opacity-50">
                            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                          </div>
                        )}

                        <div className="space-y-2.5 md:space-y-4">
                          <div className="flex justify-between items-center px-1 md:px-2">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <Radio size={12} className="text-secondary animate-pulse" />
                              <span className="text-[8px] md:text-[10px] font-mono font-black uppercase text-white/70 tracking-[0.2em] md:tracking-[0.25em]">
                                {group.zone} // {group.stations.length} POSTE{group.stations.length > 1 ? 'S' : ''}
                              </span>
                            </div>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-secondary/40 via-white/10 to-transparent ml-2 md:ml-4" />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                            {group.stations.map((station) => (
                              <StationCard
                                key={station.id}
                                station={station}
                                isOccupied={isStationOccupied(station.id)}
                                isManuallyOccupied={manualStates?.find((s) => s.station_id === station.id)?.is_manual_occupied}
                                isSelected={!isAdmin && selectedStation === station.id}
                                isAdmin={Boolean(isAdmin)}
                                onSelect={setSelectedStation}
                                onBlock={(id, blocked) => toggleStation.mutate({ id, status: blocked })}
                              />
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>



                {selectedStation && !isAdmin && (
                  <div className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 animate-fade-in">
                    <div>
                      <p className="text-[7px] md:text-[9px] uppercase font-black text-white/40 tracking-wider">CONSOLE SÉLECTIONNÉE :</p>
                      <h4 className="text-xs md:text-lg font-black uppercase text-secondary tracking-wide">
                        💻 CONSOLE {selectedStation.replace('_', ' #')}
                      </h4>
                    </div>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 md:px-3 py-1 md:py-1.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                      ⚡ Équipement PS5 Pro opérationnel
                    </span>
                  </div>
                )}
              </section>

              {!isAdmin && (
                <>
                  <section>
                    <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-8">
                      <Clock className="text-secondary" size={18} />
                      <h2 className="text-sm md:text-2xl font-display uppercase tracking-wider text-white">Durée & Tarif</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                      {durations.map((dur) => {
                        const isLegendPack = dur.label.includes("Pack Légende")
                        const isLocked = isLegendPack && userRank.name !== 'Légende' && userRank.name !== 'Iconique' && userRank.name !== 'Divin'

                        return (
                          <button
                            key={dur.minutes}
                            disabled={isLocked}
                            onClick={() => { if(!isLocked) { setSelectedDuration(dur.minutes); setTotalPrice(dur.price); } }}
                            className={cn(
                              'py-2.5 md:py-4 px-2 rounded-xl glass border-white/5 flex flex-col items-center gap-1 md:gap-2 transition-all relative cursor-pointer',
                              selectedDuration === dur.minutes && 'border-secondary bg-secondary/10 shadow-neon-cyan',
                              isLocked && 'opacity-40 cursor-not-allowed border-red-500/10'
                            )}
                          >
                            {isLocked && <Lock className="absolute top-1.5 right-1.5 text-red-500" size={10} />}
                            <span className="text-[10px] md:text-sm font-bold text-white uppercase leading-tight">{dur.label}</span>
                            <span className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">{dur.price} FCFA</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-2 md:space-y-4">
                      <label className="text-[8px] md:text-[10px] uppercase font-black text-primary tracking-widest ml-1">Heure de début</label>
                      <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 md:py-4 px-3 md:px-4 text-[11px] md:text-base text-white focus:outline-none focus:border-primary text-center font-bold" />
                    </div>
                    <div className="space-y-2 md:space-y-4">
                      <label className="text-[8px] md:text-[10px] uppercase font-black text-primary tracking-widest ml-1">Date</label>
                      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 md:py-4 px-3 md:px-4 text-[11px] md:text-base text-white focus:outline-none focus:border-primary text-center font-bold" />
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="lg:col-span-1">
              {!isAdmin ? (
                <div className="glass border-white/10 rounded-[1.5rem] md:rounded-3xl p-3.5 md:p-8 sticky top-32 shadow-2xl">
                  <h3 className="text-sm md:text-xl font-display font-black uppercase tracking-widest mb-4 md:mb-8 pb-2 md:pb-4 border-b border-white/5 text-center text-white">VOTRE TICKET</h3>
                  
                  {privilegeMinutesBonus > 0 && (
                    <div className="bg-primary/10 border border-primary/20 p-2 md:p-3 rounded-xl text-[8px] md:text-[10px] font-black uppercase text-primary tracking-wider animate-pulse mb-4 md:mb-6">
                      {privilegeAppliedLabel}
                    </div>
                  )}

                  <div className="space-y-3 md:space-y-6 mb-5 md:mb-12">
                    <div className="flex justify-between items-center text-[11px] md:text-sm">
                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[8px] md:text-[10px]">Poste</span>
                      <span className="text-white font-black uppercase tracking-widest">{selectedStation || 'Non choisi'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] md:text-sm">
                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[8px] md:text-[10px]">Temps</span>
                      <span className="text-white font-black uppercase tracking-widest">{selectedDuration} min</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 md:pt-6 border-t border-white/5">
                      <span className="text-primary font-display font-black uppercase tracking-widest text-[9px] md:text-sm">TOTAL</span>
                      <span className="text-xl md:text-3xl font-display font-black text-white">
                        {totalPrice}
                        <span className="text-[9px] md:text-sm font-normal"> FCFA</span>
                      </span>
                    </div>
                  </div>
                  <NeonButton onClick={handleBooking} className="w-full py-3 md:py-5 text-[10px] md:text-base font-black uppercase tracking-[0.2em]">Confirmer</NeonButton>
                </div>
              ) : (
                <div className="glass border-white/10 rounded-3xl p-8 sticky top-32 shadow-2xl text-left">
                  <h3 className="text-xl font-display font-black uppercase tracking-widest mb-8 pb-4 border-b border-white/5 text-center text-secondary text-glow-cyan flex items-center justify-center gap-2">
                    <Activity size={18} /> LIVE CONTROLE
                  </h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-white/50">
                      <span>Occupation du Hub</span>
                      <span className="text-secondary text-glow-cyan">{occupancyRate}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full p-0.5 border border-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-secondary shadow-neon-cyan transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
                    </div>
                    <p className="text-[9px] uppercase font-bold text-white/20 tracking-wider text-center">{totalOccupied} / {totalStations} consoles allumées</p>
                  </div>

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

                  <div className="space-y-3 border-t border-white/5 pt-6">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Raccourcis Terminal :</p>
                    <button 
                      onClick={() => navigate({ to: '/salon' })}
                      className="w-full py-3 bg-white/5 border border-white/10 hover:border-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center cursor-pointer"
                    >
                      Consulter le Salon Live
                    </button>
                    <button 
                      onClick={() => navigate({ to: '/scanner' })}
                      className="w-full py-3 bg-primary/20 border border-primary/30 hover:border-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center shadow-neon-violet cursor-pointer"
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

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-primary shadow-neon-violet max-w-md w-full relative">
            <div className="w-11 h-11 md:w-16 md:h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <CheckCircle2 className="text-primary animate-pulse" size={28} />
            </div>
            <h3 className="text-base md:text-2xl font-display font-black uppercase text-white mb-2 md:mb-4">Réservation Enregistrée !</h3>
            <p className="text-[10px] md:text-sm text-muted-foreground leading-relaxed mb-5 md:mb-8">
              Félicitations ! Votre créneau de jeu sur le poste <span className="text-primary font-bold">{selectedStation}</span> a bien été réservé. Retrouvez tous les détails sur votre espace de membre.
            </p>
            <div className="flex flex-col gap-3 md:gap-4">
              <button 
                onClick={() => navigate({ to: '/dashboard' })}
                className="w-full py-3 md:py-4 bg-primary text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon-violet cursor-pointer"
              >
                Accéder à mon espace
              </button>
              <button 
                onClick={() => { setShowSuccessModal(false); setSelectedStation(null); }}
                className="text-[9px] md:text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalShell isOpen={stationsModalOpen} onClose={closeStationsModal} title="Configuration des Stations" accent="orange">
        <AdminStationsManager />
      </ModalShell>

      <ModalShell isOpen={pricingModalOpen} onClose={closePricingModal} title="Grille Tarifaire du Hub" accent="orange">
        <AdminPricingManager />
      </ModalShell>
    </div>
  )
}
