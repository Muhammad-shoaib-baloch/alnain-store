import { useEffect, useRef, useState } from 'react'
import Badge from '@/components/ui/Badge'
import SmartImage from '@/components/ui/SmartImage'
import { cn, pctOff } from '@/lib/format'

/** Main gallery with hover zoom + thumbnails. `activeImage` (variant image) takes over when set. */
export default function ProductGallery({ product, activeImage }) {
  const images = product.images?.length ? product.images : [null]
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 })
  const frameRef = useRef(null)

  // when a variant image is selected, jump to it (append virtually if unknown)
  useEffect(() => {
    if (!activeImage) return
    const i = images.indexOf(activeImage)
    if (i >= 0) setIndex(i)
  }, [activeImage, images])

  const current = activeImage && !images.includes(activeImage) ? activeImage : images[index]
  const off = pctOff(product.price, product.salePrice)

  const onMove = (e) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    setZoom({
      on: true,
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {/* thumbnails */}
      <div className="scrollbar-none flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={cn(
              'relative h-20 w-16 shrink-0 overflow-hidden border-2 bg-cream transition-all lg:h-24 lg:w-20',
              i === index && current === images[i] ? 'border-gold-500' : 'border-transparent opacity-70 hover:opacity-100'
            )}
            aria-label={`View image ${i + 1}`}
          >
            <SmartImage src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* main image */}
      <div
        ref={frameRef}
        className="relative flex-1 cursor-zoom-in overflow-hidden bg-cream"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
      >
        <SmartImage
          src={current}
          alt={product.name}
          eager
          className="aspect-[3/4] w-full object-cover transition-transform duration-200"
          style={
            zoom.on
              ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : { transform: 'scale(1)' }
          }
        />
        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {product.isNew && <Badge tone="gold">New</Badge>}
          {off > 0 && <Badge tone="sale">-{off}% Off</Badge>}
        </div>
      </div>
    </div>
  )
}
