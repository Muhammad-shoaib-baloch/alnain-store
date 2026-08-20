import { getDB, commit, isLive, rehydrate } from '@/lib/db'
import { api, materializeImage } from '@/lib/api'
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

export async function saveBanner(data) {
  if (isLive()) {
    const payload = { ...data, image: await materializeImage(data.image) }
    await api('/admin/banners', { method: 'POST', body: payload })
    await rehydrate()
    return
  }
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

export async function deleteBanner(id) {
  if (isLive()) {
    await api(`/admin/banners/${id}`, { method: 'DELETE' })
    await rehydrate()
    return
  }
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

async function putSocialLinks(links) {
  await api('/admin/social', { method: 'PUT', body: { links } })
  await rehydrate()
}

export async function saveSocialLink(data) {
  if (isLive()) {
    const links = getSocialLinks().map((l) => ({ ...l }))
    if (data.id) {
      const existing = links.find((l) => l.id === data.id)
      if (existing) Object.assign(existing, data)
    } else {
      links.push({ platform: 'instagram', label: '', url: '', active: true, order: links.length + 1, ...data })
    }
    await putSocialLinks(links)
    return
  }
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

export async function deleteSocialLink(id) {
  if (isLive()) {
    await putSocialLinks(getSocialLinks().filter((l) => l.id !== id))
    return
  }
  const db = getDB()
  db.socialLinks = db.socialLinks.filter((l) => l.id !== id)
  commit()
}

export async function moveSocialLink(id, direction) {
  if (isLive()) {
    const sorted = getSocialLinks().map((l) => ({ ...l }))
    const idx = sorted.findIndex((l) => l.id === id)
    const swapIdx = idx + (direction === 'up' ? -1 : 1)
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return
    ;[sorted[idx].order, sorted[swapIdx].order] = [sorted[swapIdx].order, sorted[idx].order]
    await putSocialLinks(sorted)
    return
  }
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
export async function submitContactMessage({ name, email, message }) {
  if (!name?.trim() || !message?.trim()) throw new Error('Please fill in your name and message.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) throw new Error('Please enter a valid email address.')
  if (isLive()) {
    const res = await api('/messages', { method: 'POST', body: { name, email, message } })
    return res.message
  }
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

export async function setMessageStatus(id, status) {
  if (isLive()) {
    await api(`/admin/messages/${id}`, { method: 'PATCH', body: { status } })
    await rehydrate()
    return
  }
  const db = getDB()
  const msg = (db.messages || []).find((m) => m.id === id)
  if (msg) {
    msg.status = status
    commit()
  }
}

export async function deleteMessage(id) {
  if (isLive()) {
    await api(`/admin/messages/${id}`, { method: 'DELETE' })
    await rehydrate()
    return
  }
  const db = getDB()
  db.messages = (db.messages || []).filter((m) => m.id !== id)
  commit()
}

// ------------------------------------------------------------- misc
export function getTestimonials() {
  return getDB().testimonials
}

export async function subscribeNewsletter(email) {
  const clean = String(email).toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error('Please enter a valid email address.')
  if (isLive()) {
    await api('/newsletter', { method: 'POST', body: { email: clean } })
    return
  }
  const db = getDB()
  if (db.newsletter.includes(clean)) throw new Error('You are already subscribed.')
  db.newsletter.push(clean)
  commit()
}
