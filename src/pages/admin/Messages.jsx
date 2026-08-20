import { useState } from 'react'
import { Inbox, Mail, MailOpen, Trash2, Reply } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Tabs from '@/components/ui/Tabs'
import StatusBadge from '@/components/ui/StatusBadge'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDateTime, initials } from '@/lib/format'
import { listMessages, setMessageStatus, deleteMessage } from '@/services/marketing'

export default function AdminMessages() {
  usePageTitle('Admin · Messages')
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [tab, setTab] = useState('all')

  const all = listMessages()
  const newCount = all.filter((m) => m.status === 'new').length
  const messages = tab === 'all' ? all : listMessages({ status: tab })

  const markRead = async (msg) => {
    await setMessageStatus(msg.id, msg.status === 'new' ? 'read' : 'new')
    toast(msg.status === 'new' ? 'Marked as read.' : 'Marked as unread.', 'info')
  }

  const remove = async (msg) => {
    const ok = await confirm({
      title: 'Delete this message?',
      message: `From ${msg.name} (${msg.email}). This cannot be undone.`,
    })
    if (!ok) return
    await deleteMessage(msg.id)
    toast('Message deleted.', 'info')
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        sub="Contact-form submissions from the storefront land here."
      />

      <Tabs
        tabs={[
          { id: 'all', label: 'All', badge: all.length },
          { id: 'new', label: 'New', badge: newCount },
          { id: 'read', label: 'Read', badge: all.length - newCount },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-5"
      />

      <div className="max-w-4xl space-y-3">
        {messages.length === 0 && (
          <div className="card py-16 text-center">
            <Inbox size={28} className="mx-auto mb-3 text-smoke/50" />
            <p className="text-sm text-smoke">No messages in this view.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`card flex flex-wrap items-start gap-4 p-5 ${msg.status === 'new' ? 'border-l-2 border-l-gold-500' : ''}`}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
              {initials(msg.name)}
            </span>
            <div className="min-w-[220px] flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className={`text-sm ${msg.status === 'new' ? 'font-bold' : 'font-semibold'}`}>{msg.name}</p>
                <a href={`mailto:${msg.email}`} className="text-xs text-gold-700 underline underline-offset-2">{msg.email}</a>
                <span className="text-[11px] text-smoke">{formatDateTime(msg.createdAt)}</span>
                <StatusBadge value={msg.status} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{msg.message}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <a
                href={`mailto:${msg.email}?subject=Re: Your message to Al Nain`}
                className="btn btn-sm border border-gold-300 px-3 text-gold-700 hover:bg-gold-50"
                onClick={() => msg.status === 'new' && setMessageStatus(msg.id, 'read')}
              >
                <Reply size={13} /> Reply
              </a>
              <button onClick={() => markRead(msg)} className="btn btn-sm border border-ink/15 px-3 text-smoke hover:text-ink">
                {msg.status === 'new' ? <MailOpen size={13} /> : <Mail size={13} />}
                {msg.status === 'new' ? 'Mark Read' : 'Mark Unread'}
              </button>
              <button onClick={() => remove(msg)} className="btn btn-sm border border-red-300 px-3 text-red-600 hover:bg-red-50">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
