import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Quote } from 'lucide-react'
import Hero from '@/components/home/Hero'
import SectionHeading from '@/components/ui/SectionHeading'
import ProductGrid from '@/components/product/ProductGrid'
import SmartImage from '@/components/ui/SmartImage'
import RatingStars from '@/components/ui/RatingStars'
import { useMockFetch, usePageTitle } from '@/hooks'
import { useToast } from '@/context/ToastContext'
import { getProducts, getCategories, countProductsInCategory } from '@/services/catalog'
import { getBanners, getTestimonials, subscribeNewsletter } from '@/services/marketing'

/* 2 · two signature lines */
function CategorySplit() {
  const picks = getCategories({ activeOnly: true }).filter((c) => !c.parentId).slice(0, 2)
  return (
    <section className="container-x py-14 lg:py-20">
      <SectionHeading
        eyebrow="Our Signature Lines"
        title="Shop by Category"
        sub="Ready-to-wear elegance — chikankari 2 piece sets and complete printed lawn 3 piece suits."
        action={{ label: 'Shop All', to: '/shop' }}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
        {picks.map((cat) => (
          <Link key={cat.id} to={`/shop/${cat.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-cream sm:aspect-[3/3.4]">
            <SmartImage
              src={cat.image}
              alt={cat.name}
              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-200">
                {countProductsInCategory(cat.slug)} {countProductsInCategory(cat.slug) === 1 ? 'style' : 'styles'}
              </p>
              <h3 className="mt-1 font-display text-3xl text-ivory lg:text-4xl">{cat.name}</h3>
              <p className="mt-1 max-w-sm text-sm text-ivory/70">{cat.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 border border-ivory/50 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ivory transition-colors duration-300 group-hover:border-gold-400 group-hover:bg-gold-500 group-hover:text-white">
                Shop {cat.name} <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* 3 · new arrivals */
function NewArrivals() {
  const { data, loading } = useMockFetch(() => getProducts({ collections: ['new-arrivals'], sort: 'newest', perPage: 8 }), [])
  return (
    <section className="bg-cream/60 py-14 lg:py-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="Just In"
          title="New Arrivals"
          sub="Fresh from the atelier — this week’s newest pieces."
          action={{ label: 'View All', to: '/collections/new-arrivals' }}
        />
        <ProductGrid products={data?.items || []} loading={loading} skeletons={8} />
      </div>
    </section>
  )
}

/* 4 · campaign banner (admin-managed, placement: promo) */
function CampaignBanner() {
  const [banner] = getBanners({ placement: 'promo', activeOnly: true })
  if (!banner) return null
  return (
    <section className="container-x py-14 lg:py-20">
      <div className="grid overflow-hidden bg-ink lg:grid-cols-2">
        <div className="relative min-h-[340px] lg:min-h-[520px]">
          <SmartImage src={banner.image} alt={banner.heading} className="absolute inset-0 h-full w-full object-cover object-top" />
        </div>
        <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
          <span className="pointer-events-none absolute inset-4 border border-gold-500/25" />
          <p className="eyebrow text-gold-200">Al Nain Presents</p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ivory text-balance sm:text-4xl">{banner.heading}</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/70">{banner.description}</p>
          {banner.buttonText && (
            <Link to={banner.buttonUrl || '/shop'} className="btn mt-8 w-fit bg-gold-500 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-gold-400">
              {banner.buttonText} <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

/* 5 · testimonials */
function Testimonials() {
  const testimonials = getTestimonials()
  return (
    <section className="bg-ink py-14 lg:py-20">
      <div className="container-x">
        <SectionHeading eyebrow="Word of Mouth" title="Loved Across Pakistan" light center />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <figure key={t.id} className="flex flex-col border border-ivory/10 bg-charcoal p-6">
              <Quote size={22} className="text-gold-400" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ivory/80">“{t.text}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-ivory/10 pt-4">
                <SmartImage src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-ivory">{t.name}</p>
                  <p className="text-xs text-ivory/50">{t.city}</p>
                </div>
                <RatingStars value={t.rating} size={11} className="ml-auto" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 6 · newsletter */
function NewsletterBand() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  return (
    <section className="border-y border-gold-500/25 bg-gold-50 py-14">
      <div className="container-x flex flex-col items-center text-center">
        <p className="eyebrow">Join the Family</p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl">First Access to New Drops & Festive Edits</h2>
        <p className="mt-3 max-w-md text-sm text-smoke">
          Subscribe for early access to collections, exclusive offers, and styling notes — straight to your inbox.
        </p>
        <form
          className="mt-6 flex w-full max-w-md"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await subscribeNewsletter(email)
              toast('Welcome to the list — you’ll hear from us soon.')
              setEmail('')
            } catch (err) {
              toast(err.message, 'error')
            }
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="input border-r-0"
          />
          <button className="btn-primary shrink-0">Subscribe</button>
        </form>
      </div>
    </section>
  )
}

/**
 * Homepage — intentionally compact: six sections.
 * 1 Hero · 2 Categories · 3 New Arrivals · 4 Campaign · 5 Testimonials · 6 Newsletter
 */
export default function Home() {
  usePageTitle('Home')
  return (
    <>
      <Hero />
      <CategorySplit />
      <NewArrivals />
      <CampaignBanner />
      <Testimonials />
      <NewsletterBand />
    </>
  )
}
