import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Banknote, CreditCard, Landmark, Lock, Wallet } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import SmartImage from '@/components/ui/SmartImage'
import CartSummary from '@/components/cart/CartSummary'
import { Input, Select } from '@/components/ui/Field'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { cn, formatPrice } from '@/lib/format'
import { createOrder } from '@/services/orders'
import { trackEvent } from '@/lib/gtm'

const PAYMENT_ICONS = { cod: Banknote, card: CreditCard, bank: Landmark, wallet: Wallet }

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Other']

export default function Checkout() {
  usePageTitle('Checkout')
  const { detailed, couponCode, couponResult, clear } = useCart()
  const { user } = useAuth()
  const { settings } = useSettings()
  const toast = useToast()
  const navigate = useNavigate()

  const enabledShipping = (settings?.shipping?.methods || []).filter((m) => m.enabled)
  const enabledPayments = (settings?.payments || []).filter((p) => p.enabled)

  const [firstName = '', ...rest] = (user?.name || '').split(' ')
  const defaultAddress = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0]

  const [form, setForm] = useState({
    firstName,
    lastName: rest.join(' '),
    email: user?.email || '',
    phone: user?.phone || '',
    country: 'Pakistan',
    city: defaultAddress?.city || '',
    address: defaultAddress?.address || '',
    apartment: defaultAddress?.apartment || '',
    postalCode: defaultAddress?.postalCode || '',
  })
  const [shippingMethod, setShippingMethod] = useState(enabledShipping[0]?.id || 'standard')
  const [paymentMethod, setPaymentMethod] = useState(enabledPayments[0]?.id || 'cod')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)

  if (!detailed.length) return <Navigate to="/cart" replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const useAddress = (addr) => {
    setForm((f) => ({
      ...f,
      city: addr.city,
      address: addr.address,
      apartment: addr.apartment || '',
      postalCode: addr.postalCode || '',
      phone: addr.phone || f.phone,
    }))
    toast(`Address “${addr.label}” applied.`, 'info')
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number.'
    if (!form.city) e.city = 'Select your city.'
    if (form.address.trim().length < 8) e.address = 'Enter your complete street address.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const placeOrder = async () => {
    if (!validate()) {
      toast('Please fix the highlighted fields.', 'error')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setPlacing(true)
    try {
      const order = await createOrder({
        customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
        address: {
          name: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address,
          apartment: form.apartment,
          postalCode: form.postalCode,
        },
        shippingMethod,
        paymentMethod,
        items: detailed.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
        couponCode: couponResult?.ok ? couponCode : null,
        customerId: user?.id || null,
      })
      trackEvent('purchase', {
        transaction_id: order.number,
        currency: 'PKR',
        value: order.total,
        shipping: order.shipping,
        tax: order.tax,
        items: order.items.map((it) => ({ item_id: it.sku, item_name: it.name, price: it.price, quantity: it.qty })),
      })
      clear()
      toast(`Order ${order.number} placed successfully!`)
      navigate(`/order-confirmation/${order.number}`)
    } catch (err) {
      toast(err.message, 'error')
      setPlacing(false)
    }
  }

  const sectionTitle = (n, title) => (
    <h2 className="flex items-center gap-3 font-display text-xl">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-gold-200">{n}</span>
      {title}
    </h2>
  )

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} className="mb-4" />
      <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr,400px]">
        <div className="space-y-8">
          {/* 1 · contact */}
          <section className="card p-6">
            {sectionTitle(1, 'Customer Information')}
            {!user && (
              <p className="mt-2 text-xs text-smoke">
                Already have an account?{' '}
                <Link to="/login?next=/checkout" className="font-semibold text-gold-700 underline">Sign in</Link> for a faster
                checkout — or continue as guest.
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="First name" required value={form.firstName} onChange={set('firstName')} error={errors.firstName} autoComplete="given-name" />
              <Input label="Last name" required value={form.lastName} onChange={set('lastName')} error={errors.lastName} autoComplete="family-name" />
              <Input label="Email" required type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              <Input label="Phone" required placeholder="03xx xxxxxxx" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
            </div>
          </section>

          {/* 2 · shipping address */}
          <section className="card p-6">
            {sectionTitle(2, 'Shipping Address')}
            {user?.addresses?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {user.addresses.map((addr) => (
                  <button key={addr.id} type="button" onClick={() => useAddress(addr)} className="chip">
                    Use “{addr.label}” — {addr.city}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Select label="Country" required value={form.country} onChange={set('country')} options={[{ value: 'Pakistan', label: 'Pakistan' }]} />
              <Select label="City" required value={form.city} onChange={set('city')} error={errors.city} placeholder="Select city" options={CITIES.map((c) => ({ value: c, label: c }))} />
              <Input className="sm:col-span-2" label="Street address" required placeholder="House, street, area" value={form.address} onChange={set('address')} error={errors.address} autoComplete="street-address" />
              <Input label="Apartment / floor (optional)" value={form.apartment} onChange={set('apartment')} />
              <Input label="Postal code (optional)" value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" />
            </div>
          </section>

          {/* 3 · shipping method */}
          <section className="card p-6">
            {sectionTitle(3, 'Shipping Method')}
            <div className="mt-5 space-y-3">
              {enabledShipping.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 border p-4 transition-colors',
                    shippingMethod === m.id ? 'border-gold-500 bg-gold-50' : 'border-ink/15 hover:border-ink/40'
                  )}
                >
                  <input type="radio" name="shipping" checked={shippingMethod === m.id} onChange={() => setShippingMethod(m.id)} className="accent-gold-500" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-smoke">{m.eta}</span>
                  </span>
                  <span className="text-sm font-semibold">{formatPrice(m.fee)}</span>
                </label>
              ))}
              <p className="text-xs text-smoke">
                Orders placed before 2pm are dispatched the same working day.
              </p>
            </div>
          </section>

          {/* 4 · payment */}
          <section className="card p-6">
            {sectionTitle(4, 'Payment')}
            <div className="mt-5 space-y-3">
              {enabledPayments.map((p) => {
                const Icon = PAYMENT_ICONS[p.id] || Banknote
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-4 border p-4 transition-colors',
                      paymentMethod === p.id ? 'border-gold-500 bg-gold-50' : 'border-ink/15 hover:border-ink/40'
                    )}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === p.id} onChange={() => setPaymentMethod(p.id)} className="mt-1 accent-gold-500" />
                    <Icon size={20} className="mt-0.5 shrink-0 text-gold-600" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{p.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-smoke">{p.description}</span>
                      {p.id === 'bank' && paymentMethod === 'bank' && p.details && (
                        <span className="mt-2 block border border-dashed border-ink/20 bg-white p-3 text-xs">{p.details}</span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="card mb-5 max-h-72 overflow-y-auto p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-smoke">
              Your Items ({detailed.length})
            </h3>
            <ul className="space-y-3.5">
              {detailed.map((line) => (
                <li key={line.id} className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    <SmartImage src={line.image} alt={line.product.name} className="h-14 w-12 object-cover" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-ivory">
                      {line.qty}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{line.product.name}</span>
                    <span className="block text-[11px] text-smoke">
                      {Object.values(line.variant.options).join(' / ')}
                    </span>
                  </span>
                  <span className="text-xs font-semibold">{formatPrice(line.total)}</span>
                </li>
              ))}
            </ul>
          </div>

          <CartSummary shippingMethod={shippingMethod} footnote="By placing this order you agree to our Terms & Conditions and Refund Policy.">
            <button onClick={placeOrder} disabled={placing} className="btn-gold w-full py-4 text-sm">
              <Lock size={15} /> {placing ? 'Placing Order…' : 'Place Order'}
            </button>
          </CartSummary>
        </div>
      </div>
    </div>
  )
}
