import Accordion from '@/components/ui/Accordion'
import PriceRange from '@/components/ui/PriceRange'
import { Checkbox } from '@/components/ui/Field'
import { cn } from '@/lib/format'
import { getCategories, countProductsInCategory } from '@/services/catalog'
import { RATING_FILTERS, DISCOUNT_FILTERS } from '@/lib/constants'

/**
 * Full filter stack — rendered in the desktop sidebar and inside the mobile
 * filter drawer. Controlled entirely via the `filters` object + onChange.
 */
export default function FilterPanel({ meta, filters, onChange, onClear, activeCount }) {
  const tree = getCategories({ tree: true, activeOnly: true })

  const toggleInList = (key, value) => {
    const list = filters[key] || []
    onChange(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between pb-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em]">Filters</p>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs font-medium text-gold-700 underline underline-offset-2 hover:text-gold-600">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <Accordion title="Category" defaultOpen small>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onChange('category', '')}
              className={cn('w-full py-1 text-left text-sm', !filters.category ? 'font-semibold text-gold-700' : 'text-ink/75 hover:text-ink')}
            >
              All Products
            </button>
          </li>
          {tree.map((parent) => (
            <li key={parent.id}>
              <button
                onClick={() => onChange('category', parent.slug)}
                className={cn('w-full py-1 text-left text-sm', filters.category === parent.slug ? 'font-semibold text-gold-700' : 'text-ink/75 hover:text-ink')}
              >
                {parent.name} <span className="text-xs text-smoke">({countProductsInCategory(parent.slug)})</span>
              </button>
              <ul className="ml-3 border-l border-ink/10 pl-3">
                {parent.children.map((child) => (
                  <li key={child.id}>
                    <button
                      onClick={() => onChange('category', child.slug)}
                      className={cn('w-full py-1 text-left text-[13px]', filters.category === child.slug ? 'font-semibold text-gold-700' : 'text-ink/65 hover:text-ink')}
                    >
                      {child.name} <span className="text-xs text-smoke/80">({countProductsInCategory(child.slug)})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Price" defaultOpen small>
        <PriceRange
          min={meta.price[0]}
          max={meta.price[1]}
          value={[filters.price?.[0] ?? meta.price[0], filters.price?.[1] ?? meta.price[1]]}
          onChange={(value) => onChange('price', value)}
        />
      </Accordion>

      <Accordion title="Size" defaultOpen small>
        <div className="flex flex-wrap gap-2">
          {meta.sizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleInList('sizes', size)}
              className={cn('chip min-w-[40px] justify-center', (filters.sizes || []).includes(size) && 'chip-active')}
            >
              {size}
            </button>
          ))}
        </div>
      </Accordion>

      <Accordion title="Color" defaultOpen small>
        <div className="flex flex-wrap gap-2.5">
          {meta.colors.map((c) => {
            const active = (filters.colors || []).includes(c.value)
            return (
              <button
                key={c.value}
                title={c.value}
                onClick={() => toggleInList('colors', c.value)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                  active ? 'border-gold-500 scale-110' : 'border-transparent hover:scale-105'
                )}
                aria-label={`Filter by ${c.value}`}
              >
                <span className="h-6 w-6 rounded-full border border-ink/10" style={{ backgroundColor: c.hex }} />
              </button>
            )
          })}
        </div>
      </Accordion>

      <Accordion title="Fabric" small>
        <div className="space-y-2">
          {meta.fabrics.map((fabric) => (
            <Checkbox
              key={fabric}
              label={fabric}
              checked={(filters.fabrics || []).includes(fabric)}
              onChange={() => toggleInList('fabrics', fabric)}
            />
          ))}
        </div>
      </Accordion>

      <Accordion title="Collection" small>
        <div className="space-y-2">
          {meta.collections.map((col) => (
            <Checkbox
              key={col.id}
              label={col.name}
              checked={(filters.collections || []).includes(col.slug)}
              onChange={() => toggleInList('collections', col.slug)}
            />
          ))}
        </div>
      </Accordion>

      <Accordion title="Availability" small>
        <Checkbox label="In stock only" checked={!!filters.inStock} onChange={(v) => onChange('inStock', v)} />
      </Accordion>

      <Accordion title="Rating" small>
        <div className="space-y-1">
          {RATING_FILTERS.map((r) => (
            <button
              key={r.value}
              onClick={() => onChange('rating', filters.rating === r.value ? '' : r.value)}
              className={cn('block w-full py-1 text-left text-sm', filters.rating === r.value ? 'font-semibold text-gold-700' : 'text-ink/75 hover:text-ink')}
            >
              ★ {r.label}
            </button>
          ))}
        </div>
      </Accordion>

      <Accordion title="Discount" small>
        <div className="space-y-1">
          {DISCOUNT_FILTERS.map((d) => (
            <button
              key={d.value}
              onClick={() => onChange('discount', filters.discount === d.value ? '' : d.value)}
              className={cn('block w-full py-1 text-left text-sm', filters.discount === d.value ? 'font-semibold text-gold-700' : 'text-ink/75 hover:text-ink')}
            >
              {d.label}
            </button>
          ))}
        </div>
      </Accordion>
    </div>
  )
}
