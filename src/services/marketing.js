import { getDB, commit } from '@/lib/db'
import { uid } from '@/lib/format'

// ------------------------------------------------------------- banners
export function getBanners({ placement, activeOnly = false } = {}) {
  let banners = [...getDB().banners].sort((a, b) => a.position - b.position)
  if (placement) banners = banners.filter((b) => b.placement === placement)
  if (activeOnly) {
    const nowTs = Date.now()
    banners = banners.filter(
      (b) =>
        b.active &&
        (!b.startsAt || new Date(b.startsAt).getTime() <= nowTs) &&
        (!b.endsAt || new Date(b.endsAt).getTime() >= nowTs)
    )
  }
  return banners
}

export function saveBanner(data) {
  const db = getDB()
  if (data.id) {
    const existing = db.banners.find((b) => b.id === data.id)
    if (existing) Object.assign(existing, data)
  } else {
    db.banners.push({
      placement: 'hero',
      heading: '',
      description: '',
      buttonText: 'Shop Now',
      buttonUrl: '/shop',
      secondaryText: '',
      secondaryUrl: '',
      image: null,
      position: db.banners.length + 1,
      startsAt: null,
      endsAt: null,
      active: true,
      ...data,
      id: uid('bn'),
    })
  }
  commit()
}

export function deleteBanner(id) {
  const db = getDB()
  db.banners = db.banners.filter((b) => b.id !== id)
  commit()
}

// ------------------------------------------------------------- social links
export function getSocialLinks({ activeOnly = false } = {}) {
  let links = [...getDB().socialLinks].sort((a, b) => a.order - b.order)
  if (activeOnly) links = links.filter((l) => l.active)
  return links
}

export function saveSocialLink(data) {
  const db = getDB()
  if (data.id) {
    const existing = db.socialLinks.find((l) => l.id === data.id)
    if (existing) Object.assign(existing, data)
  } else {
    db.socialLinks.push({
      platform: 'instagram',
      label: '',
      url: '',
      active: true,
      order: db.socialLinks.length + 1,
      ...data,
      id: uid('sl'),
    })
  }
  commit()
}

export function deleteSocialLink(id) {
  const db = getDB()
  db.socialLinks = db.socialLinks.filter((l) => l.id !== id)
  commit()
}

export function moveSocialLink(id, direction) {
  const db = getDB()
  const sorted = [...db.socialLinks].sort((a, b) => a.order - b.order)
  const idx = sorted.findIndex((l) => l.id === id)
  const swapIdx = idx + (direction === 'up' ? -1 : 1)
  if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return
  const a = sorted[idx]
  const b = sorted[swapIdx]
  ;[a.order, b.order] = [b.order, a.order]
  commit()
}

// ------------------------------------------------------------- contact messages
export function submitContactMessage({ name, email, message }) {
  if (!name?.trim() || !message?.trim()) throw new Error('Please fill in your name and message.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) throw new Error('Please enter a valid email address.')
  const db = getDB()
  db.messages = db.messages || []
  const entry = {
    id: uid('msg'),
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    status: 'new',
    createdAt: new Date().toISOString(),
  }
  db.messages.unshift(entry)
  commit()
  return entry
}

export function listMessages({ status } = {}) {
  let items = [...(getDB().messages || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (status) items = items.filter((m) => m.status === status)
  return items
}

export function setMessageStatus(id, status) {
  const db = getDB()
  const msg = (db.messages || []).find((m) => m.id === id)
  if (msg) {
    msg.status = status
    commit()
  }
}

export function deleteMessage(id) {
  const db = getDB()
  db.messages = (db.messages || []).filter((m) => m.id !== id)
  commit()
}

// ------------------------------------------------------------- misc
export function getTestimonials() {
  return getDB().testimonials
}

export function subscribeNewsletter(email) {
  const db = getDB()
  const clean = String(email).toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error('Please enter a valid email address.')
  if (db.newsletter.includes(clean)) throw new Error('You are already subscribed.')
  db.newsletter.push(clean)
  commit()
}
