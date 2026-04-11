import { NavLink } from 'react-router'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth.store'

const navItems = [
  { to: '/', label: 'COMMAND', icon: '⚔', end: true },
  { to: '/accounts', label: 'PARTY', icon: '👥' },
  { to: '/queue', label: 'QUESTS', icon: '📜' },
  { to: '/achievements', label: 'TROPHIES', icon: '🏆' },
  { to: '/settings', label: 'OPTIONS', icon: '⚙' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-52 flex-shrink-0 bg-[hsl(var(--card))] border-r-2 border-[hsl(var(--border))] flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b-2 border-[hsl(var(--border))]">
        <div className="font-pixel text-[9px] text-[hsl(var(--primary))] leading-relaxed">
          SOCIAL<br />SCIENCE
        </div>
        <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">v0.1.0</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                'border-l-4 hover:bg-[hsl(var(--muted))]',
                isActive
                  ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                  : 'border-transparent text-[hsl(var(--foreground))]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="font-pixel text-[7px] tracking-wide">{item.label}</span>
                {isActive && <span className="ml-auto animate-pixel-blink text-[hsl(var(--primary))]">◀</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t-2 border-[hsl(var(--border))]">
        <div className="text-xs text-[hsl(var(--muted-foreground))] truncate mb-2">{user?.email}</div>
        <button
          onClick={logout}
          className="w-full text-left text-xs text-[hsl(var(--destructive))] hover:underline font-pixel text-[7px]"
        >
          LOGOUT
        </button>
      </div>
    </aside>
  )
}
