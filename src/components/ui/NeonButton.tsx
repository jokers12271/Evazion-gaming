import { Button } from '@blinkdotnew/ui'
import { cn } from '@blinkdotnew/ui'

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'violet' | 'cyan' | 'orange' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
}

export function NeonButton({ 
  variant = 'violet', 
  size = 'md', 
  glow = true, 
  className, 
  children, 
  ...props 
}: NeonButtonProps) {
  const variants = {
    violet: 'bg-primary text-white border-primary/50 hover:bg-primary/80',
    cyan: 'bg-secondary text-background border-secondary/50 hover:bg-secondary/80',
    orange: 'bg-accent text-white border-accent/50 hover:bg-accent/80',
    ghost: 'bg-transparent text-white border-white/20 hover:bg-white/10'
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-lg font-bold'
  }

  const glowStyles = {
    violet: 'shadow-neon-violet',
    cyan: 'shadow-neon-cyan',
    orange: 'shadow-neon-orange',
    ghost: ''
  }

  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-md transition-all duration-300 font-display uppercase tracking-widest border',
        variants[variant],
        sizes[size],
        glow && glowStyles[variant],
        'active:scale-95',
        className
      )}
      {...(props as any)}
    >
      <span className="relative z-10 pointer-events-none">{children}</span>
      {glow && variant !== 'ghost' && (
        <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </button>
  )
}
