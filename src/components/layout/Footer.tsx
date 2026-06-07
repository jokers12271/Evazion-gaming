import { Link } from '@tanstack/react-router'
import { Gamepad2, Facebook, Twitter, Instagram, Disc as Discord, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 py-16 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
  <Link to="/" className="flex items-center gap-4 group">
    <div className="relative w-14 h-14 flex items-center justify-center">
      {/* Halo lumineux intense */}
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
    <span className="text-2xl font-display font-bold uppercase tracking-tighter text-glow-violet">
      Evazion
    </span>
  </Link>
  {/* ... reste du texte ... */}
</div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display uppercase tracking-widest text-sm mb-6 text-white">Navigation</h4>
            <ul className="space-y-4">
              {[
                { name: 'Accueil', href: '/' },
                { name: 'Salon', href: '/salon' },
                { name: 'Réservation', href: '/reservation' },
                { name: 'Tournois', href: '/tournaments' },
                { name: 'Communauté', href: '/community' },
                { name: 'Actualités', href: '/news' }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display uppercase tracking-widest text-sm mb-6 text-white">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin size={18} className="text-primary shrink-0" />
                <span>Brazzaville, République du Congo</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone size={18} className="text-primary shrink-0" />
                <span>+242 06 000 00 00</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail size={18} className="text-primary shrink-0" />
                <span>contact@evazion.cg</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display uppercase tracking-widest text-sm mb-6 text-white">Horaires</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Lun - Jeu</span>
                <span>10:00 - 22:00</span>
              </li>
              <li className="flex justify-between text-primary font-bold">
                <span>Ven - Sam</span>
                <span>10:00 - Minuit</span>
              </li>
              <li className="flex justify-between">
                <span>Dimanche</span>
                <span>12:00 - 20:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground uppercase tracking-widest">
          <p>© 2026 Evazion Gaming Hub. Tous droits réservés.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">CGV</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
