import { X } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { getCategory } from '@/services/catalog'

/** Row of removable chips reflecting every active shop filter. */
export default function ActiveFilterChips({ filters, meta, onChange, onClear }) {
  const chips = []

  if (filters.category) {
    const cat = getCategory(filters.category)
    chips.push({ label: cat?.name || filters.category, clear: () => onChange('category', '') })
  }
  ;(filters.sizes || []).forEach((s) => chips.push({ label: `Size: ${s}`, clear: () => onChange('sizes', filters.sizes.filter((x) => x !== s)) }))
  ;(filters.colors || []).forEach((c) => chips.push({ label: c, clear: () => onChange('colors', filters.colors.filter((x) => x !== c)) }))
  ;(filters.fabrics || []).forEach((f) => chips.push({ label: f, clear: () => onChange('fabrics', filters.fabrics.filter((x) => x !== f)) }))
  ;(filters.collections || []).forEach((slug) => {
    const col = meta.collections.find((c) => c.slug === slug)
    chips.push({ label: col?.name || slug, clear: () => onChange('collections', filters.collections.filter((x) => x !== slug)) })
  })
  if (filters.price && (filters.price[0] > meta.price[0] || filters.price[1] < meta.price[1])) {
    chips.push({ label: `${formatPrice(filters.price[0])} – ${formatPrice(filters.price[1])}`, clear: () => onChange('price', null) })
  }
  if (filters.inStock) chips.push({ label: 'In stock', clear: () => onChange('inStock', false) })
  if (filters.rating) chips.push({ label: `★ ${filters.rating}+`, clear: () => onChange('rating', '') })
  if (filters.discount) chips.push({ label: filters.discount === 'sale' ? 'On sale' : `${filters.discount}%+ off`, clear: () => onChange('discount', '') })
  if (filters.q) chips.push({ label: `“${filters.q}”`, clear: () => onChange('q', '') })

  if (!chips.length) return null

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 animate-fadeIn">
      {chips.map((chip, i) => (
        <button key={i} onClick={chip.clear} className="chip group gap-1.5 bg-white">
          {chip.label}
          <X size={12} className="text-smoke transition-colors group-hover:text-red-500" />
        </button>
      ))}
      <button onClick={onClear} className="ml-1 text-xs font-medium text-smoke underline underline-offset-2 hover:text-ink">
        Clear all
      </button>
    </div>
  )
}
