import { useState } from 'react'
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Drawer from '@/components/ui/Drawer'
import StatusBadge from '@/components/ui/StatusBadge'
import { Checkbox, Input, Select, Toggle } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatPrice } from '@/lib/format'
import { listCoupons, saveCoupon, deleteCoupon } from '@/services/coupons'
import { getCategories, getProducts } from '@/services/catalog'

const BLANK = {
  code: '',
  type: 'percentage',
  value: 10,
  minOrder: 0,
  maxDiscount: '',
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
  perCustomerLimit: '',
  products: [],
  categories: [],
  active: true,
}

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

export default function AdminCoupons() {
  usePageTitle('Admin · Coupons')
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [editing, setEditing] = useState(null)
  const [productSearch, setProductSearch] = useState('')

  const coupons = listCoupons()
  const categories = getCategories().filter((c) => c.parentId)
  const allProducts = getProducts({ includeAllStatuses: true, perPage: 1000 }).items

  const couponState = (c) => {
    if (!c.active) return 'inactive'
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return 'expired'
    if (c.usageLimit != null && c.usedCount >= c.usageLimit) return 'expired'
    return 'active'
  }

  const openEdit = (c) =>
    setEditing({
      ...BLANK,
      ...c,
      maxDiscount: c.maxDiscount ?? '',
      usageLimit: c.usageLimit ?? '',
      perCustomerLimit: c.perCustomerLimit ?? '',
      startsAt: toDateInput(c.startsAt),
      expiresAt: toDateInput(c.expiresAt),
    })

  const save = async (e) => {
    e?.preventDefault()
    if (!editing.code.trim()) return toast('Coupon code is required.', 'error')
    if (!editing.value || Number(editing.value) <= 0) return toast('Enter a valid discount value.', 'error')
    try {
      await saveCoupon({
        ...editing,
        value: Number(editing.value),
        minOrder: Number(editing.minOrder) || 0,
        maxDiscount: editing.maxDiscount === '' ? null : Number(editing.maxDiscount),
        usageLimit: editing.usageLimit === '' ? null : Number(editing.usageLimit),
        perCustomerLimit: editing.perCustomerLimit === '' ? null : Number(editing.perCustomerLimit),
        startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : null,
        expiresAt: editing.expiresAt ? new Date(`${editing.expiresAt}T23:59:59`).toISOString() : null,
      })
      toast(editing.id ? 'Coupon updated.' : 'Coupon created.')
      setEditing(null)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const remove = async (c) => {
    const ok = await confirm({ title: `Delete coupon ${c.code}?`, message: 'Customers will no longer be able to use it.' })
    if (!ok) return
    await deleteCoupon(c.id)
    toast('Coupon deleted.', 'info')
  }

  const filteredProducts = productSearch
    ? allProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : allProducts.slice(0, 12)

  return (
    <div>
      <PageHeader title="Coupons" sub="Discount codes applied at cart and checkout.">
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary btn-sm">
          <Plus size={14} /> Add Coupon
        </button>
      </PageHeader>

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[820px]">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Validity</th>
              <th>Scope</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={8} className="py-14 text-center"><TicketPercent size={28} className="mx-auto mb-3 text-smoke/50" /><p className="text-sm text-smoke">No coupons yet.</p></td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id}>
                  <td><span className="border border-dashed border-gold-500/60 bg-gold-50 px-2.5 py-1 font-mono text-xs font-bold text-gold-700">{c.code}</span></td>
                  <td className="font-medium">{c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}{c.maxDiscount ? <span className="block text-[11px] font-normal text-smoke">max {formatPrice(c.maxDiscount)}</span> : null}</td>
                  <td className="text-xs text-smoke">{c.minOrder ? formatPrice(c.minOrder) : '—'}</td>
                  <td className="text-xs">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="whitespace-nowrap text-xs text-smoke">{c.expiresAt ? `till ${formatDate(c.expiresAt)}` : 'No expiry'}</td>
                  <td className="text-xs text-smoke">
                    {c.categories?.length ? `${c.categories.length} categories` : c.products?.length ? `${c.products.length} products` : 'All items'}
                  </td>
                  <td><StatusBadge value={couponState(c)} /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-smoke hover:text-gold-600" aria-label="Edit coupon"><Pencil size={15} /></button>
                      <button onClick={() => remove(c)} className="p-1.5 text-smoke hover:text-red-600" aria-label="Delete coupon"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${editing.code}` : 'Add Coupon'}
        width="max-w-lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancel</button>
            <button onClick={save} className="btn-primary btn-sm flex-1">Save Coupon</button>
          </div>
        }
      >
        {editing && (
          <form onSubmit={save} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Coupon code" required value={editing.code} onChange={(e) => setEditing((c) => ({ ...c, code: e.target.value.toUpperCase() }))} placeholder="EID10" />
              <Select label="Discount type" value={editing.type} onChange={(e) => setEditing((c) => ({ ...c, type: e.target.value }))} options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed amount (Rs.)' }]} />
              <Input label={editing.type === 'percentage' ? 'Percentage (%)' : 'Amount (Rs.)'} required type="number" value={editing.value} onChange={(e) => setEditing((c) => ({ ...c, value: e.target.value }))} />
              <Input label="Max discount (Rs.)" type="number" value={editing.maxDiscount} onChange={(e) => setEditing((c) => ({ ...c, maxDiscount: e.target.value }))} hint="Optional cap" />
              <Input label="Minimum order (Rs.)" type="number" value={editing.minOrder} onChange={(e) => setEditing((c) => ({ ...c, minOrder: e.target.value }))} />
              <Input label="Usage limit" type="number" value={editing.usageLimit} onChange={(e) => setEditing((c) => ({ ...c, usageLimit: e.target.value }))} hint="Total redemptions" />
              <Input label="Start date" type="date" value={editing.startsAt} onChange={(e) => setEditing((c) => ({ ...c, startsAt: e.target.value }))} />
              <Input label="Expiry date" type="date" value={editing.expiresAt} onChange={(e) => setEditing((c) => ({ ...c, expiresAt: e.target.value }))} />
              <Input label="Per-customer limit" type="number" value={editing.perCustomerLimit} onChange={(e) => setEditing((c) => ({ ...c, perCustomerLimit: e.target.value }))} />
              <div className="flex items-end pb-1"><Toggle checked={editing.active} onChange={(v) => setEditing((c) => ({ ...c, active: v }))} label="Active" /></div>
            </div>

            <div>
              <p className="label">Applicable categories</p>
              <p className="mb-2 text-xs text-smoke">Leave empty to apply to the whole store.</p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((cat) => (
                  <Checkbox
                    key={cat.id}
                    label={cat.name}
                    checked={(editing.categories || []).includes(cat.slug)}
                    onChange={(v) =>
                      setEditing((c) => ({ ...c, categories: v ? [...(c.categories || []), cat.slug] : (c.categories || []).filter((s) => s !== cat.slug) }))
                    }
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="label">Applicable products ({(editing.products || []).length} selected)</p>
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products…" className="input mb-2 py-2 text-sm" />
              <div className="max-h-48 space-y-1 overflow-y-auto border border-ink/10 p-3">
                {filteredProducts.map((p) => (
                  <Checkbox
                    key={p.id}
                    label={p.name}
                    checked={(editing.products || []).includes(p.id)}
                    onChange={(v) =>
                      setEditing((c) => ({ ...c, products: v ? [...(c.products || []), p.id] : (c.products || []).filter((id) => id !== p.id) }))
                    }
                  />
                ))}
              </div>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  )
}
