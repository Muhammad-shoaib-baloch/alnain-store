import { getDB } from './db'

/** Join class names, skipping falsy values. */
export function cn(...args) {
  return args.filter(Boolean).join(' ')
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatPrice(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  const symbol = getDB()?.settings?.currency?.symbol || 'Rs.'
  return `${symbol} ${Math.round(Number(n)).toLocaleString('en-PK')}`
}

export function formatNumber(n) {
  const num = Number(n) || 0
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 10_000) return `${Math.round(num / 1000)}k`
  return num.toLocaleString('en-PK')
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${formatDate(iso)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export function pctOff(price, salePrice) {
  if (!salePrice || !price || salePrice >= price) return 0
  return Math.round(((price - salePrice) / price) * 100)
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}
