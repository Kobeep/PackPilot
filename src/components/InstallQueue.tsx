import { Play, Trash2, Loader2, GripVertical, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { clsx } from 'clsx';
import { useRef, useState } from 'react';

export function InstallQueue() {
  const { selectedApps, installOrder, clearSelection, isInstalling, installSelectedApps, installProgress, deselectApp, reorderInstallQueue } = useAppStore();
  const count = selectedApps.size;
  const [expanded, setExpanded] = useState(false);
  const dragRef = useRef<number | null>(null);

  if (count === 0 && !isInstalling) return null;

  const orderedApps = installOrder
    .map(id => selectedApps.get(id))
    .filter(Boolean);

  const handleDragStart = (index: number) => {
    dragRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragRef.current !== null && dragRef.current !== index) {
      reorderInstallQueue(dragRef.current, index);
      dragRef.current = index;
    }
  };

  const handleDragEnd = () => {
    dragRef.current = null;
  };

  // Count completed
  const completedCount = Object.values(installProgress).filter(p => p.status === 'completed').length;
  const failedCount = Object.values(installProgress).filter(p => p.status === 'failed').length;

  return (
    <div className={clsx(
      "absolute bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] z-20 animate-slide-up transition-all duration-300",
      expanded ? "max-h-[60vh]" : "h-24"
    )}>
      {/* Animated Progress Bar at top border */}
      {isInstalling && (
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-xl bg-surface/50">
          <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-[slide_2s_linear_infinite] w-[200%] bg-[length:50%_100%]" />
        </div>
      )}

      {/* Main bar */}
      <div className="h-24 p-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-lg border border-primary/30">
            {count}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {isInstalling
                ? `Installing... (${completedCount}/${count})`
                : "Apps Selected"}
            </h3>
            <p className="text-text-muted text-sm">
              {isInstalling
                ? (failedCount > 0 ? `${failedCount} failed` : "Please wait...")
                : `Click to ${expanded ? 'collapse' : 'expand'} • Drag to reorder`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isInstalling && (
            <button 
              onClick={clearSelection}
              className="p-3 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
              title="Clear Selection"
            >
              <Trash2 size={20} />
            </button>
          )}
          
          <button 
            onClick={installSelectedApps}
            disabled={isInstalling || count === 0}
            className={clsx(
              "btn btn-primary px-8 py-3 text-base rounded-xl font-semibold shadow-primary/30",
              isInstalling && "opacity-80 cursor-not-allowed"
            )}
          >
            {isInstalling ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Installing...
              </>
            ) : (
              <>
                <Play fill="currentColor" size={18} />
                Install All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded queue list */}
      {expanded && (
        <div className="px-8 pb-6 overflow-y-auto max-h-[calc(60vh-6rem)] space-y-2">
          {orderedApps.map((app, index) => {
            if (!app) return null;
            const progress = installProgress[app.id];
            const statusIcon = progress?.status === 'completed' ? (
              <CheckCircle size={16} className="text-success" />
            ) : progress?.status === 'failed' ? (
              <AlertCircle size={16} className="text-danger" />
            ) : progress?.status === 'installing' ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : null;

            return (
              <div
                key={app.id}
                draggable={!isInstalling}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-background/50 border border-white/5 group"
              >
                {!isInstalling && (
                  <GripVertical size={16} className="text-text-muted/40 cursor-grab group-hover:text-text-muted" />
                )}
                <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-sm font-bold text-text-muted">
                  {app.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{app.name}</p>
                  <p className="text-xs text-text-muted/60">
                    {progress?.message || `${app.source} • ${app.version}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon}
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary uppercase font-semibold">
                    {app.source}
                  </span>
                  {!isInstalling && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deselectApp(app.id); }}
                      className="p-1 text-text-muted/40 hover:text-danger transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {progress && progress.progress > 0 && progress.status !== 'completed' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
