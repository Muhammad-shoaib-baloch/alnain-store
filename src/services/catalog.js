import { getDB, commit, isLive, rehydrate } from '@/lib/db'
import { api, materializeImage, materializeImageList } from '@/lib/api'
import { slugify, uid, pctOff } from '@/lib/format'
import { SIZE_ORDER } from '@/lib/constants'

// ------------------------------------------------------------- product utils
export const activeVariants = (p) => (p.variants || []).filter((v) => v.status === 'active')

export function productStock(p) {
  return activeVariants(p).reduce((s, v) => s + (Number(v.stock) || 0), 0)
}

export function stockStatus(p) {
  const total = productStock(p)
  if (total <= 0) return 'out-of-stock'
  if (total <= (p.lowStockThreshold ?? 5)) return 'low-stock'
  if (activeVariants(p).some((v) => v.stock > 0 && v.stock <= (p.lowStockThreshold ?? 5))) return 'low-stock'
  return 'in-stock'
}

export const effectivePrice = (p) => p.salePrice ?? p.price
export const variantPrice = (v) => v.salePrice ?? v.price

export function priceRangeOf(p) {
  const prices = activeVariants(p).map(variantPrice)
  if (!prices.length) return [effectivePrice(p), effectivePrice(p)]
  return [Math.min(...prices), Math.max(...prices)]
}

export function findVariant(product, options) {
  return (product.variants || []).find((v) =>
    (product.attributes || []).every((a) => v.options[a.name] === options[a.name])
  )
}

export function defaultVariant(product) {
  const active = activeVariants(product)
  return active.find((v) => v.stock > 0) || active[0] || product.variants?.[0] || null
}

