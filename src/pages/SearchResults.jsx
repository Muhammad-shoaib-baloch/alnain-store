import { useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import ProductGrid from '@/components/product/ProductGrid'
import { useMockFetch, usePageTitle } from '@/hooks'
import { getProducts } from '@/services/catalog'
import { SORT_OPTIONS } from '@/lib/constants'

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'featured'
  const page = Number(searchParams.get('page')) || 1
  usePageTitle(q ? `Search “${q}”` : 'Search')

  const { data, loading } = useMockFetch(() => getProducts({ q, sort, page, perPage: 12 }), [q, sort, page])

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'page' && value) next.set('page', value)
    setSearchParams(next)
  }

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} className="mb-4" />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Search Results</h1>
          <p className="mt-2 text-sm text-smoke">
            {loading ? 'Searching…' : (
              <>
                <span className="font-semibold text-ink">{data?.total ?? 0}</span> results for “
                <span className="font-medium text-ink">{q}</span>”
              </>
            )}
          </p>
        </div>
        <select value={sort} onChange={(e) => update('sort', e.target.value)} className="input w-auto py-2 text-sm" aria-label="Sort results">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>

      {!loading && (data?.items.length === 0 || !q) ? (
        <EmptyState
          icon={SearchX}
          title={q ? `Nothing found for “${q}”` : 'What are you looking for?'}
          message="Try a different spelling, a broader term, or browse by category — e.g. “embroidered”, “lawn”, “kurta”."
        />
      ) : (
        <>
          <ProductGrid products={data?.items || []} loading={loading} skeletons={8} />
          <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={(p) => update('page', String(p))} className="mt-12" />
        </>
      )}
    </div>
  )
}
