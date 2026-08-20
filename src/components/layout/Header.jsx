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
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink">
      {count > 99 ? '99+' : count}
    </span>
  )
}

const navLinkClass = ({ isActive }) =>
  cn(
    'relative py-2 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-gold-400 after:transition-transform after:duration-300',
    isActive ? 'text-gold-200 after:scale-x-100' : 'text-ivory/70 hover:text-ivory after:scale-x-0 hover:after:scale-x-100'
  )

const panelClass =
  'invisible absolute top-full z-50 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100'

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

  const handleLogout = async () => {
    await logout()
    toast('You have been signed out.', 'info')
    navigate('/')
  }

  const iconBtn = 'relative flex h-10 w-10 items-center justify-center text-ivory/80 transition-colors hover:text-gold-300'
  const itemClass = 'block px-5 py-2 text-sm text-ivory/70 transition-colors hover:bg-white/5 hover:text-gold-200'

  return (
    <header className="sticky top-0 z-50 border-b border-gold-500/25 bg-ink/95 backdrop-blur-md">
      <div className="container-x flex h-[70px] items-center gap-3 lg:h-20">
        {/* mobile hamburger */}
        <button className={cn(iconBtn, 'lg:hidden -ml-2')} onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>

        {/* original logo */}
        <Link to="/" className="flex items-center lg:min-w-[150px]" aria-label={`${settings?.general?.storeName || 'Al Nain'} — home`}>
          <Logo onDark size="md" />
        </Link>

        {/* desktop nav */}
        <nav className="mx-auto hidden items-center gap-8 lg:flex">
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
            <div className={cn(panelClass, 'left-1/2 w-56 -translate-x-1/2')}>
              <ul className="border border-gold-500/25 bg-charcoal py-2 shadow-lift">
                {collections.map((c) => (
                  <li key={c.id}>
                    <Link to={`/collections/${c.slug}`} className={itemClass}>
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
            <div className={cn(panelClass, 'right-0 w-52')}>
              <div className="border border-gold-500/25 bg-charcoal py-2 shadow-lift">
                {user ? (
                  <>
                    <p className="border-b border-white/10 px-5 py-2.5 text-xs text-ivory/50">
                      Signed in as <span className="font-semibold text-gold-200">{user.name.split(' ')[0]}</span>
                    </p>
                    {isAdmin && (
                      <Link to="/admin" className={cn(itemClass, 'flex items-center gap-2.5 text-gold-300')}>
                        <LayoutDashboard size={15} /> Admin Panel
                      </Link>
                    )}
                    <Link to="/account" className={cn(itemClass, 'flex items-center gap-2.5')}>
                      <User size={15} /> My Account
                    </Link>
                    <Link to="/account/orders" className={cn(itemClass, 'flex items-center gap-2.5')}>
                      <Package size={15} /> My Orders
                    </Link>
                    <Link to="/account/settings" className={cn(itemClass, 'flex items-center gap-2.5')}>
                      <Settings size={15} /> Settings
                    </Link>
                    <button onClick={handleLogout} className={cn(itemClass, 'flex w-full items-center gap-2.5 text-left text-red-400 hover:text-red-300')}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={itemClass}>
                      Sign In
                    </Link>
                    <Link to="/register" className={itemClass}>
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
