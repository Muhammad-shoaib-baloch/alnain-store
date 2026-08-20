/**
 * HTTP client for the Al Nain API.
 * Same-origin `/api` in production; override with VITE_API_BASE for dev
 * (e.g. VITE_API_BASE=http://localhost:8181 against the local PHP server).
 */
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const TOKEN_KEY = 'alnain_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export async function api(path, { method = 'GET', body, timeout = 15000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  let res
  try {
    res = await fetch(API_BASE + path, {
      method,
      signal: ctrl.signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } finally {
    clearTimeout(timer)
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data || {}
}

/** Uploads a data: URL image to the server, returns its hosted URL. */
export async function uploadDataUrl(dataUrl) {
  const { url } = await api('/admin/upload', { method: 'POST', body: { dataUrl } })
  return url
}

/** Replaces any data: URLs in a list of image refs with uploaded URLs. */
export async function materializeImageList(list = []) {
  return Promise.all(
    list.map((u) => (typeof u === 'string' && u.startsWith('data:') ? uploadDataUrl(u) : u))
  )
}

export async function materializeImage(u) {
  return typeof u === 'string' && u.startsWith('data:') ? uploadDataUrl(u) : u
}
