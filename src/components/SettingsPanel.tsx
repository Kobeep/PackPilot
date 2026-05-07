import { X, Sun, Moon, RefreshCw, Trash2, Info, Keyboard } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { clsx } from 'clsx';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, setTheme, availableManagers, clearCache, checkUpdates } = useAppStore();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel slides in from right */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-surface border-l border-white/10 z-50 animate-slide-up overflow-y-auto shadow-2xl shadow-black/50">
        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-xl z-10">
          <h2 className="text-xl font-bold text-text">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme */}
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Appearance
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={clsx(
                  "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                  settings.theme === 'dark'
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-white/10 text-text-muted hover:border-white/20"
                )}
              >
                <Moon size={18} />
                <span className="font-medium text-sm">Dark</span>
              </button>
              <button
                onClick={() => setTheme('light')}
                className={clsx(
                  "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                  settings.theme === 'light'
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-white/10 text-text-muted hover:border-white/20"
                )}
              >
                <Sun size={18} />
                <span className="font-medium text-sm">Light</span>
              </button>
            </div>
          </section>

          {/* Package Managers */}
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Package Managers
            </h3>
            {availableManagers.length > 0 ? (
              <div className="space-y-2">
                {availableManagers.map((pm) => (
                  <div
                    key={pm.name}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-background/50 border border-white/5"
                  >
                    <span className="font-medium text-sm text-text">{pm.name}</span>
                    <span
                      className={clsx(
                        "text-xs px-2 py-1 rounded-md font-semibold uppercase",
                        pm.available
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-danger/10 text-danger border border-danger/20"
                      )}
                    >
                      {pm.available ? 'Available' : 'Not Found'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted/60">Detecting package managers...</p>
            )}
          </section>

          {/* Actions */}
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={checkUpdates}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background/50 border border-white/5 text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-sm font-medium"
              >
                <RefreshCw size={16} />
                Check for App Updates
              </button>
              <button
                onClick={clearCache}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background/50 border border-white/5 text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                Clear Search Cache
              </button>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              <Keyboard size={14} className="inline mr-2" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['Ctrl + K', 'Focus search'],
                ['Escape', 'Close / Clear search'],
                ['Ctrl + Shift + I', 'Install selected'],
                ['Ctrl + Shift + U', 'Check updates'],
                ['Ctrl + E', 'Export profile'],
                ['Ctrl + I', 'Import profile'],
                ['Ctrl + B', 'Toggle sidebar'],
              ].map(([shortcut, desc]) => (
                <div key={shortcut} className="flex items-center justify-between px-4 py-2 rounded-lg bg-background/30">
                  <span className="text-text-muted">{desc}</span>
                  <kbd className="px-2 py-1 rounded-md bg-surface-hover border border-white/10 text-text-muted text-xs font-mono">
                    {shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              About
            </h3>
            <div className="px-4 py-4 rounded-xl bg-background/50 border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary" />
                <span className="text-sm font-medium text-text">PackPilot v0.1.0</span>
              </div>
              <p className="text-xs text-text-muted/60">
                Your autopilot for app installations. Built with Tauri + React.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
