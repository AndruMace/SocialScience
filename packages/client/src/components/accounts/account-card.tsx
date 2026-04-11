import { Link } from 'react-router'
import type { AccountSummary } from '@socialscience/shared'
import { XpBar } from '../game/xp-bar'
import { LevelBadge } from '../game/level-badge'

interface AccountCardProps {
  account: AccountSummary
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <Link to={`/accounts/${account.id}`}>
      <div className="card-pixel pixel-shadow p-4 hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all cursor-pointer space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            {account.avatarUrl ? (
              <img
                src={account.avatarUrl}
                alt=""
                className="w-12 h-12 pixel-border"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-12 h-12 pixel-border bg-[hsl(var(--muted))] flex items-center justify-center font-pixel text-[10px]">
                {account.handle[0]?.toUpperCase()}
              </div>
            )}
            {account.isActive && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[hsl(var(--primary))] pixel-border animate-pixel-blink" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-pixel text-[8px] truncate">@{account.handle}</div>
            <div className="text-xs text-[hsl(var(--secondary))] mt-0.5">{account.platform}</div>
          </div>
          <LevelBadge level={account.summary.level} size="sm" />
        </div>

        {/* XP Bar */}
        <XpBar xp={account.summary.xp} level={account.summary.level} />

        {/* Stats row */}
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{account.summary.followers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>{account.summary.streakDays}d</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
