import { getDB, commit } from '@/lib/db'
import { uid } from '@/lib/format'

const SESSION_KEY = 'poshaak_session'

export function currentUser() {
  try {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    const user = getDB().users.find((u) => u.id === id)
    if (!user || user.status === 'disabled') return null
    return user
  } catch {
    return null
  }
}

export function login(email, password) {
  const user = getDB().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user || user.password !== password) throw new Error('Invalid email or password.')
  if (user.status === 'disabled') throw new Error('This account has been disabled. Contact support.')
  localStorage.setItem(SESSION_KEY, user.id)
  return user
}

export function register({ name, email, phone, password }) {
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

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function updateUser(id, patch) {
  const db = getDB()
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new Error('User not found.')
  if (patch.email && db.users.some((u) => u.id !== id && u.email.toLowerCase() === patch.email.toLowerCase()))
    throw new Error('That email is already in use.')
  Object.assign(user, patch)
  commit()
  return user
}

export function changePassword(id, current, next) {
  const user = getDB().users.find((u) => u.id === id)
  if (!user) throw new Error('User not found.')
  if (user.password !== current) throw new Error('Current password is incorrect.')
  user.password = next
  commit()
}

// mock password-reset flow (token kept in db.meta so it survives reload)
export function requestReset(email) {
  const db = getDB()
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user) throw new Error('No account found with this email.')
  const token = uid('reset')
  db.meta.resetTokens = { ...(db.meta.resetTokens || {}), [token]: { userId: user.id, expires: Date.now() + 3600_000 } }
  commit()
  return token
}

export function resetPassword(token, password) {
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
export function addAddress(userId, address) {
  const db = getDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return
  const isFirst = user.addresses.length === 0
  const addr = { ...address, id: uid('a'), isDefault: address.isDefault || isFirst }
  if (addr.isDefault) user.addresses.forEach((a) => (a.isDefault = false))
  user.addresses.push(addr)
  commit()
  return addr
}

export function updateAddress(userId, address) {
  const db = getDB()
  const user = db.users.find((u) => u.id === userId)
  const existing = user?.addresses.find((a) => a.id === address.id)
  if (!existing) return
  if (address.isDefault) user.addresses.forEach((a) => (a.isDefault = false))
  Object.assign(existing, address)
  if (!user.addresses.some((a) => a.isDefault) && user.addresses.length) user.addresses[0].isDefault = true
  commit()
}

export function deleteAddress(userId, addressId) {
  const db = getDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return
  user.addresses = user.addresses.filter((a) => a.id !== addressId)
  if (!user.addresses.some((a) => a.isDefault) && user.addresses.length) user.addresses[0].isDefault = true
  commit()
}

export function setDefaultAddress(userId, addressId) {
  const db = getDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return
  user.addresses.forEach((a) => (a.isDefault = a.id === addressId))
  commit()
}

export function setWishlist(userId, ids) {
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

export function setCustomerStatus(id, status) {
  const db = getDB()
  const user = db.users.find((u) => u.id === id)
  if (user) {
    user.status = status
    commit()
  }
}
