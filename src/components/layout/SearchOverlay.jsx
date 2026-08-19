import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight } from 'lucide-react'
import { suggestProducts, getCategories, effectivePrice } from '@/services/catalog'
import { useDebounce, useLockBodyScroll } from '@/hooks'
import { formatPrice } from '@/lib/format'
import SmartImage from '@/components/ui/SmartImage'

const POPULAR = ['Embroidered Dobby', 'Printed Khaddar', 'Co-ord', 'Kurta', 'Festive', 'Chikankari']

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 200)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  useLockBodyScroll(open)

  useEffect(() => {
    if (open) {
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const results = debounced.trim().length >= 2 ? suggestProducts(debounced, 8) : []
  const categories = getCategories({ activeOnly: true }).filter((c) => !c.parentId)

  const goSearch = (term) => {
    onClose()
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const goProduct = (slug) => {
    onClose()
    navigate(`/product/${slug}`)
  }

  return createPortal(
    <div className="fixed inset-0 z-[105] flex flex-col bg-ivory animate-fadeIn">
      <div className="border-b border-ink/10">
        <div className="container-x flex h-20 items-center gap-4">
          <Search size={22} className="shrink-0 text-gold-600" />
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault()
              if (q.trim()) goSearch(q.trim())
            }}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, SKU, categories…"
              className="w-full bg-transparent font-display text-xl outline-none placeholder:text-smoke/50 sm:text-2xl"
              aria-label="Search products"
            />
          </form>
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center text-smoke transition-colors hover:text-ink" aria-label="Close search">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container-x py-8">
          {debounced.trim().length < 2 ? (
            <div className="mx-auto max-w-2xl">
              <p className="label">Popular searches</p>
              <div className="mb-8 flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button key={term} className="chip" onClick={() => setQ(term)}>
                    {term}
                  </button>
                ))}
              </div>
              <p className="label">Browse categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className="chip"
                    onClick={() => {
                      onClose()
                      navigate(`/shop/${c.slug}`)
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="py-16 text-center text-sm text-smoke">
              No products found for “{debounced}”. Try a different term.
            </p>
          ) : (
            <>
              <p className="label">Products</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {results.map((p) => (
                  <button key={p.id} onClick={() => goProduct(p.slug)} className="group flex items-center gap-3 border border-ink/[0.07] bg-white p-3 text-left transition-shadow hover:shadow-card">
                    <SmartImage src={p.images[0]} alt={p.name} className="h-16 w-14 shrink-0 object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium group-hover:text-gold-700">{p.name}</span>
                      <span className="block text-[11px] uppercase tracking-wider text-smoke">{p.category.replace(/-/g, ' ')}</span>
                      <span className="block text-sm font-semibold text-gold-600">{formatPrice(effectivePrice(p))}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button onClick={() => goSearch(debounced)} className="link-underline mt-8 inline-flex items-center gap-1.5 text-sm font-medium">
                View all results for “{debounced}” <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
