import { useState } from 'react'
import { Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Drawer from '@/components/ui/Drawer'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import ImageUploader from '@/components/admin/ImageUploader'
import { Checkbox, Input, Textarea, Toggle } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { slugify } from '@/lib/format'
import { getCollections, getProducts, saveCollection, deleteCollection } from '@/services/catalog'

const BLANK = { name: '', slug: '', description: '', image: null, featured: false, active: true, productIds: [] }

export default function AdminCollections() {
  usePageTitle('Admin · Collections')
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [editing, setEditing] = useState(null)
  const [productSearch, setProductSearch] = useState('')

  const collections = getCollections()
  const allProducts = getProducts({ includeAllStatuses: true, perPage: 1000 }).items

  const save = async (e) => {
    e?.preventDefault()
    if (editing.name.trim().length < 2) return toast('Collection name is required.', 'error')
    try {
      await saveCollection({ ...editing, slug: editing.slug || slugify(editing.name) })
      toast(editing.id ? 'Collection updated.' : 'Collection created.')
      setEditing(null)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const remove = async (col) => {
    const ok = await confirm({
      title: `Delete “${col.name}”?`,
      message: 'Products stay in the catalogue — they are only removed from this collection.',
    })
    if (!ok) return
    await deleteCollection(col.id)
    toast('Collection deleted.', 'info')
  }

  const toggleActive = async (col) => {
    await saveCollection({ ...col, active: !col.active })
    toast(`Collection ${col.active ? 'disabled' : 'enabled'}.`, 'info')
  }

  const filteredProducts = productSearch
    ? allProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : allProducts

  return (
    <div>
      <PageHeader title="Collections" sub="Curated edits shown on the homepage and navigation.">
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary btn-sm">
          <Plus size={14} /> Add Collection
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {collections.map((col) => (
          <div key={col.id} className="card overflow-hidden">
            <div className="relative h-36 bg-cream">
              <SmartImage src={col.image} alt={col.name} className="h-full w-full object-cover" />
              <div className="absolute left-3 top-3 flex gap-1.5">
                {col.featured && <span className="bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Featured</span>}
                <StatusBadge value={col.active ? 'active' : 'inactive'} />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{col.name}</p>
                  <p className="text-xs text-smoke">/collections/{col.slug} · {(col.productIds || []).length} products</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-smoke">{col.description}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-ink/[0.07] pt-3">
                <button onClick={() => setEditing({ ...BLANK, ...col })} className="btn-ghost btn-sm gap-1.5 px-2"><Pencil size={13} /> Edit</button>
                <button onClick={() => toggleActive(col)} className="btn-ghost btn-sm px-2">{col.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => remove(col)} className="btn-ghost btn-sm ml-auto gap-1.5 px-2 text-red-600"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <div className="card col-span-full py-16 text-center">
            <Layers size={28} className="mx-auto mb-3 text-smoke/50" />
            <p className="text-sm text-smoke">No collections yet.</p>
          </div>
        )}
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit Collection' : 'Add Collection'}
        width="max-w-lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancel</button>
            <button onClick={save} className="btn-primary btn-sm flex-1">Save Collection</button>
          </div>
        }
      >
        {editing && (
          <form onSubmit={save} className="space-y-4 px-5 py-5">
            <Input
              label="Name"
              required
              value={editing.name}
              onChange={(e) => setEditing((c) => ({ ...c, name: e.target.value, slug: c.id ? c.slug : slugify(e.target.value) }))}
            />
            <Input label="Slug" value={editing.slug} onChange={(e) => setEditing((c) => ({ ...c, slug: slugify(e.target.value) }))} hint={`/collections/${editing.slug || '…'}`} />
            <Textarea label="Description" rows={2} value={editing.description} onChange={(e) => setEditing((c) => ({ ...c, description: e.target.value }))} />
            <div>
              <p className="label">Banner image</p>
              <ImageUploader images={editing.image ? [editing.image] : []} onChange={(imgs) => setEditing((c) => ({ ...c, image: imgs[imgs.length - 1] || null }))} max={1} />
            </div>
            <div className="flex gap-6">
              <Toggle checked={editing.active} onChange={(v) => setEditing((c) => ({ ...c, active: v }))} label="Active" />
              <Toggle checked={editing.featured} onChange={(v) => setEditing((c) => ({ ...c, featured: v }))} label="Featured on homepage" />
            </div>

            <div>
              <p className="label">Products ({(editing.productIds || []).length} selected)</p>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products…" className="input py-2 pl-9 text-sm" />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto border border-ink/10 p-3">
                {filteredProducts.map((p) => (
                  <Checkbox
                    key={p.id}
                    label={p.name}
                    checked={(editing.productIds || []).includes(p.id)}
                    onChange={(v) =>
                      setEditing((c) => ({
                        ...c,
                        productIds: v ? [...(c.productIds || []), p.id] : (c.productIds || []).filter((id) => id !== p.id),
                      }))
                    }
                  />
                ))}
                {filteredProducts.length === 0 && <p className="py-4 text-center text-xs text-smoke">No products found.</p>}
              </div>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  )
}
