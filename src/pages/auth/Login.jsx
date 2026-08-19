import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react'
import { Input, Field } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'

export default function Login() {
  usePageTitle('Sign In')
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = (e, credentials) => {
    e?.preventDefault()
    const data = credentials || form
    const errs = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Enter a valid email address.'
    if (!data.password) errs.password = 'Password is required.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true)
    setTimeout(() => {
      try {
        const user = login(data.email, data.password)
        toast(`Welcome back, ${user.name.split(' ')[0]}!`)
        navigate(next || (user.role === 'admin' ? '/admin' : '/account'))
      } catch (err) {
        toast(err.message, 'error')
        setBusy(false)
      }
    }, 400)
  }

  return (
    <div className="container-x flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-7 text-center">
            <p className="eyebrow mb-2">Welcome Back</p>
            <h1 className="font-display text-3xl">Sign In</h1>
            <p className="mt-2 text-sm text-smoke">Access your orders, wishlist and faster checkout.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
              placeholder="you@example.com"
            />
            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-smoke hover:text-ink" aria-label="Toggle password visibility">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-medium text-gold-700 underline underline-offset-2">
                Forgot password?
              </Link>
            </div>
            <button disabled={busy} className="btn-primary w-full">
              <LogIn size={15} /> {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-smoke">
            New to Poshaak?{' '}
            <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-gold-700 underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>

        {/* demo access */}
        <div className="mt-4 border border-dashed border-gold-500/50 bg-gold-50 p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-700">
            <Sparkles size={13} /> Demo Access
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={(e) => submit(e, { email: 'admin@alnain.pk', password: 'admin123' })} className="btn-outline btn-sm">
              Login as Admin
            </button>
            <button onClick={(e) => submit(e, { email: 'sara@example.com', password: 'customer123' })} className="btn-outline btn-sm">
              Login as Customer
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-smoke">
            Admin: admin@alnain.pk / admin123 · Customer: sara@example.com / customer123
          </p>
        </div>
      </div>
    </div>
  )
}
