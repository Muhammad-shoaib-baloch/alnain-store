import { getDB, commit, notify, isLive, rehydrate } from '@/lib/db'
import { api } from '@/lib/api'
import { uid } from '@/lib/format'
import { validateCoupon } from './coupons'
import { getSettings } from './settings'

const DAY = 24 * 60 * 60 * 1000

export function computeTotals({ subtotal, discount = 0, shippingMethod = 'standard' }) {
  const settings = getSettings()
  const method = settings.shipping.methods.find((m) => m.id === shippingMethod && m.enabled) ||
    settings.shipping.methods.find((m) => m.enabled) || { fee: 0 }
  const base = Math.max(0, subtotal - discount)
  const freeShipping =
    shippingMethod === 'standard' && base >= (settings.shipping.freeShippingThreshold || Infinity)
  const shipping = subtotal === 0 ? 0 : freeShipping ? 0 : method.fee
  const tax = settings.tax.enabled ? Math.round(base * (settings.tax.rate / 100)) : 0
  return { subtotal, discount, shipping, tax, total: base + shipping + tax, freeShipping }
}

/**
 * Places an order. Validates stock, applies coupon, decrements inventory.
 * Live mode: the server is the authority (revalidates everything).
 * Throws Error with a friendly message on failure.
 */
export async function createOrder({ customer, address, shippingMethod, paymentMethod, items, couponCode, customerId }) {
  if (isLive()) {
    const { order } = await api('/orders', {
      method: 'POST',
      body: { customer, address, shippingMethod, paymentMethod, items, couponCode },
    })
    const db = getDB()
    db.orders = [order, ...db.orders]
    notify()
    return order
  }
  const db = getDB()
  if (!items?.length) throw new Error('Your cart is empty.')

  const detailed = items.map(({ productId, variantId, qty }) => {
    const p = db.products.find((x) => x.id === productId)
    if (!p || p.status !== 'published') throw new Error('A product in your cart is no longer available.')
    const v = p.variants.find((x) => x.id === variantId)
    if (!v || v.status !== 'active') throw new Error(`${p.name}: selected variation is unavailable.`)
    if (!p.allowBackorders && v.stock < qty)
      throw new Error(`${p.name} (${Object.values(v.options).join(' / ')}) has only ${v.stock} left in stock.`)
    const unit = v.salePrice ?? v.price
    return {
      productId: p.id,
      variantId: v.id,
      name: p.name,
      slug: p.slug,
      sku: v.sku,
      image: v.image || p.images[0] || null,
      options: v.options,
      price: unit,
      qty,
      total: unit * qty,
      category: p.category,
    }
  })

  const subtotal = detailed.reduce((s, it) => s + it.total, 0)
  let discount = 0
  let appliedCoupon = null
  if (couponCode) {
    const result = validateCoupon(couponCode, { subtotal, items: detailed })
    if (!result.ok) throw new Error(result.reason)
    discount = result.discount
    appliedCoupon = result.coupon
  }
  const totals = computeTotals({ subtotal, discount, shippingMethod })

  // decrement stock
  detailed.forEach((it) => {
    const p = db.products.find((x) => x.id === it.productId)
    const v = p.variants.find((x) => x.id === it.variantId)
    v.stock = Math.max(0, v.stock - it.qty)
  })
  if (appliedCoupon) appliedCoupon.usedCount = (appliedCoupon.usedCount || 0) + 1

  db.meta.orderSeq = (db.meta.orderSeq || 1000) + 1
  const number = `ALN-${db.meta.orderSeq}`
  const etaDays = shippingMethod === 'express' ? 2 : 5
  const order = {
    id: uid('o'),
    number,
    customerId: customerId || null,
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    email: customer.email,
    phone: customer.phone,
    items: detailed,
    subtotal,
    discount,
    couponCode: appliedCoupon?.code || null,
    shippingMethod,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    paymentMethod,
    paymentStatus: 'pending',
    status: 'pending',
    shippingAddress: address,
    trackingNumber: null,
    notes: [],
    timeline: [{ label: 'Order placed', at: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + etaDays * DAY).toISOString(),
  }
  db.orders.unshift(order)
  commit()
  return order
}

export function listOrders({ q, status, payment, customerId, email, page = 1, perPage = 10 } = {}) {
  const db = getDB()
  let items = [...db.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (customerId || email) {
    items = items.filter(
      (o) => (customerId && o.customerId === customerId) || (email && o.email === email)
    )
  }
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter(
      (o) =>
        o.number.toLowerCase().includes(needle) ||
        o.customerName.toLowerCase().includes(needle) ||
        o.email.toLowerCase().includes(needle)
    )
  }
  if (status) items = items.filter((o) => o.status === status)
  if (payment) items = items.filter((o) => o.paymentStatus === payment)
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), pages)
  return { items: items.slice((safePage - 1) * perPage, safePage * perPage), total, page: safePage, pages }
}

