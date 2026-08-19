import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, Heart, ArrowRight } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAuth } from '@/context/AuthContext'
import { useWishlist } from '@/context/WishlistContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatPrice } from '@/lib/format'
import { listOrders } from '@/services/orders'

export default function AccountDashboard() {
  usePageTitle('My Account')
  const { user } = useAuth()
  const { count: wishCount } = useWishlist()
  const { items: orders } = listOrders({ customerId: user.id, email: user.email, perPage: 100 })

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package },
    { label: 'In Progress', value: orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length, icon: Clock },
    { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, icon: CheckCircle2 },
    { label: 'Wishlist', value: wishCount, icon: Heart },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl">
        Salaam, {user.name.split(' ')[0]} <span className="text-gold-500">👋</span>
      </h1>
      <p className="mt-1.5 text-sm text-smoke">
        From your dashboard you can track orders, manage addresses and update your details.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center bg-gold-50 text-gold-600">
              <Icon size={18} />
            </span>
            <p className="mt-3 font-display text-2xl">{value}</p>
            <p className="text-xs uppercase tracking-wider text-smoke">{label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-lg">Recent Orders</h2>
          <Link to="/account/orders" className="link-underline flex items-center gap-1 text-xs font-semibold text-gold-700">
            View All <ArrowRight size={13} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-smoke">
            No orders yet —{' '}
            <Link to="/shop" className="font-semibold text-gold-700 underline">start shopping</Link>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 4).map((o) => (
                  <tr key={o.id}>
                    <td className="font-semibold">{o.number}</td>
                    <td className="text-smoke">{formatDate(o.createdAt)}</td>
                    <td className="text-smoke">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className="font-medium">{formatPrice(o.total)}</td>
                    <td><StatusBadge value={o.status} /></td>
                    <td>
                      <Link to={`/account/orders/${o.id}`} className="text-xs font-semibold text-gold-700 underline underline-offset-2">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
