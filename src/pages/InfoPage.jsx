import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import Accordion from '@/components/ui/Accordion'
import { Input, Textarea } from '@/components/ui/Field'
import { useSettings } from '@/context/SettingsContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { submitContactMessage } from '@/services/marketing'

function ContactForm() {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          await submitContactMessage(form)
          toast('Message sent — our team will reply within 24 hours.')
          setForm({ name: '', email: '', message: '' })
        } catch (err) {
          toast(err.message, 'error')
        }
      }}
    >
      <Input label="Your name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      <Textarea label="Message" required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
      <button className="btn-primary">Send Message</button>
    </form>
  )
}

const FAQS = [
  ['How does Cash on Delivery work?', 'Place your order and pay the rider in cash when it arrives at your doorstep. COD is available across Pakistan with no extra fee. Please keep the exact amount ready.'],
  ['How long does delivery take?', 'Standard delivery takes 3–5 working days; express delivery takes 1–2 working days. Orders are dispatched from our Islamabad atelier Monday to Saturday.'],
  ['What is your exchange & return policy?', 'Unworn items with original tags can be returned or exchanged within 7 days of delivery. Heavily embellished formals are exchange-only for hygiene and quality reasons.'],
  ['Do your suits come stitched or unstitched?', 'All Al Nain pieces — chikankari 2 piece and printed lawn 3 piece — come stitched to standard sizes (see the Size Guide).'],
  ['How do I track my order?', 'Once dispatched, you receive an SMS and email with the courier tracking number. Signed-in customers can also track orders from My Account → Orders.'],
  ['Can I change or cancel my order?', 'Orders can be modified or cancelled while they are still in "Pending" or "Confirmed" status — sign in and open the order, or WhatsApp our support team.'],
]

