import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { initials } from '@/lib/format'
import { updateUser, changePassword } from '@/services/auth'

export default function AccountProfile() {
  usePageTitle('Profile')
  const { user, refresh } = useAuth()
  const toast = useToast()
  const fileRef = useRef(null)

  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '' })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [avatar, setAvatar] = useState(user.avatar)

  const pickAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) return toast('Please choose an image under 1 MB.', 'error')
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 3) return toast('Please enter your full name.', 'error')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast('Enter a valid email address.', 'error')
    try {
      await updateUser(user.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), avatar })
      refresh()
      toast('Profile updated successfully.')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pw.next.length < 6) return toast('New password must be at least 6 characters.', 'error')
    if (pw.next !== pw.confirm) return toast('New passwords do not match.', 'error')
    try {
      await changePassword(user.id, pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      toast('Password changed successfully.')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl sm:text-3xl">Profile</h1>

      <form onSubmit={saveProfile} className="card mt-6 p-6">
        <div className="flex items-center gap-5 border-b border-ink/[0.07] pb-6">
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-100 font-display text-2xl text-gold-700">
                {initials(form.name)}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-ivory transition-colors hover:bg-gold-600"
              aria-label="Change profile photo"
            >
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-smoke">Member since {new Date(user.createdAt).getFullYear()}</p>
            {avatar !== user.avatar && <p className="mt-1 text-xs text-gold-700">New photo selected — save to apply.</p>}
          </div>
        </div>

        <div className="grid gap-4 pt-6 sm:grid-cols-2">
          <Input label="Full name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="03xx xxxxxxx" />
          <Input className="sm:col-span-2" label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <button className="btn-primary mt-6">Save Changes</button>
      </form>

      <form onSubmit={savePassword} className="card mt-6 p-6">
        <h2 className="font-display text-xl">Change Password</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Input label="Current password" type="password" required value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} autoComplete="current-password" />
          <Input label="New password" type="password" required value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} autoComplete="new-password" />
          <Input label="Confirm new" type="password" required value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" />
        </div>
        <button className="btn-outline mt-6">Update Password</button>
      </form>
    </div>
  )
}
