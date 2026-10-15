import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function ImageUploadInput({
  value,
  onChange,
  label = "Affiche / Image (URL ou Fichier)"
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (2 Mo maximum)");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        onChange(res);
        toast.success("Image chargée avec succès !");
      } else {
        toast.error("Erreur lors de la lecture du fichier");
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast.error("Échec de chargement du fichier");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label className="text-[8.5px] uppercase font-black text-white/50 tracking-wider">
          {label}
        </label>
        <div className="flex gap-1 text-[8.5px] font-mono">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded border transition-colors ${
              mode === 'url' ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 text-white/40'
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-2 py-0.5 rounded border transition-colors ${
              mode === 'file' ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 text-white/40'
            }`}
          >
            Fichier
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="relative">
          <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="flex-1 py-2 px-3 bg-white/5 border border-white/10 hover:border-primary rounded-lg text-[11px] font-mono font-black uppercase text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {isUploading ? "Chargement..." : "Choisir depuis le stockage"}
          </button>
        </div>
      )}

      {value && (
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg bg-white/[0.03] border border-white/10">
          <img src={value} alt="Preview" className="w-10 h-10 object-cover rounded-md" />
          <span className="text-[9px] text-white/60 font-mono truncate flex-1">{value.startsWith('data:') ? 'Image locale chargée' : value}</span>
          <span className="text-[8.5px] font-mono text-emerald-400 flex items-center gap-0.5 font-black">
            <Check size={11} /> OK
          </span>
        </div>
      )}
    </div>
  );
}
