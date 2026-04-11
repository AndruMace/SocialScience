import { useLeaderboard } from '../hooks/use-game'
import { useAccounts } from '../hooks/use-accounts'
import { LeaderboardTable } from '../components/game/leaderboard-table'
import { AccountCard } from '../components/accounts/account-card'
import { Link } from 'react-router'

export default function DashboardPage() {
  const { data: leaderboard, isLoading } = useLeaderboard()
  const { data: accounts } = useAccounts()

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-pixel text-[14px] text-[hsl(var(--primary))]">COMMAND CENTER</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">
          {accounts?.length ?? 0} accounts in party
        </p>
      </div>

      {/* Quick stats */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card-pixel p-4">
            <div className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">TOTAL XP</div>
            <div className="text-2xl mt-1 font-pixel text-[hsl(var(--primary))] text-sm">
              {leaderboard.reduce((s, e) => s + e.xp, 0).toLocaleString()}
            </div>
          </div>
          <div className="card-pixel p-4">
            <div className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">TOTAL FOLLOWERS</div>
            <div className="text-2xl mt-1 font-pixel text-[hsl(var(--secondary))] text-sm">
              {leaderboard.reduce((s, e) => s + e.followers, 0).toLocaleString()}
            </div>
          </div>
          <div className="card-pixel p-4">
            <div className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">ACHIEVEMENTS</div>
            <div className="text-2xl mt-1 font-pixel text-[hsl(var(--accent))] text-sm">
              {leaderboard.reduce((s, e) => s + e.achievementCount, 0)}
            </div>
          </div>
        </div>
      )}

      {/* Account grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-[10px]">PARTY MEMBERS</h2>
          <Link to="/accounts" className="text-[hsl(var(--secondary))] text-sm hover:underline">View all →</Link>
        </div>
        {accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((a) => <AccountCard key={a.id} account={a} />)}
          </div>
        ) : (
          <div className="card-pixel p-8 text-center space-y-4">
            <div className="font-pixel text-[10px] text-[hsl(var(--muted-foreground))]">PARTY IS EMPTY</div>
            <p className="text-[hsl(var(--muted-foreground))]">Connect your first Bluesky account to start the game!</p>
            <Link to="/accounts" className="inline-block btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-3 font-pixel text-[8px]">
              ADD MEMBER
            </Link>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="font-pixel text-[10px] mb-4">LEADERBOARD</h2>
        {isLoading ? (
          <div className="text-[hsl(var(--muted-foreground))] font-pixel text-[8px]">LOADING...</div>
        ) : (
          <LeaderboardTable entries={leaderboard ?? []} />
        )}
      </div>
    </div>
  )
}
