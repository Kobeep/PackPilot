import { Check, Info, ShieldCheck, CheckCircle, Download } from 'lucide-react';
import { AppModel } from '../types';
import { useAppStore } from '../stores/appStore';
import { clsx } from 'clsx';
import { useState } from 'react';

interface AppCardProps {
  app: AppModel;
}

// Generate a consistent gradient based on app name for the avatar
function getGradient(name: string): string {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-600',
    'from-amber-500 to-orange-500',
    'from-cyan-500 to-blue-500',
    'from-fuchsia-500 to-pink-500',
    'from-lime-500 to-green-500',
    'from-sky-500 to-indigo-500',
    'from-red-500 to-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function AppCard({ app }: AppCardProps) {
  const { selectedApps, toggleAppSelection, openDetail } = useAppStore();
  const isSelected = selectedApps.has(app.id);
  const [imgError, setImgError] = useState(false);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDetail(app);
  };

  const gradient = getGradient(app.name);

  return (
    <div 
      className={clsx(
        "card p-5 flex flex-col gap-3 cursor-pointer group relative overflow-hidden",
        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
      )}
      onClick={() => toggleAppSelection(app)}
    >
      {/* Background glow on select */}
      <div className={clsx(
        "absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none",
        isSelected ? "opacity-100" : "group-hover:opacity-50"
      )} />

      {/* Header: Icon + Name + Controls */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-4">
          {/* App Icon / Avatar */}
          <div className={clsx(
            "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg text-2xl group-hover:scale-105 transition-transform overflow-hidden shrink-0",
            !app.icon_url || imgError ? `bg-gradient-to-br ${gradient}` : ""
          )}>
            {app.icon_url && !imgError ? (
              <img
                src={app.icon_url}
                alt={app.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <span className="font-bold text-white text-xl drop-shadow-lg">
                {app.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text text-lg line-clamp-1">{app.name}</h3>
              {app.is_verified && (
                <span title="Verified source">
                  <ShieldCheck size={16} className="text-primary shrink-0" />
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm line-clamp-1">{app.publisher}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Info button */}
          <button
            onClick={handleInfoClick}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-text-muted hover:text-primary hover:bg-primary/10"
            title="View details"
          >
            <Info size={15} />
          </button>

          {/* Checkbox */}
          <div className={clsx(
            "w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-200",
            isSelected 
              ? "bg-primary border-primary shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110" 
              : "border-white/20 group-hover:border-white/40"
          )}>
            {isSelected && <Check size={14} className="text-white animate-fade-in" />}
          </div>
        </div>
      </div>
      
      {/* Description — always visible, 3 lines */}
      <p className="text-sm text-text-muted/80 line-clamp-3 relative z-10 leading-relaxed">
        {app.description || 'No description available for this package.'}
      </p>

      {/* Footer: version, badges, status */}
      <div className="mt-auto pt-3 flex items-center justify-between text-xs relative z-10 border-t border-white/5">
        <div className="flex items-center gap-2">
          {/* Installed badge */}
          {app.is_installed ? (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success border border-success/20 font-semibold">
              <CheckCircle size={12} />
              Installed
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-hover text-text-muted/60 border border-white/5 font-medium">
              <Download size={12} />
              Available
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {app.version && app.version !== 'Unknown' && app.version !== 'Latest' && (
            <span className="px-2 py-1 rounded-md bg-surface-hover border border-white/5 text-text-muted/60 font-mono">
              v{app.version}
            </span>
          )}
          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 uppercase font-semibold">
            {app.source}
          </span>
        </div>
      </div>
    </div>
  );
}
