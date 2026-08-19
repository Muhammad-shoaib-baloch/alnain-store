import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, User, MapPin, Heart, Settings, LogOut, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { cn, initials } from '@/lib/format'

const LINKS = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/settings', label: 'Settings', icon: Settings },
]

export default function AccountLayout() {
  const { user, isAdmin, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast('You have been signed out.', 'info')
    navigate('/')
  }

  return (
    <div className="container-x py-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[250px,1fr]">
        {/* sidebar */}
        <aside>
          <div className="card flex items-center gap-3 p-5">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 font-display text-lg text-gold-700">
                {initials(user?.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-smoke">{user?.email}</p>
            </div>
          </div>

          <nav className="scrollbar-none mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-ink text-ivory' : 'text-ink/70 hover:bg-cream hover:text-ink'
                  )
                }
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className="flex shrink-0 items-center gap-3 px-4 py-3 text-sm font-medium text-gold-700 transition-colors hover:bg-gold-50">
                <LayoutGrid size={16} /> Admin Panel
              </NavLink>
            )}
            <button onClick={handleLogout} className="flex shrink-0 items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
