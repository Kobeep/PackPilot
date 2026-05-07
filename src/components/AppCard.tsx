import { Check, Info } from 'lucide-react';
import { AppModel } from '../types';
import { useAppStore } from '../stores/appStore';
import { clsx } from 'clsx';

interface AppCardProps {
  app: AppModel;
}

export function AppCard({ app }: AppCardProps) {
  const { selectedApps, toggleAppSelection, openDetail } = useAppStore();
  const isSelected = selectedApps.has(app.id);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDetail(app);
  };

  return (
    <div 
      className={clsx(
        "card p-5 flex flex-col gap-4 cursor-pointer group relative overflow-hidden",
        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
      )}
      onClick={() => toggleAppSelection(app)}
    >
      {/* Background glow effect on select */}
      <div className={clsx(
        "absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none",
        isSelected ? "opacity-100" : "group-hover:opacity-50"
      )} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-xl bg-surface border border-white/10 flex items-center justify-center shadow-lg text-2xl group-hover:scale-105 transition-transform">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
              {app.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-lg line-clamp-1">{app.name}</h3>
            <p className="text-text-muted text-sm line-clamp-1">{app.publisher}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Info button */}
          <button
            onClick={handleInfoClick}
            className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-text-muted hover:text-primary hover:bg-primary/10"
            title="View details"
          >
            <Info size={14} />
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
      
      <p className="text-sm text-text-muted/80 line-clamp-2 mt-2 relative z-10">
        {app.description}
      </p>

      <div className="mt-auto pt-4 flex items-center justify-between text-xs text-text-muted/60 relative z-10">
        <span>{app.version !== 'Unknown' ? `v${app.version}` : ''}</span>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 uppercase font-semibold">
            {app.source}
          </span>
          <span className="px-2 py-1 rounded-md bg-surface-hover border border-white/5">
            {app.category || 'Utility'}
          </span>
        </div>
      </div>
    </div>
  );
}
