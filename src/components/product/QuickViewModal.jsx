import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import SmartImage from '@/components/ui/SmartImage'
import RatingStars from '@/components/ui/RatingStars'
import QuantityStepper from '@/components/ui/QuantityStepper'
import VariationSelector from './VariationSelector'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { formatPrice } from '@/lib/format'
import { defaultVariant, findVariant, variantPrice } from '@/services/catalog'

export default function QuickViewModal({ product, open, onClose }) {
  const { add } = useCart()
  const toast = useToast()
  const [qty, setQty] = useState(1)
  const [selection, setSelection] = useState(() => defaultVariant(product)?.options || {})

  const variant = useMemo(() => findVariant(product, selection), [product, selection])
  const image = variant?.image || product.images[0]
  const price = variant ? variantPrice(variant) : product.salePrice ?? product.price
  const original = variant ? (variant.salePrice ? variant.price : null) : product.salePrice ? product.price : null
  const stock = variant?.stock ?? 0

  const handleAdd = () => {
    if (!variant) return toast('Please select all options first.', 'error')
    const res = add(product, variant, qty)
    if (res.ok) {
      toast(`${product.name} added to cart.`)
      onClose()
    } else toast(res.message, 'error')
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="relative bg-cream">
          <SmartImage src={image} alt={product.name} className="aspect-[3/4] h-full w-full object-cover" eager />
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-smoke">{product.category.replace(/-/g, ' ')}</p>
          <h3 className="mt-1 font-display text-2xl leading-tight">{product.name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars value={product.rating} />
            <span className="text-xs text-smoke">({product.reviewCount} reviews)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-xl font-semibold">{formatPrice(price)}</span>
            {original && <span className="text-sm text-smoke line-through">{formatPrice(original)}</span>}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-smoke">{product.shortDescription}</p>

          <div className="mt-5">
            <VariationSelector
              product={product}
              selection={selection}
              onChange={(attr, value) => setSelection((s) => ({ ...s, [attr]: value }))}
            />
          </div>

          <p className="mt-4 text-xs font-medium">
            {!variant ? (
              <span className="text-smoke">Select options to see availability</span>
            ) : stock > 0 ? (
              <span className="text-emerald-700">{stock <= 5 ? `Only ${stock} left in stock` : 'In stock'}</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>

          <div className="mt-4 flex gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(stock, 1)} />
            <button onClick={handleAdd} disabled={!variant || stock <= 0} className="btn-primary flex-1">
              <ShoppingBag size={15} /> Add to Cart
            </button>
          </div>

          <Link to={`/product/${product.slug}`} onClick={onClose} className="link-underline mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
            View full details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Modal>
  )
}
