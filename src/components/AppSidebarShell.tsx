import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  AvatarFallback,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@blinkdotnew/ui'

import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Users,
  Settings,
  LogOut,
  PanelLeft, // AJOUTÉ
  ShoppingBag // AJOUTÉ
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Link } from '@tanstack/react-router'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  href: string
  icon: ReactNode
  label: string
}

const NAV_ITEMS: NavItemDef[] = [
  { href: '/', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Accueil' },
  { href: '/dashboard', icon: <Users className="h-4 w-4" />, label: 'Mon Espace' },
  { href: '/salon', icon: <Users className="h-4 w-4" />, label: 'Salon' }, // AJOUTÉ
  { href: '/reservation', icon: <Calendar className="h-4 w-4" />, label: 'Réservation' },
  { href: '/tournaments', icon: <Trophy className="h-4 w-4" />, label: 'Tournois' },
  { href: '/store', icon: <ShoppingBag className="h-4 w-4" />, label: 'Boutique' }, // AJOUTÉ
  { href: '/community', icon: <Users className="h-4 w-4" />, label: 'Communauté' },
  { href: '/news', icon: <Settings className="h-4 w-4" />, label: 'Actualités' },
]

export function AppSidebarShell() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const toggle = useCallback(() => {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        'flex flex-col h-full bg-background border-r border-border overflow-hidden transition-[width] duration-200 ease-linear shrink-0',
        collapsed ? 'w-[3rem]' : 'w-[15rem]'
      )}>
        <div className={cn('flex items-center gap-2 shrink-0 border-b border-border h-[52px] px-3', collapsed && 'justify-center px-2')}>
          {!collapsed && <span className="flex-1 font-semibold text-sm truncate uppercase tracking-widest text-primary">Evazion Hub</span>}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={toggle}>
            <PanelLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {NAV_ITEMS.map(item => (
            <Link 
              key={item.href} 
              to={item.href} 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-white/5",
                collapsed && "justify-center px-0"
              )}
              activeProps={{ className: 'bg-primary/10 text-primary font-bold shadow-neon-violet' }}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        <div className={cn('shrink-0 border-t border-border p-3 space-y-2', collapsed && 'items-center flex flex-col')}>
          {!collapsed && user && (
            <div className="px-2 py-1">
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout()} 
            className={cn("w-full justify-start gap-2 text-muted-foreground hover:text-destructive", collapsed && "justify-center px-0")}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Déconnexion</span>}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}