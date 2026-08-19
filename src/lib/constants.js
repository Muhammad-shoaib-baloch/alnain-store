export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed']

export const PRODUCT_STATUSES = ['published', 'draft', 'out-of-stock', 'archived']

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'name', label: 'Name: A–Z' },
]

export const RATING_FILTERS = [
  { value: '4.5', label: '4.5 & up' },
  { value: '4', label: '4.0 & up' },
  { value: '3', label: '3.0 & up' },
]

export const DISCOUNT_FILTERS = [
  { value: 'sale', label: 'On sale' },
  { value: '20', label: '20% off or more' },
  { value: '30', label: '30% off or more' },
]

export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

export const PLACEMENTS = [
  { value: 'hero', label: 'Homepage Hero' },
  { value: 'promo', label: 'Homepage Promo' },
]
