import { xpForLevel, getLevelTitle } from '@socialscience/shared'
import { cn } from '../../lib/utils'

interface XpBarProps {
  xp: number
  level: number
  className?: string
}

export function XpBar({ xp, level, className }: XpBarProps) {
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const progress = nextLevelXp > currentLevelXp
    ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 100
  const title = getLevelTitle(level)

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-pixel text-[8px] text-[hsl(var(--accent))]">LV.{level} {title}</span>
        <span className="text-[hsl(var(--muted-foreground))]">{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-4 pixel-border bg-[hsl(var(--muted))] relative overflow-hidden">
        <div
          className="h-full bg-[hsl(var(--primary))] animate-xp-fill transition-none"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        {/* Segment lines */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-[hsl(var(--background))] opacity-40"
            style={{ left: `${(i + 1) * 10}%` }}
          />
        ))}
      </div>
      <div className="text-[10px] text-[hsl(var(--muted-foreground))] text-right">
        {nextLevelXp - xp > 0 ? `${(nextLevelXp - xp).toLocaleString()} to LV.${level + 1}` : 'MAX'}
      </div>
    </div>
  )
}
