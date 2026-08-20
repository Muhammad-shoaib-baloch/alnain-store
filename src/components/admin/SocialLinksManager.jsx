import { useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react'
import SocialIcon from '@/components/common/SocialIcon'
import { Toggle } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { getSocialLinks, saveSocialLink, deleteSocialLink, moveSocialLink } from '@/services/marketing'
import { SOCIAL_PLATFORMS } from '@/lib/constants'

/**
 * Social links CRUD — shared by /admin/social-links and the Settings → Social
 * tab. Links saved here appear automatically in the storefront footer, mobile
 * menu and homepage social section (nothing is hardcoded in the frontend).
 */
export default function SocialLinksManager() {
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [drafts, setDrafts] = useState({}) // id -> url draft

  const links = getSocialLinks()

  const addLink = async () => {
    const used = links.map((l) => l.platform)
    const platform = SOCIAL_PLATFORMS.find((p) => !used.includes(p.value)) || SOCIAL_PLATFORMS[0]
    await saveSocialLink({ platform: platform.value, label: platform.label, url: '', active: false })
    toast(`${platform.label} added — paste the profile URL and activate it.`, 'info')
  }

  const setPlatform = async (link, platform) => {
    const meta = SOCIAL_PLATFORMS.find((p) => p.value === platform)
    await saveSocialLink({ ...link, platform, label: meta?.label || platform })
  }

  const commitUrl = async (link) => {
    const draft = drafts[link.id]
    if (draft === undefined || draft === link.url) return
    await saveSocialLink({ ...link, url: draft.trim() })
    setDrafts((d) => {
      const next = { ...d }
      delete next[link.id]
      return next
    })
    toast(`${link.label} URL saved.`)
  }

  const toggleActive = async (link, active) => {
    if (active && !(drafts[link.id] ?? link.url).trim()) return toast('Add the profile URL before activating.', 'error')
    await saveSocialLink({ ...link, active })
    toast(`${link.label} ${active ? 'is now visible on the storefront' : 'hidden from the storefront'}.`, 'info')
  }

  const remove = async (link) => {
    const ok = await confirm({ title: `Remove ${link.label}?`, message: 'It will disappear from the footer and social sections.' })
    if (!ok) return
    await deleteSocialLink(link.id)
    toast('Social link removed.', 'info')
  }

  return (
    <div>
      <div className="space-y-3">
        {links.map((link, idx) => (
          <div key={link.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveSocialLink(link.id, 'up')} disabled={idx === 0} className="p-0.5 text-smoke hover:text-ink disabled:opacity-25" aria-label="Move up">
                <ArrowUp size={13} />
              </button>
              <button onClick={() => moveSocialLink(link.id, 'down')} disabled={idx === links.length - 1} className="p-0.5 text-smoke hover:text-ink disabled:opacity-25" aria-label="Move down">
                <ArrowDown size={13} />
              </button>
            </div>

            <span className={`flex h-10 w-10 shrink-0 items-center justify-center border ${link.active ? 'border-gold-500/50 bg-gold-50 text-gold-600' : 'border-ink/10 bg-cream text-smoke'}`}>
              <SocialIcon platform={link.platform} size={17} />
            </span>

            <select value={link.platform} onChange={(e) => setPlatform(link, e.target.value)} className="input w-36 py-2 text-sm">
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <div className="relative min-w-[220px] flex-1">
              <input
                value={drafts[link.id] ?? link.url}
                onChange={(e) => setDrafts((d) => ({ ...d, [link.id]: e.target.value }))}
                onBlur={() => commitUrl(link)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder={`https://${link.platform}.com/yourpage`}
                className="input py-2 pr-9 text-sm"
              />
              {link.url && (
                <a href={link.url} target="_blank" rel="noreferrer" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-smoke hover:text-gold-600" aria-label="Open link">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            <Toggle checked={link.active} onChange={(v) => toggleActive(link, v)} label={link.active ? 'Visible' : 'Hidden'} />

            <button onClick={() => remove(link)} className="p-1.5 text-smoke hover:text-red-600" aria-label="Delete link">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addLink} className="btn-outline btn-sm mt-4">
        <Plus size={13} /> Add Social Link
      </button>
      <p className="mt-3 text-xs text-smoke">
        Active links render automatically in the footer, mobile menu and homepage “As Worn By You” section, in the order
        above.
      </p>
    </div>
  )
}
