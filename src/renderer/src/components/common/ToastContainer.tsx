import { useToastStore } from '../../stores/toast.store'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { clsx } from 'clsx'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

const COLORS = {
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-error/10 border-error/30 text-error',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-accent/10 border-accent/30 text-accent'
}

export function ToastContainer(): React.ReactElement | null {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className={clsx(
              'flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-in slide-in-from-right',
              COLORS[t.type]
            )}
          >
            <Icon size={16} className="shrink-0 mt-0.5" />
            <span className="text-sm text-text-primary flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
