import { useNavigate } from 'react-router-dom'
import { ChevronRight, User, Package, Heart, LogOut, LayoutDashboard } from 'lucide-react'
import Drawer from '@/components/ui/Drawer'
import Accordion from '@/components/ui/Accordion'
import SocialIcon from '@/components/common/SocialIcon'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { getCategories, getCollections } from '@/services/catalog'

export default function MobileMenu({ open, onClose, onLogout }) {
  const { user, isAdmin } = useAuth()
  const { socials, settings } = useSettings()
  const navigate = useNavigate()
  const categories = getCategories({ activeOnly: true }).filter((c) => !c.parentId)
  const collections = getCollections({ activeOnly: true })

  const go = (to) => {
    onClose()
    navigate(to)
  }

  const row = 'flex w-full items-center justify-between border-b border-ink/10 py-4 text-sm font-medium'

  return (
    <Drawer open={open} onClose={onClose} side="left" width="max-w-[330px]" title={settings?.general?.storeName || 'Menu'}>
      <div className="flex h-full flex-col">
        <nav className="px-5 pb-6">
          <button onClick={() => go('/')} className={row}>
            Home <ChevronRight size={15} className="text-smoke" />
          </button>
          <button onClick={() => go('/shop')} className={row}>
            Shop All <ChevronRight size={15} className="text-smoke" />
          </button>

          {categories.map((cat) => (
            <button key={cat.id} onClick={() => go(`/shop/${cat.slug}`)} className={row}>
              {cat.name} <ChevronRight size={15} className="text-smoke" />
            </button>
          ))}

          <Accordion title="Collections">
            <ul className="space-y-1">
              {collections.map((c) => (
                <li key={c.id}>
                  <button onClick={() => go(`/collections/${c.slug}`)} className="block w-full py-1.5 text-left text-sm text-ink/75">
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </Accordion>
        </nav>

        <div className="mt-auto border-t border-ink/10 bg-cream/60 px-5 py-5">
          {user ? (
            <div className="space-y-1">
              <p className="mb-3 text-xs text-smoke">
                Signed in as <span className="font-semibold text-ink">{user.name}</span>
              </p>
              {isAdmin && (
                <button onClick={() => go('/admin')} className="flex w-full items-center gap-2.5 py-2 text-sm font-medium text-gold-700">
                  <LayoutDashboard size={16} /> Admin Panel
                </button>
              )}
              <button onClick={() => go('/account')} className="flex w-full items-center gap-2.5 py-2 text-sm">
                <User size={16} /> My Account
              </button>
              <button onClick={() => go('/account/orders')} className="flex w-full items-center gap-2.5 py-2 text-sm">
                <Package size={16} /> My Orders
              </button>
              <button onClick={() => go('/account/wishlist')} className="flex w-full items-center gap-2.5 py-2 text-sm">
                <Heart size={16} /> Wishlist
              </button>
              <button
                onClick={() => {
                  onClose()
                  onLogout()
                }}
                className="flex w-full items-center gap-2.5 py-2 text-sm text-red-600"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => go('/login')} className="btn-primary btn-sm flex-1">
                Sign In
              </button>
              <button onClick={() => go('/register')} className="btn-outline btn-sm flex-1">
                Register
              </button>
            </div>
          )}

          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-4 border-t border-ink/10 pt-4">
              {socials.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} className="text-smoke transition-colors hover:text-gold-600">
                  <SocialIcon platform={s.platform} size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}
