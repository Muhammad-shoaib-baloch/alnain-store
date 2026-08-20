import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Copy, Trash2, Package } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Pagination from '@/components/ui/Pagination'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import Tooltip from '@/components/ui/Tooltip'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatPrice } from '@/lib/format'
import { getProducts, getCategories, deleteProduct, duplicateProduct, productStock, stockStatus, priceRangeOf } from '@/services/catalog'

const PER_PAGE = 10

export default function AdminProducts() {
  usePageTitle('Admin · Products')
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { dbVersion } = useSettings()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const categories = getCategories()

  const filtered = useMemo(() => {
    let items = getProducts({ includeAllStatuses: true, q, category, status, sort, perPage: 1000 }).items
    if (stock) items = items.filter((p) => stockStatus(p) === stock)
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, status, sort, stock, dbVersion])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pages)
  const rows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleDelete = async (product) => {
    const ok = await confirm({
      title: 'Delete this product?',
      message: `“${product.name}” and its ${product.variants.length} variation(s) will be permanently removed.`,
    })
    if (!ok) return
    await deleteProduct(product.id)
    toast('Product deleted.', 'info')
  }

  const handleDuplicate = async (product) => {
    const copy = await duplicateProduct(product.id)
    toast(`Duplicated as draft — “${copy.name}”.`)
    navigate(`/admin/products/${copy.id}/edit`)
  }

  const priceCell = (p) => {
    const [lo, hi] = priceRangeOf(p)
    return lo === hi ? formatPrice(lo) : `${formatPrice(lo)} – ${formatPrice(hi)}`
  }

  return (
    <div>
      <PageHeader title="Products" sub={`${filtered.length} product(s)`}>
        <Link to="/admin/products/new" className="btn-primary btn-sm">
          <Plus size={14} /> Add Product
        </Link>
      </PageHeader>

      {/* toolbar */}
      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search name, SKU, tags…" className="input py-2 pl-9" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className="input w-auto py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.parentId ? `— ${c.name}` : c.name}</option>
          ))}
        </select>
        <select value={stock} onChange={(e) => { setStock(e.target.value); setPage(1) }} className="input w-auto py-2 text-sm">
          <option value="">All stock</option>
          <option value="in-stock">In stock</option>
          <option value="low-stock">Low stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-auto py-2 text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto py-2 text-sm">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="price-asc">Price low–high</option>
          <option value="price-desc">Price high–low</option>
          <option value="stock-asc">Stock low–high</option>
        </select>
      </div>

      {/* table */}
      <div className="card overflow-x-auto">
        <table className="table-base min-w-[900px]">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <Package size={28} className="mx-auto mb-3 text-smoke/50" />
                  <p className="text-sm text-smoke">No products match your filters.</p>
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <SmartImage src={p.images[0]} alt={p.name} className="h-12 w-10 shrink-0 object-cover" />
                      <div className="min-w-0">
                        <Link to={`/admin/products/${p.id}/edit`} className="block max-w-[220px] truncate text-sm font-medium hover:text-gold-700">
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-smoke">{p.variants.length} variation(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-smoke">{p.sku}</td>
                  <td className="text-xs capitalize text-smoke">{p.category.replace(/-/g, ' ')}</td>
                  <td className="whitespace-nowrap text-xs font-medium">{priceCell(p)}</td>
                  <td>
                    <span className="text-sm font-semibold">{productStock(p)}</span>{' '}
                    <StatusBadge value={stockStatus(p)} className="ml-1" />
                  </td>
                  <td><StatusBadge value={p.status} /></td>
                  <td className="whitespace-nowrap text-xs text-smoke">{formatDate(p.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Tooltip label="View in store">
                        <Link to={`/product/${p.slug}`} target="_blank" className="p-1.5 text-smoke hover:text-ink" aria-label="View product">
                          <Eye size={15} />
                        </Link>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <Link to={`/admin/products/${p.id}/edit`} className="p-1.5 text-smoke hover:text-gold-600" aria-label="Edit product">
                          <Pencil size={15} />
                        </Link>
                      </Tooltip>
                      <Tooltip label="Duplicate">
                        <button onClick={() => handleDuplicate(p)} className="p-1.5 text-smoke hover:text-ink" aria-label="Duplicate product">
                          <Copy size={15} />
                        </button>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <button onClick={() => handleDelete(p)} className="p-1.5 text-smoke hover:text-red-600" aria-label="Delete product">
                          <Trash2 size={15} />
                        </button>
                      </Tooltip>
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
