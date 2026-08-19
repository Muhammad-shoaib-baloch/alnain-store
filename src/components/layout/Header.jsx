import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, User, Heart, ShoppingBag, Menu, ChevronDown, LayoutDashboard, Package, LogOut, Settings } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import { getCategories, getCollections } from '@/services/catalog'
import { cn } from '@/lib/format'
import MobileMenu from './MobileMenu'
import SearchOverlay from './SearchOverlay'
import Logo from '@/components/common/Logo'

function CountBadge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

const navLinkClass = ({ isActive }) =>
  cn(
    'relative py-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-gold-500 after:transition-transform after:duration-300',
    isActive ? 'text-ink after:scale-x-100' : 'text-ink/70 hover:text-ink after:scale-x-0 hover:after:scale-x-100'
  )

export default function Header() {
  const { settings } = useSettings()
  const { user, isAdmin, logout } = useAuth()
  const { count: cartCount } = useCart()
  const { count: wishCount } = useWishlist()
  const toast = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // top-level active categories drive the menu (admin-managed, nothing hardcoded)
  const categories = getCategories({ activeOnly: true }).filter((c) => !c.parentId)
  const collections = getCollections({ activeOnly: true })

  const handleLogout = () => {
    logout()
    toast('You have been signed out.', 'info')
    navigate('/')
  }

  const iconBtn = 'relative flex h-10 w-10 items-center justify-center text-ink/80 transition-colors hover:text-gold-600'

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.08] bg-ivory/95 backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-3 lg:h-[76px]">
        {/* mobile hamburger */}
        <button className={cn(iconBtn, 'lg:hidden -ml-2')} onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>

        {/* logo */}
        <Link to="/" className="flex items-center lg:min-w-[150px]" aria-label={`${settings?.general?.storeName || 'Al Nain'} — home`}>
          <Logo size="md" />
        </Link>

        {/* desktop nav */}
        <nav className="mx-auto hidden items-center gap-7 lg:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/shop" className={navLinkClass} end>
            Shop All
          </NavLink>

          {categories.map((cat) => (
            <NavLink key={cat.id} to={`/shop/${cat.slug}`} className={navLinkClass}>
              {cat.name}
            </NavLink>
          ))}

          {/* Collections dropdown */}
          <div className="group relative">
            <NavLink to="/collections" className={navLinkClass}>
              <span className="flex items-center gap-1">
                Collections <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />
              </span>
            </NavLink>
            <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <ul className="border border-ink/10 bg-ivory py-2 shadow-lift">
                {collections.map((c) => (
                  <li key={c.id}>
                    <Link to={`/collections/${c.slug}`} className="block px-5 py-2 text-sm text-ink/75 transition-colors hover:bg-cream hover:text-ink">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* right icons */}
        <div className="ml-auto flex items-center lg:ml-0 lg:min-w-[150px] lg:justify-end">
          <button className={iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search size={20} />
          </button>

          {/* account */}
          <div className="group relative hidden sm:block">
            <Link to={user ? '/account' : '/login'} className={iconBtn} aria-label="Account">
              <User size={20} />
            </Link>
            <div className="invisible absolute right-0 top-full z-50 w-52 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="border border-ink/10 bg-ivory py-2 shadow-lift">
                {user ? (
                  <>
                    <p className="border-b border-ink/10 px-4 py-2.5 text-xs text-smoke">
                      Signed in as <span className="font-semibold text-ink">{user.name.split(' ')[0]}</span>
                    </p>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gold-700 hover:bg-cream">
                        <LayoutDashboard size={15} /> Admin Panel
                      </Link>
                    )}
                    <Link to="/account" className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink/80 hover:bg-cream hover:text-ink">
                      <User size={15} /> My Account
                    </Link>
                    <Link to="/account/orders" className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink/80 hover:bg-cream hover:text-ink">
                      <Package size={15} /> My Orders
                    </Link>
                    <Link to="/account/settings" className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink/80 hover:bg-cream hover:text-ink">
                      <Settings size={15} /> Settings
                    </Link>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-cream">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-sm text-ink/80 hover:bg-cream hover:text-ink">
                      Sign In
                    </Link>
                    <Link to="/register" className="block px-4 py-2 text-sm text-ink/80 hover:bg-cream hover:text-ink">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <Link to={user ? '/account/wishlist' : '/login?next=%2Faccount%2Fwishlist'} className={cn(iconBtn, 'hidden sm:flex')} aria-label="Wishlist">
            <Heart size={20} />
            <CountBadge count={wishCount} />
          </Link>

          <Link to="/cart" className={cn(iconBtn, '-mr-2')} aria-label="Cart">
            <ShoppingBag size={20} />
            <CountBadge count={cartCount} />
          </Link>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
