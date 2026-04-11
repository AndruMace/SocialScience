import { useState } from 'react'
import { useAchievementCatalog } from '../hooks/use-game'
import { useAccounts } from '../hooks/use-accounts'
import { useAchievements } from '../hooks/use-game'
import { AchievementGrid } from '../components/game/achievement-grid'
import type { Achievement } from '@socialscience/shared'

const CATEGORIES = ['all', 'followers', 'posting', 'engagement', 'streak', 'misc']

export default function AchievementsPage() {
  const [category, setCategory] = useState('all')
  const [accountId, setAccountId] = useState('')
  const { data: catalog } = useAchievementCatalog()
  const { data: accounts } = useAccounts()
  const { data: achievements } = useAchievements(accountId)

  // Combine achievements across all accounts if none selected
  const allAchievements: Achievement[] = achievements ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-pixel text-[12px] text-[hsl(var(--accent))]">TROPHY ROOM</h1>

      <div className="flex gap-3 flex-wrap items-center">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none"
        >
          <option value="">Select Account</option>
          {accounts?.map((a) => <option key={a.id} value={a.id}>@{a.handle}</option>)}
        </select>

        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 text-xs pixel-border transition-colors ${
                category === c
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--accent))]'
                  : 'hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {!accountId ? (
        <div className="card-pixel p-8 text-center text-[hsl(var(--muted-foreground))]">
          <div className="font-pixel text-[8px]">SELECT AN ACCOUNT</div>
          <p className="mt-2">Choose an account to view its trophy collection.</p>
        </div>
      ) : (
        <AchievementGrid
          catalog={catalog ?? []}
          unlocked={allAchievements}
          filter={category === 'all' ? undefined : category}
        />
      )}
    </div>
  )
}
