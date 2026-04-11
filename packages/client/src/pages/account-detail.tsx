import { useState } from 'react'
import { useParams } from 'react-router'
import { useAccount } from '../hooks/use-accounts'
import { usePosts } from '../hooks/use-posts'
import { useGameState, useAchievements, useXpHistory, useAchievementCatalog } from '../hooks/use-game'
import { useAccountAnalytics, useLatestSnapshot, useRefreshAnalytics, useStrategy } from '../hooks/use-analytics'
import { PostCard } from '../components/posts/post-card'
import { GeneratePostDialog } from '../components/posts/generate-post-dialog'
import { XpBar } from '../components/game/xp-bar'
import { LevelBadge } from '../components/game/level-badge'
import { AchievementGrid } from '../components/game/achievement-grid'
import { FollowerChart } from '../components/analytics/follower-chart'
import { StatCard } from '../components/analytics/stat-card'
import { StrategyForm } from '../components/strategy/strategy-form'
import { getLevelTitle } from '@socialscience/shared'

type Tab = 'posts' | 'strategy' | 'analytics' | 'game'

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('posts')
  const [showGenerate, setShowGenerate] = useState(false)

  const { data: account } = useAccount(id!)
  const { data: posts } = usePosts(id)
  const { data: game } = useGameState(id!)
  const { data: achievements } = useAchievements(id!)
  const { data: catalog } = useAchievementCatalog()
  const { data: xpHistory } = useXpHistory(id!)
  const { data: snapshots } = useAccountAnalytics(id!)
  const { data: latest } = useLatestSnapshot(id!)
  const { data: strategy } = useStrategy(id!)
  const { mutate: refresh, isPending: refreshing } = useRefreshAnalytics(id!)

  if (!account) return <div className="font-pixel text-[8px] text-[hsl(var(--muted-foreground))]">LOADING...</div>

  const tabs: Tab[] = ['posts', 'strategy', 'analytics', 'game']

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Account header */}
      <div className="card-pixel p-5 flex items-start gap-4">
        {account.avatarUrl ? (
          <img src={account.avatarUrl} alt="" className="w-16 h-16 pixel-border" style={{ imageRendering: 'pixelated' }} />
        ) : (
          <div className="w-16 h-16 pixel-border bg-[hsl(var(--muted))] flex items-center justify-center font-pixel text-lg">
            {account.handle[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="font-pixel text-[10px]">@{account.handle}</div>
          <div className="text-[hsl(var(--secondary))] text-sm mt-1">{account.platform}</div>
          {game && <div className="text-[hsl(var(--muted-foreground))] text-sm">{getLevelTitle(game.level)}</div>}
        </div>
        {game && <LevelBadge level={game.level} size="lg" />}
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-[hsl(var(--border))]">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-pixel text-[7px] border-b-2 -mb-0.5 transition-colors ${
              tab === t
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div className="space-y-4">
          <button onClick={() => setShowGenerate(true)}
            className="btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 font-pixel text-[8px]">
            ✦ GENERATE POST
          </button>
          {posts && posts.length > 0 ? (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          ) : (
            <div className="card-pixel p-8 text-center text-[hsl(var(--muted-foreground))]">
              <div className="font-pixel text-[8px]">NO POSTS YET</div>
            </div>
          )}
        </div>
      )}

      {/* Strategy tab */}
      {tab === 'strategy' && (
        <StrategyForm accountId={id!} initial={strategy as Parameters<typeof StrategyForm>[0]['initial']} />
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-[9px]">STATS</h2>
            <button onClick={() => refresh()} disabled={refreshing}
              className="btn-pixel px-3 py-1 text-xs font-pixel text-[7px]">
              {refreshing ? 'POLLING...' : '↻ REFRESH'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="FOLLOWERS" value={latest?.followers?.toLocaleString() ?? '—'} icon="👥" accent />
            <StatCard label="FOLLOWING" value={latest?.following?.toLocaleString() ?? '—'} icon="➡" />
            <StatCard label="TOTAL POSTS" value={latest?.totalPosts?.toLocaleString() ?? '—'} icon="📜" />
          </div>
          <div>
            <div className="font-pixel text-[8px] mb-3 text-[hsl(var(--muted-foreground))]">FOLLOWER GROWTH</div>
            <FollowerChart snapshots={snapshots ?? []} />
          </div>
        </div>
      )}

      {/* Game tab */}
      {tab === 'game' && game && (
        <div className="space-y-6">
          <div className="card-pixel p-5 space-y-4">
            <div className="flex items-center gap-4">
              <LevelBadge level={game.level} size="lg" />
              <div className="flex-1">
                <div className="font-pixel text-[10px] text-[hsl(var(--accent))]">{getLevelTitle(game.level)}</div>
                <XpBar xp={game.xp} level={game.level} className="mt-2" />
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div><span className="text-[hsl(var(--muted-foreground))]">Streak: </span>
                <span className="text-orange-400">🔥 {game.streakDays} days</span></div>
              <div><span className="text-[hsl(var(--muted-foreground))]">Achievements: </span>
                <span className="text-[hsl(var(--accent))]">{achievements?.length ?? 0}</span></div>
            </div>
          </div>

          {/* XP History */}
          {xpHistory && xpHistory.length > 0 && (
            <div>
              <div className="font-pixel text-[8px] mb-3 text-[hsl(var(--muted-foreground))]">RECENT XP</div>
              <div className="space-y-2">
                {xpHistory.slice(0, 10).map((e) => (
                  <div key={e.id} className="flex justify-between text-sm pixel-border px-3 py-2">
                    <span>{e.eventType.replace(/_/g, ' ')}</span>
                    <span className="text-[hsl(var(--primary))]">+{e.xpAmount} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div>
            <div className="font-pixel text-[8px] mb-3 text-[hsl(var(--muted-foreground))]">ACHIEVEMENTS</div>
            <AchievementGrid catalog={catalog ?? []} unlocked={achievements ?? []} />
          </div>
        </div>
      )}

      {showGenerate && account && (
        <GeneratePostDialog account={account} onClose={() => setShowGenerate(false)} />
      )}
    </div>
  )
}
