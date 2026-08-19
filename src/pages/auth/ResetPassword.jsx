import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { resetPassword } from '@/services/auth'

export default function ResetPassword() {
  usePageTitle('Reset Password')
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      resetPassword(token, form.password)
      toast('Password updated — you can now sign in.')
      navigate('/login')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="container-x flex justify-center py-14 lg:py-20">
      <div className="card w-full max-w-md p-8">
        <div className="mb-7 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <ShieldCheck size={24} />
          </span>
          <h1 className="font-display text-3xl">Set New Password</h1>
          <p className="mt-2 text-sm text-smoke">Choose a strong password for your account.</p>
        </div>

        {!token ? (
          <p className="text-center text-sm text-smoke">
            This reset link is invalid.{' '}
            <Link to="/forgot-password" className="font-semibold text-gold-700 underline underline-offset-2">
              Request a new one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input label="New password" type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} error={errors.password} autoComplete="new-password" />
            <Input label="Confirm new password" type="password" required value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} autoComplete="new-password" />
            <button className="btn-primary w-full">Update Password</button>
          </form>
        )}
      </div>
    </div>
  )
}
