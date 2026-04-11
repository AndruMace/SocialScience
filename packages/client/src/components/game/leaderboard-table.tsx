import type { LeaderboardEntry } from '@socialscience/shared'
import { LevelBadge } from './level-badge'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
        <div className="font-pixel text-[10px] mb-2">NO ACCOUNTS YET</div>
        <div>Connect your first account to start the game!</div>
      </div>
    )
  }

  return (
    <div className="pixel-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[hsl(var(--muted))] border-b-2 border-[hsl(var(--border))]">
            <th className="font-pixel text-[8px] p-3 text-left text-[hsl(var(--muted-foreground))]">RANK</th>
            <th className="font-pixel text-[8px] p-3 text-left text-[hsl(var(--muted-foreground))]">ACCOUNT</th>
            <th className="font-pixel text-[8px] p-3 text-right text-[hsl(var(--muted-foreground))]">LVL</th>
            <th className="font-pixel text-[8px] p-3 text-right text-[hsl(var(--muted-foreground))]">XP</th>
            <th className="font-pixel text-[8px] p-3 text-right text-[hsl(var(--muted-foreground))]">FOLLOWERS</th>
            <th className="font-pixel text-[8px] p-3 text-right text-[hsl(var(--muted-foreground))]">STREAK</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.accountId}
              className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <td className="p-3">
                <span className={`font-pixel text-[10px] ${entry.rank === 1 ? 'text-[hsl(var(--accent))]' : entry.rank === 2 ? 'text-[hsl(var(--muted-foreground))]' : ''}`}>
                  #{entry.rank}
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="w-8 h-8 pixel-border" style={{ imageRendering: 'pixelated' }} />
                  ) : (
                    <div className="w-8 h-8 pixel-border bg-[hsl(var(--muted))] flex items-center justify-center text-xs">
                      {entry.handle[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-pixel text-[8px]">@{entry.handle}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{entry.platform}</div>
                  </div>
                </div>
              </td>
              <td className="p-3 text-right">
                <LevelBadge level={entry.level} size="sm" />
              </td>
              <td className="p-3 text-right font-pixel text-[10px] text-[hsl(var(--primary))]">
                {entry.xp.toLocaleString()}
              </td>
              <td className="p-3 text-right">
                {entry.followers.toLocaleString()}
              </td>
              <td className="p-3 text-right">
                <span className={entry.streak > 0 ? 'text-orange-400' : 'text-[hsl(var(--muted-foreground))]'}>
                  {entry.streak > 0 ? `🔥${entry.streak}` : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
