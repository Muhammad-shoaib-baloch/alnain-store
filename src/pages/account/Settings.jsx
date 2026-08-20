import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toggle } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { usePageTitle } from '@/hooks'
import { updateUser, setCustomerStatus } from '@/services/auth'

export default function AccountSettings() {
  usePageTitle('Account Settings')
  const { user, refresh, logout } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()

  const [prefs, setPrefs] = useState({
    orderUpdates: user.prefs?.orderUpdates ?? true,
    newsletter: user.prefs?.newsletter ?? true,
    restockAlerts: user.prefs?.restockAlerts ?? false,
    whatsapp: user.prefs?.whatsapp ?? true,
  })

  const savePref = async (key, value) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try {
      await updateUser(user.id, { prefs: next })
      refresh()
      toast('Preference saved.', 'info')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const deleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete your account?',
      message: 'Your account will be deactivated and you will be signed out. Order history is retained for record-keeping.',
      confirmText: 'Delete Account',
    })
    if (!ok) return
    try {
      await setCustomerStatus(user.id, 'disabled')
    } catch {
      /* proceed to sign out regardless */
    }
    await logout()
    toast('Your account has been deactivated.', 'info')
    navigate('/')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl sm:text-3xl">Settings</h1>

      <div className="card mt-6 p-6">
        <h2 className="font-display text-xl">Notifications</h2>
        <p className="mt-1 text-sm text-smoke">Choose how we keep you posted.</p>
        <div className="mt-5 space-y-5">
          <Toggle checked={prefs.orderUpdates} onChange={(v) => savePref('orderUpdates', v)} label="Order updates" description="SMS + email when your order is confirmed, shipped and delivered." />
          <Toggle checked={prefs.whatsapp} onChange={(v) => savePref('whatsapp', v)} label="WhatsApp updates" description="Delivery updates and support on WhatsApp." />
          <Toggle checked={prefs.newsletter} onChange={(v) => savePref('newsletter', v)} label="New drops & offers" description="Be first to know about new collections and sales." />
          <Toggle checked={prefs.restockAlerts} onChange={(v) => savePref('restockAlerts', v)} label="Restock alerts" description="Get notified when wishlist items come back in stock." />
        </div>
      </div>

      <div className="card mt-6 border-red-200 p-6">
        <h2 className="font-display text-xl text-red-700">Danger Zone</h2>
        <p className="mt-1 text-sm text-smoke">
          Deleting your account deactivates it immediately. Contact support within 30 days to restore.
        </p>
        <button onClick={deleteAccount} className="btn mt-5 border border-red-300 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
          Delete My Account
        </button>
      </div>
    </div>
  )
}
