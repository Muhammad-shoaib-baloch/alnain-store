import { useMemo, useState } from 'react'

/**
 * <img> with a graceful branded fallback — if a remote image fails to load
 * (or src is empty) an elegant monogram placeholder renders instead, so the
 * layout never looks broken, even offline.
 */
export default function SmartImage({ src, alt = '', className = '', eager = false, ...rest }) {
  const [failed, setFailed] = useState(false)

  const fallback = useMemo(() => {
    const letter = (alt || 'Al Nain').trim()[0]?.toUpperCase() || 'A'
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='750'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#F5F0E6'/><stop offset='1' stop-color='#EAE0CC'/></linearGradient></defs><rect width='600' height='750' fill='url(#g)'/><circle cx='300' cy='340' r='104' fill='none' stroke='#B99338' stroke-width='1.5' opacity='0.6'/><text x='300' y='378' font-family='Georgia, serif' font-size='110' fill='#B99338' text-anchor='middle'>${letter}</text><text x='300' y='500' font-family='Georgia, serif' font-size='24' letter-spacing='10' fill='#8A7A5C' text-anchor='middle'>AL NAIN</text></svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }, [alt])

  return (
    <img
      src={failed || !src ? fallback : src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
      draggable={false}
      {...rest}
    />
  )
}
