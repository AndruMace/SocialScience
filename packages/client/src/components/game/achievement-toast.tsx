import { useEffect } from 'react'
import { useUIStore } from '../../stores/ui.store'
import { cn } from '../../lib/utils'

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastProps {
  id: string
  title: string
  description?: string
  type: 'achievement' | 'levelup' | 'success' | 'error'
  onDismiss: () => void
}

function Toast({ title, description, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const borderColor =
    type === 'achievement' ? 'hsl(var(--accent))' :
    type === 'levelup' ? 'hsl(var(--primary))' :
    type === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--secondary))'

  const icon =
    type === 'achievement' ? '🏆' :
    type === 'levelup' ? '⬆' :
    type === 'error' ? '✗' : '✓'

  return (
    <div
      className={cn(
        'pointer-events-auto bg-[hsl(var(--card))] px-4 py-3 min-w-[260px]',
        'pixel-shadow animate-in slide-in-from-right',
      )}
      style={{ border: `2px solid ${borderColor}` }}
    >
      <div className="flex gap-3 items-start">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-pixel text-[8px]" style={{ color: borderColor }}>{title}</div>
          {description && <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{description}</div>}
        </div>
      </div>
    </div>
  )
}
