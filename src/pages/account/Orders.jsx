import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import Tabs from '@/components/ui/Tabs'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatPrice } from '@/lib/format'
import { listOrders } from '@/services/orders'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled / Returned' },
]

export default function AccountOrders() {
  usePageTitle('My Orders')
  const { user } = useAuth()
  const [tab, setTab] = useState('all')
  const { items: all } = listOrders({ customerId: user.id, email: user.email, perPage: 100 })

  const orders = all.filter((o) => {
    if (tab === 'active') return ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)
    if (tab === 'delivered') return o.status === 'delivered'
    if (tab === 'cancelled') return ['cancelled', 'returned'].includes(o.status)
    return true
  })

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl">My Orders</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mt-5" />

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders here"
          message="When you place an order, it will show up in this list."
          action={<Link to="/shop" className="btn-primary">Start Shopping</Link>}
          compact
        />
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] pb-4">
                <div>
                  <p className="font-semibold">{o.number}</p>
                  <p className="text-xs text-smoke">Placed {formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={o.paymentStatus === 'paid' ? 'paid' : 'pending'} />
                  <StatusBadge value={o.status} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                <div className="flex items-center">
                  {o.items.slice(0, 4).map((item, i) => (
                    <SmartImage
                      key={i}
                      src={item.image}
                      alt={item.name}
                      className="-ml-2 h-14 w-12 border-2 border-ivory object-cover first:ml-0"
                    />
                  ))}
                  {o.items.length > 4 && (
                    <span className="-ml-2 flex h-14 w-12 items-center justify-center border-2 border-ivory bg-cream text-xs font-semibold text-smoke">
                      +{o.items.length - 4}
                    </span>
                  )}
                  <p className="ml-3 text-sm text-smoke">
                    {o.items.reduce((s, i) => s + i.qty, 0)} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-display text-lg">{formatPrice(o.total)}</p>
                  <Link to={`/account/orders/${o.id}`} className="btn-outline btn-sm">
                    View / Track
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
