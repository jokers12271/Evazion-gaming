import { cn } from '@/lib/utils';

type ManiIconProps = {
  className?: string;
  size?: string;
  title?: string;
};

export function ManiIcon({ className = "w-4 h-4", size, title = "MANI" }: ManiIconProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-block shrink-0 rounded-full overflow-hidden align-middle shadow-[0_0_8px_rgba(251,191,36,0.45)]",
        size,
        className
      )}
    >
      <img src="/mani.jpg" alt="MANI" className="w-full h-full object-cover scale-110" />
    </span>
  );
}