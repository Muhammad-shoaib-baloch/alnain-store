import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'
import { formatPrice } from '@/lib/format'

export function CouponBox() {
  const { couponCode, couponResult, applyCoupon, removeCoupon } = useCart()
  const toast = useToast()
  const [draft, setDraft] = useState('')

  const apply = async (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    try {
      const result = await applyCoupon(draft.trim())
      if (result.ok) {
        toast(`Coupon ${result.coupon?.code || draft.trim().toUpperCase()} applied — you saved ${formatPrice(result.discount)}.`)
        setDraft('')
      } else {
        toast(result.reason, 'error')
      }
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  if (couponCode && couponResult?.ok) {
    return (
      <div className="flex items-center justify-between border border-dashed border-gold-500/60 bg-gold-50 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-gold-700">
          <Tag size={14} /> {couponCode}
        </span>
        <button onClick={removeCoupon} className="flex items-center gap-1 text-xs text-smoke hover:text-red-600" aria-label="Remove coupon">
          Remove <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={apply} className="flex">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          className="input border-r-0 uppercase placeholder:normal-case"
          aria-label="Coupon code"
        />
        <button className="btn-primary shrink-0 px-5">Apply</button>
      </form>
      {couponCode && couponResult && !couponResult.ok && (
        <p className="mt-1.5 text-xs text-red-600">{couponResult.reason} (coupon removed at checkout)</p>
      )}
    </div>
  )
}

/**
 * Order summary card. `shippingMethod` drives the shipping row; used on the
 * cart page (standard estimate) and checkout (live selection).
 */
export default function CartSummary({ shippingMethod = 'standard', showCoupon = true, footnote, children }) {
  const { getTotals, discount, couponCode, couponResult } = useCart()
  const { settings } = useSettings()
  const totals = getTotals(shippingMethod)
  const taxLabel = settings?.tax?.label || 'Tax'

  return (
    <div className="card p-6">
      <h3 className="font-display text-xl">Order Summary</h3>
      {showCoupon && (
        <div className="mt-5">
          <CouponBox />
        </div>
      )}
      <dl className="mt-5 space-y-3 border-t border-ink/10 pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-smoke">Subtotal</dt>
          <dd className="font-medium">{formatPrice(totals.subtotal)}</dd>
        </div>
        {discount > 0 && couponResult?.ok && (
          <div className="flex justify-between text-emerald-700">
            <dt>Discount ({couponCode})</dt>
            <dd className="font-medium">−{formatPrice(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-smoke">Shipping</dt>
          <dd className="font-medium">
            {totals.shipping === 0 ? <span className="text-emerald-700">Free</span> : formatPrice(totals.shipping)}
          </dd>
        </div>
        {settings?.tax?.enabled && (
          <div className="flex justify-between">
            <dt className="text-smoke">
              {taxLabel} ({settings.tax.rate}%)
            </dt>
            <dd className="font-medium">{formatPrice(totals.tax)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
          <dt className="font-semibold">Grand Total</dt>
          <dd className="font-display text-xl text-gold-600">{formatPrice(totals.total)}</dd>
        </div>
      </dl>
      {footnote && <p className="mt-3 text-xs text-smoke">{footnote}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
