import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Star, Trash2, X } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import Tabs from '@/components/ui/Tabs'
import RatingStars from '@/components/ui/RatingStars'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDate } from '@/lib/format'
import { listAllReviews, setReviewStatus, deleteReview } from '@/services/reviews'

export default function AdminReviews() {
  usePageTitle('Admin · Reviews')
  const toast = useToast()
  const confirm = useConfirm()
  const { dbVersion } = useSettings()
  void dbVersion
  const [tab, setTab] = useState('pending')
  const [rating, setRating] = useState('')

  const all = listAllReviews({})
  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === 'pending').length,
    approved: all.filter((r) => r.status === 'approved').length,
    rejected: all.filter((r) => r.status === 'rejected').length,
  }
  const reviews = listAllReviews({ status: tab === 'all' ? '' : tab, rating })

  const act = async (review, status) => {
    await setReviewStatus(review.id, status)
    toast(`Review ${status}.`, status === 'approved' ? 'success' : 'info')
  }

  const remove = async (review) => {
    const ok = await confirm({ title: 'Delete this review?', message: `By ${review.customerName} on ${review.product?.name || 'a product'}.` })
    if (!ok) return
    await deleteReview(review.id)
    toast('Review deleted.', 'info')
  }

  return (
    <div>
      <PageHeader title="Reviews" sub="Approve customer reviews before they appear on product pages.">
        <select value={rating} onChange={(e) => setRating(e.target.value)} className="input w-auto py-2 text-sm">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>
          ))}
        </select>
      </PageHeader>

      <Tabs
        tabs={[
          { id: 'pending', label: 'Pending', badge: counts.pending },
          { id: 'approved', label: 'Approved', badge: counts.approved },
          { id: 'rejected', label: 'Rejected', badge: counts.rejected },
          { id: 'all', label: 'All', badge: counts.all },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-5"
      />

      <div className="space-y-3">
        {reviews.length === 0 && (
          <div className="card py-16 text-center">
            <Star size={28} className="mx-auto mb-3 text-smoke/50" />
            <p className="text-sm text-smoke">No reviews in this view.</p>
          </div>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="card flex flex-wrap items-start gap-4 p-5">
            {r.product && (
              <Link to={`/product/${r.product.slug}`} target="_blank" className="flex w-44 shrink-0 items-center gap-2.5">
                <SmartImage src={r.product.images[0]} alt={r.product.name} className="h-12 w-10 shrink-0 object-cover" />
                <span className="line-clamp-2 text-xs font-medium hover:text-gold-700">{r.product.name}</span>
              </Link>
            )}
            <div className="min-w-[200px] flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-sm font-semibold">{r.customerName}</p>
                <RatingStars value={r.rating} size={12} />
                <span className="text-[11px] text-smoke">{formatDate(r.createdAt)}</span>
                <StatusBadge value={r.status} />
              </div>
              {r.title && <p className="mt-1.5 text-sm font-medium">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-smoke">{r.text}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {r.status !== 'approved' && (
                <button onClick={() => act(r, 'approved')} className="btn btn-sm border border-emerald-300 px-3 text-emerald-700 hover:bg-emerald-50">
                  <Check size={13} /> Approve
                </button>
              )}
              {r.status !== 'rejected' && (
                <button onClick={() => act(r, 'rejected')} className="btn btn-sm border border-orange-300 px-3 text-orange-700 hover:bg-orange-50">
                  <X size={13} /> Reject
                </button>
              )}
              <button onClick={() => remove(r)} className="btn btn-sm border border-red-300 px-3 text-red-600 hover:bg-red-50">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
