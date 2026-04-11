import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import type { AuthResponse } from '@socialscience/shared'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await api.post<AuthResponse>('/auth/register', { email, password, displayName: displayName || undefined })
      setAuth(token, user)
      navigate('/accounts')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="w-full max-w-sm card-pixel pixel-shadow-primary p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-pixel text-[12px] text-[hsl(var(--primary))] leading-relaxed">NEW GAME</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">CREATE YOUR ACCOUNT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">PLAYER NAME (optional)</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Hero Name"
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]" />
          </div>
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required autoFocus autoComplete="email" />
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
              We’ll use this address for <strong>Social Science</strong> login, password reset, and other platform
              verification—it should be an inbox you can access.
            </p>
          </div>
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required minLength={8} />
          </div>
          {error && <div className="text-[hsl(var(--destructive))] text-sm pixel-border border-[hsl(var(--destructive))] p-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3 font-pixel text-[8px]">
            {loading ? 'CREATING...' : 'START GAME'}
          </button>
        </form>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Already playing?{' '}
          <Link to="/login" className="text-[hsl(var(--secondary))] hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
