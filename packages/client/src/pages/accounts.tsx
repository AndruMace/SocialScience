import { useState } from 'react'
import { useAccounts } from '../hooks/use-accounts'
import { AccountCard } from '../components/accounts/account-card'
import { ConnectAccountDialog } from '../components/accounts/connect-account-dialog'

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts()
  const [showConnect, setShowConnect] = useState(false)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-[12px] text-[hsl(var(--primary))]">PARTY ({accounts?.length ?? 0}/10)</h1>
        <button
          onClick={() => setShowConnect(true)}
          className="btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 font-pixel text-[8px]"
          disabled={(accounts?.length ?? 0) >= 10}
        >
          + ADD MEMBER
        </button>
      </div>

      {isLoading && <div className="font-pixel text-[8px] text-[hsl(var(--muted-foreground))]">LOADING PARTY...</div>}

      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => <AccountCard key={a.id} account={a} />)}
        </div>
      ) : !isLoading && (
        <div className="card-pixel p-8 text-center space-y-4">
          <div className="font-pixel text-[10px] text-[hsl(var(--muted-foreground))]">NO MEMBERS YET</div>
          <p className="text-[hsl(var(--muted-foreground))]">Connect a Bluesky account to begin your journey.</p>
          <button onClick={() => setShowConnect(true)} className="btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-3 font-pixel text-[8px]">
            RECRUIT FIRST MEMBER
          </button>
        </div>
      )}

      {showConnect && <ConnectAccountDialog onClose={() => setShowConnect(false)} />}
    </div>
  )
}
