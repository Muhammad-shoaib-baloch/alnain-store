/**
 * Google Tag Manager integration.
 * The container ID lives in store settings (Admin → Settings → SEO). When set,
 * the GTM script is injected once and route changes / commerce actions are
 * pushed to the dataLayer, so any tag (GA4, Meta Pixel, etc.) can be managed
 * from the GTM dashboard without code changes.
 */
let injectedId = null

export function initGTM(id) {
  const clean = (id || '').trim()
  if (!clean || injectedId === clean || typeof document === 'undefined') return
  injectedId = clean

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.async = true
  script.id = 'gtm-script'
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(clean)}`
  document.head.appendChild(script)

  const noscript = document.createElement('noscript')
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(clean)}`
  iframe.height = '0'
  iframe.width = '0'
  iframe.style.display = 'none'
  iframe.style.visibility = 'hidden'
  noscript.appendChild(iframe)
  document.body.prepend(noscript)
}

export function trackEvent(event, data = {}) {
  if (typeof window === 'undefined' || !window.dataLayer) return
  window.dataLayer.push({ event, ...data })
}

export function trackPageView(path, title) {
  trackEvent('page_view', { page_path: path, page_title: title })
}
