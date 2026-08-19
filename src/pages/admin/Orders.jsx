import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart, Eye } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Pagination from '@/components/ui/Pagination'
import StatusBadge from '@/components/ui/StatusBadge'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDateTime, formatPrice } from '@/lib/format'
import { listOrders } from '@/services/orders'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'

export default function AdminOrders() {
  usePageTitle('Admin · Orders')
  const { dbVersion } = useSettings()
  void dbVersion
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [payment, setPayment] = useState('')
  const [page, setPage] = useState(1)

  const { items, total, pages, page: safePage } = listOrders({ q, status, payment, page, perPage: 12 })

  return (
    <div>
      <PageHeader title="Orders" sub={`${total} order(s)`} />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search order #, customer, email…" className="input py-2 pl-9" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-auto py-2 text-sm capitalize">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1) }} className="input w-auto py-2 text-sm capitalize">
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[860px]">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <ShoppingCart size={28} className="mx-auto mb-3 text-smoke/50" />
                  <p className="text-sm text-smoke">No orders match your filters.</p>
                </td>
              </tr>
            ) : (
              items.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/admin/orders/${o.id}`} className="font-semibold text-gold-700 hover:underline">{o.number}</Link>
                    <p className="text-[11px] text-smoke">{o.paymentMethod.toUpperCase()}</p>
                  </td>
                  <td>
                    <p className="text-sm font-medium">{o.customerName}</p>
                    <p className="text-[11px] text-smoke">{o.email}</p>
                  </td>
                  <td className="whitespace-nowrap text-xs text-smoke">{formatDateTime(o.createdAt)}</td>
                  <td className="text-center">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="whitespace-nowrap font-medium">{formatPrice(o.total)}</td>
                  <td><StatusBadge value={o.paymentStatus} /></td>
                  <td><StatusBadge value={o.status} /></td>
                  <td>
                    <div className="flex justify-end">
                      <Link to={`/admin/orders/${o.id}`} className="btn-outline btn-sm gap-1.5">
                        <Eye size={13} /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} pages={pages} onChange={setPage} className="mt-6" />
    </div>
  )
}
