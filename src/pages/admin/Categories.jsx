import { Fragment, useState } from 'react'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { slugify } from '@/lib/format'
import { getCategories, saveCategory, deleteCategory, countProductsInCategory } from '@/services/catalog'

const BLANK = { name: '', slug: '', parentId: '', image: null, description: '', status: 'active' }

export default function AdminCategories() {
  usePageTitle('Admin · Categories')
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [editing, setEditing] = useState(null)

  const tree = getCategories({ tree: true })
  const parents = getCategories().filter((c) => !c.parentId)

  const save = (e) => {
    e?.preventDefault()
    if (editing.name.trim().length < 2) return toast('Category name is required.', 'error')
    saveCategory({ ...editing, parentId: editing.parentId || null, slug: editing.slug || slugify(editing.name) })
    toast(editing.id ? 'Category updated.' : 'Category created.')
    setEditing(null)
  }

  const remove = async (cat) => {
    const count = countProductsInCategory(cat.slug)
    const ok = await confirm({
      title: `Delete “${cat.name}”?`,
      message: count
        ? `${count} product(s) use this category — they will be moved to the parent category.`
        : 'This category has no products.',
    })
    if (!ok) return
    deleteCategory(cat.id)
    toast('Category deleted.', 'info')
  }

  const Row = ({ cat, child = false }) => (
    <tr>
      <td>
        <div className={`flex items-center gap-3 ${child ? 'pl-8' : ''}`}>
          <SmartImage src={cat.image} alt={cat.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
          <div>
            <p className="text-sm font-medium">{child && <span className="mr-1 text-smoke">└</span>}{cat.name}</p>
            <p className="text-[11px] text-smoke">/{cat.slug}</p>
          </div>
        </div>
      </td>
      <td className="max-w-[280px] truncate text-xs text-smoke">{cat.description}</td>
      <td className="text-center font-semibold">{countProductsInCategory(cat.slug)}</td>
      <td><StatusBadge value={cat.status} /></td>
      <td>
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing({ ...BLANK, ...cat, parentId: cat.parentId || '' })} className="p-1.5 text-smoke hover:text-gold-600" aria-label="Edit category">
            <Pencil size={15} />
          </button>
          <button onClick={() => remove(cat)} className="p-1.5 text-smoke hover:text-red-600" aria-label="Delete category">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div>
      <PageHeader title="Categories" sub="Organise your catalogue — parent categories with nested subcategories.">
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary btn-sm">
          <Plus size={14} /> Add Category
        </button>
      </PageHeader>

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[720px]">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th className="text-center">Products</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 ? (
              <tr><td colSpan={5} className="py-14 text-center"><FolderTree size={28} className="mx-auto mb-3 text-smoke/50" /><p className="text-sm text-smoke">No categories yet.</p></td></tr>
            ) : (
              tree.map((parent) => (
                <Fragment key={parent.id}>
                  <Row cat={parent} />
                  {parent.children.map((child) => (
                    <Row key={child.id} cat={child} child />
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit Category' : 'Add Category'}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancel</button>
            <button onClick={save} className="btn-primary btn-sm flex-1">Save Category</button>
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
            <Input label="Slug" value={editing.slug} onChange={(e) => setEditing((c) => ({ ...c, slug: slugify(e.target.value) }))} hint={`/shop/${editing.slug || '…'}`} />
            <Select
              label="Parent category"
              value={editing.parentId}
              onChange={(e) => setEditing((c) => ({ ...c, parentId: e.target.value }))}
              placeholder="None (top level)"
              options={parents.filter((p) => p.id !== editing.id).map((p) => ({ value: p.id, label: p.name }))}
            />
            <Textarea label="Description" rows={3} value={editing.description} onChange={(e) => setEditing((c) => ({ ...c, description: e.target.value }))} />
            <div>
              <p className="label">Category image</p>
              <ImageUploader images={editing.image ? [editing.image] : []} onChange={(imgs) => setEditing((c) => ({ ...c, image: imgs[imgs.length - 1] || null }))} max={1} />
            </div>
            <Toggle checked={editing.status === 'active'} onChange={(v) => setEditing((c) => ({ ...c, status: v ? 'active' : 'inactive' }))} label="Active" description="Inactive categories are hidden from the storefront navigation" />
          </form>
        )}
      </Drawer>
    </div>
  )
}
