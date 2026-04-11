import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, icon, accent, className }: StatCardProps) {
  return (
    <div className={cn('card-pixel p-4', accent && 'pixel-border-primary', className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-base">{icon}</span>}
        <span className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">{label}</span>
      </div>
      <div className={cn('text-2xl', accent && 'font-pixel text-[hsl(var(--primary))] text-lg')}>
        {value}
      </div>
    </div>
  )
}
