import { getDB, commit, notify, isLive, rehydrate } from '@/lib/db'
import { api, setToken } from '@/lib/api'
import { uid } from '@/lib/format'

const SESSION_KEY = 'poshaak_session' // demo mode only

export function currentUser() {
  const db = getDB()
  if (isLive()) return db.me || null
  try {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    const user = db.users.find((u) => u.id === id)
    if (!user || user.status === 'disabled') return null
    return user
  } catch {
    return null
  }
}

export async function login(email, password) {
  if (isLive()) {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(token)
    await rehydrate()
    getDB().me = user
    return user
  }
  const user = getDB().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user || user.password !== password) throw new Error('Invalid email or password.')
  if (user.status === 'disabled') throw new Error('This account has been disabled. Contact support.')
  localStorage.setItem(SESSION_KEY, user.id)
  return user
}

export async function register({ name, email, phone, password }) {
  if (isLive()) {
    const { token, user } = await api('/auth/register', { method: 'POST', body: { name, email, phone, password } })
    setToken(token)
    await rehydrate()
    getDB().me = user
    return user
  }
  const db = getDB()
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase()))
    throw new Error('An account with this email already exists.')
  const user = {
    id: uid('u'),
    role: 'customer',
    name,
    email,
    phone: phone || '',
    password,
    status: 'active',
    createdAt: new Date().toISOString(),
    avatar: null,
    addresses: [],
    wishlist: [],
  }
  db.users.push(user)
  commit()
  localStorage.setItem(SESSION_KEY, user.id)
  return user
}

export async function logout() {
  if (isLive()) {
    setToken(null)
    getDB().me = null
    await rehydrate()
    return
  }
  localStorage.removeItem(SESSION_KEY)
}

export async function updateUser(id, patch) {
  if (isLive()) {
    const me = getDB().me
    const self = me && me.id === id
    const { user } = await api(self ? '/auth/me' : `/admin/customers/${id}`, { method: 'PATCH', body: patch })
    await rehydrate()
    if (self) getDB().me = user
    notify()
    return user
  }
  const db = getDB()
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new Error('User not found.')
  if (patch.email && db.users.some((u) => u.id !== id && u.email.toLowerCase() === patch.email.toLowerCase()))
    throw new Error('That email is already in use.')
  Object.assign(user, patch)
  commit()
  return user
}

export async function changePassword(id, current, next) {
  if (isLive()) {
    await api('/auth/password', { method: 'POST', body: { current, next } })
    return
  }
  const user = getDB().users.find((u) => u.id === id)
  if (!user) throw new Error('User not found.')
  if (user.password !== current) throw new Error('Current password is incorrect.')
  user.password = next
  commit()
}

// mock password-reset flow (demo only — live installs route through support)
export function requestReset(email) {
  if (isLive())
    throw new Error('Password reset is handled by our support team — please WhatsApp or email us and we will reset it for you.')
  const db = getDB()
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user) throw new Error('No account found with this email.')
  const token = uid('reset')
  db.meta.resetTokens = { ...(db.meta.resetTokens || {}), [token]: { userId: user.id, expires: Date.now() + 3600_000 } }
  commit()
  return token
}

export function resetPassword(token, password) {
  if (isLive()) throw new Error('This reset link is invalid or has expired.')
  const db = getDB()
  const entry = db.meta.resetTokens?.[token]
  if (!entry || entry.expires < Date.now()) throw new Error('This reset link is invalid or has expired.')
  const user = db.users.find((u) => u.id === entry.userId)
  if (!user) throw new Error('User not found.')
  user.password = password
  delete db.meta.resetTokens[token]
  commit()
  return user
}

// ------------------------------------------------------------- addresses
const cloneAddresses = (user) => (user.addresses || []).map((a) => ({ ...a }))

async function persistAddresses(userId, addresses) {
  if (isLive()) {
    const { user } = await api('/auth/me', { method: 'PATCH', body: { addresses } })
    getDB().me = user
    notify()
    return
  }
  commit()
}

export async function addAddress(userId, address) {
  const user = isLive() ? getDB().me : getDB().users.find((u) => u.id === userId)
  if (!user) return
  const list = cloneAddresses(user)
  const isFirst = list.length === 0
  const addr = { ...address, id: uid('a'), isDefault: address.isDefault || isFirst }
  if (addr.isDefault) list.forEach((a) => (a.isDefault = false))
  list.push(addr)
  user.addresses = list
  await persistAddresses(userId, list)
  return addr
}

export async function updateAddress(userId, address) {
  const user = isLive() ? getDB().me : getDB().users.find((u) => u.id === userId)
  if (!user) return
  const list = cloneAddresses(user)
  const existing = list.find((a) => a.id === address.id)
  if (!existing) return
  if (address.isDefault) list.forEach((a) => (a.isDefault = false))
  Object.assign(existing, address)
  if (!list.some((a) => a.isDefault) && list.length) list[0].isDefault = true
  user.addresses = list
  await persistAddresses(userId, list)
}

export async function deleteAddress(userId, addressId) {
  const user = isLive() ? getDB().me : getDB().users.find((u) => u.id === userId)
  if (!user) return
  const list = cloneAddresses(user).filter((a) => a.id !== addressId)
  if (!list.some((a) => a.isDefault) && list.length) list[0].isDefault = true
  user.addresses = list
  await persistAddresses(userId, list)
}

export async function setDefaultAddress(userId, addressId) {
  const user = isLive() ? getDB().me : getDB().users.find((u) => u.id === userId)
  if (!user) return
  const list = cloneAddresses(user)
  list.forEach((a) => (a.isDefault = a.id === addressId))
  user.addresses = list
  await persistAddresses(userId, list)
}

export async function setWishlist(userId, ids) {
  if (isLive()) {
    const me = getDB().me
    if (!me || me.id !== userId) return
    me.wishlist = ids
    try {
      const { user } = await api('/auth/me', { method: 'PATCH', body: { wishlist: ids } })
      getDB().me = user
    } catch {
      /* non-critical */
    }
    return
  }
  const db = getDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return
  user.wishlist = ids
  commit()
}

// ------------------------------------------------------------- admin: customers
export function listCustomers({ q, status, page = 1, perPage = 10 } = {}) {
  const db = getDB()
  let items = db.users
    .filter((u) => u.role === 'customer')
    .map((u) => {
      const orders = db.orders.filter((o) => o.customerId === u.id)
      const spent = orders
        .filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'refunded')
        .reduce((s, o) => s + o.total, 0)
      const last = orders[0]
      return { ...u, orderCount: orders.length, totalSpent: spent, lastOrderAt: last?.createdAt || null }
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter(
      (u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle) || (u.phone || '').includes(needle)
    )
  }
  if (status) items = items.filter((u) => u.status === status)
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), pages)
  return { items: items.slice((safePage - 1) * perPage, safePage * perPage), total, page: safePage, pages }
}

export async function setCustomerStatus(id, status) {
  if (isLive()) {
    const me = getDB().me
    if (me && me.id === id && status === 'disabled') {
      await api('/auth/me', { method: 'PATCH', body: { status: 'disabled' } })
    } else {
      await api(`/admin/customers/${id}`, { method: 'PATCH', body: { status } })
    }
    await rehydrate()
    return
  }
  const db = getDB()
  const user = db.users.find((u) => u.id === id)
  if (user) {
    user.status = status
    commit()
  }
}
