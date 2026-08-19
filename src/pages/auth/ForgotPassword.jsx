import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, MailCheck } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks'
import { requestReset } from '@/services/auth'

export default function ForgotPassword() {
  usePageTitle('Forgot Password')
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    try {
      const t = requestReset(email.trim())
      setToken(t)
      toast('Reset link generated — check your inbox.', 'info')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="container-x flex justify-center py-14 lg:py-20">
      <div className="card w-full max-w-md p-8">
        {token ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
              <MailCheck size={24} />
            </span>
            <h1 className="mt-4 font-display text-2xl">Check your email</h1>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              If an account exists for <span className="font-medium text-ink">{email}</span>, a password reset link has
              been sent. The link is valid for 1 hour.
            </p>
            <div className="mt-6 border border-dashed border-gold-500/50 bg-gold-50 p-4 text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold-700">Demo shortcut</p>
              <p className="mt-1 text-xs text-smoke">In this demo there's no real email — open the reset form directly:</p>
              <button onClick={() => navigate(`/reset-password?token=${token}`)} className="btn-primary btn-sm mt-3 w-full">
                Open Reset Form
              </button>
            </div>
            <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-gold-700 underline underline-offset-2">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                <KeyRound size={24} />
              </span>
              <h1 className="font-display text-3xl">Forgot Password?</h1>
              <p className="mt-2 text-sm text-smoke">
                Enter your account email and we'll send you a link to reset your password.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <button className="btn-primary w-full">Send Reset Link</button>
            </form>
            <p className="mt-6 text-center text-sm text-smoke">
              Remembered it?{' '}
              <Link to="/login" className="font-semibold text-gold-700 underline underline-offset-2">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
