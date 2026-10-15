import { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useSanctuaryStatus } from '@/hooks/useSanctuaryStatus'
import { NeonButton } from '../ui/NeonButton'
import { 
  User, LogIn, Menu, X, UserPlus, Coins, Shield, 
  Home, Monitor, Calendar, Trophy, ShoppingBag, Users, Newspaper, LogOut 
} from 'lucide-react'
import { AmbientThemeSelector } from '../ui/AmbientThemeSelector'
import { cn } from '@blinkdotnew/ui'
import { getRank } from '@/lib/ranks'
import { ManiIcon } from '../ui/ManiIcon'

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { data: metadata } = useUserMetadata()
  const { data: loyalty } = useLoyalty()
  const { currentStatus } = useSanctuaryStatus()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  // Fermeture automatique du tiroir lors d'un changement de route
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Verrouillage du scroll en arrière-plan lorsque le menu mobile est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Fermeture du tiroir via la touche Échap
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const isOpenStatus = (currentStatus || 'ouvert') === 'ouvert'
  const maniTokens = loyalty?.points ?? 0
  const displayName = metadata?.display_name || user?.email?.split('@')[0] || 'Gamer'
  const avatarUrl = metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`
  const isAdmin = metadata?.is_admin || false
  const userRank = getRank(loyalty?.total_hours || 0)

  const navLinks = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Salon', href: '/salon', icon: Monitor },
    { name: 'Réservation', href: '/reservation', icon: Calendar },
    { name: 'Tournois', href: '/tournaments', icon: Trophy },
    { name: 'Boutique', href: '/store', icon: ShoppingBag },
    { name: 'Communauté', href: '/community', icon: Users },
    { name: 'Actualités', href: '/news', icon: Newspaper },
  ]

  return (
    <>
      <nav className="fixed top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 right-2 sm:right-3 md:right-4 h-16 md:h-20 glass border border-white/10 rounded-2xl md:rounded-3xl shadow-glass z-50 transition-all duration-300">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-50 h-full">
          <div className="flex items-center justify-between h-full">
            
            {/* 1. LOGO & STATUT DU SANCTUARY */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group" onClick={() => setIsOpen(false)}>
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -inset-1 rounded-full bg-primary/30 blur-md group-hover:bg-primary/50 transition-all duration-300" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border border-primary/50 shadow-neon-violet bg-background z-10 group-hover:scale-105 transition-transform duration-300">
                    <img src="/logo.png" alt="Logo Evazion" className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <div className="flex flex-col text-left">
                  <span className="text-lg sm:text-xl md:text-2xl font-display font-black uppercase tracking-tight text-white group-hover:text-glow-violet transition-all leading-none">
                    EVA<span className="text-amber-400">Z</span>ION
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-primary font-bold uppercase mt-0.5">
                    Gaming
                  </span>
                </div>
              </Link>

              {/* Voyant Statut Sanctuary en direct (visible sur mobile et PC uniquement si connecté) */}
              {isAuthenticated && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[8.5px] sm:text-[10px] font-mono uppercase tracking-wider backdrop-blur-md transition-all",
                  isOpenStatus 
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_-2px_rgba(16,185,129,0.3)]"
                    : "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_12px_-2px_rgba(239,68,68,0.3)]"
                )}>
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      isOpenStatus ? "bg-emerald-400" : "bg-red-400"
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2",
                      isOpenStatus ? "bg-emerald-500" : "bg-red-500"
                    )} />
                  </span>
                </div>
              )}
            </div>

            {/* 2. NAVIGATION DESKTOP */}
            <div className="hidden xl:flex items-center gap-1.5 2xl:gap-3 shrink-0">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
                  activeProps={{ 
                    className: 'bg-primary/15 border border-primary/50 text-white font-extrabold shadow-neon-violet text-glow-violet' 
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* 3. ACTIONS UTILISATEUR DESKTOP */}
            <div className="hidden xl:flex items-center gap-3">
              <AmbientThemeSelector />
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {/* Solde Jetons MANI : visible UNIQUEMENT pour les joueurs réguliers (retiré pour l'admin) */}
                  {!isAdmin && (
                    <Link to="/store">
                      <div className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_15px_-4px_rgba(245,158,11,0.25)] transition-all">
                        <Coins className="text-amber-400 group-hover:scale-110 transition-transform" size={16} />
                        <span className="font-display font-black text-amber-300 text-xs tracking-wider">
                          {maniTokens} <ManiIcon className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Profil Joueur & Bouton Mon Espace */}
                  <Link to="/dashboard">
                    <div className="flex items-center gap-2.5 p-1.5 pr-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/50 hover:bg-white/[0.08] transition-all group">
                      <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-primary/50 shadow-neon-violet bg-background">
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white group-hover:text-primary transition-colors flex items-center gap-1">
                          @{displayName}
                          {isAdmin && <Shield size={12} className="text-amber-400" />}
                        </span>
                        <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest -mt-0.5">
                          {isAdmin ? 'Console Admin' : 'Mon Espace'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Link to="/register">
                    <NeonButton variant="ghost" size="sm" className="text-xs font-bold">
                      <UserPlus size={14} className="mr-1.5" />
                      S'inscrire
                    </NeonButton>
                  </Link>
                  <Link to="/login">
                    <NeonButton variant="violet" size="sm" sweep cornerAccents className="text-xs font-black shadow-neon-violet">
                      <LogIn size={14} className="mr-1.5" />
                      Connexion
                    </NeonButton>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. ACTIONS & BOUTON MENU MOBILE */}
            <div className="flex xl:hidden items-center gap-2">
              <AmbientThemeSelector />
              <button 
                className="p-2 sm:p-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:border-primary/50 text-white flex items-center justify-center transition-all shadow-glass active:scale-95" 
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isOpen}
                aria-controls="navbar-mobile-drawer"
              >
                {isOpen ? <X size={20} className="text-secondary" /> : <Menu size={20} className="text-white" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* 5. TIROIR MOBILE MODERNE & PLEIN ÉCRAN */}
      {isOpen && (
        <div 
          id="navbar-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation principal"
          className="fixed inset-0 z-40 bg-[#06070c]/98 backdrop-blur-3xl xl:hidden flex flex-col justify-between pt-20 md:pt-28 pb-6 px-4 sm:px-5 overflow-y-auto animate-fade-in text-white font-display"
        >
          {/* Nébuleuses d'ambiance */}
          <div className="absolute top-10 left-0 w-60 h-60 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-0 w-60 h-60 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 sm:space-y-4 relative z-10 w-full max-w-sm mx-auto">
            {/* Carte Profil Joueur en mode mobile si connecté */}
            {isAuthenticated ? (
              <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-primary/50 shadow-neon-violet bg-background relative shrink-0">
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-white flex items-center gap-1" translate="no">
                      @{displayName}
                      {isAdmin && <Shield size={13} className="text-amber-400" />}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: userRank.color }}>
                      Rang {userRank.name}
                    </span>
                  </div>
                </div>
                
                {/* Solde MANI uniquement pour les joueurs, pas pour l'admin */}
                {!isAdmin && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Coins className="text-amber-400" size={14} />
                    <span className="font-display font-black text-amber-300 text-xs">{maniTokens} <ManiIcon className="w-3.5 h-3.5" /></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">Bienvenue au Sanctuary</p>
              </div>
            )}

            {/* Liste complète des liens avec icônes tactiles */}
            <div className="flex flex-col gap-1.5 pt-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link 
                    key={link.name} 
                    to={link.href} 
                    onClick={() => setIsOpen(false)} 
                    className="w-full flex items-center justify-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] sm:text-xs font-display uppercase tracking-widest hover:text-primary hover:border-primary/40 hover:bg-white/[0.06] transition-all text-white/80 font-bold active:scale-[0.98]"
                    activeProps={{ className: 'border-primary/60 text-primary shadow-neon-violet bg-primary/10 font-black' }}
                  >
                    <Icon size={16} className="text-secondary shrink-0" />
                    <span>{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Actions de session en bas du tiroir mobile */}
          <div className="pt-4 sm:pt-6 relative z-10 w-full max-w-sm mx-auto space-y-2.5 sm:space-y-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block w-full">
                  <NeonButton variant="violet" size="md" sweep className="w-full py-3 text-[11px] sm:text-xs font-black shadow-neon-violet">
                    <User size={14} className="mr-2" />
                    {isAdmin ? 'Console Administrateur' : 'Mon Espace Joueur'}
                  </NeonButton>
                </Link>
                <button
                  onClick={async () => {
                    setIsOpen(false)
                    await logout()
                    window.location.href = '/login'
                  }}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut size={14} />
                  Se déconnecter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link to="/register" onClick={() => setIsOpen(false)} className="w-full">
                  <NeonButton variant="ghost" size="sm" className="w-full py-2.5 text-[11px] sm:text-xs font-bold">
                    <UserPlus size={13} className="mr-1.5" />
                    S'inscrire
                  </NeonButton>
                </Link>
                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full">
                  <NeonButton variant="violet" size="sm" sweep cornerAccents className="w-full py-2.5 text-[11px] sm:text-xs font-black shadow-neon-violet">
                    <LogIn size={13} className="mr-1.5" />
                    Connexion
                  </NeonButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
