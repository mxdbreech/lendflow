import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { NotificationBell } from './NotificationBell'
import { LayoutDashboard, ClipboardList, FileText, Users, Settings, AlertTriangle, BarChart2, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/queue', label: 'Application Queue', icon: ClipboardList },
  { to: '/admin/loans', label: 'Loan Management', icon: FileText },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/risk', label: 'Risk Monitor', icon: AlertTriangle },
  { to: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  const currentPage = navItems.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))
  const initial = user?.name?.[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  const signOutAndLeave = async () => {
    await signOut()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) => cn(
    'flex items-center gap-2.5 rounded-lg px-3 min-h-11 text-sm font-medium transition-all',
    isActive
      ? 'bg-primary text-white shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  )

  const sidebarBody = (
    <>
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-white">L</span>
          </div>
          <span className="font-bold text-base tracking-tight">LendFlow</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 ml-9">Admin Portal</p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5">
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">Admin</p>
          </div>
        </div>
        <button
          onClick={signOutAndLeave}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 min-h-11 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-dvh bg-background">
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-card border-r border-border shadow-sm">
        {sidebarBody}
      </aside>

      {navOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-card shadow-xl pt-[env(safe-area-inset-top)]">
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border flex items-center justify-between gap-2 px-2 md:px-6 shadow-sm pt-[env(safe-area-inset-top)] min-h-14">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-semibold text-foreground truncate">{currentPage?.label ?? 'Dashboard'}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1.5">
              <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">{initial}</span>
              </div>
              <span className="text-xs font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
