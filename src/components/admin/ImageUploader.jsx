import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Star, Trash2, Link2 } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import Tooltip from '@/components/ui/Tooltip'
import { useToast } from '@/context/ToastContext'

/**
 * Multi-image manager: upload files (stored as data URLs), paste image URLs,
 * reorder, delete, and promote to featured (first image = featured).
 */
export default function ImageUploader({ images = [], onChange, max = 8 }) {
  const fileRef = useRef(null)
  const toast = useToast()
  const [url, setUrl] = useState('')

  const addFiles = (e) => {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    if (images.length + files.length > max) return toast(`Maximum ${max} images.`, 'error')
    let pending = files.length
    const next = [...images]
    files.forEach((file) => {
      if (file.size > 1024 * 1024) {
        toast(`${file.name} is over 1 MB — skipped.`, 'error')
        if (--pending === 0) onChange([...next])
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        next.push(reader.result)
        if (--pending === 0) onChange([...next])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const addUrl = () => {
    const clean = url.trim()
    if (!clean) return
    if (images.length >= max) return toast(`Maximum ${max} images.`, 'error')
    onChange([...images, clean])
    setUrl('')
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    const next = [...images]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i))

  const feature = (i) => {
    const next = [...images]
    const [img] = next.splice(i, 1)
    onChange([img, ...next])
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {images.map((img, i) => (
          <div key={i} className="group relative aspect-[3/4] overflow-hidden border border-ink/10 bg-cream">
            <SmartImage src={img} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 bg-gold-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                <Star size={9} fill="currentColor" /> Featured
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-ink/70 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Tooltip label="Move left">
                <button type="button" onClick={() => move(i, -1)} className="p-1 text-ivory/80 hover:text-ivory" aria-label="Move left"><ArrowLeft size={13} /></button>
              </Tooltip>
              {i !== 0 && (
                <Tooltip label="Set featured">
                  <button type="button" onClick={() => feature(i)} className="p-1 text-ivory/80 hover:text-gold-200" aria-label="Set featured"><Star size={13} /></button>
                </Tooltip>
              )}
              <Tooltip label="Delete">
                <button type="button" onClick={() => remove(i)} className="p-1 text-ivory/80 hover:text-red-400" aria-label="Delete image"><Trash2 size={13} /></button>
              </Tooltip>
              <Tooltip label="Move right">
                <button type="button" onClick={() => move(i, 1)} className="p-1 text-ivory/80 hover:text-ivory" aria-label="Move right"><ArrowRight size={13} /></button>
              </Tooltip>
            </div>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/20 text-smoke transition-colors hover:border-gold-500 hover:text-gold-600"
          >
            <Plus size={20} />
            <span className="text-[11px] font-medium">Upload</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addFiles} />

      <div className="mt-3 flex">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
            placeholder="…or paste an image URL"
            className="input pl-9"
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-outline shrink-0 px-4 text-xs">
          Add URL
        </button>
      </div>
      <p className="mt-1.5 text-xs text-smoke">First image is the featured image shown on product cards. Max {max} images, 1 MB each for uploads.</p>
    </div>
  )
}
