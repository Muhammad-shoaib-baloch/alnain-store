import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import ProductGrid from '@/components/product/ProductGrid'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { getProductById, defaultVariant } from '@/services/catalog'

export default function AccountWishlist() {
  usePageTitle('Wishlist')
  const { ids, count } = useWishlist()
  const { add } = useCart()
  const toast = useToast()

  const products = ids.map((id) => getProductById(id)).filter((p) => p && p.status === 'published')

  const addAll = () => {
    let added = 0
    products.forEach((p) => {
      const v = defaultVariant(p)
      if (v && v.stock > 0 && add(p, v, 1).ok) added++
    })
    toast(added ? `${added} item(s) moved to your cart.` : 'No items could be added (out of stock).', added ? 'success' : 'error')
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl">
          Wishlist <span className="text-lg text-smoke">({count})</span>
        </h1>
        {products.length > 0 && (
          <button onClick={addAll} className="btn-primary btn-sm">
            <ShoppingBag size={14} /> Add All to Cart
          </button>
        )}
      </div>
      <p className="mt-1.5 text-sm text-smoke">Tap the heart on any product to remove it from your wishlist.</p>

      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          message="Save pieces you love and find them here — they'll be waiting."
          action={<Link to="/shop" className="btn-primary">Discover Products</Link>}
          compact
        />
      ) : (
        <div className="mt-8">
          <ProductGrid products={products} columns="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-6" />
        </div>
      )}
    </div>
  )
}
