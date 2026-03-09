import { AlertTriangle } from 'lucide-react'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}: Props): React.ReactElement {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50">
      <div className="bg-bg border border-border rounded-xl w-[400px] shadow-2xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-error/10' : 'bg-warning/10'}`}>
              <AlertTriangle size={20} className={variant === 'danger' ? 'text-error' : 'text-warning'} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              variant === 'danger'
                ? 'bg-error text-white hover:bg-error/90'
                : 'bg-warning text-bg hover:bg-warning/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
