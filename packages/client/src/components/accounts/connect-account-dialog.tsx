import { useEffect, useRef, useState } from 'react'
import { suggestSubaddressEmail } from '@socialscience/shared'
import { useConnectAccount, useRegisterBlueskyAccount, useAccounts } from '../../hooks/use-accounts'
import { useAuthStore } from '../../stores/auth.store'
import { useUIStore } from '../../stores/ui.store'

type Mode = 'connect' | 'create'

interface ConnectAccountDialogProps {
  onClose: () => void
}

export function ConnectAccountDialog({ onClose }: ConnectAccountDialogProps) {
  const [mode, setMode] = useState<Mode>('connect')

  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')

  const [createEmail, setCreateEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { mutateAsync: connectAsync, isPending: connectPending, error: connectError } = useConnectAccount()
  const { mutateAsync: registerAsync, isPending: registerPending, error: registerError } =
    useRegisterBlueskyAccount()
  const { data: accounts } = useAccounts()
  const profileEmail = useAuthStore((s) => s.user?.email ?? '')
  const addToast = useUIStore((s) => s.addToast)

  const blueskyLinkedCount = accounts?.filter((a) => a.platform === 'bluesky').length ?? 0
  const slotForNewAccount = blueskyLinkedCount + 1
  const suggestedBlueskyEmail =
    profileEmail && slotForNewAccount <= 10 ? suggestSubaddressEmail(profileEmail, slotForNewAccount) : null

  const suggestionKeyRef = useRef<string>('')
  useEffect(() => {
    if (mode !== 'create' || !profileEmail || !suggestedBlueskyEmail) return
    const key = `${profileEmail}:${slotForNewAccount}`
    if (suggestionKeyRef.current === key) return
    suggestionKeyRef.current = key
    setCreateEmail(suggestedBlueskyEmail)
  }, [mode, profileEmail, slotForNewAccount, suggestedBlueskyEmail])

  const isPending = mode === 'connect' ? connectPending : registerPending
  const error = mode === 'connect' ? connectError : registerError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalizedHandle = handle.startsWith('@') ? handle.slice(1) : handle
    try {
      if (mode === 'connect') {
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
      } else {
        await registerAsync({
          handle: normalizedHandle,
          password,
          email: createEmail.trim(),
          inviteCode: inviteCode.trim() || undefined,
          verificationCode: verificationCode.trim() || undefined,
          serviceUrl: serviceUrl.trim() || undefined,
        })
        addToast({
          title: 'BLUESKY ACCOUNT CREATED',
          description: 'Your new account is connected and ready.',
          type: 'success',
        })
      }
      onClose()
    } catch {
      // error shown inline
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="card-pixel pixel-shadow-primary w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="font-pixel text-[10px] text-[hsl(var(--primary))] mb-4">ADD TO PARTY</div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('connect')}
            className={`flex-1 btn-pixel py-2 font-pixel text-[7px] ${
              mode === 'connect' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
            }`}
          >
            LINK EXISTING
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 btn-pixel py-2 font-pixel text-[7px] ${
              mode === 'create' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
            }`}
          >
            CREATE NEW
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">PLATFORM</label>
            <div className="pixel-border px-3 py-2 bg-[hsl(var(--muted))] text-sm">Bluesky 🦋</div>
          </div>

          {mode === 'create' && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
              Sign up on Bluesky’s network from here. Enter a handle like <strong>yourname</strong> (we use{' '}
              <strong>yourname.bsky.social</strong>) or a full handle if you use a custom domain.
            </p>
          )}

          {mode === 'create' && slotForNewAccount > 10 && (
            <p className="text-[10px] text-[hsl(var(--destructive))] pixel-border border-[hsl(var(--destructive))] p-2">
              Your party already has 10 Bluesky members. Remove one to create another.
            </p>
          )}

          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">HANDLE</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={mode === 'create' ? 'yourname' : 'user.bsky.social'}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
              {mode === 'create' ? 'PASSWORD' : 'APP PASSWORD'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'create' ? 'At least 8 characters' : 'xxxx-xxxx-xxxx-xxxx'}
              minLength={mode === 'create' ? 8 : 1}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required
            />
            {mode === 'connect' ? (
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Generate at bsky.app → Settings → App Passwords
              </p>
            ) : (
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                This becomes your Bluesky login password (not an app password).
              </p>
            )}
          </div>

          {mode === 'create' && (
            <div className="space-y-1">
              <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
                EMAIL (Bluesky verification)
              </label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder={suggestedBlueskyEmail ?? 'you@email.com'}
                autoComplete="email"
                required
                className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              />
              {suggestedBlueskyEmail && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateEmail(suggestedBlueskyEmail)
                      suggestionKeyRef.current = `${profileEmail}:${slotForNewAccount}`
                    }}
                    className="text-[10px] font-pixel text-[hsl(var(--secondary))] underline"
                  >
                    Use suggested address
                  </button>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Slot {slotForNewAccount} of 10 party members
                  </span>
                </div>
              )}
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                This address is for <strong>Bluesky</strong> (not Social Science): verification links and account recovery.
                We pre-fill a <strong>subaddress</strong>—the same inbox as your profile email with a{' '}
                <strong>+ssbsky{slotForNewAccount}</strong> tag before <strong>@</strong>—so each Bluesky account gets a unique
                address without juggling multiple mailboxes. If your provider doesn’t support subaddressing, replace this
                with any unique address you control (e.g. an alias or relay).
              </p>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] font-pixel text-[hsl(var(--muted-foreground))] underline"
              >
                {showAdvanced ? 'Hide' : 'Show'} advanced (invite / verification / custom PDS)
              </button>
              {showAdvanced && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
                      INVITE CODE
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
                      VERIFICATION CODE
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
                      SERVICE URL
                    </label>
                    <input
                      type="url"
                      value={serviceUrl}
                      onChange={(e) => setServiceUrl(e.target.value)}
                      placeholder="https://bsky.social"
                      className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'connect' && (
            <div className="space-y-1">
              <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">SERVICE URL (optional)</label>
              <input
                type="url"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://bsky.social"
                className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              />
            </div>
          )}

          {error && (
            <div className="pixel-border border-[hsl(var(--destructive))] p-3 text-[hsl(var(--destructive))] text-sm">
              {(error as Error).message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending || (mode === 'create' && slotForNewAccount > 10)}
              className="flex-1 btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-2 font-pixel text-[8px]"
            >
              {isPending ? (mode === 'create' ? 'CREATING...' : 'CONNECTING...') : mode === 'create' ? 'CREATE & CONNECT' : 'CONNECT'}
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
