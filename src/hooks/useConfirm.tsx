import React, { useState, ReactNode } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { AlertCircle, X } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  subject?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
  };

  const handleConfirm = async () => {
    if (!options) return;
    setIsLoading(true);
    try {
      await options.onConfirm();
      setOptions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const dialog: ReactNode = options ? (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center font-display">
      <CyberCard variant="danger" hoverEffect={false} className="max-w-md w-full p-8 md:p-10 relative text-left">
        <button
          onClick={() => setOptions(null)}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <AlertCircle size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-red-400 block mb-0.5">
              CONFIRMATION REQUISE
            </span>
            <h3 className="text-xl font-black uppercase text-white leading-tight">
              {options.title}
            </h3>
          </div>
        </div>

        {options.subject && (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 mb-4 text-xs font-mono text-secondary font-bold truncate">
            {options.subject}
          </div>
        )}

        {options.message && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-8">
            {options.message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setOptions(null)}
            className="flex-1 py-3 text-xs font-mono uppercase font-black text-white/50 hover:text-white transition-colors"
          >
            {options.cancelLabel || 'Annuler'}
          </button>
          <NeonButton
            variant="danger"
            disabled={options.isPending || isLoading}
            onClick={handleConfirm}
            className="flex-1 py-3 text-xs font-mono"
          >
            {options.isPending || isLoading ? 'Opération...' : (options.confirmLabel || 'CONFIRMER')}
          </NeonButton>
        </div>
      </CyberCard>
    </div>
  ) : null;

  return {
    confirm,
    dialog
  };
}
