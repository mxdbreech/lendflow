import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { NotificationBell } from './NotificationBell'
import { Home, FileText, Users, User, LogOut, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const navItems = [
  { to: '/lender', label: 'Home', icon: Home, end: true },
  { to: '/lender/requests', label: 'Requests', icon: Users },
  { to: '/lender/loans', label: 'My Loans', icon: FileText },
  { to: '/lender/profile', label: 'Profile', icon: User },
]

export function LenderShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const initial = user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop sidebar — dark */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-sidebar shadow-xl">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-white">L</span>
            </div>
            <span className="font-bold text-base tracking-tight text-white">LendFlow</span>
          </div>
          <p className="text-[11px] text-white/40 mt-1 ml-9">Capital Partner Portal</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-0.5">
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight text-white">{user?.name}</p>
              <p className="text-[11px] text-white/40">Lender</p>
            </div>
          </div>
          <button onClick={async () => { await signOut(); navigate('/login') }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-background border-b border-border flex items-center justify-between gap-2 px-3 md:px-6 shadow-sm sticky top-0 z-30 pt-[env(safe-area-inset-top)] min-h-14">
          <div className="flex items-center gap-2 md:hidden min-w-0">
            <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">L</span>
            </div>
            <span className="font-bold text-sm truncate">LendFlow</span>
          </div>
          <div className="hidden md:block text-sm font-semibold">Capital Partner Portal</div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={async () => { await signOut(); navigate('/login') }}
              aria-label="Sign out"
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <Link to="/lender/new-loan"
              aria-label="New loan"
              className="flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold shadow-sm hover:brightness-105 transition-all"
              style={{ background: 'hsl(var(--lime))', color: 'hsl(var(--lime-foreground))' }}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Loan</span>
            </Link>
            <ThemeToggle />
            <NotificationBell />
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1.5">
              <div className="h-4 w-4 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">{initial}</span>
              </div>
              <span className="text-xs font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 px-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="leading-none">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
