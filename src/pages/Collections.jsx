import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import SmartImage from '@/components/ui/SmartImage'
import { usePageTitle } from '@/hooks'
import { getCollections, getCollectionProducts } from '@/services/catalog'

export default function Collections() {
  usePageTitle('Collections')
  const collections = getCollections({ activeOnly: true })

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} className="mb-4" />
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl">Our Collections</h1>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          Season edits, festive drops and heirloom pieces — every collection curated by our stylists in Islamabad.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((col, i) => (
          <Link
            key={col.id}
            to={`/collections/${col.slug}`}
            className={`group relative block overflow-hidden bg-cream ${i === 0 ? 'sm:col-span-2 aspect-[2/1]' : 'aspect-[4/3]'}`}
          >
            <SmartImage src={col.image} alt={col.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-200">
                {getCollectionProducts(col.slug).length} pieces
              </p>
              <h2 className="mt-1 font-display text-2xl text-ivory">{col.name}</h2>
              <p className="mt-1 line-clamp-2 max-w-md text-sm text-ivory/70">{col.description}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-gold-200">
                Explore Collection <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
