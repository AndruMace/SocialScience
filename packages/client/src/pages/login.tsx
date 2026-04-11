import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import type { AuthResponse } from '@socialscience/shared'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await api.post<AuthResponse>('/auth/login', { email, password })
      setAuth(token, user)
      navigate('/')
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
          <h1 className="font-pixel text-[12px] text-[hsl(var(--primary))] leading-relaxed">SOCIAL<br/>SCIENCE</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">PLAYER LOGIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required autoFocus />
          </div>
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              required />
          </div>
          {error && <div className="text-[hsl(var(--destructive))] text-sm pixel-border border-[hsl(var(--destructive))] p-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3 font-pixel text-[8px]">
            {loading ? 'LOADING...' : 'PRESS START'}
          </button>
        </form>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          New player?{' '}
          <Link to="/register" className="text-[hsl(var(--secondary))] hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  )
}
