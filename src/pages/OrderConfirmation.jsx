import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package, MapPin, Banknote, CalendarDays, ArrowRight, SearchX } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import SmartImage from '@/components/ui/SmartImage'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatPrice } from '@/lib/format'
import { getOrder } from '@/services/orders'
import { useSettings } from '@/context/SettingsContext'

export default function OrderConfirmation() {
  const { number } = useParams()
  const { user } = useAuth()
  const { settings } = useSettings()
  const order = getOrder(number)
  usePageTitle(order ? `Order ${order.number}` : 'Order')

  if (!order) {
    return (
      <div className="container-x py-20">
        <EmptyState
          icon={SearchX}
          title="Order not found"
          message="We couldn’t find this order. Check the link from your confirmation."
          action={<Link to="/shop" className="btn-primary">Continue Shopping</Link>}
        />
      </div>
    )
  }

  const payment = (settings?.payments || []).find((p) => p.id === order.paymentMethod)
  const addr = order.shippingAddress

  return (
    <div className="container-x max-w-4xl py-10 lg:py-16">
      {/* success header */}
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 animate-fadeUp">
          <CheckCircle2 size={32} strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 font-display text-3xl sm:text-4xl">Shukriya, {order.customerName.split(' ')[0]}!</h1>
        <p className="mt-2 text-sm text-smoke">
          Your order has been placed successfully. A confirmation has been sent to{' '}
          <span className="font-medium text-ink">{order.email}</span>.
        </p>
        <p className="mt-4 inline-block border border-gold-500/50 bg-gold-50 px-5 py-2 font-display text-lg tracking-wide">
          Order No: <span className="font-semibold text-gold-700">{order.number}</span>
        </p>
      </div>

      {/* info grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-smoke">
            <MapPin size={14} className="text-gold-600" /> Shipping To
          </p>
          <p className="mt-3 text-sm font-semibold">{addr.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-smoke">
            {addr.address}
            {addr.apartment ? `, ${addr.apartment}` : ''}
            <br />
            {addr.city}, {addr.country} {addr.postalCode}
            <br />
            {addr.phone}
          </p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-smoke">
            <Banknote size={14} className="text-gold-600" /> Payment
          </p>
          <p className="mt-3 text-sm font-semibold">{payment?.label || order.paymentMethod.toUpperCase()}</p>
          <p className="mt-1 text-sm leading-relaxed text-smoke">
            {order.paymentMethod === 'cod'
              ? `Keep ${formatPrice(order.total)} ready in cash for the rider.`
              : payment?.description}
          </p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-smoke">
            <CalendarDays size={14} className="text-gold-600" /> Estimated Delivery
          </p>
          <p className="mt-3 text-sm font-semibold">{formatDate(order.estimatedDelivery)}</p>
          <p className="mt-1 text-sm text-smoke">
            Via {order.shippingMethod === 'express' ? 'Express' : 'Standard'} delivery. We’ll SMS you the tracking
            number once dispatched.
          </p>
        </div>
      </div>

      {/* items */}
      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-ink/10 px-6 py-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-smoke">
            <Package size={14} className="text-gold-600" /> Ordered Items
          </p>
        </div>
        <ul className="divide-y divide-ink/[0.06]">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-4">
              <SmartImage src={item.image} alt={item.name} className="h-16 w-14 shrink-0 object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/product/${item.slug}`} className="block truncate text-sm font-medium hover:text-gold-700">
                  {item.name}
                </Link>
                <p className="text-xs text-smoke">
                  {Object.values(item.options).join(' / ')} · Qty {item.qty}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.total)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-ink/10 bg-cream/50 px-6 py-4 text-sm">
          <div className="flex justify-between"><dt className="text-smoke">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatPrice(order.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-smoke">Shipping</dt><dd>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</dd></div>
          {order.tax > 0 && <div className="flex justify-between"><dt className="text-smoke">Tax</dt><dd>{formatPrice(order.tax)}</dd></div>}
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold">
            <dt>Total {order.paymentMethod === 'cod' && <span className="text-xs font-normal text-smoke">(pay on delivery)</span>}</dt>
            <dd className="font-display text-xl text-gold-600">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* actions */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {user ? (
          <Link to={`/account/orders/${order.id}`} className="btn-primary">
            Track Order <ArrowRight size={15} />
          </Link>
        ) : (
          <Link to="/register" className="btn-primary">
            Create an Account to Track Orders
          </Link>
        )}
        <Link to="/shop" className="btn-outline">Continue Shopping</Link>
      </div>
    </div>
  )
}
