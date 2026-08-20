import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, Eye, Ban, CheckCircle2 } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Pagination from '@/components/ui/Pagination'
import StatusBadge from '@/components/ui/StatusBadge'
import Drawer from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatPrice, initials } from '@/lib/format'
import { listCustomers, setCustomerStatus, updateUser } from '@/services/auth'
import { listOrders } from '@/services/orders'

export default function AdminCustomers() {
  usePageTitle('Admin · Customers')
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null) // customer id
  const [edit, setEdit] = useState(null)

  const { items, total, pages, page: safePage } = listCustomers({ q, status, page, perPage: 10 })
  const viewingCustomer = viewing ? listCustomers({ perPage: 1000 }).items.find((c) => c.id === viewing) : null
  const customerOrders = viewingCustomer ? listOrders({ customerId: viewingCustomer.id, perPage: 50 }).items : []

  const toggleStatus = async (customer) => {
    const disabling = customer.status === 'active'
    if (disabling) {
      const ok = await confirm({
        title: `Disable ${customer.name}?`,
        message: 'They will no longer be able to sign in. Order history is retained.',
        confirmText: 'Disable',
      })
      if (!ok) return
    }
    await setCustomerStatus(customer.id, disabling ? 'disabled' : 'active')
    toast(`Customer ${disabling ? 'disabled' : 're-activated'}.`, 'info')
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    try {
      await updateUser(edit.id, { name: edit.name, email: edit.email, phone: edit.phone })
      toast('Customer updated.')
      setEdit(null)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Customers" sub={`${total} registered customer(s)`} />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search name, email, phone…" className="input py-2 pl-9" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-auto py-2 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[860px]">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Registered</th>
              <th className="text-center">Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <Users size={28} className="mx-auto mb-3 text-smoke/50" />
                  <p className="text-sm text-smoke">No customers found.</p>
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-gold-700">
                          {initials(c.name)}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-[11px] text-smoke">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-smoke">{c.phone || '—'}</td>
                  <td className="whitespace-nowrap text-xs text-smoke">{formatDate(c.createdAt)}</td>
                  <td className="text-center font-semibold">{c.orderCount}</td>
                  <td className="whitespace-nowrap font-medium">{formatPrice(c.totalSpent)}</td>
                  <td className="whitespace-nowrap text-xs text-smoke">{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                  <td><StatusBadge value={c.status} /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewing(c.id)} className="p-1.5 text-smoke hover:text-ink" aria-label="View customer"><Eye size={15} /></button>
                      <button onClick={() => toggleStatus(c)} className={`p-1.5 ${c.status === 'active' ? 'text-smoke hover:text-red-600' : 'text-smoke hover:text-emerald-600'}`} aria-label="Toggle status">
                        {c.status === 'active' ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} pages={pages} onChange={setPage} className="mt-6" />

      {/* customer drawer */}
      <Drawer open={!!viewingCustomer} onClose={() => { setViewing(null); setEdit(null) }} title="Customer Profile" width="max-w-lg">
        {viewingCustomer && (
          <div className="px-5 py-5">
            <div className="flex items-center gap-4">
              {viewingCustomer.avatar ? (
                <img src={viewingCustomer.avatar} alt={viewingCustomer.name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 font-display text-lg text-gold-700">
                  {initials(viewingCustomer.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl">{viewingCustomer.name}</p>
                <p className="text-sm text-smoke">{viewingCustomer.email} · {viewingCustomer.phone || 'no phone'}</p>
              </div>
              <StatusBadge value={viewingCustomer.status} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                ['Orders', viewingCustomer.orderCount],
                ['Spent', formatPrice(viewingCustomer.totalSpent)],
                ['Since', formatDate(viewingCustomer.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="border border-ink/10 bg-cream/40 p-3">
                  <p className="text-sm font-semibold">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-smoke">{label}</p>
                </div>
              ))}
            </div>

            {edit ? (
              <form onSubmit={saveEdit} className="mt-6 space-y-3 border border-ink/10 p-4">
                <Input label="Name" value={edit.name} onChange={(e) => setEdit((v) => ({ ...v, name: e.target.value }))} />
                <Input label="Email" type="email" value={edit.email} onChange={(e) => setEdit((v) => ({ ...v, email: e.target.value }))} />
                <Input label="Phone" value={edit.phone} onChange={(e) => setEdit((v) => ({ ...v, phone: e.target.value }))} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEdit(null)} className="btn-outline btn-sm flex-1">Cancel</button>
                  <button className="btn-primary btn-sm flex-1">Save</button>
                </div>
              </form>
            ) : (
              <div className="mt-5 flex gap-2">
                <button onClick={() => setEdit({ id: viewingCustomer.id, name: viewingCustomer.name, email: viewingCustomer.email, phone: viewingCustomer.phone || '' })} className="btn-outline btn-sm flex-1">
                  Edit Details
                </button>
                <button onClick={() => toggleStatus(viewingCustomer)} className={`btn btn-sm flex-1 border ${viewingCustomer.status === 'active' ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
                  {viewingCustomer.status === 'active' ? 'Disable Account' : 'Re-activate'}
                </button>
              </div>
            )}

            <h3 className="mt-7 border-t border-ink/10 pt-5 text-xs font-bold uppercase tracking-wider text-smoke">
              Orders ({customerOrders.length})
            </h3>
            <ul className="mt-3 space-y-2">
              {customerOrders.length === 0 && <li className="text-sm text-smoke">No orders yet.</li>}
              {customerOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 border border-ink/[0.08] p-3 text-sm">
                  <div>
                    <Link to={`/admin/orders/${o.id}`} className="font-semibold text-gold-700 hover:underline">{o.number}</Link>
                    <p className="text-[11px] text-smoke">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatPrice(o.total)}</span>
                    <StatusBadge value={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Drawer>
    </div>
  )
}
