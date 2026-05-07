import { X, Download, Trash2, Tag, Box, User, Info } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { clsx } from 'clsx';

export function AppDetailModal() {
  const { detailApp, closeDetail, selectedApps, toggleAppSelection, uninstallApp } = useAppStore();

  if (!detailApp) return null;

  const isSelected = selectedApps.has(detailApp.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={closeDetail}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div
          className="bg-surface border border-white/10 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg pointer-events-auto animate-slide-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header gradient */}
          <div className="relative h-24 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent">
            <button
              onClick={closeDetail}
              className="absolute top-4 right-4 p-2 rounded-lg bg-surface/50 backdrop-blur text-text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Avatar overlapping header */}
          <div className="px-6 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-surface border-4 border-surface border-white/10 flex items-center justify-center shadow-xl text-3xl">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
                {detailApp.name.charAt(0)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-6 space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-text">{detailApp.name}</h2>
              <p className="text-text-muted text-sm mt-1">{detailApp.publisher}</p>
            </div>

            <p className="text-text-muted/90 text-sm leading-relaxed">
              {detailApp.description || 'No description available for this application.'}
            </p>

            {/* Meta info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Tag size={14} className="text-primary" />
                <span>v{detailApp.version}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Box size={14} className="text-primary" />
                <span className="uppercase font-medium">{detailApp.source}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <User size={14} className="text-primary" />
                <span>{detailApp.publisher}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Info size={14} className="text-primary" />
                <span>{detailApp.category || 'Utility'}</span>
              </div>
            </div>

            {/* Source badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase font-semibold tracking-wider">
                {detailApp.source}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-surface-hover border border-white/5 text-text-muted">
                {detailApp.category || 'Utility'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  toggleAppSelection(detailApp);
                }}
                className={clsx(
                  "flex-1 btn py-3 rounded-xl font-semibold text-sm",
                  isSelected
                    ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                    : "btn-primary"
                )}
              >
                <Download size={16} />
                {isSelected ? 'Selected' : 'Select for Install'}
              </button>

              <button
                onClick={() => {
                  uninstallApp(detailApp.id, detailApp.source);
                  closeDetail();
                }}
                className="btn bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 py-3 rounded-xl font-semibold text-sm"
              >
                <Trash2 size={16} />
                Uninstall
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
