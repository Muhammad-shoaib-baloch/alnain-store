import { useState } from 'react'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import Drawer from '@/components/ui/Drawer'
import EmptyState from '@/components/ui/EmptyState'
import { Checkbox, Input, Select } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { usePageTitle } from '@/hooks'
import { addAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/services/auth'

const BLANK = { label: 'Home', name: '', phone: '', country: 'Pakistan', city: '', address: '', apartment: '', postalCode: '', isDefault: false }
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Other']

export default function AccountAddresses() {
  usePageTitle('Addresses')
  const { user, refresh } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null) // null | address object | BLANK copy

  const openNew = () => setEditing({ ...BLANK, name: user.name, phone: user.phone || '' })

  const save = (e) => {
    e.preventDefault()
    if (!editing.name.trim() || !editing.city || editing.address.trim().length < 8)
      return toast('Please complete name, city and full address.', 'error')
    if (editing.id) {
      updateAddress(user.id, editing)
      toast('Address updated.')
    } else {
      addAddress(user.id, editing)
      toast('Address added.')
    }
    refresh()
    setEditing(null)
  }

  const remove = async (addr) => {
    const ok = await confirm({
      title: 'Delete this address?',
      message: `“${addr.label}” — ${addr.address}, ${addr.city}`,
    })
    if (!ok) return
    deleteAddress(user.id, addr.id)
    refresh()
    toast('Address deleted.', 'info')
  }

  const makeDefault = (addr) => {
    setDefaultAddress(user.id, addr.id)
    refresh()
    toast(`“${addr.label}” is now your default address.`)
  }

  const set = (key) => (e) => setEditing((a) => ({ ...a, [key]: e.target.value }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl">Addresses</h1>
        <button onClick={openNew} className="btn-primary btn-sm">
          <Plus size={14} /> Add Address
        </button>
      </div>

      {user.addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          message="Save an address to speed through checkout."
          action={<button onClick={openNew} className="btn-primary">Add Your First Address</button>}
          compact
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {user.addresses.map((addr) => (
            <div key={addr.id} className="card relative p-5">
              {addr.isDefault && (
                <span className="absolute right-4 top-4 flex items-center gap-1 bg-gold-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-700">
                  <Star size={10} fill="currentColor" /> Default
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-wider text-smoke">{addr.label}</p>
              <p className="mt-2 text-sm font-semibold">{addr.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-smoke">
                {addr.address}
                {addr.apartment ? `, ${addr.apartment}` : ''}
                <br />
                {addr.city}, {addr.country} {addr.postalCode}
                <br />
                {addr.phone}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-ink/[0.07] pt-3">
                <button onClick={() => setEditing({ ...addr })} className="btn-ghost btn-sm gap-1.5 px-2">
                  <Pencil size={13} /> Edit
                </button>
                {!addr.isDefault && (
                  <button onClick={() => makeDefault(addr)} className="btn-ghost btn-sm gap-1.5 px-2">
                    <Star size={13} /> Set Default
                  </button>
                )}
                <button onClick={() => remove(addr)} className="btn-ghost btn-sm ml-auto gap-1.5 px-2 text-red-600 hover:text-red-700">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit Address' : 'Add Address'}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancel</button>
            <button onClick={save} className="btn-primary btn-sm flex-1">Save Address</button>
          </div>
        }
      >
        {editing && (
          <form onSubmit={save} className="space-y-4 px-5 py-5">
            <Select label="Label" value={editing.label} onChange={set('label')} options={['Home', 'Office', 'Other'].map((v) => ({ value: v, label: v }))} />
            <Input label="Full name" required value={editing.name} onChange={set('name')} />
            <Input label="Phone" required value={editing.phone} onChange={set('phone')} placeholder="03xx xxxxxxx" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Country" value={editing.country} onChange={set('country')} options={[{ value: 'Pakistan', label: 'Pakistan' }]} />
              <Select label="City" required value={editing.city} onChange={set('city')} placeholder="Select city" options={CITIES.map((c) => ({ value: c, label: c }))} />
            </div>
            <Input label="Street address" required value={editing.address} onChange={set('address')} placeholder="House, street, area" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Apartment (optional)" value={editing.apartment} onChange={set('apartment')} />
              <Input label="Postal code" value={editing.postalCode} onChange={set('postalCode')} />
            </div>
            <Checkbox label="Set as default address" checked={editing.isDefault} onChange={(v) => setEditing((a) => ({ ...a, isDefault: v }))} />
          </form>
        )}
      </Drawer>
    </div>
  )
}
