import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Banknote, RotateCcw, Truck } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import { cn } from '@/lib/format'
import { getBanners } from '@/services/marketing'
import { useSettings } from '@/context/SettingsContext'

/**
 * Full-bleed hero driven by admin-managed banners (placement: hero).
 * Desktop shows `image` (wide artwork); mobile prefers `mobileImage`
 * (portrait) so nothing crops badly. Content bottom-anchors on phones.
 */
export default function Hero() {
  const { settings } = useSettings()
  const banners = getBanners({ placement: 'hero', activeOnly: true })
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 7000)
    return () => clearInterval(t)
  }, [banners.length])

  if (!banners.length) return null
  const safeIndex = index % banners.length
  const storeName = settings?.general?.storeName || 'Al Nain'

  const TRUST = [
    { icon: Banknote, label: 'Cash on Delivery' },
    { icon: Truck, label: 'Nationwide Delivery' },
    { icon: RotateCcw, label: '7-Day Easy Returns' },
  ]

  return (
    <section className="relative h-[78vh] min-h-[520px] max-h-[700px] overflow-hidden bg-ink sm:h-[74vh] sm:min-h-[500px] sm:max-h-[760px]">
      {banners.map((banner, i) => {
        const right = banner.align === 'right'
        const mobileSrc = banner.mobileImage || banner.image
        return (
          <div
            key={banner.id}
            className={cn('absolute inset-0 transition-opacity duration-1000', i === safeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none')}
          >
            {/* artwork — portrait on phones, wide on larger screens */}
            <SmartImage
              src={mobileSrc}
              alt={banner.heading}
              eager={i === 0}
              className={cn('h-full w-full object-cover object-top sm:hidden', i === safeIndex && 'animate-kenburns')}
            />
            <SmartImage
              src={banner.image}
              alt={banner.heading}
              eager={i === 0}
              className={cn('hidden h-full w-full object-cover sm:block', right ? 'object-left' : 'object-center', i === safeIndex && 'animate-kenburns')}
            />
            {/* scrims */}
            <div className={cn('absolute inset-0 hidden sm:block', right ? 'bg-gradient-to-l from-ink/90 via-ink/35 to-ink/10' : 'bg-gradient-to-r from-ink/90 via-ink/40 to-ink/10')} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/20 sm:from-ink/70 sm:via-transparent sm:to-ink/25" />

            {/* faint Arabic wordmark behind the content */}
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute top-1/2 hidden -translate-y-1/2 select-none font-arabic text-[26rem] leading-none text-gold-500/[0.07] lg:block',
                right ? 'right-[-4rem]' : 'left-[-4rem]'
              )}
            >
              النين
            </span>

            {/* content — bottom-anchored on phones, centered on larger screens */}
            <div className={cn('container-x absolute inset-0 flex items-end pb-14 sm:items-center sm:pb-0', right && 'sm:justify-end')}>
              <div className={cn('max-w-xl sm:pb-10', i === safeIndex && 'animate-fadeUp')}>
                <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-200 sm:mb-4 sm:text-[11px]">
                  <span className="h-px w-8 bg-gold-400/70 sm:w-10" />
                  {storeName} · Est. Islamabad
                </p>
                <h1 className="font-display text-[34px] leading-[1.08] text-ivory text-balance sm:text-5xl lg:text-[64px]">
                  {banner.heading}
                </h1>
                <p className="mt-3 max-w-md text-[13px] leading-relaxed text-ivory/85 sm:mt-5 sm:text-base">{banner.description}</p>

                <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
                  {banner.buttonText && (
                    <Link to={banner.buttonUrl || '/shop'} className="btn bg-gold-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lift hover:bg-gold-400 sm:px-7 sm:py-3.5">
                      {banner.buttonText} <ArrowRight size={15} />
                    </Link>
                  )}
                  {banner.secondaryText && (
                    <Link to={banner.secondaryUrl || '/collections'} className="btn-outline-light px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur-[2px] sm:px-7 sm:py-3.5">
                      {banner.secondaryText}
                    </Link>
                  )}
                </div>

                {/* trust chips */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ivory/15 pt-4 sm:mt-8 sm:gap-x-6 sm:pt-5">
                  {TRUST.map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-ivory/80 sm:text-[11px]">
                      <Icon size={13} className="text-gold-300" /> {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* thin gold frame over everything */}
      <div className="pointer-events-none absolute inset-3 border border-gold-500/30 sm:inset-4" />
      <div className="pointer-events-none absolute inset-3 sm:inset-4">
        {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((pos) => (
          <span key={pos} className={cn('absolute h-6 w-6 border-gold-400/80', pos)} />
        ))}
      </div>

      {/* slider controls */}
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2.5 sm:bottom-7">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn('h-1 rounded-full transition-all duration-300', i === safeIndex ? 'w-8 bg-gold-400' : 'w-4 bg-ivory/40 hover:bg-ivory/70')}
              />
            ))}
          </div>
          <button
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            className="absolute left-6 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-ivory/25 text-ivory/70 backdrop-blur-sm transition-colors hover:border-gold-400 hover:text-gold-200 lg:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-6 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-ivory/25 text-ivory/70 backdrop-blur-sm transition-colors hover:border-gold-400 hover:text-gold-200 lg:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </section>
  )
}
