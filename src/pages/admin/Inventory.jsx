import { useState } from 'react'
import { Boxes, Search } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import { useToast } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { listInventory, updateVariantStock } from '@/services/catalog'

export default function AdminInventory() {
  usePageTitle('Admin · Inventory')
  const toast = useToast()
  const { dbVersion } = useSettings()
  void dbVersion
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [drafts, setDrafts] = useState({}) // variantId -> stock value being edited

  const rows = listInventory({ q, status })
  const summary = {
    total: listInventory().length,
    low: listInventory({ status: 'low-stock' }).length,
    out: listInventory({ status: 'out-of-stock' }).length,
  }

  const commit = async (row) => {
    const draft = drafts[row.variant.id]
    if (draft === undefined || Number(draft) === row.variant.stock) return
    await updateVariantStock(row.product.id, row.variant.id, Number(draft))
    setDrafts((d) => {
      const next = { ...d }
      delete next[row.variant.id]
      return next
    })
    toast(`Stock updated — ${row.product.name} (${Object.values(row.variant.options).join(' / ') || 'default'}).`)
  }

  return (
    <div>
      <PageHeader title="Inventory" sub={`${summary.total} variants · ${summary.low} low stock · ${summary.out} out of stock`} />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, SKU, variation…" className="input py-2 pl-9" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto py-2 text-sm">
          <option value="">All statuses</option>
          <option value="in-stock">In stock</option>
          <option value="low-stock">Low stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[820px]">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Variation</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <Boxes size={28} className="mx-auto mb-3 text-smoke/50" />
                  <p className="text-sm text-smoke">No inventory rows match.</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const draft = drafts[row.variant.id]
                const dirty = draft !== undefined && Number(draft) !== row.variant.stock
                return (
                  <tr key={row.variant.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <SmartImage src={row.variant.image || row.product.images[0]} alt={row.product.name} className="h-11 w-9 shrink-0 object-cover" />
                        <span className="max-w-[220px] truncate text-sm font-medium">{row.product.name}</span>
                      </div>
                    </td>
                    <td className="text-xs text-smoke">{row.variant.sku}</td>
                    <td className="text-xs">{Object.values(row.variant.options).join(' / ') || 'Default'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={draft ?? row.variant.stock}
                          onChange={(e) => setDrafts((d) => ({ ...d, [row.variant.id]: e.target.value }))}
                          onBlur={() => commit(row)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          className={`input w-24 py-1.5 text-sm ${dirty ? 'border-gold-500 ring-2 ring-gold-500/20' : ''}`}
                          aria-label="Stock quantity"
                        />
                        {dirty && <span className="text-[10px] font-semibold uppercase text-gold-600">Enter ↵</span>}
                      </div>
                    </td>
                    <td className="text-center text-xs text-smoke">{row.threshold}</td>
                    <td><StatusBadge value={row.status} /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
