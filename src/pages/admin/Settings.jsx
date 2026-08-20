import { useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Tabs from '@/components/ui/Tabs'
import SocialLinksManager from '@/components/admin/SocialLinksManager'
import { Input, Textarea, Toggle } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { usePageTitle } from '@/hooks'
import { getSettings, saveSettings, resetStore } from '@/services/settings'

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'currency', label: 'Currency' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'tax', label: 'Tax' },
  { id: 'payments', label: 'Payments' },
  { id: 'social', label: 'Social Media' },
  { id: 'seo', label: 'SEO' },
]

function SectionCard({ title, sub, children, onSave }) {
  return (
    <form
      className="card max-w-3xl p-6"
      onSubmit={(e) => {
        e.preventDefault()
        onSave?.()
      }}
    >
      <h2 className="font-display text-lg">{title}</h2>
      {sub && <p className="mt-1 text-xs text-smoke">{sub}</p>}
      <div className="mt-5 space-y-4">{children}</div>
      {onSave && (
        <button className="btn-primary btn-sm mt-6">
          <Save size={13} /> Save Changes
        </button>
      )}
    </form>
  )
}

export default function AdminSettings() {
  usePageTitle('Admin · Settings')
  const toast = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState('general')

  const settings = getSettings()
  const [general, setGeneral] = useState({ ...settings.general })
  const [currency, setCurrency] = useState({ ...settings.currency })
  const [shipping, setShipping] = useState(JSON.parse(JSON.stringify(settings.shipping)))
  const [tax, setTax] = useState({ ...settings.tax })
  const [payments, setPayments] = useState(JSON.parse(JSON.stringify(settings.payments)))
  const [seo, setSeo] = useState({ ...settings.seo })

  const save = async (patch, message) => {
    try {
      await saveSettings(patch)
      toast(message)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const resetDemo = async () => {
    const ok = await confirm({
      title: 'Reset store data?',
      message: 'All products, orders, customers and settings return to the original seed. This cannot be undone.',
      confirmText: 'Reset Everything',
    })
    if (!ok) return
    try {
      await resetStore()
      toast('Store data reset — reloading…', 'info')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const setMethod = (idx, patch) => {
    setShipping((s) => ({ ...s, methods: s.methods.map((m, i) => (i === idx ? { ...m, ...patch } : m)) }))
  }

  const setPayment = (idx, patch) => {
    setPayments((p) => p.map((pm, i) => (i === idx ? { ...pm, ...patch } : pm)))
  }

  return (
    <div>
      <PageHeader title="Store Settings" sub="Configuration that drives the storefront — everything here updates live." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'general' && (
        <div className="space-y-5">
          <SectionCard
            title="Store Information"
            sub="Shown in the header, footer, contact page and order emails."
            onSave={() => save({ general }, 'General settings saved.')}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Store name" value={general.storeName} onChange={(e) => setGeneral((g) => ({ ...g, storeName: e.target.value }))} />
              <Input label="Tagline" value={general.tagline} onChange={(e) => setGeneral((g) => ({ ...g, tagline: e.target.value }))} />
              <Input label="Store email" type="email" value={general.email} onChange={(e) => setGeneral((g) => ({ ...g, email: e.target.value }))} />
              <Input label="Phone" value={general.phone} onChange={(e) => setGeneral((g) => ({ ...g, phone: e.target.value }))} />
              <Input className="sm:col-span-2" label="Address" value={general.address} onChange={(e) => setGeneral((g) => ({ ...g, address: e.target.value }))} />
              <Input
                className="sm:col-span-2"
                label="Announcement bar"
                value={general.announcement}
                onChange={(e) => setGeneral((g) => ({ ...g, announcement: e.target.value }))}
                hint="Shown at the very top of the storefront. Leave empty to hide."
              />
            </div>
          </SectionCard>

          <div className="card max-w-3xl border-red-200 p-6">
            <h2 className="font-display text-lg text-red-700">Danger Zone</h2>
            <p className="mt-1 text-xs text-smoke">Restore the original demo catalogue, orders, customers and settings.</p>
            <button onClick={resetDemo} className="btn mt-4 border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <RotateCcw size={14} /> Reset Demo Data
            </button>
          </div>
        </div>
      )}

      {tab === 'currency' && (
        <SectionCard
          title="Currency"
          sub="Applies to every price across the storefront and admin."
          onSave={() => save({ currency }, 'Currency settings saved.')}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Currency code" value={currency.code} onChange={(e) => setCurrency((c) => ({ ...c, code: e.target.value.toUpperCase() }))} hint="e.g. PKR" />
            <Input label="Currency symbol" value={currency.symbol} onChange={(e) => setCurrency((c) => ({ ...c, symbol: e.target.value }))} hint="e.g. Rs." />
          </div>
        </SectionCard>
      )}

      {tab === 'shipping' && (
        <SectionCard
          title="Shipping"
          sub="Methods offered at checkout and the free-shipping threshold."
          onSave={() => save({ shipping: { ...shipping, freeShippingThreshold: Number(shipping.freeShippingThreshold) || 0, methods: shipping.methods.map((m) => ({ ...m, fee: Number(m.fee) || 0 })) } }, 'Shipping settings saved.')}
        >
          {shipping.methods.map((m, idx) => (
            <div key={m.id} className="grid items-end gap-3 border border-ink/10 bg-cream/40 p-4 sm:grid-cols-[1fr,1fr,120px,auto]">
              <Input label="Method name" value={m.label} onChange={(e) => setMethod(idx, { label: e.target.value })} />
              <Input label="Delivery estimate" value={m.eta} onChange={(e) => setMethod(idx, { eta: e.target.value })} />
              <Input label="Fee (Rs.)" type="number" value={m.fee} onChange={(e) => setMethod(idx, { fee: e.target.value })} />
              <div className="pb-1"><Toggle checked={m.enabled} onChange={(v) => setMethod(idx, { enabled: v })} label="Enabled" /></div>
            </div>
          ))}
          <Input
            label="Free shipping threshold (Rs.)"
            type="number"
            value={shipping.freeShippingThreshold}
            onChange={(e) => setShipping((s) => ({ ...s, freeShippingThreshold: e.target.value }))}
            hint="Standard shipping becomes free above this order value. Set 0 to disable."
          />
        </SectionCard>
      )}

      {tab === 'tax' && (
        <SectionCard
          title="Tax"
          sub="Applied to the order subtotal after discounts."
          onSave={() => save({ tax: { ...tax, rate: Number(tax.rate) || 0 } }, 'Tax settings saved.')}
        >
          <Toggle checked={tax.enabled} onChange={(v) => setTax((t) => ({ ...t, enabled: v }))} label="Charge tax" description="Adds a tax line to cart, checkout and orders" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Tax label" value={tax.label} onChange={(e) => setTax((t) => ({ ...t, label: e.target.value }))} hint="e.g. GST" />
            <Input label="Rate (%)" type="number" value={tax.rate} onChange={(e) => setTax((t) => ({ ...t, rate: e.target.value }))} />
          </div>
        </SectionCard>
      )}

      {tab === 'payments' && (
        <SectionCard
          title="Payment Methods"
          sub="Enabled methods appear at checkout. Cash on Delivery is the store default."
          onSave={() => save({ payments }, 'Payment settings saved.')}
        >
          {payments.map((pm, idx) => (
            <div key={pm.id} className="border border-ink/10 bg-cream/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">{pm.label}</p>
                <Toggle checked={pm.enabled} onChange={(v) => setPayment(idx, { enabled: v })} label={pm.enabled ? 'Enabled' : 'Disabled'} />
              </div>
              <Textarea className="mt-3" rows={2} label="Description shown at checkout" value={pm.description} onChange={(e) => setPayment(idx, { description: e.target.value })} />
              {pm.id === 'bank' && (
                <Input className="mt-3" label="Bank account details" value={pm.details || ''} onChange={(e) => setPayment(idx, { details: e.target.value })} />
              )}
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'social' && (
        <div className="max-w-3xl">
          <div className="card mb-5 p-6">
            <h2 className="font-display text-lg">Social Media Links</h2>
            <p className="mt-1 text-xs text-smoke">
              Managed centrally — the storefront footer and social sections read from this list.
            </p>
          </div>
          <SocialLinksManager />
        </div>
      )}

      {tab === 'seo' && (
        <SectionCard
          title="SEO & Tracking"
          sub="Site metadata and analytics identifiers."
          onSave={() => save({ seo }, 'SEO settings saved.')}
        >
          <Input label="Site title" value={seo.siteTitle} onChange={(e) => setSeo((s) => ({ ...s, siteTitle: e.target.value }))} />
          <Textarea label="Meta description" rows={2} value={seo.metaDescription} onChange={(e) => setSeo((s) => ({ ...s, metaDescription: e.target.value }))} />
          <Input
            label="Google Tag Manager container ID"
            value={seo.gtmId || ''}
            onChange={(e) => setSeo((s) => ({ ...s, gtmId: e.target.value.trim() }))}
            placeholder="GTM-XXXXXXX"
            hint="Create a free container at tagmanager.google.com, paste its ID here and save — the GTM script loads automatically and receives page_view, add_to_cart and purchase events. Manage GA4/Meta Pixel tags from the GTM dashboard."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Google Analytics ID" value={seo.googleAnalyticsId} onChange={(e) => setSeo((s) => ({ ...s, googleAnalyticsId: e.target.value }))} placeholder="G-XXXXXXXXXX" hint="Optional — usually managed inside GTM instead" />
            <Input label="Facebook Pixel ID" value={seo.facebookPixelId} onChange={(e) => setSeo((s) => ({ ...s, facebookPixelId: e.target.value }))} placeholder="123456789012345" />
          </div>
        </SectionCard>
      )}
    </div>
  )
}
