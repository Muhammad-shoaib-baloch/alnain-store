import { Link, useParams } from 'react-router-dom'
import { Layers, SlidersHorizontal } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import SmartImage from '@/components/ui/SmartImage'
import ProductGrid from '@/components/product/ProductGrid'
import { useMockFetch, usePageTitle } from '@/hooks'
import { getCollection, getCollectionProducts } from '@/services/catalog'

export default function CollectionDetail() {
  const { slug } = useParams()
  const collection = getCollection(slug)
  usePageTitle(collection?.name || 'Collection')
  const { data: products, loading } = useMockFetch(() => getCollectionProducts(slug), [slug])

  if (!collection || !collection.active) {
    return (
      <div className="container-x py-20">
        <EmptyState
          icon={Layers}
          title="Collection not found"
          message="This collection may have ended or the link is incorrect."
          action={<Link to="/collections" className="btn-primary">All Collections</Link>}
        />
      </div>
    )
  }

  return (
    <div>
      {/* banner */}
      <section className="relative h-[300px] overflow-hidden bg-ink sm:h-[360px]">
        <SmartImage src={collection.image} alt={collection.name} eager className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/20" />
        <div className="container-x absolute inset-0 flex flex-col justify-end pb-10">
          <p className="eyebrow text-gold-200">The Edit</p>
          <h1 className="mt-2 font-display text-4xl text-ivory sm:text-5xl">{collection.name}</h1>
          <p className="mt-3 max-w-xl text-sm text-ivory/75">{collection.description}</p>
        </div>
      </section>

      <div className="container-x py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Breadcrumbs
            items={[{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: collection.name }]}
          />
          <Link to={`/shop?collections=${collection.slug}`} className="btn-outline btn-sm">
            <SlidersHorizontal size={13} /> Filter & Sort in Shop
          </Link>
        </div>

        {!loading && products?.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No products in this collection yet"
            message="Check back soon — pieces are added every week."
            action={<Link to="/shop" className="btn-primary">Browse Shop</Link>}
          />
        ) : (
          <ProductGrid products={products || []} loading={loading} skeletons={8} />
        )}
      </div>
    </div>
  )
}
