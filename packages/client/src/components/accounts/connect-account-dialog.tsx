import { useState } from 'react'
import { useConnectAccount, useAccounts } from '../../hooks/use-accounts'
import { useUIStore } from '../../stores/ui.store'

interface ConnectAccountDialogProps {
  onClose: () => void
}

export function ConnectAccountDialog({ onClose }: ConnectAccountDialogProps) {
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')

  const { mutateAsync: connectAsync, isPending: connectPending, error: connectError } = useConnectAccount()
  const { data: accounts } = useAccounts()
  const addToast = useUIStore((s) => s.addToast)

  const blueskyLinkedCount = accounts?.filter((a) => a.platform === 'bluesky').length ?? 0
  const partyFull = blueskyLinkedCount >= 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalizedHandle = handle.startsWith('@') ? handle.slice(1) : handle
    try {
      await connectAsync({
        platform: 'bluesky',
        handle: normalizedHandle,
        password,
        serviceUrl: serviceUrl || undefined,
      })
      addToast({
        title: 'ACCOUNT CONNECTED',
        description: `@${normalizedHandle} is now in your party!`,
        type: 'success',
      })
      onClose()
    } catch {
      // error shown inline
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="card-pixel pixel-shadow-primary w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="font-pixel text-[10px] text-[hsl(var(--primary))] mb-2">ADD TO PARTY</div>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
          <strong className="text-[hsl(var(--foreground))]">Link an existing Bluesky account only.</strong> Social Science
          does not create Bluesky accounts. Create yours in the official Bluesky app or at{' '}
          <a
            href="https://bsky.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(var(--secondary))] underline"
          >
            bsky.app
          </a>
          , then connect it here using an <strong>app password</strong> (not your main Bluesky login password).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">PLATFORM</label>
            <div className="pixel-border px-3 py-2 bg-[hsl(var(--muted))] text-sm">Bluesky 🦋</div>
          </div>

          {partyFull && (
            <p className="text-[10px] text-[hsl(var(--destructive))] pixel-border border-[hsl(var(--destructive))] p-2">
              Your party already has 10 Bluesky accounts. Remove one to link another.
            </p>
          )}

          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">HANDLE</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="user.bsky.social"
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">APP PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              minLength={1}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required
            />
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Generate at bsky.app → Settings → App Passwords. This is required so Social Science can act on your behalf
              without your main account password.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">SERVICE URL (optional)</label>
            <input
              type="url"
              value={serviceUrl}
              onChange={(e) => setServiceUrl(e.target.value)}
              placeholder="https://bsky.social"
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
            />
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Leave blank unless your account uses a custom PDS; default is Bluesky’s hosted service.
            </p>
          </div>

          {connectError && (
            <div className="pixel-border border-[hsl(var(--destructive))] p-3 text-[hsl(var(--destructive))] text-sm">
              {(connectError as Error).message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={connectPending || partyFull}
              className="flex-1 btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-2 font-pixel text-[8px]"
            >
              {connectPending ? 'CONNECTING...' : 'CONNECT'}
            </button>
            <button type="button" onClick={onClose} className="btn-pixel px-4 py-2 font-pixel text-[8px]">
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
