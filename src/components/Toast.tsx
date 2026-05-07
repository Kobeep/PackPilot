import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { clsx } from 'clsx';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    icon: 'text-success',
    bar: 'bg-success',
  },
  error: {
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    icon: 'text-danger',
    bar: 'bg-danger',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    bar: 'bg-amber-400',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: 'text-primary',
    bar: 'bg-primary',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        const colors = colorMap[toast.type];

        return (
          <div
            key={toast.id}
            className={clsx(
              "relative overflow-hidden rounded-xl border backdrop-blur-xl shadow-2xl shadow-black/30 animate-slide-up",
              colors.bg,
              colors.border
            )}
          >
            {/* Auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
              <div
                className={clsx("h-full animate-[shrink_5s_linear_forwards]", colors.bar)}
              />
            </div>

            <div className="flex items-start gap-3 p-4">
              <Icon size={20} className={clsx("mt-0.5 shrink-0", colors.icon)} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text">{toast.title}</p>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-text-muted/60 hover:text-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
