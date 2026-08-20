import { useState } from 'react'
import { Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Drawer from '@/components/ui/Drawer'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import ImageUploader from '@/components/admin/ImageUploader'
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDate } from '@/lib/format'
import { getBanners, saveBanner, deleteBanner } from '@/services/marketing'
import { PLACEMENTS } from '@/lib/constants'

const BLANK = {
  placement: 'hero',
  heading: '',
  description: '',
  buttonText: 'Shop Now',
  buttonUrl: '/shop',
  secondaryText: '',
  secondaryUrl: '',
  image: null,
  mobileImage: null,
  position: 1,
  startsAt: '',
  endsAt: '',
  active: true,
}

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

export default function AdminBanners() {
  usePageTitle('Admin · Banners')
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [editing, setEditing] = useState(null)

  const banners = getBanners()

  const openEdit = (b) => setEditing({ ...BLANK, ...b, startsAt: toDateInput(b.startsAt), endsAt: toDateInput(b.endsAt) })

  const save = async (e) => {
    e?.preventDefault()
    if (!editing.heading.trim()) return toast('Banner heading is required.', 'error')
    try {
      await saveBanner({
        ...editing,
        position: Number(editing.position) || 1,
        startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : null,
        endsAt: editing.endsAt ? new Date(`${editing.endsAt}T23:59:59`).toISOString() : null,
      })
      toast(editing.id ? 'Banner updated.' : 'Banner created.')
      setEditing(null)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const remove = async (b) => {
    const ok = await confirm({ title: 'Delete this banner?', message: `“${b.heading}” will be removed from the homepage.` })
    if (!ok) return
    await deleteBanner(b.id)
    toast('Banner deleted.', 'info')
  }

  const toggleActive = async (b) => {
    await saveBanner({ ...b, active: !b.active })
    toast(`Banner ${b.active ? 'deactivated' : 'activated'}.`, 'info')
  }

  return (
    <div>
      <PageHeader title="Banners" sub="Homepage hero slides and promo banners — managed here, rendered live on the storefront.">
        <button onClick={() => setEditing({ ...BLANK, position: banners.length + 1 })} className="btn-primary btn-sm">
          <Plus size={14} /> Add Banner
        </button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        {banners.length === 0 && (
          <div className="card col-span-full py-16 text-center">
            <ImageIcon size={28} className="mx-auto mb-3 text-smoke/50" />
            <p className="text-sm text-smoke">No banners yet — the homepage hero will be empty.</p>
          </div>
        )}
        {banners.map((b) => (
          <div key={b.id} className="card overflow-hidden">
            <div className="relative h-40 bg-ink">
              <SmartImage src={b.image} alt={b.heading} className="h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <p className="font-display text-xl text-ivory">{b.heading}</p>
                <p className="line-clamp-1 text-xs text-ivory/70">{b.description}</p>
              </div>
              <div className="absolute left-3 top-3 flex gap-1.5">
                <span className="bg-ink/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-200">
                  {b.placement} · #{b.position}
                </span>
                <StatusBadge value={b.active ? 'active' : 'inactive'} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-4">
              <p className="mr-auto text-xs text-smoke">
                {b.startsAt || b.endsAt
                  ? `${b.startsAt ? formatDate(b.startsAt) : '…'} → ${b.endsAt ? formatDate(b.endsAt) : '…'}`
                  : 'Always visible'}
                {b.buttonText && <span className="ml-2 text-smoke/70">CTA: {b.buttonText} → {b.buttonUrl}</span>}
              </p>
              <button onClick={() => toggleActive(b)} className="btn-ghost btn-sm px-2">{b.active ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => openEdit(b)} className="btn-ghost btn-sm gap-1 px-2"><Pencil size={13} /> Edit</button>
              <button onClick={() => remove(b)} className="btn-ghost btn-sm gap-1 px-2 text-red-600"><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit Banner' : 'Add Banner'}
        width="max-w-lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancel</button>
            <button onClick={save} className="btn-primary btn-sm flex-1">Save Banner</button>
          </div>
        }
      >
        {editing && (
          <form onSubmit={save} className="space-y-4 px-5 py-5">
            <div>
              <p className="label">Banner image (desktop — wide)</p>
              <ImageUploader images={editing.image ? [editing.image] : []} onChange={(imgs) => setEditing((b) => ({ ...b, image: imgs[imgs.length - 1] || null }))} max={1} />
            </div>
            <div>
              <p className="label">Mobile image (portrait — optional)</p>
              <ImageUploader images={editing.mobileImage ? [editing.mobileImage] : []} onChange={(imgs) => setEditing((b) => ({ ...b, mobileImage: imgs[imgs.length - 1] || null }))} max={1} />
              <p className="mt-1 text-xs text-smoke">Phones show this instead of the wide image, so nothing crops badly.</p>
            </div>
            <Input label="Heading" required value={editing.heading} onChange={(e) => setEditing((b) => ({ ...b, heading: e.target.value }))} />
            <Textarea label="Description" rows={2} value={editing.description} onChange={(e) => setEditing((b) => ({ ...b, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Button text" value={editing.buttonText} onChange={(e) => setEditing((b) => ({ ...b, buttonText: e.target.value }))} />
              <Input label="Button URL" value={editing.buttonUrl} onChange={(e) => setEditing((b) => ({ ...b, buttonUrl: e.target.value }))} placeholder="/collections/eid-edit" />
              <Input label="Secondary text" value={editing.secondaryText} onChange={(e) => setEditing((b) => ({ ...b, secondaryText: e.target.value }))} hint="Optional second button (hero only)" />
              <Input label="Secondary URL" value={editing.secondaryUrl} onChange={(e) => setEditing((b) => ({ ...b, secondaryUrl: e.target.value }))} />
              <Select label="Placement" value={editing.placement} onChange={(e) => setEditing((b) => ({ ...b, placement: e.target.value }))} options={PLACEMENTS} />
              <Input label="Position" type="number" value={editing.position} onChange={(e) => setEditing((b) => ({ ...b, position: e.target.value }))} hint="Lower shows first" />
              <Input label="Start date" type="date" value={editing.startsAt} onChange={(e) => setEditing((b) => ({ ...b, startsAt: e.target.value }))} />
              <Input label="End date" type="date" value={editing.endsAt} onChange={(e) => setEditing((b) => ({ ...b, endsAt: e.target.value }))} />
            </div>
            <Toggle checked={editing.active} onChange={(v) => setEditing((b) => ({ ...b, active: v }))} label="Active" description="Inactive banners are hidden from the storefront" />
          </form>
        )}
      </Drawer>
    </div>
  )
}
