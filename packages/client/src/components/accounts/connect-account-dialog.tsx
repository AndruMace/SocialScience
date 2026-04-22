import { useState } from 'react'
import type { SupportedPlatform } from '@socialscience/shared'
import { useConnectAccount, useAccounts } from '../../hooks/use-accounts'
import { useUIStore } from '../../stores/ui.store'

interface ConnectAccountDialogProps {
  onClose: () => void
}

export function ConnectAccountDialog({ onClose }: ConnectAccountDialogProps) {
  const [platform, setPlatform] = useState<SupportedPlatform>('bluesky')
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')

  const { mutateAsync: connectAsync, isPending: connectPending, error: connectError } = useConnectAccount()
  const { data: accounts } = useAccounts()
  const addToast = useUIStore((s) => s.addToast)

  const partyFull = (accounts?.length ?? 0) >= 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalizedHandle = handle.startsWith('@') ? handle.slice(1) : handle
    try {
      await connectAsync({
        platform,
        handle: normalizedHandle,
        password,
        serviceUrl: platform === 'bluesky' ? serviceUrl || undefined : undefined,
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
          {platform === 'bluesky' ? (
            <>
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
            </>
          ) : (
            <>
              <strong className="text-[hsl(var(--foreground))]">Link an existing X account.</strong> Create a developer app at{' '}
              <a
                href="https://developer.x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--secondary))] underline"
              >
                developer.x.com
              </a>{' '}
              and paste <strong>OAuth 1.0a user credentials</strong> as JSON (API Key, Secret, Access Token, Access Secret) or
              an <strong>OAuth 2.0 user access token</strong> string. Your username must match the signed-in account.
            </>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">PLATFORM</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SupportedPlatform)}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
            >
              <option value="bluesky">Bluesky 🦋</option>
              <option value="x">X</option>
            </select>
          </div>

          {partyFull && (
            <p className="text-[10px] text-[hsl(var(--destructive))] pixel-border border-[hsl(var(--destructive))] p-2">
              Your party already has 10 linked accounts. Remove one to add another.
            </p>
          )}

          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
              {platform === 'bluesky' ? 'HANDLE' : 'USERNAME'}
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={platform === 'bluesky' ? 'user.bsky.social' : 'username'}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
              {platform === 'bluesky' ? 'APP PASSWORD' : 'API CREDENTIALS'}
            </label>
            {platform === 'bluesky' ? (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                minLength={1}
                className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                required
              />
            ) : (
              <textarea
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`{\n  "appKey": "...",\n  "appSecret": "...",\n  "accessToken": "...",\n  "accessSecret": "..."\n}`}
                minLength={1}
                rows={5}
                className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] font-mono text-xs"
                required
              />
            )}
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {platform === 'bluesky' ? (
                <>
                  Generate at bsky.app → Settings → App Passwords. This is required so Social Science can act on your behalf
                  without your main account password.
                </>
              ) : (
                <>
                  OAuth 1.0a: paste JSON with appKey, appSecret, accessToken, and accessSecret from your X developer app
                  (User authentication settings). OAuth 2.0: paste the user access token alone if you obtained it elsewhere.
                </>
              )}
            </p>
          </div>

          {platform === 'bluesky' && (
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
          )}

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
