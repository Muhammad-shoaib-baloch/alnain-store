import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'

export default function Register() {
  usePageTitle('Create Account')
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (form.name.trim().length < 3) errs.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Enter a valid phone number.'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true)
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password })
      toast('Welcome to Al Nain — your account is ready!')
      navigate(next || '/account')
    } catch (err) {
      toast(err.message, 'error')
      setBusy(false)
    }
  }

  return (
    <div className="container-x flex justify-center py-14 lg:py-20">
      <div className="card w-full max-w-md p-8">
        <div className="mb-7 text-center">
          <p className="eyebrow mb-2">Join the Family</p>
          <h1 className="font-display text-3xl">Create Account</h1>
          <p className="mt-2 text-sm text-smoke">Track orders, save your wishlist, and check out faster.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" required value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Ayesha Khan" autoComplete="name" />
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" autoComplete="email" />
          <Input label="Phone (optional)" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="03xx xxxxxxx" autoComplete="tel" />
          <Input label="Password" type="password" required value={form.password} onChange={set('password')} error={errors.password} placeholder="At least 6 characters" autoComplete="new-password" />
          <Input label="Confirm password" type="password" required value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
          <button disabled={busy} className="btn-primary w-full">
            <UserPlus size={15} /> {busy ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-smoke">
          Already have an account?{' '}
          <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-gold-700 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