export default function InfoPage() {
  const { pathname } = useLocation()
  const slug = pathname.replace('/', '')
  const { settings } = useSettings()
  const general = settings?.general || {}

  const PAGES = {
    about: {
      title: 'Our Story',
      body: (
        <div className="prose-sm max-w-3xl space-y-5 text-[15px] leading-relaxed text-ink/80">
          <p>
            <strong>Al Nain</strong> began in a single tailoring room in Islamabad with one belief:
            traditional wear deserves the same obsession with cut, cloth and finish as any luxury house. Today our
            atelier brings together master karigars, pattern-makers and a quality team who inspect every piece twice
            before it ships.
          </p>
          <p>
            We work directly with certified Pakistani mills for our lawn, khaddar, raw silk and velvet, and our
            embellishment — kora, dabka, tilla, mirror and chikankari — is set by hand. Every collection is designed in
            Islamabad and made in Pakistan, honestly priced, and delivered nationwide with cash on delivery.
          </p>
          <p>
            From everyday shalwar kameez to wedding sherwanis and bridal organza, our promise stays the same:
            <strong> heritage in every thread</strong>.
          </p>
        </div>
      ),
    },
    contact: {
      title: 'Contact Us',
      body: (
        <div className="grid max-w-4xl gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-smoke">
              Questions about sizing, an order, or a custom piece? Our team replies within 24 hours — or reach us
              instantly on WhatsApp.
            </p>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3"><MapPin size={17} className="mt-0.5 text-gold-600" /> {general.address}</li>
              <li className="flex items-center gap-3"><Phone size={17} className="text-gold-600" /> {general.phone}</li>
              <li className="flex items-center gap-3"><Mail size={17} className="text-gold-600" /> {general.email}</li>
              <li className="flex items-center gap-3"><Clock size={17} className="text-gold-600" /> Mon–Sat, 10am – 8pm PKT</li>
            </ul>
          </div>
          <ContactForm />
        </div>
      ),
    },
    faq: {
      title: 'Frequently Asked Questions',
      body: (
        <div className="max-w-2xl">
          {FAQS.map(([q, a]) => (
            <Accordion key={q} title={q}>
              <p className="text-sm leading-relaxed text-smoke">{a}</p>
            </Accordion>
          ))}
        </div>
      ),
    },
    shipping: {
      title: 'Shipping & Delivery',
      body: (
        <div className="max-w-3xl space-y-5 text-[15px] leading-relaxed text-ink/80">
          <p><strong>Coverage.</strong> We deliver across Pakistan through trusted courier partners, with Cash on Delivery available on every order.</p>
          <p><strong>Timelines.</strong> Standard delivery: 3–5 working days (Rs. 250, free above the free-shipping threshold shown at checkout). Express delivery: 1–2 working days (Rs. 600). Orders placed before 2pm are dispatched the same working day.</p>
          <p><strong>Tracking.</strong> You'll receive the courier tracking number by SMS and email as soon as your order leaves the atelier. Signed-in customers can also track from My Account → Orders.</p>
          <p><strong>Delays.</strong> During Eid and sale seasons, delivery may take 1–2 extra days — we appreciate your patience.</p>
        </div>
      ),
    },
    returns: {
      title: 'Returns & Exchanges',
      body: (
        <div className="max-w-3xl space-y-5 text-[15px] leading-relaxed text-ink/80">
          <p><strong>7-day window.</strong> Unworn, unwashed items with original tags can be returned or exchanged within 7 days of delivery.</p>
          <p><strong>Exchange-only items.</strong> Heavily embellished formals, sherwanis and bridal pieces are exchange-only, for hygiene and quality reasons.</p>
          <p><strong>How to start.</strong> WhatsApp us your order number and reason, and we'll arrange a reverse pickup where available.</p>
          <p><strong>Refunds.</strong> For COD orders, refunds are made via bank transfer within 5 working days of receiving the return. Shipping fees are non-refundable except for our errors.</p>
        </div>
      ),
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      body: (
        <div className="max-w-3xl space-y-5 text-[15px] leading-relaxed text-ink/80">
          <p>We collect only the information needed to fulfil your order — your name, contact details, and delivery address. We never sell your data to third parties.</p>
          <p>Payment information for card payments (when enabled) is processed by our payment partners; Al Nain does not store card numbers. Analytics data is anonymised and used solely to improve the shopping experience.</p>
          <p>You may request a copy or deletion of your personal data at any time by emailing {general.email}.</p>
        </div>
      ),
    },
    terms: {
      title: 'Terms & Conditions',
      body: (
        <div className="max-w-3xl space-y-5 text-[15px] leading-relaxed text-ink/80">
          <p>By placing an order you confirm the details provided are accurate and that you accept our shipping and returns policies. Prices are in Pakistani Rupees and include applicable taxes shown at checkout.</p>
          <p>Product colours may vary slightly due to photography lighting and screen calibration — significant variation qualifies for a free exchange.</p>
          <p>Al Nain reserves the right to cancel orders affected by pricing errors or stock issues; any amount paid is refunded in full.</p>
        </div>
      ),
    },
    'refund-policy': {
      title: 'Refund Policy',
      body: (
        <div className="max-w-3xl space-y-5 text-[15px] leading-relaxed text-ink/80">
          <p>Approved refunds for prepaid orders are reversed to the original payment method within 7 working days. COD order refunds are made via bank transfer within 5 working days of receiving the return.</p>
          <p>Items must reach us unworn with tags intact to qualify. Refunds cover the product amount; original shipping fees are refundable only when the return is due to our error.</p>
        </div>
      ),
    },
  }

  const page = PAGES[slug] || PAGES.about
  usePageTitle(page.title)

  return (
    <div className="container-x py-10 lg:py-14">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: page.title }]} className="mb-6" />
      <div className="mb-10 border-b border-ink/10 pb-8">
        <p className="eyebrow mb-2">{general.storeName || 'Al Nain'}</p>
        <h1 className="font-display text-3xl sm:text-4xl">{page.title}</h1>
      </div>
      {page.body}
      <div className="mt-14 border-t border-ink/10 pt-8 text-sm text-smoke">
        Need more help? <Link to="/contact" className="font-semibold text-gold-700 underline underline-offset-2">Contact our team</Link>.
      </div>
    </div>
  )
}
