import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Eye, ShoppingBag } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import Badge from '@/components/ui/Badge'
import RatingStars from '@/components/ui/RatingStars'
import Tooltip from '@/components/ui/Tooltip'
import QuickViewModal from './QuickViewModal'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import { cn, formatPrice, pctOff } from '@/lib/format'
import { defaultVariant, effectivePrice, productStock } from '@/services/catalog'

export default function ProductCard({ product, view = 'grid' }) {
  const { add } = useCart()
  const wishlist = useWishlist()
  const toast = useToast()
  const [quickView, setQuickView] = useState(false)

  const inWishlist = wishlist.has(product.id)
  const off = pctOff(product.price, product.salePrice)
  const outOfStock = productStock(product) <= 0
  const hoverImage = product.images[1]
  const sizes = (product.attributes || []).find((a) => a.name === 'Size')?.values || []
  const colors = (product.attributes || []).find((a) => a.name === 'Color')?.values || []

  const handleAdd = (e) => {
    e.preventDefault()
    const variant = defaultVariant(product)
    if (!variant || outOfStock) return toast('This product is currently out of stock.', 'error')
    const res = add(product, variant, 1)
    if (res.ok) toast(`${product.name} (${Object.values(variant.options).join(' / ')}) added to cart.`)
    else toast(res.message, 'error')
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    const added = wishlist.toggle(product.id)
    toast(added ? 'Added to wishlist.' : 'Removed from wishlist.', added ? 'success' : 'info')
  }

  const priceBlock = (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-[15px] font-semibold text-ink">{formatPrice(effectivePrice(product))}</span>
      {product.salePrice && <span className="text-sm text-smoke line-through">{formatPrice(product.price)}</span>}
      {off > 0 && <span className="text-xs font-bold text-red-600">-{off}%</span>}
    </div>
  )

  // ------------------------------------------------------------- list view
  if (view === 'list') {
    return (
      <div className="card group flex gap-5 p-4 transition-shadow hover:shadow-lift sm:gap-6">
        <Link to={`/product/${product.slug}`} className="relative block w-32 shrink-0 overflow-hidden bg-cream sm:w-44">
          <SmartImage src={product.images[0]} alt={product.name} className="aspect-[3/4] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {off > 0 && <Badge tone="sale" className="absolute left-2 top-2">-{off}%</Badge>}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-smoke">{product.category.replace(/-/g, ' ')}</p>
          <Link to={`/product/${product.slug}`} className="mt-1 font-display text-lg leading-snug hover:text-gold-700">
            {product.name}
          </Link>
          {product.reviewCount > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <RatingStars value={product.rating} />
              <span className="text-xs text-smoke">({product.reviewCount})</span>
            </div>
          )}
          <p className="mt-2 hidden text-sm leading-relaxed text-smoke sm:line-clamp-2">{product.shortDescription}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
            {priceBlock}
            <div className="flex items-center gap-2">
              <button onClick={handleWishlist} className={cn('flex h-10 w-10 items-center justify-center border transition-colors', inWishlist ? 'border-gold-500 bg-gold-50 text-gold-600' : 'border-ink/15 text-smoke hover:border-ink hover:text-ink')} aria-label="Toggle wishlist">
                <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => setQuickView(true)} className="btn-outline btn-sm hidden sm:inline-flex">
                Quick View
              </button>
              <button onClick={handleAdd} disabled={outOfStock} className="btn-primary btn-sm">
                <ShoppingBag size={14} /> {outOfStock ? 'Sold Out' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
        {quickView && <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />}
      </div>
    )
  }

  // ------------------------------------------------------------- grid view
  return (
    <div className="group relative">
      <div className="relative overflow-hidden bg-cream">
        <Link to={`/product/${product.slug}`} className="block aspect-[3/4]">
          <SmartImage
            src={product.images[0]}
            alt={product.name}
            className={cn('absolute inset-0 h-full w-full object-cover transition-all duration-700', hoverImage && 'group-hover:opacity-0 group-hover:scale-105')}
          />
          {hoverImage && (
            <SmartImage
              src={hoverImage}
              alt={`${product.name} — alternate view`}
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && <Badge tone="gold">New</Badge>}
          {off > 0 && <Badge tone="sale">-{off}%</Badge>}
          {outOfStock && <Badge tone="dark">Sold Out</Badge>}
        </div>

        {/* wishlist */}
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/95 shadow-soft transition-all duration-300 hover:bg-gold-500 hover:text-white',
            inWishlist ? 'text-gold-600 opacity-100' : 'text-ink lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100'
          )}
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        {/* hover actions */}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 lg:translate-y-3 lg:opacity-0 lg:transition-all lg:duration-300 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          <Tooltip label="Quick view">
            <button
              onClick={() => setQuickView(true)}
              aria-label="Quick view"
              className="flex h-11 w-11 shrink-0 items-center justify-center bg-ivory/95 text-ink shadow-soft transition-colors hover:bg-ink hover:text-ivory"
            >
              <Eye size={16} />
            </button>
          </Tooltip>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="btn flex-1 bg-ink/95 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ivory shadow-soft transition-colors hover:bg-gold-600 disabled:bg-ink/50"
          >
            <ShoppingBag size={14} /> {outOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* meta */}
      <div className="pt-3.5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-smoke">{product.category.replace(/-/g, ' ')}</p>
        <Link to={`/product/${product.slug}`} className="mt-1 block truncate font-medium text-[15px] leading-snug transition-colors hover:text-gold-700">
          {product.name}
        </Link>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <RatingStars value={product.rating} size={12} />
            <span className="text-[11px] text-smoke">({product.reviewCount})</span>
          </div>
        )}
        <div className="mt-1.5">{priceBlock}</div>
        <div className="mt-2 flex items-center justify-between">
          {colors.length > 0 && (
            <div className="flex items-center gap-1">
              {colors.slice(0, 5).map((c) => (
                <span key={c.value} className="h-3.5 w-3.5 rounded-full border border-ink/15" style={{ backgroundColor: c.hex }} title={c.value} />
              ))}
              {colors.length > 5 && <span className="text-[10px] text-smoke">+{colors.length - 5}</span>}
            </div>
          )}
          {sizes.length > 0 && (
            <p className="hidden text-[10px] uppercase tracking-wider text-smoke/80 sm:block">
              {sizes.map((s) => s.value).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {quickView && <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />}
    </div>
  )
}