// ------------------------------------------------------------- product query
function matchesQuery(p, q) {
  const hay = `${p.name} ${p.sku} ${p.category} ${p.fabric} ${(p.tags || []).join(' ')}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word))
}

function categoryFamily(db, slug) {
  const cat = db.categories.find((c) => c.slug === slug)
  if (!cat) return [slug]
  const children = db.categories.filter((c) => c.parentId === cat.id).map((c) => c.slug)
  return [cat.slug, ...children]
}

/**
 * Central product query used by shop, search, rails and admin list.
 * All filters combine (AND); returns paginated result.
 */
export function getProducts(params = {}) {
  const {
    q,
    category,
    subcategory,
    sizes = [],
    colors = [],
    fabrics = [],
    collections = [],
    price,
    inStock,
    rating,
    discount,
    sort = 'featured',
    page = 1,
    perPage = 12,
    includeAllStatuses = false,
    status,
  } = params
  const db = getDB()

  let items = db.products.filter((p) => (includeAllStatuses ? true : p.status === 'published'))
  if (status) items = items.filter((p) => p.status === status)
  if (q) items = items.filter((p) => matchesQuery(p, q))
  if (category) {
    const family = categoryFamily(db, category)
    items = items.filter((p) => family.includes(p.category))
  }
  if (subcategory) items = items.filter((p) => p.category === subcategory)
  if (sizes.length) {
    items = items.filter((p) => {
      const attr = (p.attributes || []).find((a) => a.name === 'Size')
      return attr && attr.values.some((v) => sizes.includes(v.value))
    })
  }
  if (colors.length) {
    items = items.filter((p) => {
      const attr = (p.attributes || []).find((a) => a.name === 'Color')
      return attr && attr.values.some((v) => colors.includes(v.value))
    })
  }
  if (fabrics.length) {
    items = items.filter(
      (p) =>
        fabrics.includes(p.fabric) ||
        (p.attributes || []).some((a) => a.name === 'Fabric' && a.values.some((v) => fabrics.includes(v.value)))
    )
  }
  if (collections.length) {
    items = items.filter((p) => (p.collections || []).some((c) => collections.includes(c)))
  }
  if (price && (price[0] != null || price[1] != null)) {
    const [lo, hi] = price
    items = items.filter((p) => {
      const val = effectivePrice(p)
      return (lo == null || val >= lo) && (hi == null || val <= hi)
    })
  }
  if (inStock) items = items.filter((p) => productStock(p) > 0)
  if (rating) items = items.filter((p) => p.rating >= Number(rating))
  if (discount) {
    if (discount === 'sale') items = items.filter((p) => p.salePrice != null)
    else items = items.filter((p) => pctOff(p.price, p.salePrice) >= Number(discount))
  }

  const sorters = {
    featured: (a, b) => (b.featured === true) - (a.featured === true) || b.rating - a.rating,
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    'price-asc': (a, b) => effectivePrice(a) - effectivePrice(b),
    'price-desc': (a, b) => effectivePrice(b) - effectivePrice(a),
    rating: (a, b) => b.rating - a.rating,
    'best-selling': (a, b) => b.reviewCount - a.reviewCount,
    name: (a, b) => a.name.localeCompare(b.name),
    'stock-asc': (a, b) => productStock(a) - productStock(b),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  }
  items = [...items].sort(sorters[sort] || sorters.featured)

  const total = items.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), pages)
  return {
    items: items.slice((safePage - 1) * perPage, safePage * perPage),
    total,
    page: safePage,
    pages,
  }
}

export function getProductBySlug(slug) {
  return getDB().products.find((p) => p.slug === slug) || null
}

export function getProductById(id) {
  return getDB().products.find((p) => p.id === id) || null
}

export function getRelated(product, n = 4) {
  return getDB()
    .products.filter(
      (p) =>
        p.id !== product.id &&
        p.status === 'published' &&
        (p.category === product.category || p.collections.some((c) => product.collections.includes(c)))
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, n)
}

export function suggestProducts(q, n = 6) {
  if (!q || q.trim().length < 2) return []
  return getDB()
    .products.filter((p) => p.status === 'published' && matchesQuery(p, q))
    .slice(0, n)
}

/** Facet metadata for the shop filter sidebar. */
export function getFilterMeta() {
  const db = getDB()
  const products = db.products.filter((p) => p.status === 'published')
  const sizes = new Set()
  const colorMap = new Map()
  const fabrics = new Set()
  let min = Infinity
  let max = 0
  for (const p of products) {
    fabrics.add(p.fabric)
    for (const a of p.attributes || []) {
      if (a.name === 'Size') a.values.forEach((v) => sizes.add(v.value))
      if (a.name === 'Color') a.values.forEach((v) => colorMap.set(v.value, v.hex))
      if (a.name === 'Fabric') a.values.forEach((v) => fabrics.add(v.value))
    }
    const val = effectivePrice(p)
    min = Math.min(min, val)
    max = Math.max(max, val)
  }
  return {
    sizes: SIZE_ORDER.filter((s) => sizes.has(s)),
    colors: [...colorMap.entries()].map(([value, hex]) => ({ value, hex })),
    fabrics: [...fabrics].sort(),
    price: [Math.floor(min / 500) * 500 || 0, Math.ceil(max / 500) * 500 || 100000],
    collections: db.collections.filter((c) => c.active),
  }
}

// ------------------------------------------------------------- product CRUD
export async function saveProduct(data) {
  if (isLive()) {
    const payload = { ...data }
    payload.images = await materializeImageList(payload.images || [])
    payload.variants = await Promise.all(
      (payload.variants || []).map(async (v) => ({ ...v, image: await materializeImage(v.image) }))
    )
    const { product } = await api('/admin/products', { method: 'POST', body: payload })
    await rehydrate()
    return product
  }
  const db = getDB()
  const existing = data.id ? db.products.find((p) => p.id === data.id) : null
  const slug = slugify(data.slug || data.name)
  const slugTaken = db.products.some((p) => p.slug === slug && p.id !== data.id)
  const finalSlug = slugTaken ? `${slug}-${Math.floor(Math.random() * 900 + 100)}` : slug
  if (existing) {
    Object.assign(existing, data, { slug: finalSlug, updatedAt: new Date().toISOString() })
    commit()
    return existing
  }
  const product = {
    rating: 0,
    reviewCount: 0,
    isNew: true,
    featured: false,
    collections: [],
    tags: [],
    images: [],
    attributes: [],
    variants: [],
    details: [],
    lowStockThreshold: 5,
    allowBackorders: false,
    seo: {},
    ...data,
    id: uid('p'),
    slug: finalSlug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.products.unshift(product)
  commit()
  return product
}

export async function deleteProduct(id) {
  if (isLive()) {
    await api(`/admin/products/${id}`, { method: 'DELETE' })
    await rehydrate()
    return
  }
  const db = getDB()
  db.products = db.products.filter((p) => p.id !== id)
  db.collections.forEach((c) => {
    c.productIds = (c.productIds || []).filter((pid) => pid !== id)
  })
  commit()
}

export async function duplicateProduct(id) {
  if (isLive()) {
    const { product } = await api(`/admin/products/${id}/duplicate`, { method: 'POST' })
    await rehydrate()
    return product
  }
  const db = getDB()
  const src = db.products.find((p) => p.id === id)
  if (!src) return null
  const copy = JSON.parse(JSON.stringify(src))
  copy.id = uid('p')
  copy.name = `${src.name} (Copy)`
  copy.slug = `${src.slug}-copy-${Math.floor(Math.random() * 900 + 100)}`
  copy.sku = `${src.sku}-C`
  copy.status = 'draft'
  copy.createdAt = new Date().toISOString()
  copy.updatedAt = new Date().toISOString()
  db.products.unshift(copy)
  commit()
  return copy
}

// ------------------------------------------------------------- inventory
export function listInventory({ q, status } = {}) {
  const db = getDB()
  const rows = []
  for (const p of db.products) {
    for (const v of p.variants || []) {
      const threshold = p.lowStockThreshold ?? 5
      const st = v.stock <= 0 ? 'out-of-stock' : v.stock <= threshold ? 'low-stock' : 'in-stock'
      rows.push({ product: p, variant: v, threshold, status: st })
    }
  }
  let out = rows
  if (q) {
    const needle = q.toLowerCase()
    out = out.filter(
      (r) =>
        r.product.name.toLowerCase().includes(needle) ||
        r.variant.sku.toLowerCase().includes(needle) ||
        Object.values(r.variant.options).join(' ').toLowerCase().includes(needle)
    )
  }
  if (status) out = out.filter((r) => r.status === status)
  return out.sort((a, b) => a.variant.stock - b.variant.stock)
}

export async function updateVariantStock(productId, variantId, stock) {
  if (isLive()) {
    await api('/admin/inventory', { method: 'PATCH', body: { productId, variantId, stock } })
    await rehydrate()
    return
  }
  const db = getDB()
  const p = db.products.find((x) => x.id === productId)
  const v = p?.variants.find((x) => x.id === variantId)
  if (!v) return
  v.stock = Math.max(0, Number(stock) || 0)
  p.updatedAt = new Date().toISOString()
  commit()
}

// ------------------------------------------------------------- categories
export function getCategories({ tree = false, activeOnly = false } = {}) {
  const db = getDB()
  let cats = db.categories
  if (activeOnly) cats = cats.filter((c) => c.status === 'active')
  if (!tree) return cats
  return cats
    .filter((c) => !c.parentId)
    .map((parent) => ({ ...parent, children: cats.filter((c) => c.parentId === parent.id) }))
}

export function getCategory(slug) {
  return getDB().categories.find((c) => c.slug === slug) || null
}

export function countProductsInCategory(slug) {
  const db = getDB()
  const family = categoryFamily(db, slug)
  return db.products.filter((p) => p.status === 'published' && family.includes(p.category)).length
}

export async function saveCategory(data) {
  if (isLive()) {
    const payload = { ...data, image: await materializeImage(data.image) }
    await api('/admin/categories', { method: 'POST', body: payload })
    await rehydrate()
    return
  }
  const db = getDB()
  if (data.id) {
    const existing = db.categories.find((c) => c.id === data.id)
    if (existing) Object.assign(existing, data, { slug: slugify(data.slug || data.name) })
  } else {
    db.categories.push({
      status: 'active',
      parentId: null,
      image: null,
      description: '',
      ...data,
      id: uid('c'),
      slug: slugify(data.slug || data.name),
    })
  }
  commit()
}

export async function deleteCategory(id) {
  if (isLive()) {
    await api(`/admin/categories/${id}`, { method: 'DELETE' })
    await rehydrate()
    return
  }
  const db = getDB()
  const cat = db.categories.find((c) => c.id === id)
  if (!cat) return
  const parent = db.categories.find((c) => c.id === cat.parentId)
  db.products.forEach((p) => {
    if (p.category === cat.slug) p.category = parent?.slug || ''
  })
  db.categories.forEach((c) => {
    if (c.parentId === id) c.parentId = cat.parentId || null
  })
  db.categories = db.categories.filter((c) => c.id !== id)
  commit()
}

// ------------------------------------------------------------- collections
export function getCollections({ activeOnly = false, featuredOnly = false } = {}) {
  let cols = getDB().collections
  if (activeOnly) cols = cols.filter((c) => c.active)
  if (featuredOnly) cols = cols.filter((c) => c.featured)
  return cols
}

export function getCollection(slug) {
  return getDB().collections.find((c) => c.slug === slug) || null
}

export function getCollectionProducts(slug) {
  const col = getCollection(slug)
  if (!col) return []
  const db = getDB()
  return (col.productIds || [])
    .map((id) => db.products.find((p) => p.id === id))
    .filter((p) => p && p.status === 'published')
}

export async function saveCollection(data) {
  if (isLive()) {
    const payload = { ...data, image: await materializeImage(data.image) }
    await api('/admin/collections', { method: 'POST', body: payload })
    await rehydrate()
    return
  }
  const db = getDB()
  if (data.id) {
    const existing = db.collections.find((c) => c.id === data.id)
    if (existing) Object.assign(existing, data, { slug: slugify(data.slug || data.name) })
  } else {
    db.collections.push({
      active: true,
      featured: false,
      productIds: [],
      image: null,
      description: '',
      ...data,
      id: uid('col'),
      slug: slugify(data.slug || data.name),
    })
  }
  // keep product.collections in sync with collection.productIds
  const col = data.id ? db.collections.find((c) => c.id === data.id) : db.collections[db.collections.length - 1]
  if (col) {
    db.products.forEach((p) => {
      const inList = (col.productIds || []).includes(p.id)
      const has = (p.collections || []).includes(col.slug)
      if (inList && !has) p.collections = [...(p.collections || []), col.slug]
      if (!inList && has) p.collections = p.collections.filter((s) => s !== col.slug)
    })
  }
  commit()
}

export async function deleteCollection(id) {
  if (isLive()) {
    await api(`/admin/collections/${id}`, { method: 'DELETE' })
    await rehydrate()
    return
  }
  const db = getDB()
  const col = db.collections.find((c) => c.id === id)
  if (!col) return
  db.products.forEach((p) => {
    p.collections = (p.collections || []).filter((s) => s !== col.slug)
  })
  db.collections = db.collections.filter((c) => c.id !== id)
  commit()
}
