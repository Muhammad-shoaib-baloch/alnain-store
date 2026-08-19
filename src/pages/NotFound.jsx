import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks'

export default function NotFound() {
  usePageTitle('Page Not Found')
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <p className="font-display text-[100px] leading-none text-gold-500/40 sm:text-[140px]">404</p>
      <h1 className="mt-2 font-display text-3xl">This page has wandered off</h1>
      <p className="mt-3 max-w-md text-sm text-smoke">
        The page you're looking for doesn't exist or has been moved. Let's get you back to something beautiful.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">Back to Home</Link>
        <Link to="/shop" className="btn-outline">Browse Shop</Link>
      </div>
    </div>
  )
}
