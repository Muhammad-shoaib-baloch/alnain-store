import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import RatingStars from '@/components/ui/RatingStars'
import { Input, Textarea } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { addReview, listProductReviews, reviewSummary } from '@/services/reviews'
import { formatDate, initials } from '@/lib/format'

function ReviewCard({ review }) {
  return (
    <div className="border-b border-ink/[0.08] py-5 last:border-0">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-xs font-bold text-gold-700">
          {initials(review.customerName)}
        </span>
        <div>
          <p className="text-sm font-semibold">{review.customerName}</p>
          <div className="flex items-center gap-2">
            <RatingStars value={review.rating} size={12} />
            <span className="text-[11px] text-smoke">{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>
      {review.title && <p className="mt-3 text-sm font-semibold">{review.title}</p>}
      <p className="mt-1 text-sm leading-relaxed text-smoke">{review.text}</p>
    </div>
  )
}

export default function ReviewsSection({ product, onSubmitted }) {
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ rating: 5, title: '', text: '' })
  const [showForm, setShowForm] = useState(false)

  const reviews = listProductReviews(product.id)
  const summary = reviewSummary(product)

  const submit = (e) => {
    e.preventDefault()
    if (!form.text.trim()) return toast('Please write a few words about the product.', 'error')
    addReview({
      productId: product.id,
      rating: form.rating,
      title: form.title.trim(),
      text: form.text.trim(),
      customerName: user.name,
      customerId: user.id,
    })
    setForm({ rating: 5, title: '', text: '' })
    setShowForm(false)
    toast('Thank you! Your review was submitted and is awaiting moderation.')
    onSubmitted?.()
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[300px,1fr]">
      {/* summary */}
      <div>
        <div className="card p-6 text-center">
          <p className="font-display text-5xl">{Number(summary.avg).toFixed(1)}</p>
          <RatingStars value={summary.avg} size={18} className="mt-2 justify-center" />
          <p className="mt-1.5 text-xs text-smoke">Based on {summary.count} ratings</p>
          <div className="mt-5 space-y-1.5 text-left">
            {[5, 4, 3, 2, 1].map((star) => {
              const total = Math.max(summary.written, 1)
              const width = ((summary.dist[star] || 0) / total) * 100
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 font-medium">{star}</span>
                  <Star size={11} className="text-gold-500" fill="currentColor" strokeWidth={0} />
                  <div className="h-1.5 flex-1 bg-cream">
                    <div className="h-full bg-gold-500" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-5 text-right text-smoke">{summary.dist[star] || 0}</span>
                </div>
              )
            })}
          </div>
        </div>
        {user ? (
          <button onClick={() => setShowForm((s) => !s)} className="btn-outline mt-4 w-full">
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        ) : (
          <p className="mt-4 text-center text-xs text-smoke">
            <Link to={`/login?next=/product/${product.slug}`} className="font-semibold text-gold-700 underline">
              Sign in
            </Link>{' '}
            to write a review
          </p>
        )}
      </div>

      {/* list + form */}
      <div>
        {showForm && user && (
          <form onSubmit={submit} className="card mb-6 space-y-4 p-6 animate-fadeUp">
            <div>
              <p className="label">Your rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setForm((f) => ({ ...f, rating: star }))} aria-label={`${star} stars`}>
                    <Star
                      size={26}
                      className={star <= form.rating ? 'text-gold-500' : 'text-beige'}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Sums up your experience" />
            <Textarea label="Review" required value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} placeholder="What did you like or dislike? How was the fit and fabric?" />
            <button className="btn-primary">Submit Review</button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="py-10 text-center text-sm text-smoke">No written reviews yet — be the first to share your experience.</p>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>
    </div>
  )
}
