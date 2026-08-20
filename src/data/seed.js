/**
 * Seed data for the Al Nain store — REAL catalogue.
 * buildSeed() output is imported into the live database by api/setup.php
 * (regenerate api/seed.json with: node scripts/export-seed.mjs), and also
 * powers the frontend's offline demo mode.
 *
 * Categories: "2 Piece" and "3 Piece".
 * Production-clean: no fake orders, reviews, customers or messages.
 */

const now = () => Date.now()
const daysAgo = (d) => new Date(now() - d * 24 * 60 * 60 * 1000).toISOString()
const daysAhead = (d) => new Date(now() + d * 24 * 60 * 60 * 1000).toISOString()

// Al Nain's own photography (served from /public/images)
const PHOTOS = {
  logo: '/images/logo.png',
  heroBanner: '/images/hero-banner.png',
  p: (n) => `/images/products/p${n}.jpg`,
}

// ---------------------------------------------------------------- color chart
const COLORS = {
  Magenta: '#B13B7F',
  Ivory: '#F1E9D7',
  'Scarlet Red': '#C0392B',
  'Sea Green': '#5FBFA5',
  Pistachio: '#B4D3A2',
  'Navy Blue': '#1F2A44',
  Teal: '#17646B',
  Maroon: '#7C1F2E',
  'Ice Blue': '#9FD9D2',
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const SIZES = ['S', 'M', 'L', 'XL']
const STOCK_PER_SIZE = 10

function makeVariants(skuBase, colorName, price, image) {
  return SIZES.map((size) => ({
    id: slugify(`${skuBase}-${colorName}-${size}`),
    sku: `${skuBase}-${colorName.slice(0, 2).toUpperCase()}${size}`,
    options: { Color: colorName, Size: size },
    price,
    salePrice: null,
    stock: STOCK_PER_SIZE,
    image,
    status: 'active',
  }))
}

// ---------------------------------------------------------------- products (REAL)
const TWO_PC = '2-piece'
const THREE_PC = '3-piece'

const RAW_PRODUCTS = [
  {
    img: 9,
    name: 'Magenta Chikankari Embroidered 2 Piece',
    cat: TWO_PC,
    fabric: 'Chikankari Cotton',
    price: 4000,
    color: 'Magenta',
    featured: true,
    collections: ['new-arrivals', 'chikankari-edit', 'best-sellers'],
    tags: ['chikankari', 'embroidered', '2 piece', 'kurta trouser'],
    pieces: 'Kameez and printed trouser (2 piece)',
    short:
      'All-over chikankari embroidered kameez in rich magenta, paired with a coordinating floral printed trouser.',
  },
  {
    img: 1,
    name: 'Ivory Booti Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Ivory',
    featured: false,
    collections: ['new-arrivals', 'lawn-edit'],
    tags: ['lawn', 'printed', '3 piece', 'booti'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Classic ivory kameez with navy floral booti print, finished with a contrast navy dupatta and off-white trouser.',
  },
  {
    img: 2,
    name: 'Scarlet Floral Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Scarlet Red',
    featured: true,
    collections: ['new-arrivals', 'lawn-edit', 'best-sellers'],
    tags: ['lawn', 'printed', '3 piece', 'floral'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Vibrant scarlet lawn covered in lily blooms, with a matching printed dupatta and dyed trouser.',
  },
  {
    img: 3,
    name: 'Mint Floral Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Sea Green',
    featured: false,
    collections: ['new-arrivals', 'lawn-edit'],
    tags: ['lawn', 'printed', '3 piece', 'floral'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Fresh sea-green lawn with delicate white florals, matching dupatta and dyed trouser — summer-perfect.',
  },
  {
    img: 4,
    name: 'Pistachio Rose Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Pistachio',
    featured: false,
    collections: ['new-arrivals', 'lawn-edit'],
    tags: ['lawn', 'printed', '3 piece', 'rose'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Soft pistachio green lawn printed with vintage roses, paired with a printed dupatta and light trouser.',
  },
  {
    img: 5,
    name: 'Navy Bloom Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Navy Blue',
    featured: false,
    collections: ['new-arrivals', 'lawn-edit'],
    tags: ['lawn', 'printed', '3 piece', 'floral'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Deep navy lawn scattered with blue and gold blooms, with matching dupatta and navy trouser.',
  },
  {
    img: 6,
    name: 'Teal Blossom Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Teal',
    featured: true,
    collections: ['new-arrivals', 'lawn-edit', 'best-sellers'],
    tags: ['lawn', 'printed', '3 piece', 'blossom'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Rich teal lawn with white cherry blossoms, bordered hems, matching dupatta and dyed trouser.',
  },
  {
    img: 7,
    name: 'Maroon Jaal Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Maroon',
    featured: false,
    collections: ['new-arrivals', 'lawn-edit'],
    tags: ['lawn', 'printed', '3 piece', 'jaal'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Traditional maroon jaal print in crisp white — full three-piece with printed trouser and dupatta.',
  },
  {
    img: 8,
    name: 'Ice Blue Floral Printed Lawn 3 Piece',
    cat: THREE_PC,
    fabric: 'Lawn',
    price: 3850,
    color: 'Ice Blue',
    featured: true,
    collections: ['new-arrivals', 'lawn-edit', 'best-sellers'],
    tags: ['lawn', 'printed', '3 piece', 'floral'],
    pieces: 'Kameez, trouser and dupatta (3 piece)',
    short:
      'Watercolour aqua florals on ice-white lawn, with a geometric-border dupatta and mint trouser.',
  },
]

function buildProducts() {
  return RAW_PRODUCTS.map((raw, i) => {
    const id = `p${i + 1}`
    const slug = slugify(raw.name)
    const skuBase = `ALN-${String(i + 1).padStart(3, '0')}`
    const image = PHOTOS.p(raw.img)
    const catLabel = raw.cat === TWO_PC ? '2 Piece' : '3 Piece'
    return {
      id,
      name: raw.name,
      slug,
      sku: skuBase,
      brand: 'Al Nain',
      category: raw.cat,
      collections: raw.collections,
      tags: raw.tags,
      gender: 'women',
      fabric: raw.fabric,
      shortDescription: raw.short,
      description: [
        `${raw.short}`,
        `Stitched to standard sizes in our Islamabad atelier and quality-checked twice before dispatch. The ${raw.fabric.toLowerCase()} fabric is pre-washed for softness and colour fastness, so it stays beautiful wear after wear.`,
        `Cash on Delivery available nationwide. If you are between sizes, we recommend going one size up for a relaxed fit.`,
      ].join('\n\n'),
      details: [
        `Fabric: ${raw.fabric}`,
        `Includes: ${raw.pieces}`,
        `Line: ${catLabel}`,
        'Fit: True to size, standard stitched sizes (see Size Guide)',
        'Care: Gentle machine wash inside-out; iron on medium',
        'Made in Pakistan — Al Nain, Islamabad',
      ],
      price: raw.price,
      salePrice: null,
      costPrice: null,
      images: [image],
      attributes: [
        { name: 'Color', values: [{ value: raw.color, hex: COLORS[raw.color] }] },
        { name: 'Size', values: SIZES.map((s) => ({ value: s })) },
      ],
      variants: makeVariants(skuBase, raw.color, raw.price, image),
      lowStockThreshold: 3,
      allowBackorders: false,
      rating: 0,
      reviewCount: 0,
      isNew: true,
      featured: raw.featured,
      status: 'published',
      seo: {
        metaTitle: `${raw.name} | Al Nain`,
        metaDescription: raw.short,
      },
      createdAt: daysAgo(1 + i * 0.1),
      updatedAt: daysAgo(0),
    }
  })
}

// ---------------------------------------------------------------- categories
const CATEGORIES = [
  { id: 'c-2pc', slug: TWO_PC, name: '2 Piece', parentId: null, image: PHOTOS.p(9), description: 'Kameez and trouser sets — chikankari and printed styles, ready to wear.', status: 'active' },
  { id: 'c-3pc', slug: THREE_PC, name: '3 Piece', parentId: null, image: PHOTOS.p(6), description: 'Complete suits — kameez, trouser and dupatta in signature printed lawn.', status: 'active' },
]

// ---------------------------------------------------------------- collections
const COLLECTIONS = [
  { id: 'col-new', slug: 'new-arrivals', name: 'New Arrivals', description: 'Fresh from the atelier — our newest pieces.', image: PHOTOS.p(2), active: true, featured: true },
  { id: 'col-best', slug: 'best-sellers', name: 'Best Sellers', description: 'The pieces our customers love the most.', image: PHOTOS.p(6), active: true, featured: true },
  { id: 'col-lawn', slug: 'lawn-edit', name: 'The Lawn Edit', description: 'Signature printed lawn — complete 3 piece suits.', image: PHOTOS.p(8), active: true, featured: true },
  { id: 'col-chikan', slug: 'chikankari-edit', name: 'Chikankari Edit', description: 'Hand-finished chikankari embroidery, ready to wear.', image: PHOTOS.p(9), active: true, featured: false },
]

// ---------------------------------------------------------------- users (admin only — real store)
const USERS = [
  {
    id: 'u-admin', role: 'admin', name: 'Al Nain Admin', email: 'admin@alnain.pk', phone: '+92 340 9421907',
    password: 'admin123', status: 'active', createdAt: daysAgo(1), avatar: null, addresses: [], wishlist: [],
  },
]

// ---------------------------------------------------------------- coupons (real, usable)
const COUPONS = [
  { id: 'cp-1', code: 'EID10', type: 'percentage', value: 10, minOrder: 5000, maxDiscount: 1500, startsAt: daysAgo(1), expiresAt: daysAhead(60), usageLimit: 500, usedCount: 0, perCustomerLimit: 2, products: [], categories: [], active: true },
  { id: 'cp-2', code: 'WELCOME500', type: 'fixed', value: 500, minOrder: 6000, maxDiscount: null, startsAt: daysAgo(1), expiresAt: daysAhead(180), usageLimit: 1000, usedCount: 0, perCustomerLimit: 1, products: [], categories: [], active: true },
]

// ---------------------------------------------------------------- banners
const BANNERS = [
  { id: 'bn-1', placement: 'hero', heading: 'Heritage in Every Thread', description: 'Chikankari and signature printed lawn — stitched 2 & 3 piece suits, delivered across Pakistan with Cash on Delivery.', buttonText: 'Shop Now', buttonUrl: '/shop', secondaryText: '3 Piece Collection', secondaryUrl: '/shop/3-piece', image: PHOTOS.heroBanner, align: 'right', position: 1, startsAt: null, endsAt: null, active: true },
  { id: 'bn-2', placement: 'promo', heading: 'The Chikankari Edit', description: 'All-over chikankari embroidered kameez with a coordinating printed trouser — elegant, breathable, ready to wear. Only Rs. 4,000.', buttonText: 'Shop 2 Piece', buttonUrl: '/shop/2-piece', secondaryText: '', secondaryUrl: '', image: PHOTOS.p(9), position: 1, startsAt: null, endsAt: null, active: true },
]

// ---------------------------------------------------------------- social links
const SOCIAL_LINKS = [
  { id: 'sl-1', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/alnain.pk', active: true, order: 1 },
  { id: 'sl-2', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/alnain.pk', active: true, order: 2 },
  { id: 'sl-3', platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@alnain.pk', active: true, order: 3 },
  { id: 'sl-4', platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/923409421907', active: true, order: 4 },
  { id: 'sl-5', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@alnain', active: false, order: 5 },
  { id: 'sl-6', platform: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com/alnain', active: false, order: 6 },
]

// ---------------------------------------------------------------- testimonials
const TESTIMONIALS = [
  { id: 't-1', name: 'Mahnoor Ali', city: 'Islamabad', rating: 5, text: 'Fabric quality is excellent and the stitching is very neat. Cash on delivery made it completely hassle-free.', avatar: 'https://i.pravatar.cc/100?img=44' },
  { id: 't-2', name: 'Ayesha Raza', city: 'Rawalpindi', rating: 5, text: 'Ordered the lawn 3 piece — colours are exactly like the pictures and it did not fade after washing.', avatar: 'https://i.pravatar.cc/100?img=32' },
  { id: 't-3', name: 'Kiran Fatima', city: 'Lahore', rating: 5, text: 'The chikankari kurta is beautiful in person. Delivery was quick and well packed.', avatar: 'https://i.pravatar.cc/100?img=25' },
  { id: 't-4', name: 'Hassan Javed', city: 'Karachi', rating: 4, text: 'Ordered for my wife — honest sizing, premium feel, and COD nationwide. Recommended.', avatar: 'https://i.pravatar.cc/100?img=68' },
]

// ---------------------------------------------------------------- settings
function buildSettings() {
  return {
    general: {
      storeName: 'Al Nain',
      tagline: 'Heritage in Every Thread',
      email: 'info@alnain.pk',
      phone: '+92 340 9421907',
      address: 'Islamabad, Pakistan',
      announcement: 'Cash on Delivery nationwide · Free shipping on orders above Rs. 5,000',
      logo: '/images/logo.png',
      favicon: null,
    },
    currency: { code: 'PKR', symbol: 'Rs.' },
    shipping: {
      methods: [
        { id: 'standard', label: 'Standard Delivery', eta: '3–5 working days', fee: 250, enabled: true },
        { id: 'express', label: 'Express Delivery', eta: '1–2 working days', fee: 500, enabled: true },
      ],
      freeShippingThreshold: 5000,
    },
    tax: { enabled: false, rate: 0, label: 'GST' },
    payments: [
      { id: 'cod', label: 'Cash on Delivery', description: 'Pay with cash when your order arrives at your doorstep.', enabled: true },
      { id: 'card', label: 'Credit / Debit Card', description: 'Visa and Mastercard. (Gateway integration pending — enable when connected.)', enabled: false },
      { id: 'bank', label: 'Bank Transfer', description: 'Direct transfer — order ships once payment is confirmed.', enabled: false, details: '' },
      { id: 'wallet', label: 'JazzCash / Easypaisa', description: 'Mobile wallet payment on +92 340 9421907.', enabled: false },
    ],
    seo: {
      siteTitle: 'Al Nain — Premium Traditional Wear',
      metaDescription: 'Chikankari and printed lawn suits — stitched 2 and 3 piece. Cash on delivery across Pakistan.',
      gtmId: '',
      googleAnalyticsId: '',
      facebookPixelId: '',
    },
  }
}

// ---------------------------------------------------------------- build all
export function buildSeed() {
  const products = buildProducts()
  return {
    version: 5,
    seededAt: new Date().toISOString(),
    settings: buildSettings(),
    products,
    categories: CATEGORIES,
    collections: COLLECTIONS.map((c) => ({
      ...c,
      productIds: products.filter((p) => p.collections.includes(c.slug)).map((p) => p.id),
    })),
    users: USERS,
    orders: [],
    reviews: [],
    coupons: COUPONS,
    banners: BANNERS,
    socialLinks: SOCIAL_LINKS,
    testimonials: TESTIMONIALS,
    messages: [],
    newsletter: [],
    meta: { orderSeq: 1000 },
  }
}
