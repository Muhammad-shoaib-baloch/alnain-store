import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Banknote, Truck, SearchX } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import SmartImage from '@/components/ui/SmartImage'
import StatusBadge from '@/components/ui/StatusBadge'
import OrderStatusTracker from '@/components/account/OrderStatusTracker'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatDateTime, formatPrice } from '@/lib/format'
import { getOrder, cancelOrder } from '@/services/orders'

export default function AccountOrderDetail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const { dbVersion } = useSettings()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()

  // dbVersion dependency keeps this fresh after cancel/restock
  void dbVersion
  const order = getOrder(id)
  usePageTitle(order ? `Order ${order.number}` : 'Order')

  const owns = order && (order.customerId === user.id || order.email === user.email || isAdmin)

  if (!order || !owns) {
    return (
      <EmptyState
        icon={SearchX}
        title="Order not found"
        message="This order doesn't exist or doesn't belong to your account."
        action={<Link to="/account/orders" className="btn-primary">Back to Orders</Link>}
        compact
      />
    )
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status)

  const handleCancel = async () => {
    const ok = await confirm({
      title: 'Cancel this order?',
      message: `Order ${order.number} will be cancelled and stock returned. This cannot be undone.`,
      confirmText: 'Cancel Order',
    })
    if (!ok) return
    cancelOrder(order.id, { label: 'Cancelled by customer' })
    toast('Your order has been cancelled.', 'info')
  }

  return (
    <div>
      <button onClick={() => navigate('/account/orders')} className="mb-4 flex items-center gap-1.5 text-sm text-smoke transition-colors hover:text-ink">
        <ArrowLeft size={15} /> Back to orders
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Order {order.number}</h1>
          <p className="mt-1 text-sm text-smoke">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={order.paymentStatus} />
          <StatusBadge value={order.status} />
        </div>
      </div>

      {/* tracker */}
      <div className="card mt-6 p-6">
        <OrderStatusTracker status={order.status} />
        {order.trackingNumber && (
          <p className="mt-5 flex items-center gap-2 border-t border-ink/[0.07] pt-4 text-sm">
            <Truck size={16} className="text-gold-600" />
            Tracking number: <span className="font-semibold">{order.trackingNumber}</span>
          </p>
        )}
        {order.status !== 'delivered' && !['cancelled', 'returned'].includes(order.status) && (
          <p className="mt-2 text-xs text-smoke">Estimated delivery: {formatDate(order.estimatedDelivery)}</p>
        )}
      </div>

      {/* items + totals */}
      <div className="card mt-5 overflow-hidden">
        <ul className="divide-y divide-ink/[0.06]">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4">
              <SmartImage src={item.image} alt={item.name} className="h-16 w-14 shrink-0 object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/product/${item.slug}`} className="block truncate text-sm font-medium hover:text-gold-700">
                  {item.name}
                </Link>
                <p className="text-xs text-smoke">
                  {Object.values(item.options).join(' / ')} · SKU {item.sku}
                </p>
                <p className="text-xs text-smoke">Qty {item.qty} × {formatPrice(item.price)}</p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.total)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-ink/10 bg-cream/50 px-5 py-4 text-sm">
          <div className="flex justify-between"><dt className="text-smoke">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-smoke">Shipping ({order.shippingMethod})</dt><dd>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</dd></div>
          {order.tax > 0 && <div className="flex justify-between"><dt className="text-smoke">Tax</dt><dd>{formatPrice(order.tax)}</dd></div>}
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold">
            <dt>Total</dt><dd className="font-display text-lg text-gold-600">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* address + payment + timeline */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-smoke">
            <MapPin size={14} className="text-gold-600" /> Delivery Address
          </p>
          <p className="mt-3 text-sm font-semibold">{order.shippingAddress.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-smoke">
            {order.shippingAddress.address}
            {order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ''}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.country}
            <br />
            {order.shippingAddress.phone}
          </p>
          <p className="mt-4 flex items-center gap-2 border-t border-ink/[0.07] pt-3 text-sm">
            <Banknote size={15} className="text-gold-600" />
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-smoke">Order Timeline</p>
          <ol className="mt-4 space-y-4">
            {[...order.timeline].reverse().map((t, i) => (
              <li key={i} className="relative flex gap-3 text-sm">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-gold-500' : 'bg-beige'}`} />
                <div>
                  <p className={i === 0 ? 'font-semibold' : 'text-ink/80'}>{t.label}</p>
                  <p className="text-xs text-smoke">{formatDateTime(t.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {canCancel && (
        <div className="mt-6 flex justify-end">
          <button onClick={handleCancel} className="btn border border-red-200 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50">
            Cancel Order
          </button>
        </div>
      )}
    </div>
  )
}
