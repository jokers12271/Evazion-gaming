import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'violet' | 'cyan' | 'orange' | 'ghost' | 'danger' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  sweep?: boolean;
  cornerAccents?: boolean;
  children?: ReactNode;
}

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(({
  variant = 'violet',
  size = 'md',
  sweep = false,
  cornerAccents = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const variantStyles = {
    violet: 'bg-primary/20 text-white border-primary/60 hover:bg-primary hover:text-black shadow-neon-violet focus:ring-primary',
    cyan: 'bg-secondary/20 text-white border-secondary/60 hover:bg-secondary hover:text-black shadow-neon-cyan focus:ring-secondary',
    orange: 'bg-amber-500/20 text-white border-amber-500/60 hover:bg-amber-500 hover:text-black shadow-neon-orange focus:ring-amber-500',
    emerald: 'bg-emerald-500/20 text-white border-emerald-500/60 hover:bg-emerald-500 hover:text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] focus:ring-emerald-500',
    danger: 'bg-red-500/20 text-red-300 border-red-500/60 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] focus:ring-red-500',
    ghost: 'bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white focus:ring-white/30'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs sm:text-sm',
    lg: 'px-7 py-3.5 text-sm sm:text-base'
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center font-display font-black uppercase tracking-wider rounded-xl border transition-all duration-300 select-none overflow-hidden cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {/* Corner Accents */}
      {cornerAccents && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40 pointer-events-none" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/40 pointer-events-none" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/40 pointer-events-none" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40 pointer-events-none" />
        </>
      )}

      {/* Sweep Effect */}
      {sweep && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[sweep_3s_ease-in-out_infinite] pointer-events-none" />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
});
