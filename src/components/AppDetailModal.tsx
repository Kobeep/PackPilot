import { X, Download, Trash2, Tag, Box, User, Info, ShieldCheck, ShieldOff, CheckCircle } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { clsx } from 'clsx';
import { useState } from 'react';

// Same gradient function as AppCard for consistency
function getGradient(name: string): string {
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500', 'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
    'from-amber-500 to-orange-500', 'from-cyan-500 to-blue-500',
    'from-fuchsia-500 to-pink-500', 'from-lime-500 to-green-500',
    'from-sky-500 to-indigo-500', 'from-red-500 to-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return gradients[Math.abs(hash) % gradients.length];
}

export function AppDetailModal() {
  const { detailApp, closeDetail, selectedApps, toggleAppSelection, uninstallApp } = useAppStore();
  const [imgError, setImgError] = useState(false);

  if (!detailApp) return null;

  const isSelected = selectedApps.has(detailApp.id);
  const gradient = getGradient(detailApp.name);

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
            <div className={clsx(
              "w-20 h-20 rounded-2xl border-4 border-surface flex items-center justify-center shadow-xl text-3xl overflow-hidden",
              !detailApp.icon_url || imgError ? `bg-gradient-to-br ${gradient}` : "bg-surface"
            )}>
              {detailApp.icon_url && !imgError ? (
                <img
                  src={detailApp.icon_url}
                  alt={detailApp.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-bold text-white drop-shadow-lg">
                  {detailApp.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-6 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text">{detailApp.name}</h2>
                {detailApp.is_verified && (
                  <span title="Verified source">
                    <ShieldCheck size={20} className="text-primary" />
                  </span>
                )}
              </div>
              <p className="text-text-muted text-sm mt-1">{detailApp.publisher}</p>
            </div>

            <p className="text-text-muted/90 text-sm leading-relaxed">
              {detailApp.description || 'No description available for this application.'}
            </p>

            {/* Meta info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Tag size={14} className="text-primary" />
                <span>{detailApp.version && detailApp.version !== 'Unknown' ? `v${detailApp.version}` : 'Latest'}</span>
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

            {/* Status badges */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase font-semibold tracking-wider">
                {detailApp.source}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-surface-hover border border-white/5 text-text-muted">
                {detailApp.category || 'Utility'}
              </span>
              {detailApp.is_installed ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/20 font-semibold">
                  <CheckCircle size={12} /> Installed
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-lg bg-surface-hover text-text-muted border border-white/5 font-medium">
                  Not installed
                </span>
              )}
              {detailApp.is_verified ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-semibold">
                  <ShieldCheck size={12} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  <ShieldOff size={12} /> Community
                </span>
              )}
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

              {detailApp.is_installed && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
