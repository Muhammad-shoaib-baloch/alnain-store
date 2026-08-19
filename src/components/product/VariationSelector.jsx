import { Ruler } from 'lucide-react'
import { cn } from '@/lib/format'

/**
 * Attribute pickers (Color swatches, Size chips, Fabric chips…).
 * Values that have no in-stock variant for the current selection are shown
 * struck-through but stay clickable (selecting shows the out-of-stock state).
 */
export default function VariationSelector({ product, selection, onChange, onSizeGuide }) {
  const attributes = product.attributes || []

  const hasStockFor = (attrName, value) => {
    return (product.variants || []).some(
      (v) =>
        v.status === 'active' &&
        v.stock > 0 &&
        v.options[attrName] === value &&
        attributes.every((a) => a.name === attrName || !selection[a.name] || v.options[a.name] === selection[a.name])
    )
  }

  return (
    <div className="space-y-5">
      {attributes.map((attr) => (
        <div key={attr.name}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-smoke">
              {attr.name}: <span className="text-ink normal-case tracking-normal">{selection[attr.name] || '—'}</span>
            </p>
            {attr.name === 'Size' && onSizeGuide && (
              <button type="button" onClick={onSizeGuide} className="link-underline flex items-center gap-1 text-xs font-medium text-gold-700">
                <Ruler size={13} /> Size Guide
              </button>
            )}
          </div>

          {attr.name === 'Color' ? (
            <div className="flex flex-wrap gap-2.5">
              {attr.values.map((v) => {
                const active = selection.Color === v.value
                const inStock = hasStockFor('Color', v.value)
                return (
                  <button
                    key={v.value}
                    type="button"
                    title={v.value + (inStock ? '' : ' — out of stock')}
                    onClick={() => onChange('Color', v.value)}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                      active ? 'border-gold-500 scale-110' : 'border-transparent hover:scale-105'
                    )}
                    aria-label={`Color ${v.value}`}
                  >
                    <span
                      className="h-6.5 h-7 w-7 rounded-full border border-ink/10"
                      style={{ backgroundColor: v.hex || '#ccc' }}
                    />
                    {!inStock && <span className="absolute h-px w-9 rotate-45 bg-ink/50" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attr.values.map((v) => {
                const active = selection[attr.name] === v.value
                const inStock = hasStockFor(attr.name, v.value)
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => onChange(attr.name, v.value)}
                    className={cn(
                      'chip min-w-[44px] justify-center py-2',
                      active && 'chip-active',
                      !inStock && 'text-smoke/60 line-through decoration-ink/40'
                    )}
                  >
                    {v.value}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
