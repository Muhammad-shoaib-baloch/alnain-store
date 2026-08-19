import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, FolderTree, Layers, ShoppingCart, Users, TicketPercent, Star, Boxes,
  Image as ImageIcon, Share2, Settings, Menu, X, ExternalLink, LogOut, Inbox,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useToast } from '@/context/ToastContext'
import { cn, initials } from '@/lib/format'
import { listOrders } from '@/services/orders'
import { listAllReviews } from '@/services/reviews'
import { listMessages } from '@/services/marketing'
import { useLockBodyScroll } from '@/hooks'
import Logo from '@/components/common/Logo'

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/collections', label: 'Collections', icon: Layers },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: 'orders' },
  { to: '/admin/messages', label: 'Messages', icon: Inbox, badge: 'messages' },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, badge: 'reviews' },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { to: '/admin/social-links', label: 'Social Links', icon: Share2 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ onNavigate, badges }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-3 px-6 py-5">
        <Logo onDark size="sm" />
        <span className="border border-gold-500/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gold-400">Admin</span>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {MENU.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium transition-colors',
                isActive ? 'bg-gold-500/15 text-gold-200 border-l-2 border-gold-500' : 'text-ivory/60 border-l-2 border-transparent hover:bg-white/5 hover:text-ivory'
              )
            }
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {badge && badges[badge] > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-ink">
                {badges[badge]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2 py-2 text-[13px] text-ivory/60 transition-colors hover:text-gold-200">
          <ExternalLink size={15} /> View Storefront
        </Link>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { settings, dbVersion } = useSettings()
  const toast = useToast()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  useLockBodyScroll(mobileOpen)

  // sidebar badges (re-derived on every db commit)
  void dbVersion
  void settings
  const badges = {
    orders: listOrders({ perPage: 1000 }).items.filter((o) => o.status === 'pending').length,
    reviews: listAllReviews({ status: 'pending' }).length,
    messages: listMessages({ status: 'new' }).length,
  }

  const handleLogout = () => {
    logout()
    toast('Signed out of admin.', 'info')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream/60">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-ink lg:block">
        <SidebarContent badges={badges} />
      </aside>

      {/* mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-ink/60 animate-fadeIn" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[270px] bg-ink animate-slideInLeft">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 p-1 text-ivory/60 hover:text-ivory" aria-label="Close menu">
              <X size={20} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} badges={badges} />
          </aside>
        </div>
      )}

      {/* main */}
      <div className="lg:pl-60">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink/10 bg-ivory/95 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-ink/70 hover:text-ink lg:hidden" aria-label="Open admin menu">
            <Menu size={20} />
          </button>
          <p className="hidden text-sm text-smoke sm:block">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/" className="btn-outline btn-sm hidden sm:inline-flex">
              <ExternalLink size={13} /> View Store
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-sm text-gold-200">
                {initials(user?.name)}
              </span>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold leading-tight">{user?.name}</p>
                <p className="text-[11px] text-smoke">Administrator</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-smoke transition-colors hover:text-red-600" aria-label="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
