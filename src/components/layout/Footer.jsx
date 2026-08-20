import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Banknote, ShieldCheck, Truck } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useToast } from '@/context/ToastContext'
import { subscribeNewsletter } from '@/services/marketing'
import SocialIcon from '@/components/common/SocialIcon'
import Logo from '@/components/common/Logo'

const SHOP_LINKS = [
  { label: 'Shop All', to: '/shop' },
  { label: '2 Piece', to: '/shop/2-piece' },
  { label: '3 Piece', to: '/shop/3-piece' },
  { label: 'Collections', to: '/collections' },
  { label: 'Best Sellers', to: '/collections/best-sellers' },
]

const SERVICE_LINKS = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'Shipping & Delivery', to: '/shipping' },
  { label: 'Returns & Exchanges', to: '/returns' },
  { label: 'FAQ', to: '/faq' },
  { label: 'About Us', to: '/about' },
]

export default function Footer() {
  const { settings, socials } = useSettings()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const general = settings?.general || {}

  const onSubscribe = async (e) => {
    e.preventDefault()
    try {
      await subscribeNewsletter(email)
      toast('Welcome to the list — you’ll hear from us soon.')
      setEmail('')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <footer className="bg-ink text-ivory">
      {/* trust strip */}
      <div className="border-b border-ivory/10">
        <div className="container-x grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Banknote, title: 'Cash on Delivery', sub: 'Pay at your doorstep, nationwide' },
            { icon: Truck, title: 'Free Shipping', sub: `On orders above Rs. ${(settings?.shipping?.freeShippingThreshold || 15000).toLocaleString()}` },
            { icon: ShieldCheck, title: '7-Day Returns', sub: 'Easy exchange & return policy' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center border border-gold-500/40 text-gold-200">
                <Icon size={19} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">{title}</p>
                <p className="text-xs text-ivory/55">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* brand */}
        <div>
          <Logo onDark size="lg" className="-ml-1" />
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-gold-200">{general.tagline}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/60">
            Premium ready-to-wear crafted in Pakistan — chikankari kurtas and signature printed lawn suits,
            delivered nationwide with cash on delivery.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-ivory/60">
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gold-400" /> {general.address}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-gold-400" /> {general.phone}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="shrink-0 text-gold-400" /> {general.email}
            </li>
          </ul>
        </div>

        {/* shop */}
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-200">Shop</h4>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-sm text-ivory/65 transition-colors hover:text-gold-200">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* customer service */}
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-200">Customer Service</h4>
          <ul className="space-y-2.5">
            {SERVICE_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-sm text-ivory/65 transition-colors hover:text-gold-200">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* newsletter + social */}
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-200">Stay in Touch</h4>
          <p className="text-sm text-ivory/60">
            Subscribe for new drops, exclusive festive edits and members-only offers.
          </p>
          <form onSubmit={onSubscribe} className="mt-4 flex">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full border border-ivory/20 bg-transparent px-3.5 py-2.5 text-sm text-ivory outline-none placeholder:text-ivory/35 focus:border-gold-400"
            />
            <button className="btn bg-gold-500 px-5 text-sm font-semibold text-white hover:bg-gold-400">Join</button>
          </form>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-9 w-9 items-center justify-center border border-ivory/15 text-ivory/70 transition-all hover:border-gold-400 hover:text-gold-200"
                >
                  <SocialIcon platform={s.platform} size={16} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-ivory/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {general.storeName || 'Al Nain'}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <Link to="/privacy-policy" className="transition-colors hover:text-gold-200">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-gold-200">
              Terms & Conditions
            </Link>
            <Link to="/refund-policy" className="transition-colors hover:text-gold-200">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
