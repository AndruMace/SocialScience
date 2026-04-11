import { useState } from 'react'
import { useGeneratePost } from '../../hooks/use-posts'
import type { Account } from '@socialscience/shared'

interface GeneratePostDialogProps {
  account: Account
  onClose: () => void
}

export function GeneratePostDialog({ account, onClose }: GeneratePostDialogProps) {
  const [hint, setHint] = useState('')
  const { mutateAsync, isPending, error, data: generated } = useGeneratePost()

  async function handleGenerate() {
    await mutateAsync({ accountId: account.id, contextHint: hint || undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="card-pixel pixel-shadow-primary w-full max-w-lg p-6 space-y-4">
        <div className="font-pixel text-[10px] text-[hsl(var(--primary))]">GENERATE QUEST</div>
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Account: @{account.handle}</div>

        <div className="space-y-1">
          <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">CONTEXT HINT (optional)</label>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. trending topic, recent news..."
            className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>

        {generated && (
          <div className="pixel-border border-[hsl(var(--primary))] p-3 bg-[hsl(var(--muted))] space-y-2">
            <div className="font-pixel text-[7px] text-[hsl(var(--primary))]">GENERATED POST:</div>
            <p className="text-base">{generated.content}</p>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Saved to queue — go to Posts to review
            </div>
          </div>
        )}

        {error && (
          <div className="pixel-border border-[hsl(var(--destructive))] p-3 text-[hsl(var(--destructive))] text-sm">
            {(error as Error).message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex-1 btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-2 font-pixel text-[8px]"
          >
            {isPending ? 'GENERATING...' : generated ? 'GENERATE ANOTHER' : 'GENERATE'}
          </button>
          <button onClick={onClose} className="btn-pixel px-4 py-2 font-pixel text-[8px]">
            {generated ? 'DONE' : 'CANCEL'}
          </button>
        </div>
      </div>
    </div>
  )
}
