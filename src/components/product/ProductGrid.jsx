import ProductCard from './ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/format'

export default function ProductGrid({ products = [], loading = false, view = 'grid', skeletons = 8, columns }) {
  const gridClass =
    columns ||
    (view === 'list'
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 lg:gap-x-6 lg:gap-y-10')

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletons }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn(gridClass, 'animate-fadeIn')}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} view={view} />
      ))}
    </div>
  )
}
