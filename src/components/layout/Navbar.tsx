import { Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '../ui/NeonButton'
import { User, LogIn, Menu, X, UserPlus } from 'lucide-react'
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
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          
          {/* 1. LOGO PREMIUM */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-[-4px] rounded-full bg-primary/30 blur-md group-hover:bg-primary/50 transition-all duration-300" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_20px_rgba(168,85,247,0.6)] bg-background z-10 group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(0,0,0,0.9)] pointer-events-none" />
              </div>
            </div>
            <span className="text-3xl font-display font-bold uppercase tracking-tighter text-glow-violet hidden sm:block">
              Evazion
            </span>
          </Link>

          {/* 2. NAVIGATION DESKTOP */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors hover:text-glow-violet"
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
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      <div className={cn(
        'fixed inset-0 bg-[#040405] backdrop-blur-2xl z-40 flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden',
        isOpen 
          ? 'translate-x-0 opacity-100 visible pointer-events-auto' 
          : 'translate-x-full opacity-0 invisible pointer-events-none'
      )}>
        {navLinks.map((link) => (
          <Link key={link.name} to={link.href} onClick={() => setIsOpen(false)} className="text-2xl font-display uppercase tracking-widest hover:text-primary">
            {link.name}
          </Link>
        ))}
        <div className="mt-8 flex flex-col gap-4 w-full px-10">
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
                 <NeonButton variant="violet" className="w-full">Connexion</NeonButton>
               </Link>
             </>
           )}
        </div>
      </div>
    </nav>
  )
}