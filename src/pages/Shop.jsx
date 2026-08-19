import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, Search, SlidersHorizontal, X, PackageSearch } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import Drawer from '@/components/ui/Drawer'
import ProductGrid from '@/components/product/ProductGrid'
import FilterPanel from '@/components/shop/FilterPanel'
import ActiveFilterChips from '@/components/shop/ActiveFilterChips'
import { useMockFetch, usePageTitle } from '@/hooks'
import { getProducts, getFilterMeta, getCategory } from '@/services/catalog'
import { SORT_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/format'

const csv = (v) => (v ? v.split(',').filter(Boolean) : [])

export default function Shop() {
  const { category: pathCategory } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '')

  const meta = useMemo(() => getFilterMeta(), [])

  const filters = useMemo(() => {
    const sp = searchParams
    const min = sp.get('min')
    const max = sp.get('max')
    return {
      q: sp.get('q') || '',
      category: pathCategory || sp.get('category') || '',
      sizes: csv(sp.get('sizes')),
      colors: csv(sp.get('colors')),
      fabrics: csv(sp.get('fabrics')),
      collections: csv(sp.get('collections')),
      price: min || max ? [Number(min) || meta.price[0], Number(max) || meta.price[1]] : null,
      inStock: sp.get('stock') === 'in',
      rating: sp.get('rating') || '',
      discount: sp.get('discount') || '',
      sort: sp.get('sort') || 'featured',
      page: Number(sp.get('page')) || 1,
      view: sp.get('view') || 'grid',
    }
  }, [searchParams, pathCategory, meta])

  const setFilter = (key, value) => {
    if (key === 'category') {
      const next = new URLSearchParams(searchParams)
      next.delete('page')
      next.delete('category')
      navigate({ pathname: value ? `/shop/${value}` : '/shop', search: next.toString() })
      return
    }
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    const setOrDelete = (k, v) => (v ? next.set(k, v) : next.delete(k))
    if (key === 'price') {
      if (!value) {
        next.delete('min')
        next.delete('max')
      } else {
        next.set('min', value[0])
        next.set('max', value[1])
      }
    } else if (['sizes', 'colors', 'fabrics', 'collections'].includes(key)) {
      setOrDelete(key, (value || []).join(','))
    } else if (key === 'inStock') {
      setOrDelete('stock', value ? 'in' : '')
    } else {
      setOrDelete(key, value)
    }
    setSearchParams(next)
  }

  const clearAll = () => {
    const next = new URLSearchParams()
    if (filters.sort !== 'featured') next.set('sort', filters.sort)
    if (filters.view !== 'grid') next.set('view', filters.view)
    setSearchDraft('')
    navigate({ pathname: '/shop', search: next.toString() })
  }

  const activeCount =
    (filters.category ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    filters.fabrics.length +
    filters.collections.length +
    (filters.price ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.discount ? 1 : 0) +
    (filters.q ? 1 : 0)

  const { data, loading } = useMockFetch(
    () => getProducts({ ...filters, perPage: 12 }),
    [location.pathname, location.search]
  )

  const category = filters.category ? getCategory(filters.category) : null
  const title = category?.name || 'All Products'
  usePageTitle(`Shop ${title}`)

  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }]
  if (category) crumbs.push({ label: category.name })

  const filterPanel = (
    <FilterPanel meta={meta} filters={filters} onChange={setFilter} onClear={clearAll} activeCount={activeCount} />
  )

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={crumbs} className="mb-4" />

      {/* page head */}
      <div className="mb-8 border-b border-ink/10 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-smoke">
          {category?.description || 'Premium traditional wear — embroidered, formal, casual and festive suits.'}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[250px,1fr]">
        {/* sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">{filterPanel}</div>
        </aside>

        {/* results */}
        <div>
          {/* toolbar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <p className="mr-auto text-sm text-smoke">
              {loading ? 'Loading…' : <><span className="font-semibold text-ink">{data?.total ?? 0}</span> products</>}
            </p>

            <form
              className="relative order-last w-full sm:order-none sm:w-56"
              onSubmit={(e) => {
                e.preventDefault()
                setFilter('q', searchDraft.trim())
              }}
            >
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search in shop…"
                className="input py-2 pl-9 pr-8 text-sm"
                aria-label="Search products"
              />
              {filters.q && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft('')
                    setFilter('q', '')
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-smoke hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <select
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="input w-auto py-2 text-sm"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>

            <div className="hidden items-center border border-ink/15 sm:flex">
              <button
                onClick={() => setFilter('view', '')}
                className={cn('flex h-9 w-9 items-center justify-center transition-colors', filters.view === 'grid' ? 'bg-ink text-ivory' : 'text-smoke hover:text-ink')}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setFilter('view', 'list')}
                className={cn('flex h-9 w-9 items-center justify-center transition-colors', filters.view === 'list' ? 'bg-ink text-ivory' : 'text-smoke hover:text-ink')}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>

            <button onClick={() => setDrawerOpen(true)} className="btn-outline btn-sm lg:hidden">
              <SlidersHorizontal size={14} /> Filters {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>

          <ActiveFilterChips filters={filters} meta={meta} onChange={setFilter} onClear={clearAll} />

          {!loading && data?.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products match your filters"
              message="Try removing a filter or two, or browse the full collection."
              action={<button onClick={clearAll} className="btn-primary">Clear Filters</button>}
            />
          ) : (
            <>
              <ProductGrid
                products={data?.items || []}
                loading={loading}
                view={filters.view === 'list' ? 'list' : 'grid'}
                skeletons={9}
                columns={filters.view === 'list' ? undefined : 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-6 lg:gap-y-10'}
              />
              <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={(p) => setFilter('page', String(p))} className="mt-12" />
            </>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`Filters ${activeCount ? `(${activeCount})` : ''}`}
        side="right"
        width="max-w-[340px]"
        footer={
          <div className="flex gap-3">
            <button onClick={clearAll} className="btn-outline btn-sm flex-1">
              Clear All
            </button>
            <button onClick={() => setDrawerOpen(false)} className="btn-primary btn-sm flex-1">
              Show Results {data ? `(${data.total})` : ''}
            </button>
          </div>
        }
      >
        <div className="px-5 py-4">{filterPanel}</div>
      </Drawer>
    </div>
  )
}
