import { Link } from 'react-router-dom'
import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import QuantityStepper from '@/components/ui/QuantityStepper'
import SmartImage from '@/components/ui/SmartImage'
import CartSummary from '@/components/cart/CartSummary'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { formatPrice } from '@/lib/format'

function CartRow({ line }) {
  const { updateQty, remove } = useCart()
  const wishlist = useWishlist()
  const toast = useToast()

  const moveToWishlist = () => {
    if (!wishlist.has(line.productId)) wishlist.toggle(line.productId)
    remove(line.id)
    toast('Moved to wishlist.')
  }

  return (
    <div className="flex gap-4 border-b border-ink/[0.08] py-5 sm:gap-5">
      <Link to={`/product/${line.product.slug}`} className="block w-24 shrink-0 overflow-hidden bg-cream sm:w-28">
        <SmartImage src={line.image} alt={line.product.name} className="aspect-[3/4] h-full w-full object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/product/${line.product.slug}`} className="block truncate font-medium hover:text-gold-700">
              {line.product.name}
            </Link>
            <p className="mt-0.5 text-xs text-smoke">
              {Object.entries(line.variant.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </p>
            <p className="mt-0.5 text-[11px] text-smoke/70">SKU: {line.variant.sku}</p>
          </div>
          <button onClick={() => { remove(line.id); toast('Item removed from cart.', 'info') }} className="p-1 text-smoke transition-colors hover:text-red-600" aria-label="Remove item">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="flex items-center gap-4">
            <QuantityStepper small value={line.qty} onChange={(q) => updateQty(line.id, q)} max={Math.max(line.maxQty, 1)} />
            <button onClick={moveToWishlist} className="hidden items-center gap-1.5 text-xs text-smoke transition-colors hover:text-gold-700 sm:flex">
              <Heart size={13} /> Move to wishlist
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatPrice(line.total)}</p>
            {line.qty > 1 && <p className="text-[11px] text-smoke">{formatPrice(line.unit)} each</p>}
          </div>
        </div>
        {line.maxQty <= 5 && line.maxQty > 0 && (
          <p className="mt-1.5 text-[11px] font-medium text-amber-600">Only {line.maxQty} left in stock</p>
        )}
      </div>
    </div>
  )
}

export default function Cart() {
  usePageTitle('Shopping Cart')
  const { detailed, count } = useCart()

  if (!detailed.length) {
    return (
      <div className="container-x py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          message="Discover our embroidered suits, signature lawn and festive edits — something beautiful is waiting."
          action={<Link to="/shop" className="btn-primary">Start Shopping <ArrowRight size={15} /></Link>}
        />
      </div>
    )
  }

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shopping Cart' }]} className="mb-4" />
      <h1 className="font-display text-3xl sm:text-4xl">
        Shopping Cart <span className="text-lg text-smoke">({count} {count === 1 ? 'item' : 'items'})</span>
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr,380px]">
        <div>
          {detailed.map((line) => (
            <CartRow key={line.id} line={line} />
          ))}
          <Link to="/shop" className="link-underline mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
            ← Continue shopping
          </Link>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <CartSummary footnote="Standard shipping shown — you can switch to express delivery at checkout.">
            <Link to="/checkout" className="btn-primary w-full">
              Proceed to Checkout <ArrowRight size={15} />
            </Link>
          </CartSummary>
        </div>
      </div>
    </div>
  )
}
