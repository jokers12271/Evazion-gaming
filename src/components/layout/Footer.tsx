import { Link } from '@tanstack/react-router'
import { MapPin, Phone, Mail, Instagram, Youtube } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'

export function Footer() {
  const footerLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Salon', href: '/salon' },
    { name: 'Réservation', href: '/reservation' },
    { name: 'Tournois', href: '/tournaments' },
    { name: 'Boutique', href: '/store' },
    { name: 'Communauté', href: '/community' },
    { name: 'Actualités', href: '/news' }
  ]

  return (
    <footer className="bg-background border-t border-white/5 py-12 md:py-16 mt-auto">
      <div className="container mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 text-center md:text-left">
          
          {/* 1. Colonne Marque */}
          <div className="flex flex-col items-center md:items-start gap-5">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <div className="absolute inset-[-2px] rounded-full bg-primary/40 blur-lg" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/30 shadow-neon-violet bg-background z-10">
                  <img 
                    src="/logo.png" 
                    alt="Evazion Logo" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]" />
                </div>
              </div>
              <span className="text-2xl font-display font-black uppercase tracking-tighter text-glow-violet">
                Evazion
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Le repaire d'élite des gamers à Brazzaville. Rejoignez le Sanctuary, intégrez votre Team, et écrivez votre propre légende.
            </p>
            <div className="flex items-center gap-3 mt-2 justify-center md:justify-start shrink-0">
              <a href="https://www.tiktok.com/@evazion.gaming?_r=1&_t=ZS-972NghNdYRN" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-primary/40 hover:text-primary transition-all text-white/50 flex items-center justify-center">
                <svg className="w-[14px] h-[14px] fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.19 1.09 1.15 2.58 1.8 4.12 1.95v3.91c-1.2-.02-2.38-.41-3.37-1.11-.9-.64-1.6-1.54-2-2.57V17c-.02 1.61-.59 3.17-1.61 4.38-1.57 1.87-4 2.89-6.44 2.55-2.22-.3-4.14-1.74-4.94-3.81C-.1 17.51.5 14.54 2.25 12.87c1.47-1.4 3.58-2.01 5.6-1.64v4.07c-1.76-.17-3.4.67-4.13 2.24-.7 1.5.02 3.42 1.58 4.1 1.47.63 3.3-.01 3.97-1.52.2-.47.28-1 .27-1.52V.02h3z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/evaziongaminghub" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-secondary/40 hover:text-secondary transition-all text-white/50">
                <Instagram size={14} />
              </a>
              <a href="https://www.youtube.com/@evaziongaminghub" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-accent/40 hover:text-accent transition-all text-white/50">
                <Youtube size={14} />
              </a>
            </div>
          </div>

          {/* 2. Colonne Navigation */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-display uppercase tracking-widest text-[9px] md:text-xs font-black text-white mb-6">Navigation</h4>
            <ul className="space-y-3 text-xs font-bold uppercase tracking-widest">
              {footerLinks.map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Colonne Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-display uppercase tracking-widest text-[9px] md:text-xs font-black text-white mb-6">Contact</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-tight">
              <li className="flex flex-col md:flex-row items-center gap-3 text-muted-foreground">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                <span className="capitalize-none text-left">
                  Case A 87 A, Rue Duplex, <br /> collé à l’église du centenaire
                </span>
              </li>
              <li className="flex flex-col md:flex-row items-center gap-3 text-muted-foreground">
                <Phone size={16} className="text-secondary shrink-0" />
                <span translate="no">+242 05 795 72 48</span>
              </li>
              <li className="flex flex-col md:flex-row items-center gap-3 text-muted-foreground">
                <Mail size={16} className="text-accent shrink-0" />
                <span translate="no" className="capitalize-none">evazionbzv@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* 4. Colonne Horaires */}
          <div className="flex flex-col items-center md:items-start w-full">
            <h4 className="font-display uppercase tracking-widest text-[9px] md:text-xs font-black text-white mb-6">Horaires</h4>
            <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-muted-foreground w-full max-w-[240px] md:max-w-none">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>Lun - Ven</span>
                <span className="text-white">10:00 - 21:00</span>
              </li>
              <li className="flex justify-between border-b border-primary/30 pb-2 text-primary font-black shadow-neon-violet">
                <span>Samedi</span>
                <span>10:00 - 23:00</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>Dimanche</span>
                <span className="text-white">09:00 - 21:00</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Pied de page bas (Copyright, Mentions & Signature de Darius BOUKS) */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] text-muted-foreground uppercase tracking-widest text-center md:text-left">
          <p className="leading-relaxed">
            © 2026 Evazion Gaming Hub. Tous droits réservés.
            <span className="opacity-40 block sm:inline md:ml-2">
              | Conçu & développé par{' '}
              <span translate="no" className="text-primary hover:text-glow-violet transition-colors">Darius BOUKS</span>{' '}
              (<a href="mailto:contact.darius.pro@gmail.com" className="hover:text-secondary transition-colors lowercase tracking-normal font-semibold">contact.darius.pro@gmail.com</a>)
            </span>
          </p>
          <div className="flex gap-6 justify-center items-center">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <span className="opacity-20">•</span>
            <a href="#" className="hover:text-white transition-colors">CGV</a>
          </div>
        </div>

      </div>
    </footer>
  )
}