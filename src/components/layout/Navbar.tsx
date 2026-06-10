import { Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '../ui/NeonButton'
import { User, LogIn, Menu, X, UserPlus, ChevronRight } from 'lucide-react' // MODIFIÉ (Inclusion de ChevronRight)
import { useState } from 'react'
import { cn } from '@blinkdotnew/ui'

export function Navbar() {
  const { isAuthenticated, login, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Salon', href: '/salon' }, // AJOUTÉ
    { name: 'Réservation', href: '/reservation' },
    { name: 'Tournois', href: '/tournaments' },
    { name: 'Boutique', href: '/store' }, // AJOUTÉ
    { name: 'Communauté', href: '/community' },
    { name: 'Actualités', href: '/news' },
  ]

  return (
    /* LE CONTENEUR DE LA BARRE DE NAVIGATION FLOTTANTE ET ARRONDIE (AJOUTÉ) */
    <nav className={cn(
      "fixed z-50 transition-all duration-300",
      isOpen 
        ? "top-0 left-0 right-0 h-screen bg-[#040405] border-b border-white/5 rounded-none" 
        : "top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 h-16 md:h-20 glass border border-white/10 rounded-2xl md:rounded-3xl shadow-lg shadow-black/40"
    )}>
      <div className="container mx-auto px-4 relative z-50">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* 1. LOGO PREMIUM (Texte masqué en version moyenne pour libérer de la largeur) */}
          <Link to="/" className="flex items-center gap-4 group" onClick={() => setIsOpen(false)}>
            <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-[-4px] rounded-full bg-primary/30 blur-md group-hover:bg-primary/50 transition-all duration-300" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_20px_rgba(168,85,247,0.6)] bg-background z-10 group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(0,0,0,0.9)] pointer-events-none" />
              </div>
            </div>
            {/* MODIFIÉ : Texte Evazion masqué sur moyen écran (hidden lg:block au lieu de sm:block) pour libérer de la largeur */}
            <span className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tighter text-glow-violet hidden lg:block shrink-0">
              Evazion
            </span>
          </Link>

          {/* 2. NAVIGATION DESKTOP (Sécurisée contre le débordement horizontal sur PC et émulation mobile) */}
              <div className="hidden md:flex items-center gap-2.5 lg:gap-5 xl:gap-8 shrink-0"> {/* MODIFIÉ : Spécification de gap réactif pour s'adapter à la largeur de l'écran */}
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-[10px] lg:text-xs xl:text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors hover:text-glow-violet" // MODIFIÉ : Taille de police de 10px à 14px réactive
                    activeProps={{ className: 'text-primary text-glow-violet font-bold' }}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

          {/* 3. ACTIONS AUTHENTIFICATION */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <NeonButton variant="ghost" size="sm" className="flex items-center gap-2">
                  <User size={16} />
                  <span>Mon Espace</span>
                </NeonButton>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/register">
                  <button className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase font-black text-muted-foreground hover:text-white transition-all tracking-[0.2em]">
                    <UserPlus size={14} />
                    S'inscrire
                  </button>
                </Link>
                <Link to="/login">
                  <NeonButton variant="violet" size="sm" className="flex items-center gap-2">
                    <LogIn size={16} />
                    <span>Connexion</span>
                  </NeonButton>
                </Link>
              </div>
            )}
          </div>

          {/* MENU MOBILE TRIGGER */}
          <button 
            className="md:hidden text-white p-2 border-none bg-transparent focus:outline-none focus:ring-0 flex items-center justify-center shrink-0" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} className="text-white shrink-0" /> : <Menu size={28} className="text-white shrink-0" />}
          </button>
        </div>
      </div>

      {/* MOBILE OVERLAY (Design "Sanctuary Cyberpunk" avec nébuleuses lumineuses et verre dépoli) */}
      <div className={cn(
        'fixed inset-0 bg-[#040405]/95 backdrop-blur-2xl z-40 flex flex-col items-center justify-start gap-3 pt-24 pb-10 px-5 overflow-y-auto transition-all duration-500 md:hidden', // pt-24, justify-start et overflow-y-auto conservés pour l'ergonomie
        isOpen 
          ? 'translate-x-0 opacity-100 visible pointer-events-auto' 
          : 'translate-x-full opacity-0 invisible pointer-events-none'
      )}>
        {/* Halos de lumière néon d'arrière-plan (Nébuleuses) */}
        <div className="absolute top-20 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

       {/* CORRECTION DU CENTRAGE DES BOUTONS MOBILES (AJOUTÉ) */}
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            to={link.href} 
            onClick={() => setIsOpen(false)} 
            className="w-full max-w-xs flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-display uppercase tracking-widest hover:text-primary hover:border-primary/40 hover:bg-white/[0.05] transition-all text-white/80 shrink-0 group relative z-10 text-center font-bold"
            activeProps={{ className: 'border-primary/60 text-primary shadow-neon-violet bg-primary/5 font-black' }}
          >
            <span>{link.name}</span>
          </Link>
        ))}
        <div className="mt-4 flex flex-col gap-4 w-full px-5 max-w-xs shrink-0 pb-6 relative z-10">
           {isAuthenticated ? (
             <Link to="/dashboard" onClick={() => setIsOpen(false)}>
               <NeonButton variant="violet" className="w-full">Mon Espace</NeonButton>
             </Link>
           ) : (
             <>
               <Link to="/register" onClick={() => setIsOpen(false)}>
                 <NeonButton variant="ghost" className="w-full">S'inscrire</NeonButton>
               </Link>
               <Link to="/login" onClick={() => setIsOpen(false)}>
                 <NeonButton variant="violet" className="w-full" translate="no">
                   Connexion
                 </NeonButton>
               </Link>
             </>
           )}
        </div>
      </div>
    </nav>
  )
}