export function getOrder(idOrNumber) {
  const db = getDB()
  return db.orders.find((o) => o.id === idOrNumber || o.number === idOrNumber) || null
}

export async function updateOrder(id, patch, timelineLabel) {
  if (isLive()) {
    const { order } = await api(`/admin/orders/${id}`, { method: 'PATCH', body: { ...patch, timelineLabel } })
    await rehydrate()
    return order
  }
  const db = getDB()
  const order = db.orders.find((o) => o.id === id)
  if (!order) return null
  Object.assign(order, patch)
  if (timelineLabel) order.timeline = [...order.timeline, { label: timelineLabel, at: new Date().toISOString() }]
  commit()
  return order
}

export async function addOrderNote(id, text, by = 'Store Admin') {
  if (isLive()) {
    const { order } = await api(`/admin/orders/${id}`, { method: 'PATCH', body: { note: text } })
    await rehydrate()
    return order
  }
  const db = getDB()
  const order = db.orders.find((o) => o.id === id)
  if (!order) return
  order.notes = [...(order.notes || []), { id: uid('n'), text, by, at: new Date().toISOString() }]
  commit()
  return order
}

export async function cancelOrder(id, { restock = true, label = 'Order cancelled', byStore = false } = {}) {
  if (isLive()) {
    const { order } = byStore
      ? await api(`/admin/orders/${id}`, { method: 'PATCH', body: { cancel: true } })
      : await api(`/orders/${id}/cancel`, { method: 'POST' })
    await rehydrate()
    return order
  }
  const db = getDB()
  const order = db.orders.find((o) => o.id === id)
  if (!order) return
  if (restock) {
    order.items.forEach((it) => {
      const p = db.products.find((x) => x.id === it.productId)
      const v = p?.variants.find((x) => x.id === it.variantId)
      if (v) v.stock += it.qty
    })
  }
  order.status = 'cancelled'
  order.timeline = [...order.timeline, { label, at: new Date().toISOString() }]
  commit()
  return order
}

// ------------------------------------------------------------- analytics
const isRevenue = (o) => o.status !== 'cancelled' && o.paymentStatus !== 'refunded'

export function getDashboardStats() {
  const db = getDB()
  const today = new Date().toDateString()
  const revenueOrders = db.orders.filter(isRevenue)
  const lowStock = db.products.reduce((acc, p) => {
    const th = p.lowStockThreshold ?? 5
    return acc + (p.variants || []).filter((v) => v.status === 'active' && v.stock <= th).length
  }, 0)
  return {
    totalSales: revenueOrders.reduce((s, o) => s + o.total, 0),
    todaySales: revenueOrders
      .filter((o) => new Date(o.createdAt).toDateString() === today)
      .reduce((s, o) => s + o.total, 0),
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
    totalCustomers: db.users.filter((u) => u.role === 'customer').length,
    totalProducts: db.products.length,
    lowStockVariants: lowStock,
  }
}

export function getSalesSeries(days = 30) {
  const db = getDB()
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = d.toDateString()
    const dayOrders = db.orders.filter((o) => isRevenue(o) && new Date(o.createdAt).toDateString() === key)
    out.push({
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    })
  }
  return out
}

export function getTopProducts(n = 5) {
  const db = getDB()
  const map = new Map()
  db.orders.filter(isRevenue).forEach((o) =>
    o.items.forEach((it) => {
      const entry = map.get(it.productId) || { qty: 0, revenue: 0 }
      entry.qty += it.qty
      entry.revenue += it.total
      map.set(it.productId, entry)
    })
  )
  return [...map.entries()]
    .map(([productId, agg]) => ({ product: db.products.find((p) => p.id === productId), ...agg }))
    .filter((x) => x.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n)
}

export function getCategoryPerformance() {
  const db = getDB()
  const map = new Map()
  db.orders.filter(isRevenue).forEach((o) =>
    o.items.forEach((it) => {
      const p = db.products.find((x) => x.id === it.productId)
      const cat = db.categories.find((c) => c.slug === (it.category || p?.category))
      const key = cat?.name || 'Other'
      map.set(key, (map.get(key) || 0) + it.total)
    })
  )
  const total = [...map.values()].reduce((s, v) => s + v, 0) || 1
  return [...map.entries()]
    .map(([name, revenue]) => ({ name, revenue, share: Math.round((revenue / total) * 100) }))
    .sort((a, b) => b.revenue - a.revenue)
}
