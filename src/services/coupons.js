import { getDB, commit } from '@/lib/db'
import { uid } from '@/lib/format'

export function listCoupons() {
  return [...getDB().coupons].sort((a, b) => new Date(b.startsAt || 0) - new Date(a.startsAt || 0))
}

export function saveCoupon(data) {
  const db = getDB()
  const code = String(data.code || '').toUpperCase().trim()
  const duplicate = db.coupons.some((c) => c.code === code && c.id !== data.id)
  if (duplicate) throw new Error(`Coupon code "${code}" already exists.`)
  if (data.id) {
    const existing = db.coupons.find((c) => c.id === data.id)
    if (existing) Object.assign(existing, data, { code })
  } else {
    db.coupons.push({
      type: 'percentage',
      value: 0,
      minOrder: 0,
      maxDiscount: null,
      startsAt: null,
      expiresAt: null,
      usageLimit: null,
      usedCount: 0,
      perCustomerLimit: null,
      products: [],
      categories: [],
      active: true,
      ...data,
      id: uid('cp'),
      code,
    })
  }
  commit()
}

export function deleteCoupon(id) {
  const db = getDB()
  db.coupons = db.coupons.filter((c) => c.id !== id)
  commit()
}

/**
 * Validates a coupon against the cart.
 * items: [{ productId, category, total }]
 * Returns { ok, coupon, discount } or { ok:false, reason }.
 */
export function validateCoupon(code, { subtotal, items = [] }) {
  const db = getDB()
  const coupon = db.coupons.find((c) => c.code === String(code).toUpperCase().trim())
  if (!coupon) return { ok: false, reason: 'This coupon code does not exist.' }
  if (!coupon.active) return { ok: false, reason: 'This coupon is no longer active.' }
  const nowTs = Date.now()
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > nowTs)
    return { ok: false, reason: 'This coupon is not active yet.' }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < nowTs)
    return { ok: false, reason: 'This coupon has expired.' }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, reason: 'This coupon has reached its usage limit.' }
  if (coupon.minOrder && subtotal < coupon.minOrder)
    return { ok: false, reason: `Minimum order for this coupon is Rs. ${coupon.minOrder.toLocaleString()}.` }

  let base = subtotal
  const hasProductScope = coupon.products?.length > 0
  const hasCategoryScope = coupon.categories?.length > 0
  if (hasProductScope || hasCategoryScope) {
    const parentOf = (slug) => {
      const cat = db.categories.find((c) => c.slug === slug)
      const parent = db.categories.find((c) => c.id === cat?.parentId)
      return parent?.slug
    }
    base = items
      .filter((it) => {
        const byProduct = hasProductScope && coupon.products.includes(it.productId)
        const byCategory =
          hasCategoryScope &&
          (coupon.categories.includes(it.category) || coupon.categories.includes(parentOf(it.category)))
        return byProduct || byCategory
      })
      .reduce((s, it) => s + it.total, 0)
    if (base === 0) return { ok: false, reason: 'This coupon does not apply to the items in your cart.' }
  }

  let discount = coupon.type === 'percentage' ? Math.round((base * coupon.value) / 100) : Math.min(coupon.value, base)
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
  return { ok: true, coupon, discount }
}
