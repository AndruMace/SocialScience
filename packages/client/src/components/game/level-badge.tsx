import { getLevelTitle } from '@socialscience/shared'
import { cn } from '../../lib/utils'

interface LevelBadgeProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10 text-[8px]',
  md: 'w-14 h-14 text-[10px]',
  lg: 'w-20 h-20 text-xs',
}

export function LevelBadge({ level, size = 'md', className }: LevelBadgeProps) {
  const title = getLevelTitle(level)
  const color = level >= 75 ? 'var(--accent)' : level >= 40 ? 'var(--secondary)' : level >= 20 ? 'var(--primary)' : 'var(--muted-foreground)'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center pixel-border font-pixel',
        sizeClasses[size],
        className,
      )}
      style={{ borderColor: `hsl(${color})`, backgroundColor: 'hsl(var(--card))' }}
      title={title}
    >
      <span style={{ color: `hsl(${color})` }}>{level}</span>
    </div>
  )
}
