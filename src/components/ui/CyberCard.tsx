import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'violet' | 'cyan' | 'orange' | 'danger' | 'default';
  accentColor?: string;
  hoverEffect?: boolean;
  cornerAccents?: boolean;
  headerBadge?: string;
  topRight?: ReactNode;
  overlay?: ReactNode;
  children?: ReactNode;
}

export function CyberCard({
  variant = 'default',
  accentColor,
  hoverEffect = true,
  cornerAccents = true,
  headerBadge,
  topRight,
  overlay,
  className,
  children,
  style,
  ...props
}: CyberCardProps) {
  const variantStyles = {
    default: 'border-white/10 hover:border-white/25',
    violet: 'border-primary/40 hover:border-primary shadow-neon-violet',
    cyan: 'border-secondary/40 hover:border-secondary shadow-neon-cyan',
    orange: 'border-amber-500/40 hover:border-amber-500 shadow-neon-orange',
    danger: 'border-red-500/40 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-[1.75rem] sm:rounded-[2rem] border bg-gradient-to-b from-white/[0.07] via-black/75 to-black/95 backdrop-blur-xl shadow-card overflow-hidden transition-all duration-300 ease-smooth cyber-card',
        variantStyles[variant],
        hoverEffect && 'hover:-translate-y-1 hover:shadow-2xl',
        className
      )}
      style={{
        borderColor: accentColor ? `${accentColor}70` : undefined,
        ...style
      }}
      {...props}
    >
      {/* Background Overlay */}
      {overlay}

      {/* Corner Accents */}
      {cornerAccents && (
        <>
          <span className="absolute top-3 left-3 w-3 h-3 rounded-tl-[0.6rem] border-t border-l border-white/15 pointer-events-none z-10" />
          <span className="absolute top-3 right-3 w-3 h-3 rounded-tr-[0.6rem] border-t border-r border-white/15 pointer-events-none z-10" />
          <span className="absolute bottom-3 left-3 w-3 h-3 rounded-bl-[0.6rem] border-b border-l border-white/15 pointer-events-none z-10" />
          <span className="absolute bottom-3 right-3 w-3 h-3 rounded-br-[0.6rem] border-b border-r border-white/15 pointer-events-none z-10" />
        </>
      )}

      {/* Header Badge */}
      {headerBadge && (
        <span className="absolute top-4 left-4 z-20 px-3 py-0.5 rounded-full text-[8.5px] font-mono font-black uppercase tracking-widest bg-secondary text-black">
          {headerBadge}
        </span>
      )}

      {/* Top Right Element */}
      {topRight && (
        <div className="absolute top-4 right-4 z-20">
          {topRight}
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
