import { useRef, useState } from 'react'
import { Plus, RefreshCw, Trash2, ImagePlus, X } from 'lucide-react'
import TagInput from '@/components/ui/TagInput'
import SmartImage from '@/components/ui/SmartImage'
import { Select } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { slugify } from '@/lib/format'

const PRESET_ATTRS = ['Color', 'Size', 'Fabric', 'Style']
const DEFAULT_HEX = '#B99338'

/**
 * Admin variation system: define attributes (Color/Size/Fabric/custom),
 * auto-generate the cartesian combinations, then edit SKU / price / sale /
 * stock / image / status per variant. Existing variant edits survive
 * regeneration (matched by option combination).
 */
export default function VariationBuilder({ attributes = [], variants = [], skuBase = 'SKU', basePrice = 0, baseSalePrice = null, onChange }) {
  const toast = useToast()
  const [bulk, setBulk] = useState({ price: '', stock: '' })
  const fileRefs = useRef({})

  const update = (patch) => onChange({ attributes, variants, ...patch })

  // ---------------- attributes
  const addAttribute = () => {
    if (attributes.length >= 3) return toast('Maximum 3 attributes per product.', 'error')
    const unused = PRESET_ATTRS.find((p) => !attributes.some((a) => a.name === p)) || 'Attribute'
    update({ attributes: [...attributes, { name: unused, values: [] }] })
  }

  const setAttrName = (idx, name) => {
    const next = attributes.map((a, i) => (i === idx ? { ...a, name } : a))
    update({ attributes: next })
  }

  const setAttrValues = (idx, rawValues) => {
    const attr = attributes[idx]
    const values = rawValues.map((v) => {
      const existing = attr.values.find((x) => x.value === v)
      return existing || (attr.name === 'Color' ? { value: v, hex: DEFAULT_HEX } : { value: v })
    })
    update({ attributes: attributes.map((a, i) => (i === idx ? { ...a, values } : a)) })
  }

  const setColorHex = (idx, value, hex) => {
    update({
      attributes: attributes.map((a, i) =>
        i === idx ? { ...a, values: a.values.map((v) => (v.value === value ? { ...v, hex } : v)) } : a
      ),
    })
  }

  const removeAttribute = (idx) => {
    update({ attributes: attributes.filter((_, i) => i !== idx) })
  }

  // ---------------- variants
  const comboKey = (options) => JSON.stringify(options)

  const generate = () => {
    const usable = attributes.filter((a) => a.values.length > 0)
    if (!usable.length) return toast('Add at least one attribute with values first.', 'error')
    let combos = [[]]
    for (const attr of usable) {
      combos = combos.flatMap((c) => attr.values.map((v) => [...c, [attr.name, v.value]]))
    }
    const existingByKey = new Map(variants.map((v) => [comboKey(v.options), v]))
    const next = combos.map((combo) => {
      const options = Object.fromEntries(combo)
      const existing = existingByKey.get(comboKey(options))
      if (existing) return existing
      return {
        id: slugify(`${skuBase}-${Object.values(options).join('-')}-${Math.floor(Math.random() * 900 + 100)}`),
        sku: `${skuBase}-${Object.values(options).map((v) => String(v).slice(0, 2).toUpperCase()).join('')}`,
        options,
        price: Number(basePrice) || 0,
        salePrice: baseSalePrice ? Number(baseSalePrice) : null,
        stock: 0,
        image: null,
        status: 'active',
      }
    })
    update({ variants: next })
    toast(`${next.length} variation(s) generated.`)
  }

  const setVariant = (id, patch) => {
    update({ variants: variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) })
  }

  const removeVariant = (id) => update({ variants: variants.filter((v) => v.id !== id) })

  const applyBulk = (field) => {
    const value = Number(bulk[field])
    if (Number.isNaN(value)) return
    update({ variants: variants.map((v) => ({ ...v, [field]: value })) })
    toast(`${field === 'price' ? 'Price' : 'Stock'} applied to all variations.`)
  }

  const pickImage = (id, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 512 * 1024) return toast('Variant images must be under 512 KB.', 'error')
    const reader = new FileReader()
    reader.onload = () => setVariant(id, { image: reader.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div>
      {/* attribute editor */}
      <div className="space-y-4">
        {attributes.map((attr, idx) => (
          <div key={idx} className="border border-ink/10 bg-cream/40 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <Select
                  label="Attribute"
                  value={PRESET_ATTRS.includes(attr.name) ? attr.name : 'custom'}
                  onChange={(e) => setAttrName(idx, e.target.value === 'custom' ? 'Custom' : e.target.value)}
                  options={[...PRESET_ATTRS.map((p) => ({ value: p, label: p })), { value: 'custom', label: 'Custom…' }]}
                />
              </div>
              {!PRESET_ATTRS.includes(attr.name) && (
                <div className="w-40">
                  <label className="label">Name</label>
                  <input className="input" value={attr.name} onChange={(e) => setAttrName(idx, e.target.value)} />
                </div>
              )}
              <div className="min-w-[220px] flex-1">
                <TagInput
                  label="Values"
                  value={attr.values.map((v) => v.value)}
                  onChange={(vals) => setAttrValues(idx, vals)}
                  placeholder={attr.name === 'Size' ? 'e.g. S, M, L' : attr.name === 'Color' ? 'e.g. Black, Maroon' : 'Type value, press Enter'}
                />
              </div>
              <button type="button" onClick={() => removeAttribute(idx)} className="btn-ghost mb-0.5 px-2 py-2 text-red-600" aria-label="Remove attribute">
                <Trash2 size={15} />
              </button>
            </div>
            {attr.name === 'Color' && attr.values.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {attr.values.map((v) => (
                  <label key={v.value} className="flex cursor-pointer items-center gap-1.5 text-xs">
                    <input
                      type="color"
                      value={v.hex || DEFAULT_HEX}
                      onChange={(e) => setColorHex(idx, v.value, e.target.value)}
                      className="h-6 w-8 cursor-pointer border border-ink/15 bg-transparent p-0"
                      aria-label={`Colour for ${v.value}`}
                    />
                    {v.value}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={addAttribute} className="btn-outline btn-sm">
          <Plus size={13} /> Add Attribute
        </button>
        <button type="button" onClick={generate} className="btn-primary btn-sm">
          <RefreshCw size={13} /> Generate Variations
        </button>
      </div>

      {/* variants table */}
      {variants.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2 border border-ink/10 bg-cream/40 p-3 text-xs">
            <span className="font-semibold uppercase tracking-wider text-smoke">Bulk apply:</span>
            <input type="number" placeholder="Price" value={bulk.price} onChange={(e) => setBulk((b) => ({ ...b, price: e.target.value }))} className="input w-24 py-1.5" />
            <button type="button" onClick={() => applyBulk('price')} className="btn-outline px-3 py-1.5 text-xs">Set Price</button>
            <input type="number" placeholder="Stock" value={bulk.stock} onChange={(e) => setBulk((b) => ({ ...b, stock: e.target.value }))} className="input w-24 py-1.5" />
            <button type="button" onClick={() => applyBulk('stock')} className="btn-outline px-3 py-1.5 text-xs">Set Stock</button>
            <span className="ml-auto text-smoke">{variants.length} variation(s)</span>
          </div>

          <div className="mt-3 overflow-x-auto border border-ink/10">
            <table className="table-base min-w-[820px]">
              <thead>
                <tr>
                  <th>Variation</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Sale Price</th>
                  <th>Stock</th>
                  <th>Image</th>
                  <th>Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id}>
                    <td className="whitespace-nowrap text-xs font-semibold">{Object.values(v.options).join(' / ')}</td>
                    <td><input className="input w-32 py-1.5 text-xs" value={v.sku} onChange={(e) => setVariant(v.id, { sku: e.target.value })} /></td>
                    <td><input type="number" className="input w-24 py-1.5 text-xs" value={v.price} onChange={(e) => setVariant(v.id, { price: Number(e.target.value) || 0 })} /></td>
                    <td>
                      <input
                        type="number"
                        className="input w-24 py-1.5 text-xs"
                        placeholder="—"
                        value={v.salePrice ?? ''}
                        onChange={(e) => setVariant(v.id, { salePrice: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                    </td>
                    <td><input type="number" className="input w-20 py-1.5 text-xs" value={v.stock} onChange={(e) => setVariant(v.id, { stock: Math.max(0, Number(e.target.value) || 0) })} /></td>
                    <td>
                      {v.image ? (
                        <span className="relative inline-block">
                          <SmartImage src={v.image} alt="Variant" className="h-10 w-8 object-cover" />
                          <button type="button" onClick={() => setVariant(v.id, { image: null })} className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white" aria-label="Remove image">
                            <X size={9} />
                          </button>
                        </span>
                      ) : (
                        <>
                          <button type="button" onClick={() => fileRefs.current[v.id]?.click()} className="btn-ghost px-2 py-1.5" aria-label="Add variant image">
                            <ImagePlus size={15} />
                          </button>
                          <input ref={(el) => (fileRefs.current[v.id] = el)} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(v.id, e)} />
                        </>
                      )}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={v.status === 'active'}
                        onChange={(e) => setVariant(v.id, { status: e.target.checked ? 'active' : 'disabled' })}
                        className="h-4 w-4 accent-gold-500"
                        aria-label="Variant active"
                      />
                    </td>
                    <td>
                      <button type="button" onClick={() => removeVariant(v.id)} className="p-1 text-smoke hover:text-red-600" aria-label="Delete variant">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
