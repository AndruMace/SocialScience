import { useState } from 'react'
import { usePosts } from '../hooks/use-posts'
import { PostCard } from '../components/posts/post-card'
import { useAccounts } from '../hooks/use-accounts'

const STATUSES = ['all', 'queued', 'scheduled', 'draft', 'published', 'failed']

export default function PostQueuePage() {
  const [accountFilter, setAccountFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: posts } = usePosts(accountFilter || undefined, statusFilter === 'all' ? undefined : statusFilter)
  const { data: accounts } = useAccounts()

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-pixel text-[12px] text-[hsl(var(--primary))]">QUEST LOG</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none"
        >
          <option value="">All Accounts</option>
          {accounts?.map((a) => <option key={a.id} value={a.id}>@{a.handle}</option>)}
        </select>
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs pixel-border transition-colors ${
                statusFilter === s
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]'
                  : 'hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      ) : (
        <div className="card-pixel p-8 text-center text-[hsl(var(--muted-foreground))]">
          <div className="font-pixel text-[8px]">NO QUESTS FOUND</div>
          <p className="mt-2">Generate some posts from an account to populate the queue.</p>
        </div>
      )}
    </div>
  )
}
