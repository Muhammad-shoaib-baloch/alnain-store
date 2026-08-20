import { getDB, commit, isLive, rehydrate } from '@/lib/db'
import { api } from '@/lib/api'
import { uid } from '@/lib/format'

export function listCoupons() {
  return [...getDB().coupons].sort((a, b) => new Date(b.startsAt || 0) - new Date(a.startsAt || 0))
}

export async function saveCoupon(data) {
  if (isLive()) {
    const { coupon } = await api('/admin/coupons', { method: 'POST', body: data })
    await rehydrate()
    return coupon
  }
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

export async function deleteCoupon(id) {
  if (isLive()) {
    await api(`/admin/coupons/${id}`, { method: 'DELETE' })
    await rehydrate()
    return
  }
  const db = getDB()
  db.coupons = db.coupons.filter((c) => c.id !== id)
  commit()
}

export function toPublicCoupon(c) {
  return {
    code: c.code,
    type: c.type,
    value: c.value,
    minOrder: c.minOrder ?? 0,
    maxDiscount: c.maxDiscount ?? null,
    products: c.products ?? [],
    categories: c.categories ?? [],
  }
}

/**
 * Re-evaluates an ALREADY-VALIDATED coupon against the current cart
 * (used to keep the discount correct as quantities change). Active/date/usage
 * checks happened at apply time and again server-side at checkout.
 * items: [{ productId, category, total }]
 */
export function evaluateCoupon(meta, subtotal, items = []) {
  if (!meta) return { ok: false, reason: 'Coupon unavailable.', discount: 0 }
  const minOrder = Number(meta.minOrder) || 0
  if (minOrder && subtotal < minOrder)
    return { ok: false, reason: `Minimum order for this coupon is Rs. ${minOrder.toLocaleString()}.`, discount: 0 }

  let base = subtotal
  const scopedP = (meta.products || []).length > 0
  const scopedC = (meta.categories || []).length > 0
  if (scopedP || scopedC) {
    base = items
      .filter((it) => (scopedP && meta.products.includes(it.productId)) || (scopedC && meta.categories.includes(it.category)))
      .reduce((s, it) => s + it.total, 0)
    if (base === 0) return { ok: false, reason: 'This coupon does not apply to the items in your cart.', discount: 0 }
  }

  let discount = meta.type === 'percentage' ? Math.round((base * meta.value) / 100) : Math.min(meta.value, base)
  if (meta.maxDiscount) discount = Math.min(discount, meta.maxDiscount)
  return { ok: true, discount }
}

/**
 * Full validation (existence, active, dates, limits, scope) — via API when
 * live, locally in demo mode. Returns { ok, discount, coupon } | { ok:false, reason }.
 */
export async function requestCouponValidation(code, { subtotal, items = [] }) {
  if (isLive()) {
    return api('/coupons/validate', { method: 'POST', body: { code, subtotal, items } })
  }
  const result = validateCoupon(code, { subtotal, items })
  return result.ok ? { ok: true, discount: result.discount, coupon: toPublicCoupon(result.coupon) } : result
}

/** Demo-mode full validation against the local coupon table. */
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

  const check = evaluateCoupon(toPublicCoupon(coupon), subtotal, items)
  if (!check.ok) return { ok: false, reason: check.reason }
  return { ok: true, coupon, discount: check.discount }
}
