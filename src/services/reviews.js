import { getDB, commit } from '@/lib/db'
import { uid } from '@/lib/format'

export function listProductReviews(productId) {
  return getDB()
    .reviews.filter((r) => r.productId === productId && r.status === 'approved')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function reviewSummary(product) {
  const reviews = listProductReviews(product.id)
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r) => (dist[r.rating] = (dist[r.rating] || 0) + 1))
  return {
    // seeded aggregate keeps ratings looking realistic even with few written reviews
    avg: product.rating || (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0),
    count: Math.max(product.reviewCount || 0, reviews.length),
    written: reviews.length,
    dist,
  }
}

export function addReview({ productId, rating, title, text, customerName, customerId }) {
  const db = getDB()
  const review = {
    id: uid('r'),
    productId,
    customerId: customerId || null,
    customerName,
    rating,
    title,
    text,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  db.reviews.unshift(review)
  commit()
  return review
}

export function listAllReviews({ q, status, rating } = {}) {
  const db = getDB()
  let items = db.reviews
    .map((r) => ({ ...r, product: db.products.find((p) => p.id === r.productId) || null }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (status) items = items.filter((r) => r.status === status)
  if (rating) items = items.filter((r) => r.rating === Number(rating))
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter(
      (r) =>
        r.customerName.toLowerCase().includes(needle) ||
        (r.product?.name || '').toLowerCase().includes(needle) ||
        r.text.toLowerCase().includes(needle)
    )
  }
  return items
}

export function setReviewStatus(id, status) {
  const db = getDB()
  const review = db.reviews.find((r) => r.id === id)
  if (review) {
    review.status = status
    commit()
  }
}

export function deleteReview(id) {
  const db = getDB()
  db.reviews = db.reviews.filter((r) => r.id !== id)
  commit()
}
