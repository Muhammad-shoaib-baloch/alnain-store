import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import ImageUploader from '@/components/admin/ImageUploader'
import VariationBuilder from '@/components/admin/VariationBuilder'
import TagInput from '@/components/ui/TagInput'
import { Checkbox, Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { slugify, uid } from '@/lib/format'
import { getProductById, getCategories, getCollections, saveProduct } from '@/services/catalog'

const BLANK = {
  name: '',
  slug: '',
  sku: '',
  brand: 'Al Nain',
  category: '',
  collections: [],
  tags: [],
  gender: 'women',
  fabric: '',
  shortDescription: '',
  description: '',
  details: [],
  price: '',
  salePrice: '',
  costPrice: '',
  images: [],
  attributes: [],
  variants: [],
  lowStockThreshold: 5,
  allowBackorders: false,
  simpleStock: 10,
  isNew: false,
  featured: false,
  status: 'draft',
  seo: { metaTitle: '', metaDescription: '' },
}

export default function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = useMemo(() => (id ? getProductById(id) : null), [id])
  usePageTitle(existing ? `Edit · ${existing.name}` : 'New Product')

  const [form, setForm] = useState(() =>
    existing
      ? { ...BLANK, ...existing, price: existing.price, salePrice: existing.salePrice ?? '', costPrice: existing.costPrice ?? '', seo: { ...BLANK.seo, ...existing.seo } }
      : { ...BLANK }
  )
  const [slugTouched, setSlugTouched] = useState(!!existing)
  const [errors, setErrors] = useState({})

  if (id && !existing) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-smoke">Product not found.</p>
        <Link to="/admin/products" className="btn-primary mt-4">Back to Products</Link>
      </div>
    )
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setInput = (key) => (e) => set(key, e.target.value)

  const onNameChange = (e) => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
  }

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 3) e.name = 'Product name is required.'
    if (!form.sku.trim()) e.sku = 'SKU is required.'
    if (!form.category) e.category = 'Select a category.'
    if (!form.price || Number(form.price) <= 0) e.price = 'Enter a valid price.'
    if (form.salePrice && Number(form.salePrice) >= Number(form.price)) e.salePrice = 'Sale price must be below the regular price.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = (statusOverride) => {
    if (!validate()) {
      toast('Please fix the highlighted fields.', 'error')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    let { attributes, variants } = form
    // simple product (no variations defined) → one default variant carries stock
    if (!variants.length) {
      variants = [
        {
          id: uid('v'),
          sku: form.sku,
          options: {},
          price: Number(form.price),
          salePrice: form.salePrice ? Number(form.salePrice) : null,
          stock: Number(form.simpleStock) || 0,
          image: null,
          status: 'active',
        },
      ]
      attributes = []
    }
    const payload = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      attributes,
      variants,
      status: statusOverride || form.status,
      seo: {
        metaTitle: form.seo.metaTitle || `${form.name} | Al Nain`,
        metaDescription: form.seo.metaDescription || form.shortDescription,
      },
    }
    delete payload.simpleStock
    const saved = saveProduct(payload)
    toast(existing ? 'Product updated.' : `Product “${saved.name}” created.`)
    navigate('/admin/products')
  }

  const categories = getCategories()
  const collections = getCollections()

  return (
    <div>
      <button onClick={() => navigate('/admin/products')} className="mb-3 flex items-center gap-1.5 text-sm text-smoke transition-colors hover:text-ink">
        <ArrowLeft size={15} /> Back to products
      </button>
      <PageHeader title={existing ? 'Edit Product' : 'Add Product'} sub={existing ? existing.name : 'Create a new product for your catalogue.'}>
        {existing && (
          <Link to={`/product/${existing.slug}`} target="_blank" className="btn-outline btn-sm">
            <Eye size={13} /> Preview
          </Link>
        )}
        <button onClick={() => save('draft')} className="btn-outline btn-sm">Save Draft</button>
        <button onClick={() => save('published')} className="btn-primary btn-sm">
          <Save size={13} /> {existing ? 'Save & Publish' : 'Publish'}
        </button>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr,320px]">
        {/* main column */}
        <div className="space-y-5">
          {/* basic */}
          <section className="card p-6">
            <h2 className="mb-5 font-display text-lg">Basic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input className="sm:col-span-2" label="Product name" required value={form.name} onChange={onNameChange} error={errors.name} placeholder="e.g. Gulnar Embroidered Chiffon Suit" />
              <Input
                label="URL slug"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)) }}
                hint={`/product/${form.slug || '…'}`}
              />
              <Input label="Base SKU" required value={form.sku} onChange={setInput('sku')} error={errors.sku} placeholder="PSK-025" />
              <Textarea className="sm:col-span-2" label="Short description" rows={2} value={form.shortDescription} onChange={setInput('shortDescription')} placeholder="One-line summary shown on cards and quick view" />
              <Textarea className="sm:col-span-2" label="Full description" rows={6} value={form.description} onChange={setInput('description')} placeholder="Separate paragraphs with a blank line" />
            </div>
          </section>

          {/* pricing */}
          <section className="card p-6">
            <h2 className="mb-5 font-display text-lg">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Regular price (Rs.)" required type="number" value={form.price} onChange={setInput('price')} error={errors.price} />
              <Input label="Sale price (Rs.)" type="number" value={form.salePrice} onChange={setInput('salePrice')} error={errors.salePrice} hint="Leave empty for no sale" />
              <Input label="Cost price (Rs.)" type="number" value={form.costPrice} onChange={setInput('costPrice')} hint="Internal — for margins" />
            </div>
          </section>

          {/* images */}
          <section className="card p-6">
            <h2 className="mb-5 font-display text-lg">Product Images</h2>
            <ImageUploader images={form.images} onChange={(images) => set('images', images)} />
          </section>

          {/* variations */}
          <section className="card p-6">
            <h2 className="mb-1 font-display text-lg">Variations</h2>
            <p className="mb-5 text-xs text-smoke">
              Define attributes (Color, Size, Fabric…) and generate combinations. Each variation has its own SKU, price,
              stock and optional image. Leave empty for a simple product.
            </p>
            <VariationBuilder
              attributes={form.attributes}
              variants={form.variants}
              skuBase={form.sku || 'SKU'}
              basePrice={Number(form.price) || 0}
              baseSalePrice={form.salePrice ? Number(form.salePrice) : null}
              onChange={({ attributes, variants }) => setForm((f) => ({ ...f, attributes, variants }))}
            />
          </section>

          {/* SEO */}
          <section className="card p-6">
            <h2 className="mb-5 font-display text-lg">SEO</h2>
            <div className="space-y-4">
              <Input label="Meta title" value={form.seo.metaTitle} onChange={(e) => set('seo', { ...form.seo, metaTitle: e.target.value })} placeholder={`${form.name || 'Product'} | Al Nain`} />
              <Textarea label="Meta description" rows={2} value={form.seo.metaDescription} onChange={(e) => set('seo', { ...form.seo, metaDescription: e.target.value })} />
            </div>
          </section>
        </div>

        {/* side column */}
        <div className="space-y-5">
          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg">Status</h2>
            <Select
              value={form.status}
              onChange={setInput('status')}
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <div className="mt-4 space-y-3">
              <Toggle checked={form.isNew} onChange={(v) => set('isNew', v)} label="Mark as New" description="Shows the “New” badge" />
              <Toggle checked={form.featured} onChange={(v) => set('featured', v)} label="Featured" description="Boosts in featured sorting" />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg">Organization</h2>
            <div className="space-y-4">
              <Select
                label="Category"
                required
                value={form.category}
                onChange={setInput('category')}
                error={errors.category}
                placeholder="Select category"
                options={categories.map((c) => ({ value: c.slug, label: c.parentId ? `— ${c.name}` : c.name }))}
              />
              <Select
                label="Gender"
                value={form.gender}
                onChange={setInput('gender')}
                options={[
                  { value: 'women', label: 'Women' },
                  { value: 'men', label: 'Men' },
                  { value: 'unisex', label: 'Unisex' },
                ]}
              />
              <Input label="Fabric" value={form.fabric} onChange={setInput('fabric')} placeholder="e.g. Lawn, Velvet, Khaddar" />
              <Input label="Brand" value={form.brand} onChange={setInput('brand')} />
              <div>
                <p className="label">Collections</p>
                <div className="space-y-2">
                  {collections.map((col) => (
                    <Checkbox
                      key={col.id}
                      label={col.name}
                      checked={form.collections.includes(col.slug)}
                      onChange={(v) =>
                        set('collections', v ? [...form.collections, col.slug] : form.collections.filter((s) => s !== col.slug))
                      }
                    />
                  ))}
                </div>
              </div>
              <TagInput label="Tags" value={form.tags} onChange={(tags) => set('tags', tags)} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg">Inventory</h2>
            <div className="space-y-4">
              {form.variants.length === 0 && (
                <Input label="Stock quantity (simple product)" type="number" value={form.simpleStock} onChange={setInput('simpleStock')} hint="Used when no variations are defined" />
              )}
              <Input label="Low stock threshold" type="number" value={form.lowStockThreshold} onChange={setInput('lowStockThreshold')} hint="Variants at or below this show as low stock" />
              <Toggle checked={form.allowBackorders} onChange={(v) => set('allowBackorders', v)} label="Allow backorders" description="Customers can order even when out of stock" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
