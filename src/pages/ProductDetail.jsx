import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, ShoppingBag, Zap, Truck, RotateCcw, Banknote, PackageSearch, ShieldCheck } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import RatingStars from '@/components/ui/RatingStars'
import QuantityStepper from '@/components/ui/QuantityStepper'
import Tabs from '@/components/ui/Tabs'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeading from '@/components/ui/SectionHeading'
import ProductGallery from '@/components/product/ProductGallery'
import VariationSelector from '@/components/product/VariationSelector'
import SizeGuideModal, { SizeChartTable } from '@/components/product/SizeGuideModal'
import ReviewsSection from '@/components/product/ReviewsSection'
import ProductGrid from '@/components/product/ProductGrid'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle, useRecentlyViewed, getRecentlyViewed } from '@/hooks'
import { cn, formatPrice, pctOff } from '@/lib/format'
import {
  getProductBySlug,
  getProductById,
  getCategory,
  getRelated,
  findVariant,
  defaultVariant,
  variantPrice,
} from '@/services/catalog'
import { reviewSummary } from '@/services/reviews'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const wishlist = useWishlist()
  const toast = useToast()
  const { settings, dbVersion } = useSettings()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const product = useMemo(() => getProductBySlug(slug), [slug, dbVersion])
  const [selection, setSelection] = useState(() => (product ? defaultVariant(product)?.options || {} : {}))
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('description')
  const [sizeGuide, setSizeGuide] = useState(false)
  const [slugState, setSlugState] = useState(slug)

  // reset local state when navigating between products
  if (slugState !== slug) {
    setSlugState(slug)
    setSelection(product ? defaultVariant(product)?.options || {} : {})
    setQty(1)
    setTab('description')
  }

  useRecentlyViewed(product?.id)
  usePageTitle(product?.seo?.metaTitle || product?.name)

  if (!product) {
    return (
      <div className="container-x py-20">
        <EmptyState
          icon={PackageSearch}
          title="Product not found"
          message="This product may have been removed or the link is incorrect."
          action={<Link to="/shop" className="btn-primary">Back to Shop</Link>}
        />
      </div>
    )
  }

  const variant = findVariant(product, selection)
  const category = getCategory(product.category)
  const price = variant ? variantPrice(variant) : product.salePrice ?? product.price
  const original = variant ? (variant.salePrice ? variant.price : null) : product.salePrice ? product.price : null
  const off = original ? pctOff(original, price) : 0
  const stock = variant?.stock ?? 0
  const inWishlist = wishlist.has(product.id)
  const summary = reviewSummary(product)
  const related = getRelated(product, 4)
  const recent = getRecentlyViewed()
    .filter((id) => id !== product.id)
    .map((id) => getProductById(id))
    .filter((p) => p && p.status === 'published')
    .slice(0, 4)
  const freeThreshold = settings?.shipping?.freeShippingThreshold || 15000

  const handleAdd = () => {
    if (!variant) return toast('Please select all options first.', 'error')
    const res = add(product, variant, qty)
    if (res.ok) toast(`${product.name} added to cart.`)
    else toast(res.message, 'error')
    return res.ok
  }

  const handleBuyNow = () => {
    if (handleAdd()) navigate('/checkout')
  }

  const handleWishlist = () => {
    const added = wishlist.toggle(product.id)
    toast(added ? 'Added to wishlist.' : 'Removed from wishlist.', added ? 'success' : 'info')
  }

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'details', label: 'Details & Fabric' },
    { id: 'size', label: 'Size Chart' },
    { id: 'shipping', label: 'Shipping & Returns' },
    { id: 'reviews', label: 'Reviews', badge: summary.count },
  ]

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          ...(category ? [{ label: category.name, to: `/shop/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* gallery */}
        <ProductGallery product={product} activeImage={variant?.image || null} />

        {/* info */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-smoke">
            {category?.name || product.category} · {product.fabric}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <button onClick={() => setTab('reviews')} className="flex items-center gap-2">
              {summary.count > 0 ? (
                <>
                  <RatingStars value={summary.avg} />
                  <span className="text-xs text-smoke underline-offset-2 hover:underline">{summary.count} reviews</span>
                </>
              ) : (
                <span className="text-xs text-gold-700 underline-offset-2 hover:underline">Be the first to review</span>
              )}
            </button>
            <span className="text-xs text-smoke">
              SKU: <span className="font-medium text-ink">{variant?.sku || product.sku}</span>
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl text-gold-600">{formatPrice(price)}</span>
            {original && <span className="text-lg text-smoke line-through">{formatPrice(original)}</span>}
            {off > 0 && <span className="bg-red-600 px-2 py-0.5 text-xs font-bold text-white">SAVE {off}%</span>}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-smoke sm:text-[15px]">{product.shortDescription}</p>

          <div className="mt-7 border-t border-ink/10 pt-6">
            <VariationSelector
              product={product}
              selection={selection}
              onChange={(attr, value) => setSelection((s) => ({ ...s, [attr]: value }))}
              onSizeGuide={() => setSizeGuide(true)}
            />
          </div>

          {/* stock state */}
          <p className="mt-5 text-sm font-medium">
            {!variant ? (
              <span className="text-smoke">Select options to check availability</span>
            ) : stock > 0 ? (
              <span className={cn(stock <= 5 ? 'text-amber-600' : 'text-emerald-700')}>
                {stock <= 5 ? `Hurry — only ${stock} left in stock` : 'In stock, ready to ship'}
              </span>
            ) : (
              <span className="text-red-600">Out of stock for this combination</span>
            )}
          </p>

          {/* actions */}
          <div className="mt-5 flex flex-wrap gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(stock, 1)} />
            <button onClick={handleAdd} disabled={!variant || stock <= 0} className="btn-primary min-w-[180px] flex-1">
              <ShoppingBag size={16} /> Add to Cart
            </button>
            <button
              onClick={handleWishlist}
              className={cn(
                'flex h-11 w-11 items-center justify-center border transition-colors',
                inWishlist ? 'border-gold-500 bg-gold-50 text-gold-600' : 'border-ink/20 text-smoke hover:border-ink hover:text-ink'
              )}
              aria-label="Toggle wishlist"
            >
              <Heart size={17} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>
          <button onClick={handleBuyNow} disabled={!variant || stock <= 0} className="btn-gold mt-3 w-full">
            <Zap size={16} /> Buy It Now
          </button>

          {/* shipping / returns info */}
          <ul className="mt-7 space-y-3 border-t border-ink/10 pt-6 text-sm text-smoke">
            <li className="flex items-center gap-3">
              <Banknote size={17} className="shrink-0 text-gold-600" />
              <span><span className="font-medium text-ink">Cash on Delivery</span> available nationwide</span>
            </li>
            <li className="flex items-center gap-3">
              <Truck size={17} className="shrink-0 text-gold-600" />
              <span>
                Free standard shipping over <span className="font-medium text-ink">{formatPrice(freeThreshold)}</span> ·
                3–5 working days
              </span>
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw size={17} className="shrink-0 text-gold-600" />
              <span>7-day easy returns & exchanges — <Link to="/returns" className="underline underline-offset-2">see policy</Link></span>
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={17} className="shrink-0 text-gold-600" />
              <span>Quality checked twice before dispatch</span>
            </li>
          </ul>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-14 lg:mt-20">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="py-8">
          {tab === 'description' && (
            <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-ink/80 sm:text-[15px] animate-fadeIn">
              {product.description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
          {tab === 'details' && (
            <ul className="max-w-2xl space-y-3 animate-fadeIn">
              {(product.details || []).map((d, i) => (
                <li key={i} className="flex gap-3 border-b border-ink/[0.07] pb-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {d}
                </li>
              ))}
              <li className="flex gap-3 pb-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                Available colours:{' '}
                {((product.attributes || []).find((a) => a.name === 'Color')?.values || []).map((v) => v.value).join(', ')}
              </li>
            </ul>
          )}
          {tab === 'size' && (
            <div className="max-w-2xl animate-fadeIn">
              <SizeChartTable />
              <p className="mt-4 text-xs text-smoke">All measurements in inches. Tolerance ±0.5″.</p>
            </div>
          )}
          {tab === 'shipping' && (
            <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-ink/80 animate-fadeIn">
              <p>
                <strong>Shipping.</strong> Standard delivery takes 3–5 working days (free over {formatPrice(freeThreshold)}),
                express delivery 1–2 working days. Orders are dispatched from Islamabad Monday–Saturday.
              </p>
              <p>
                <strong>Cash on Delivery.</strong> Pay in cash when your order arrives — available across Pakistan.
                Please keep the exact amount ready for the rider.
              </p>
              <p>
                <strong>Returns & exchanges.</strong> Unworn items with tags can be returned or exchanged within 7 days
                of delivery. Embellished formals are exchange-only. Refunds for COD orders are issued via bank transfer
                within 5 working days of us receiving the return.
              </p>
            </div>
          )}
          {tab === 'reviews' && <ReviewsSection product={product} />}
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-10 border-t border-ink/10 pt-14">
          <SectionHeading eyebrow="Complete the Look" title="You May Also Like" />
          <ProductGrid products={related} />
        </section>
      )}

      {/* recently viewed */}
      {recent.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="Your History" title="Recently Viewed" />
          <ProductGrid products={recent} />
        </section>
      )}

      {/* sticky mobile add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{product.name}</p>
          <p className="text-sm font-bold text-gold-600">{formatPrice(price)}</p>
        </div>
        <button onClick={handleAdd} disabled={!variant || stock <= 0} className="btn-primary btn-sm px-5 py-2.5">
          <ShoppingBag size={14} /> Add to Cart
        </button>
      </div>
      <div className="h-16 lg:hidden" />

      <SizeGuideModal open={sizeGuide} onClose={() => setSizeGuide(false)} />
    </div>
  )
}
