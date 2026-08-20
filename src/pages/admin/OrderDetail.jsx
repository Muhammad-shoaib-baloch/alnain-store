import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck, StickyNote, RefreshCcw, Ban, Undo2 } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import { Select, Input, Textarea } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDateTime, formatPrice } from '@/lib/format'
import { getOrder, updateOrder, addOrderNote, cancelOrder } from '@/services/orders'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'

const STATUS_LABELS = {
  pending: 'Order marked pending',
  confirmed: 'Order confirmed',
  processing: 'Being stitched & packed',
  shipped: 'Handed to courier',
  delivered: 'Delivered',
  cancelled: 'Order cancelled',
  returned: 'Return processed',
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion

  const order = getOrder(id)
  usePageTitle(order ? `Admin · ${order.number}` : 'Order')
  const [tracking, setTracking] = useState(order?.trackingNumber || '')
  const [note, setNote] = useState('')

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-smoke">Order not found.</p>
        <Link to="/admin/orders" className="btn-primary mt-4">Back to Orders</Link>
      </div>
    )
  }

  const setStatus = async (status) => {
    if (status === order.status) return
    if (status === 'cancelled') {
      const ok = await confirm({
        title: 'Cancel this order?',
        message: 'Stock for all items will be returned to inventory.',
        confirmText: 'Cancel Order',
      })
      if (!ok) return
      await cancelOrder(order.id, { label: 'Cancelled by store', byStore: true })
      toast('Order cancelled and stock restored.', 'info')
      return
    }
    await updateOrder(order.id, { status }, STATUS_LABELS[status])
    toast(`Order status updated to “${status}”.`)
  }

  const setPayment = async (paymentStatus) => {
    if (paymentStatus === order.paymentStatus) return
    await updateOrder(order.id, { paymentStatus }, `Payment marked ${paymentStatus}`)
    toast(`Payment status: ${paymentStatus}.`)
  }

  const saveTracking = async () => {
    await updateOrder(order.id, { trackingNumber: tracking.trim() || null }, tracking.trim() ? `Tracking number added (${tracking.trim()})` : undefined)
    toast('Tracking number saved.')
  }

  const submitNote = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    await addOrderNote(order.id, note.trim())
    setNote('')
    toast('Internal note added.', 'info')
  }

  const refund = async () => {
    const ok = await confirm({
      title: 'Refund this order?',
      message: `${formatPrice(order.total)} will be marked as refunded and the order set to “returned”.`,
      confirmText: 'Refund',
    })
    if (!ok) return
    await updateOrder(order.id, { paymentStatus: 'refunded', status: 'returned' }, 'Order refunded')
    toast('Order refunded.', 'info')
  }

  return (
    <div>
      <button onClick={() => navigate('/admin/orders')} className="mb-3 flex items-center gap-1.5 text-sm text-smoke transition-colors hover:text-ink">
        <ArrowLeft size={15} /> Back to orders
      </button>
      <PageHeader title={`Order ${order.number}`} sub={`Placed ${formatDateTime(order.createdAt)} · ${order.paymentMethod.toUpperCase()}`}>
        <StatusBadge value={order.paymentStatus} />
        <StatusBadge value={order.status} />
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr,360px]">
        {/* left: items + totals + notes */}
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="border-b border-ink/10 px-5 py-4">
              <h2 className="font-display text-lg">Items ({order.items.length})</h2>
            </div>
            <ul className="divide-y divide-ink/[0.06]">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  <SmartImage src={item.image} alt={item.name} className="h-16 w-14 shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.slug}`} target="_blank" className="block truncate text-sm font-medium hover:text-gold-700">
                      {item.name}
                    </Link>
                    <p className="text-xs text-smoke">{Object.values(item.options).join(' / ')} · SKU {item.sku}</p>
                    <p className="text-xs text-smoke">{item.qty} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.total)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-ink/10 bg-cream/50 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-smoke">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-smoke">Shipping ({order.shippingMethod})</dt><dd>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</dd></div>
              {order.tax > 0 && <div className="flex justify-between"><dt className="text-smoke">Tax</dt><dd>{formatPrice(order.tax)}</dd></div>}
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold">
                <dt>Total</dt><dd className="font-display text-xl text-gold-600">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          {/* internal notes */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <StickyNote size={17} className="text-gold-600" /> Internal Notes
            </h2>
            <form onSubmit={submitNote} className="mt-4 flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team…" className="input" />
              <button className="btn-primary btn-sm shrink-0">Add</button>
            </form>
            <ul className="mt-4 space-y-3">
              {(order.notes || []).length === 0 && <li className="text-sm text-smoke">No notes yet.</li>}
              {[...(order.notes || [])].reverse().map((n) => (
                <li key={n.id} className="border border-ink/[0.08] bg-cream/40 p-3 text-sm">
                  <p>{n.text}</p>
                  <p className="mt-1 text-[11px] text-smoke">{n.by} · {formatDateTime(n.at)}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* timeline */}
          <div className="card p-5">
            <h2 className="font-display text-lg">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {[...order.timeline].reverse().map((t, i) => (
                <li key={i} className="flex gap-3 text-sm">
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

        {/* right: management */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <RefreshCcw size={16} className="text-gold-600" /> Manage Order
            </h2>
            <div className="mt-4 space-y-4">
              <Select label="Order status" value={order.status} onChange={(e) => setStatus(e.target.value)} options={ORDER_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
              <Select label="Payment status" value={order.paymentStatus} onChange={(e) => setPayment(e.target.value)} options={PAYMENT_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
              <div>
                <Input label="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. TCS-784321" />
                <button onClick={saveTracking} className="btn-outline btn-sm mt-2 w-full"><Truck size={13} /> Save Tracking</button>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-ink/10 pt-4">
                <button onClick={() => setStatus('shipped')} className="btn-outline btn-sm">Mark Shipped</button>
                <button onClick={() => setStatus('delivered')} className="btn-outline btn-sm">Mark Delivered</button>
                <button onClick={refund} className="btn btn-sm border border-orange-300 text-orange-700 hover:bg-orange-50"><Undo2 size={13} /> Refund</button>
                <button onClick={() => setStatus('cancelled')} className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-50"><Ban size={13} /> Cancel</button>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-lg">Customer</h2>
            <p className="mt-3 text-sm font-semibold">{order.customerName}</p>
            <p className="text-sm text-smoke">{order.email}</p>
            <p className="text-sm text-smoke">{order.phone}</p>
            {order.customerId && (
              <Link to="/admin/customers" className="link-underline mt-2 inline-block text-xs font-semibold text-gold-700">
                View customer profile
              </Link>
            )}
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <MapPin size={16} className="text-gold-600" /> Shipping Address
            </h2>
            <p className="mt-3 text-sm font-semibold">{order.shippingAddress.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-smoke">
              {order.shippingAddress.address}
              {order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ''}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.country} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
