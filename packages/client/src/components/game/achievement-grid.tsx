import type { AchievementDef, Achievement } from '@socialscience/shared'
import { cn } from '../../lib/utils'

interface AchievementGridProps {
  catalog: AchievementDef[]
  unlocked: Achievement[]
  filter?: string
}

const categoryColors: Record<string, string> = {
  followers: 'var(--secondary)',
  posting: 'var(--primary)',
  engagement: 'var(--accent)',
  streak: '0 80% 65%',
  misc: 'var(--muted-foreground)',
}

export function AchievementGrid({ catalog, unlocked, filter }: AchievementGridProps) {
  const unlockedKeys = new Set(unlocked.map((a) => a.achievementKey))
  const filtered = filter ? catalog.filter((a) => a.category === filter) : catalog

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {filtered.map((def) => {
        const isUnlocked = unlockedKeys.has(def.key)
        const unlockedDate = unlocked.find((a) => a.achievementKey === def.key)?.unlockedAt
        const color = categoryColors[def.category] ?? 'var(--muted-foreground)'

        return (
          <div
            key={def.key}
            className={cn(
              'p-3 flex flex-col items-center gap-2 pixel-border pixel-shadow text-center transition-opacity',
              isUnlocked ? 'bg-[hsl(var(--card))]' : 'bg-[hsl(var(--muted))] opacity-50',
            )}
            style={isUnlocked ? { borderColor: `hsl(${color})` } : {}}
            title={isUnlocked ? `Unlocked: ${unlockedDate ? new Date(unlockedDate).toLocaleDateString() : ''}` : 'Locked'}
          >
            <div
              className="w-10 h-10 flex items-center justify-center text-2xl pixel-border"
              style={isUnlocked ? { borderColor: `hsl(${color})` } : {}}
            >
              {isUnlocked ? getCategoryEmoji(def.category) : '?'}
            </div>
            <div className="font-pixel text-[6px] leading-relaxed" style={isUnlocked ? { color: `hsl(${color})` } : {}}>
              {isUnlocked ? def.name : '???'}
            </div>
            {isUnlocked && (
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">{def.description}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function getCategoryEmoji(cat: string) {
  const map: Record<string, string> = {
    followers: '👥',
    posting: '📜',
    engagement: '⚡',
    streak: '🔥',
    misc: '⭐',
  }
  return map[cat] ?? '🏆'
}
