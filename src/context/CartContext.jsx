import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { subscribe } from '@/lib/db'
import { getProductById, variantPrice } from '@/services/catalog'
import { validateCoupon } from '@/services/coupons'
import { computeTotals } from '@/services/orders'
import { uid } from '@/lib/format'
import { trackEvent } from '@/lib/gtm'

const CART_KEY = 'poshaak_cart'
const CartContext = createContext(null)

export function useCart() {
  return useContext(CartContext)
}

const readCart = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || 'null')
    return raw && Array.isArray(raw.items) ? raw : { items: [], couponCode: null }
  } catch {
    return { items: [], couponCode: null }
  }
}

export function CartProvider({ children }) {
  const [state, setState] = useState(readCart)
  const [dbVersion, setDbVersion] = useState(0)

  // prices/stock can change from the admin panel — re-derive on db commits
  useEffect(() => subscribe(() => setDbVersion((v) => v + 1)), [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state))
  }, [state])

  /** Resolved cart rows (product + variant + live pricing). Missing items are dropped. */
  const detailed = useMemo(() => {
    return state.items
      .map((line) => {
        const product = getProductById(line.productId)
        if (!product || product.status !== 'published') return null
        const variant = (product.variants || []).find((v) => v.id === line.variantId)
        if (!variant) return null
        const unit = variantPrice(variant)
        return {
          ...line,
          product,
          variant,
          unit,
          total: unit * line.qty,
          image: variant.image || product.images[0],
          maxQty: product.allowBackorders ? 99 : variant.stock,
        }
      })
      .filter(Boolean)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items, dbVersion])

  const subtotal = detailed.reduce((s, it) => s + it.total, 0)

  const couponResult = useMemo(() => {
    if (!state.couponCode) return null
    return validateCoupon(state.couponCode, {
      subtotal,
      items: detailed.map((it) => ({ productId: it.productId, category: it.product.category, total: it.total })),
    })
  }, [state.couponCode, subtotal, detailed])

  const discount = couponResult?.ok ? couponResult.discount : 0

  const getTotals = useCallback(
    (shippingMethod = 'standard') => computeTotals({ subtotal, discount, shippingMethod }),
    [subtotal, discount]
  )

  const add = useCallback((product, variant, qty = 1) => {
    let result = { ok: true }
    setState((prev) => {
      const existing = prev.items.find((l) => l.variantId === variant.id)
      const already = existing?.qty || 0
      const available = product.allowBackorders ? 99 : variant.stock
      if (variant.status !== 'active' || available <= 0) {
        result = { ok: false, message: 'This variation is out of stock.' }
        return prev
      }
      if (already + qty > available) {
        result = { ok: false, message: `Only ${available} in stock for this variation.` }
        return prev
      }
      const items = existing
        ? prev.items.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + qty } : l))
        : [...prev.items, { id: uid('line'), productId: product.id, variantId: variant.id, qty }]
      return { ...prev, items }
    })
    if (result.ok) {
      trackEvent('add_to_cart', {
        currency: 'PKR',
        value: (variant.salePrice ?? variant.price) * qty,
        items: [{ item_id: variant.sku, item_name: product.name, quantity: qty }],
      })
    }
    return result
  }, [])

  const updateQty = useCallback((lineId, qty) => {
    setState((prev) => ({
      ...prev,
      items:
        qty <= 0
          ? prev.items.filter((l) => l.id !== lineId)
          : prev.items.map((l) => (l.id === lineId ? { ...l, qty } : l)),
    }))
  }, [])

  const remove = useCallback((lineId) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((l) => l.id !== lineId) }))
  }, [])

  const clear = useCallback(() => setState({ items: [], couponCode: null }), [])

  const applyCoupon = useCallback(
    (code) => {
      const result = validateCoupon(code, {
        subtotal,
        items: detailed.map((it) => ({ productId: it.productId, category: it.product.category, total: it.total })),
      })
      if (result.ok) setState((prev) => ({ ...prev, couponCode: result.coupon.code }))
      return result
    },
    [subtotal, detailed]
  )

  const removeCoupon = useCallback(() => setState((prev) => ({ ...prev, couponCode: null })), [])

  const value = useMemo(
    () => ({
      items: state.items,
      detailed,
      count: state.items.reduce((s, l) => s + l.qty, 0),
      subtotal,
      couponCode: state.couponCode,
      couponResult,
      discount,
      getTotals,
      add,
      updateQty,
      remove,
      clear,
      applyCoupon,
      removeCoupon,
    }),
    [state.items, state.couponCode, detailed, subtotal, couponResult, discount, getTotals, add, updateQty, remove, clear, applyCoupon, removeCoupon]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
