/**
 * Seed / demo data for the Al Nain store.
 * buildSeed() returns a fresh database object. It is called once when
 * localStorage is empty (or after "Reset demo data" in admin settings).
 *
 * Catalogue structure: TWO categories only —
 *   1. Embroidered Dobby        (hand/machine embroidery on textured dobby weave)
 *   2. Digital Printed Khaddar  (digital prints on soft-washed khaddar)
 *
 * Everything here is mock data — the service layer (src/services) is the only
 * code that touches this shape, so swapping in a real REST/Laravel/Node API
 * later only means rewriting the services.
 */

const DAY = 24 * 60 * 60 * 1000
const now = () => Date.now()
const daysAgo = (d) => new Date(now() - d * DAY).toISOString()
const daysAhead = (d) => new Date(now() + d * DAY).toISOString()

const U = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`

// ---------------------------------------------------------------- image pools
const W = [
  '1610030469983-98e550d6193c',
  '1617627143750-d86bc21e42bb',
  '1595777457583-95e059d581b8',
  '1524504388940-b1c1722653e1',
  '1515372039744-b8f02a3ae446',
  '1529139574466-a303027c1d8b',
  '1509631179647-0177331693ae',
  '1469334031218-e382a71b716b',
  '1487222477894-8943e31ef7b2',
  '1496747611176-843222e1e57c',
  '1483985988355-763728e1935b',
  '1490481651871-ab68de25d43d',
  '1539109136881-3be0616acf4b',
  '1519699047748-de8e457a634e',
  '1531746020798-e6953c6e8e04',
  '1445205170230-053b83016050',
].map((id) => U(id))

const B = {
  rack: U('1434389677669-e08b4cac3105', 1600),
  fabric: U('1558769132-cb1aea458c5e', 1600),
  bride: U('1583939003579-730e3918a45a', 1600),
  saree: U('1610030469983-98e550d6193c', 1600),
}

// Al Nain's own campaign photography (served from /public/images)
const PHOTOS = {
  logo: '/images/logo.png',
  heroBanner: '/images/hero-banner.png',
  maroon: '/images/suit-maroon.jpg',
  rust: '/images/kurta-rust.jpg',
  duo: '/images/duo-green-beige.jpg',
  green: '/images/kurta-green.jpg',
}

// ---------------------------------------------------------------- color chart
const COLORS = {
  Black: '#1B1B1B',
  White: '#F4F1EA',
  Ivory: '#F1E9D7',
  Navy: '#1F2A44',
  Maroon: '#6E1423',
  Beige: '#D9C7A7',
  Emerald: '#1F5F4A',
  Rust: '#B4552D',
  Blush: '#E8B4B8',
  Mustard: '#C9962E',
  Teal: '#175E63',
  Olive: '#6F6B3A',
  Sage: '#9CAF88',
  Rose: '#C4536A',
  Gold: '#B99338',
  Grey: '#8B8B85',
  Brown: '#5C4327',
}

const cv = (names) => names.map((n) => ({ value: n, hex: COLORS[n] }))
const sv = (names) => names.map((n) => ({ value: n }))

const STOCK_PATTERN = [14, 8, 0, 16, 4, 22, 3, 18, 9, 2, 12, 6, 20, 5, 11, 0, 7, 15]

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Cartesian-product variant generator (same logic the admin VariationBuilder uses). */
function genVariants(skuBase, attributes, basePrice, salePrice, images, opts = {}) {
  const lists = attributes.map((a) => a.values.map((v) => ({ attr: a.name, value: v.value })))
  let combos = [[]]
  for (const list of lists) {
    combos = combos.flatMap((c) => list.map((item) => [...c, item]))
  }
  return combos.map((combo, i) => {
    const options = {}
    combo.forEach(({ attr, value }) => (options[attr] = value))
    const surcharge = options.Size === 'XXL' ? (opts.xxlSurcharge ?? 0) : 0
    const colorIdx = attributes[0]?.name === 'Color'
      ? attributes[0].values.findIndex((v) => v.value === options.Color)
      : -1
    return {
      id: slugify(`${skuBase}-${Object.values(options).join('-')}`),
      sku: `${skuBase}-${Object.values(options).map((v) => v.slice(0, 2).toUpperCase()).join('')}`,
      options,
      price: basePrice + surcharge,
      salePrice: salePrice ? salePrice + surcharge : null,
      stock: STOCK_PATTERN[(i + (opts.stockOffset || 0)) % STOCK_PATTERN.length],
      image: opts.colorImages && colorIdx >= 0 ? images[colorIdx % images.length] : null,
      status: 'active',
    }
  })
}

const pickImgs = (pool, i) => [pool[(i * 3) % pool.length], pool[(i * 3 + 1) % pool.length], pool[(i * 3 + 2) % pool.length], pool[(i * 3 + 4) % pool.length]]

// ---------------------------------------------------------------- products
const DOBBY = 'embroidered-dobby'
const KHADDAR = 'digital-printed-khaddar'

const RAW_PRODUCTS = [
  // ---- Embroidered Dobby (p1–p8)
  { name: 'Gulnar Embroidered Dobby Suit', cat: DOBBY, fabric: 'Dobby', price: 4990, sale: 4290, colors: ['Maroon', 'Emerald', 'Black'], sizes: ['S', 'M', 'L', 'XL'], isNew: true, featured: true, collections: ['new-arrivals', 'eid-edit', 'premium-heritage'], tags: ['embroidered', 'dobby', 'festive', '2 piece'], photos: [PHOTOS.maroon], short: 'Tilla-embroidered dobby two-piece with zari detailing on the neckline, sleeves and hem borders.' },
  { name: 'Mehrbano Pearl Button Dobby Kurta', cat: DOBBY, fabric: 'Dobby', price: 3490, sale: null, colors: ['Sage', 'Beige', 'White'], sizes: ['XS', 'S', 'M', 'L', 'XL'], isNew: true, featured: true, collections: ['new-arrivals', 'best-sellers'], tags: ['embroidered', 'dobby', 'pearl buttons', 'kurta'], photos: [PHOTOS.green], short: 'Self-textured dobby kurta finished with hand-set pearl tassel buttons and embroidered sleeve panels.' },
  { name: 'Inara Embroidered Dobby Co-ord', cat: DOBBY, fabric: 'Dobby', price: 5490, sale: 4790, colors: ['Sage', 'Beige'], sizes: ['S', 'M', 'L', 'XL'], isNew: false, featured: true, collections: ['best-sellers', 'eid-edit'], tags: ['co-ord', 'embroidered', 'dobby', '2 piece'], photos: [PHOTOS.duo, PHOTOS.green], short: 'Matching kurta-and-trouser co-ord on textured dobby with mirror-accent embroidered borders.' },
  { name: 'Anaya Festive Embroidered Dobby', cat: DOBBY, fabric: 'Dobby', price: 6990, sale: null, colors: ['Gold', 'Rose', 'Ivory'], sizes: ['S', 'M', 'L', 'XL'], isNew: false, featured: true, collections: ['eid-edit', 'festive-formals'], tags: ['festive', 'embroidered', 'dobby'], short: 'Festive dobby suit with dense floral embroidery and a gota-finished daaman.' },
  { name: 'Mahjabeen Zari Dobby Suit', cat: DOBBY, fabric: 'Dobby', price: 7490, sale: null, colors: ['Emerald', 'Maroon', 'Navy'], sizes: ['S', 'M', 'L'], isNew: false, featured: false, collections: ['festive-formals', 'premium-heritage'], tags: ['zari', 'embroidered', 'dobby', 'formal'], short: 'Statement zari embroidery over deep-tone dobby — made for evening functions.' },
  { name: 'Gulbahar Chikankari Dobby Kurta', cat: DOBBY, fabric: 'Dobby', price: 4290, sale: null, colors: ['White', 'Blush', 'Ivory'], sizes: ['S', 'M', 'L', 'XL'], isNew: false, featured: true, collections: ['premium-heritage', 'best-sellers'], tags: ['chikankari', 'handwork', 'dobby'], short: 'Heirloom chikankari hand embroidery on breathable fine dobby — quiet luxury.' },
  { name: 'Roshanay Luxe Dobby Formal', cat: DOBBY, fabric: 'Dobby', price: 8490, sale: null, colors: ['Ivory', 'Blush', 'Gold'], sizes: ['S', 'M', 'L'], isNew: true, featured: true, collections: ['new-arrivals', 'festive-formals'], tags: ['formal', 'embroidered', 'dobby', 'wedding'], short: 'Our most embellished dobby formal — kora, dabka and sequin spray, set by hand.' },
  { name: 'Meher Mirror-work Dobby Suit', cat: DOBBY, fabric: 'Dobby', price: 5990, sale: 5190, colors: ['Teal', 'Gold', 'Rose'], sizes: ['S', 'M', 'L', 'XL'], isNew: false, featured: false, collections: ['eid-edit'], tags: ['mirror work', 'embroidered', 'dobby'], short: 'Hand-set mirror work that catches the light — on soft self-weave dobby.' },

  // ---- Digital Printed Khaddar (p9–p16)
  { name: 'Zarlish Digital Printed Khaddar Suit', cat: KHADDAR, fabric: 'Khaddar', price: 3290, sale: 2790, colors: ['Rust', 'Olive', 'Black', 'Beige'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], isNew: false, featured: true, collections: ['best-sellers', 'winter-edit'], tags: ['digital print', 'khaddar', '2 piece'], photos: [PHOTOS.rust], xxlSurcharge: 200, short: 'Signature digital print on soft-washed khaddar with printed border daaman and sleeves.' },
  { name: 'Farah Signature Print Khaddar', cat: KHADDAR, fabric: 'Khaddar', price: 2990, sale: null, colors: ['Mustard', 'Teal', 'Rose'], sizes: ['XS', 'S', 'M', 'L', 'XL'], isNew: false, featured: true, collections: ['signature-prints', 'best-sellers'], tags: ['digital print', 'khaddar', 'signature print'], short: 'The season’s signature print, digitally rendered edge-to-edge on premium khaddar.' },
  { name: 'Dilnaz Printed Khaddar 2-Piece', cat: KHADDAR, fabric: 'Khaddar', price: 2490, sale: null, colors: ['White', 'Blush', 'Teal'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], isNew: false, featured: false, collections: ['signature-prints'], tags: ['digital print', 'khaddar', 'casual'], xxlSurcharge: 200, short: 'Easy two-piece in soft pastels — a printed khaddar staple for every day.' },
  { name: 'Sehr Everyday Printed Khaddar', cat: KHADDAR, fabric: 'Khaddar', price: 2790, sale: null, colors: ['Beige', 'White', 'Grey', 'Navy'], sizes: ['S', 'M', 'L', 'XL'], isNew: false, featured: false, collections: [], tags: ['digital print', 'khaddar', 'everyday'], short: 'Understated geometric print on brushed khaddar — the working-day favourite.' },
  { name: 'Shabnam Floral Khaddar Suit', cat: KHADDAR, fabric: 'Khaddar', price: 3490, sale: null, colors: ['Black', 'Gold', 'Maroon'], sizes: ['S', 'M', 'L', 'XL'], isNew: true, featured: false, collections: ['new-arrivals', 'signature-prints'], tags: ['floral', 'digital print', 'khaddar'], short: 'Dark-ground florals in gold and maroon — a digital print with a formal mood.' },
  { name: 'Nooriya Winter Khaddar Suit', cat: KHADDAR, fabric: 'Khaddar', price: 3990, sale: 3390, colors: ['Maroon', 'Navy', 'Emerald'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], isNew: false, featured: true, collections: ['winter-edit', 'festive-formals'], tags: ['winter', 'digital print', 'khaddar'], xxlSurcharge: 200, short: 'Heavier winter-weight khaddar in jewel tones with a printed shawl-style dupatta.' },
  { name: 'Zaray Digital Print Khaddar Kurta', cat: KHADDAR, fabric: 'Khaddar', price: 2690, sale: null, colors: ['Olive', 'Rust', 'Brown'], sizes: ['S', 'M', 'L', 'XL'], isNew: false, featured: false, collections: ['winter-edit'], tags: ['kurta', 'digital print', 'khaddar'], short: 'Single kurta in earthy digital prints — pair it with anything.' },
  { name: 'Dua Printed Khaddar Co-ord', cat: KHADDAR, fabric: 'Khaddar', price: 4290, sale: null, colors: ['Blush', 'Sage', 'Mustard'], sizes: ['S', 'M', 'L', 'XL'], isNew: true, featured: false, collections: ['new-arrivals', 'signature-prints'], tags: ['co-ord', 'digital print', 'khaddar'], short: 'Printed co-ord set on featherweight khaddar — matched kurta and trouser.' },
]

function buildProducts() {
  return RAW_PRODUCTS.map((raw, i) => {
    const id = `p${i + 1}`
    const slug = slugify(raw.name)
    const skuBase = `ALN-${String(i + 1).padStart(3, '0')}`
    const poolImgs = pickImgs(W, i)
    const images = raw.photos ? [...raw.photos, ...poolImgs].slice(0, 4) : poolImgs
    const attributes = [
      { name: 'Color', values: cv(raw.colors) },
      { name: 'Size', values: sv(raw.sizes) },
    ]
    const variants = genVariants(skuBase, attributes, raw.price, raw.sale, images, {
      xxlSurcharge: raw.xxlSurcharge || 0,
      stockOffset: i * 5,
      colorImages: !!raw.photos,
    })
    const catLabel = raw.cat === DOBBY ? 'Embroidered Dobby' : 'Digital Printed Khaddar'
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
        `${raw.name} is part of our ${catLabel} line — cut, finished and quality-checked in our Islamabad atelier. ${raw.short}`,
        `The ${raw.fabric.toLowerCase()} fabric is sourced from certified Pakistani mills and pre-washed for softness and colour fastness. Every piece is inspected twice before it ships, and embroidery (where present) is secured with a backing layer so it stays pristine through wear and washing.`,
        `Styling note: pair it with khussa or a modern flat, and layer with our shawls in colder months. The silhouette is true to size — if you prefer a relaxed fit, we recommend going one size up.`,
      ].join('\n\n'),
      details: [
        `Fabric: ${raw.fabric}`,
        `Line: ${catLabel}`,
        raw.tags.includes('kurta') ? 'Includes: Kurta only' : 'Includes: Kurta and trouser (dupatta where pictured)',
        'Fit: True to size, tailored silhouette',
        'Care: Gentle machine wash inside-out; dry clean embellished pieces',
        'Made in Pakistan — Al Nain atelier, Islamabad',
      ],
      price: raw.price,
      salePrice: raw.sale,
      costPrice: Math.round(raw.price * 0.55),
      images,
      attributes,
      variants,
      lowStockThreshold: 5,
      allowBackorders: false,
      rating: [4.8, 4.7, 4.9, 4.5, 4.6, 4.8, 4.9, 4.4, 4.7, 4.6, 4.3, 4.2, 4.5, 4.7, 4.4, 4.6][i],
      reviewCount: [124, 96, 88, 57, 41, 112, 34, 65, 203, 148, 91, 77, 28, 134, 53, 22][i],
      isNew: raw.isNew,
      featured: raw.featured,
      status: 'published',
      seo: {
        metaTitle: `${raw.name} | Al Nain`,
        metaDescription: raw.short,
      },
      createdAt: daysAgo(raw.isNew ? 3 + i : 40 + i * 4),
      updatedAt: daysAgo(1),
    }
  })
}

// ---------------------------------------------------------------- categories
const CATEGORIES = [
  { id: 'c-dobby', slug: DOBBY, name: 'Embroidered Dobby', parentId: null, image: PHOTOS.duo, description: 'Hand-finished embroidery on textured dobby weave — kurtas, co-ords and festive suits.', status: 'active' },
  { id: 'c-khaddar', slug: KHADDAR, name: 'Digital Printed Khaddar', parentId: null, image: PHOTOS.rust, description: 'Signature digital prints on soft-washed khaddar — everyday ease to winter formals.', status: 'active' },
]

// ---------------------------------------------------------------- collections
const COLLECTIONS = [
  { id: 'col-new', slug: 'new-arrivals', name: 'New Arrivals', description: 'Fresh from the atelier — this week’s newest pieces.', image: PHOTOS.green, active: true, featured: true },
  { id: 'col-best', slug: 'best-sellers', name: 'Best Sellers', description: 'The pieces our customers keep coming back for.', image: PHOTOS.duo, active: true, featured: true },
  { id: 'col-eid', slug: 'eid-edit', name: 'The Eid Edit', description: 'Embroidered dobby, zari and mirror-work for the days of Eid.', image: PHOTOS.maroon, active: true, featured: true },
  { id: 'col-festive', slug: 'festive-formals', name: 'Festive Formals', description: 'Occasion-ready formals for the shaadi season and beyond.', image: B.bride, active: true, featured: false },
  { id: 'col-prints', slug: 'signature-prints', name: 'Signature Prints', description: 'Al Nain’s own digital prints on premium khaddar.', image: PHOTOS.rust, active: true, featured: true },
  { id: 'col-winter', slug: 'winter-edit', name: 'Winter Khaddar Edit', description: 'Heavier weaves and deep tones to keep the cold elegant.', image: B.fabric, active: true, featured: false },
  { id: 'col-premium', slug: 'premium-heritage', name: 'Premium Heritage', description: 'Limited heirloom pieces — chikankari and hand embroidery.', image: B.saree, active: true, featured: false },
]

// ---------------------------------------------------------------- users
const USERS = [
  {
    id: 'u-admin', role: 'admin', name: 'Store Admin', email: 'admin@alnain.pk', phone: '+92 300 0000001',
    password: 'admin123', status: 'active', createdAt: daysAgo(400), avatar: null, addresses: [], wishlist: [],
  },
  {
    id: 'u-sara', role: 'customer', name: 'Sara Khan', email: 'sara@example.com', phone: '+92 300 1112223',
    password: 'customer123', status: 'active', createdAt: daysAgo(210), avatar: 'https://i.pravatar.cc/100?img=47',
    addresses: [
      { id: 'a-s1', label: 'Home', name: 'Sara Khan', phone: '+92 300 1112223', country: 'Pakistan', city: 'Lahore', address: 'House 24, Street 9, DHA Phase 5', apartment: '', postalCode: '54000', isDefault: true },
      { id: 'a-s2', label: 'Office', name: 'Sara Khan', phone: '+92 300 1112223', country: 'Pakistan', city: 'Lahore', address: 'Suite 301, Liberty Tower, Gulberg III', apartment: '3rd Floor', postalCode: '54660', isDefault: false },
    ],
    wishlist: ['p1', 'p3', 'p7'],
  },
  { id: 'u-ahmed', role: 'customer', name: 'Ahmed Raza', email: 'ahmed@example.com', phone: '+92 321 4445556', password: 'customer123', status: 'active', createdAt: daysAgo(160), avatar: 'https://i.pravatar.cc/100?img=12', addresses: [{ id: 'a-a1', label: 'Home', name: 'Ahmed Raza', phone: '+92 321 4445556', country: 'Pakistan', city: 'Karachi', address: 'Flat 7B, Sea View Apartments, Clifton Block 2', apartment: '7B', postalCode: '75600', isDefault: true }], wishlist: ['p9', 'p14'] },
  { id: 'u-fatima', role: 'customer', name: 'Fatima Noor', email: 'fatima@example.com', phone: '+92 333 7778889', password: 'customer123', status: 'active', createdAt: daysAgo(120), avatar: 'https://i.pravatar.cc/100?img=31', addresses: [{ id: 'a-f1', label: 'Home', name: 'Fatima Noor', phone: '+92 333 7778889', country: 'Pakistan', city: 'Islamabad', address: 'House 12, Street 30, F-8/1', apartment: '', postalCode: '44000', isDefault: true }], wishlist: ['p7'] },
  { id: 'u-hina', role: 'customer', name: 'Hina Shah', email: 'hina@example.com', phone: '+92 345 2223334', password: 'customer123', status: 'active', createdAt: daysAgo(90), avatar: 'https://i.pravatar.cc/100?img=25', addresses: [{ id: 'a-h1', label: 'Home', name: 'Hina Shah', phone: '+92 345 2223334', country: 'Pakistan', city: 'Faisalabad', address: 'P-234, Peoples Colony No 1', apartment: '', postalCode: '38000', isDefault: true }], wishlist: [] },
  { id: 'u-bilal', role: 'customer', name: 'Bilal Ahmed', email: 'bilal@example.com', phone: '+92 301 9990001', password: 'customer123', status: 'active', createdAt: daysAgo(60), avatar: 'https://i.pravatar.cc/100?img=59', addresses: [{ id: 'a-b1', label: 'Home', name: 'Bilal Ahmed', phone: '+92 301 9990001', country: 'Pakistan', city: 'Multan', address: 'House 5, Gulgasht Colony', apartment: '', postalCode: '60000', isDefault: true }], wishlist: ['p16'] },
  { id: 'u-zoya', role: 'customer', name: 'Zoya Malik', email: 'zoya@example.com', phone: '+92 302 5556667', password: 'customer123', status: 'disabled', createdAt: daysAgo(300), avatar: null, addresses: [], wishlist: [] },
]

// ---------------------------------------------------------------- orders
function buildOrders(products, settings) {
  const seq = { n: 1000 }
  const findUser = (id) => USERS.find((u) => u.id === id)

  const mk = (dAgo, userId, itemSpecs, status, paymentStatus, opts = {}) => {
    const user = findUser(userId)
    const items = itemSpecs.map(([pIdx, qty, vIdx]) => {
      const p = products[pIdx]
      const v = p.variants.filter((x) => x.stock > 0)[vIdx || 0] || p.variants[0]
      const unit = v.salePrice ?? v.price
      return {
        productId: p.id, variantId: v.id, name: p.name, slug: p.slug, sku: v.sku,
        image: v.image || p.images[0], options: v.options, price: unit, qty,
        total: unit * qty,
        category: p.category,
      }
    })
    const subtotal = items.reduce((s, it) => s + it.total, 0)
    const discount = opts.coupon ? Math.round(subtotal * 0.1) : 0
    const method = opts.express ? 'express' : 'standard'
    const methodDef = settings.shipping.methods.find((m) => m.id === method)
    const shipping = method === 'standard' && subtotal - discount >= settings.shipping.freeShippingThreshold ? 0 : methodDef.fee
    const tax = settings.tax.enabled ? Math.round((subtotal - discount) * (settings.tax.rate / 100)) : 0
    const total = subtotal - discount + shipping + tax
    seq.n += 1
    const address = user?.addresses?.[0] || {
      name: 'Guest Customer', phone: '+92 300 7654321', country: 'Pakistan', city: 'Lahore',
      address: 'House 1, Model Town', apartment: '', postalCode: '54000',
    }
    const statusTrail = {
      pending: ['Order placed'],
      confirmed: ['Order placed', 'Order confirmed'],
      processing: ['Order placed', 'Order confirmed', 'Being stitched & packed'],
      shipped: ['Order placed', 'Order confirmed', 'Being stitched & packed', 'Handed to courier'],
      delivered: ['Order placed', 'Order confirmed', 'Being stitched & packed', 'Handed to courier', 'Delivered'],
      cancelled: ['Order placed', 'Order cancelled'],
      returned: ['Order placed', 'Order confirmed', 'Being stitched & packed', 'Handed to courier', 'Delivered', 'Return processed'],
    }[status]
    return {
      id: `o-${seq.n}`,
      number: `ALN-${seq.n}`,
      customerId: user?.id || null,
      customerName: user?.name || 'Guest Customer',
      email: user?.email || 'guest@example.com',
      phone: user?.phone || '+92 300 7654321',
      items, subtotal, discount, couponCode: opts.coupon || null,
      shippingMethod: method, shipping, tax, total,
      paymentMethod: 'cod', paymentStatus,
      status,
      shippingAddress: address,
      trackingNumber: ['shipped', 'delivered', 'returned'].includes(status) ? `TCS-${784000 + seq.n}` : null,
      notes: opts.note ? [{ id: `n-${seq.n}`, text: opts.note, at: daysAgo(dAgo), by: 'Store Admin' }] : [],
      timeline: statusTrail.map((label, i) => ({ label, at: daysAgo(Math.max(dAgo - i, 0)) })),
      createdAt: daysAgo(dAgo),
      estimatedDelivery: daysAhead(status === 'delivered' ? -Math.max(dAgo - 4, 0) : 4),
    }
  }

  return [
    mk(1, 'u-sara', [[0, 1], [8, 2]], 'pending', 'pending'),
    mk(2, 'u-ahmed', [[13, 1, 1]], 'confirmed', 'pending'),
    mk(3, 'u-fatima', [[6, 1]], 'processing', 'pending', { note: 'Customer requested extra sleeve length.' }),
    mk(4, 'u-hina', [[1, 2], [10, 1]], 'processing', 'pending'),
    mk(6, 'u-sara', [[3, 1]], 'shipped', 'pending'),
    mk(8, 'u-bilal', [[15, 1], [11, 1]], 'shipped', 'pending'),
    mk(11, 'u-sara', [[4, 1]], 'delivered', 'paid', { express: true }),
    mk(14, 'u-ahmed', [[2, 1], [9, 1]], 'delivered', 'paid', { coupon: 'EID10' }),
    mk(18, 'u-fatima', [[12, 1]], 'delivered', 'paid'),
    mk(22, 'u-hina', [[9, 2]], 'delivered', 'paid'),
    mk(26, 'u-bilal', [[7, 1]], 'cancelled', 'pending', { note: 'Cancelled on customer request — size unavailable.' }),
    mk(30, 'u-sara', [[5, 1]], 'delivered', 'paid'),
    mk(34, 'u-ahmed', [[14, 1]], 'returned', 'refunded', { note: 'Colour difference claimed; refund issued.' }),
    mk(38, null, [[13, 1]], 'delivered', 'paid'),
  ]
}

// ---------------------------------------------------------------- reviews
const REVIEW_SEED = [
  ['p1', 'Mahnoor A.', 5, 'Absolutely stunning', 'The embroidery is even better in person. Wore it on Eid and got endless compliments. True to size.', 4, 'approved'],
  ['p1', 'Rabia S.', 4, 'Beautiful but delicate', 'Gorgeous suit — just handle the embroidered borders with care, the work is fine and detailed.', 12, 'approved'],
  ['p2', 'Amna T.', 5, 'The pearl buttons!', 'The tassel buttons are such a beautiful detail. Dobby fabric feels premium, fits perfectly.', 8, 'approved'],
  ['p3', 'Khadija R.', 5, 'Bought both colours', 'My sister and I got the sage and beige — the co-ord fits beautifully and the embroidery is neat.', 20, 'approved'],
  ['p6', 'Farhat U.', 5, 'Heirloom quality', 'Real chikankari, not machine imitation. My mother approved — highest possible praise.', 18, 'approved'],
  ['p7', 'Zainab W.', 5, 'Bridal-worthy', 'Wore it at my nikkah. Featherlight and the dabka work is couture level.', 25, 'approved'],
  ['p7', 'Maryam J.', 4, 'Elegant', 'Beautiful piece. Delivery took a day longer than promised, hence 4 stars.', 40, 'approved'],
  ['p8', 'Hira B.', 5, 'Mirror work catches every light', 'Slightly snug on the arms, size up if in doubt — but absolutely worth it.', 6, 'approved'],
  ['p9', 'Nida K.', 4, 'Great daily wear', 'Soft khaddar, generous fit. The rust print is beautiful in daylight.', 15, 'approved'],
  ['p9', 'Sana M.', 5, 'Third one I bought', 'This is my third Zarlish suit. Says everything.', 30, 'approved'],
  ['p10', 'Ayesha L.', 4, 'Lovely print', 'The signature print looks exactly like the photos. Fabric is soft after first wash.', 10, 'approved'],
  ['p11', 'Bushra Z.', 4, 'Everyday favourite', 'Light, easy, and the pastel print goes with everything.', 9, 'approved'],
  ['p13', 'Neha P.', 5, 'Print quality is superb', 'Dark florals look richer in person. No fading after wash.', 2, 'pending'],
  ['p14', 'Kiran D.', 5, 'Perfect for winter', 'Warmer than expected and the maroon is regal. Dupatta print is gorgeous.', 5, 'approved'],
  ['p14', 'Adeela N.', 4, 'Good buy on sale', 'Great value at the sale price. True to size.', 28, 'approved'],
  ['p15', 'Rimsha G.', 4, 'Nice kurta', 'Earthy colours as pictured. Would love matching trousers as an option.', 11, 'approved'],
  ['p16', 'Laiba H.', 5, 'Co-ord goals', 'The blush set is so pretty — got compliments at uni all day.', 3, 'pending'],
  ['p4', 'Saba Q.', 3, 'Shade slightly different', 'Pretty suit but the gold is a shade deeper than the website photo.', 3, 'pending'],
  ['p5', 'Anonymous', 1, 'Spam review text', 'Visit my page for cheap replicas!!!', 7, 'rejected'],
]

function buildReviews() {
  return REVIEW_SEED.map(([productId, customerName, rating, title, text, dAgo, status], i) => ({
    id: `r-${i + 1}`, productId, customerName, rating, title, text,
    status, createdAt: daysAgo(dAgo),
  }))
}

// ---------------------------------------------------------------- coupons
const COUPONS = [
  { id: 'cp-1', code: 'EID10', type: 'percentage', value: 10, minOrder: 3000, maxDiscount: 1000, startsAt: daysAgo(20), expiresAt: daysAhead(30), usageLimit: 500, usedCount: 42, perCustomerLimit: 2, products: [], categories: [], active: true },
  { id: 'cp-2', code: 'WELCOME500', type: 'fixed', value: 500, minOrder: 2500, maxDiscount: null, startsAt: daysAgo(90), expiresAt: daysAhead(180), usageLimit: 1000, usedCount: 218, perCustomerLimit: 1, products: [], categories: [], active: true },
  { id: 'cp-3', code: 'DOBBY15', type: 'percentage', value: 15, minOrder: 6000, maxDiscount: 2000, startsAt: daysAgo(10), expiresAt: daysAhead(60), usageLimit: 200, usedCount: 12, perCustomerLimit: 1, products: [], categories: [DOBBY], active: true },
  { id: 'cp-4', code: 'SUMMER20', type: 'percentage', value: 20, minOrder: 0, maxDiscount: 1500, startsAt: daysAgo(120), expiresAt: daysAgo(5), usageLimit: 300, usedCount: 300, perCustomerLimit: 1, products: [], categories: [], active: false },
]

// ---------------------------------------------------------------- banners
const BANNERS = [
  { id: 'bn-1', placement: 'hero', heading: 'Heritage in Every Thread', description: 'Embroidered dobby and digital printed khaddar — crafted in Islamabad, delivered nationwide with cash on delivery.', buttonText: 'Shop Now', buttonUrl: '/shop', secondaryText: 'Explore Collection', secondaryUrl: '/collections', image: PHOTOS.heroBanner, align: 'right', position: 1, startsAt: null, endsAt: null, active: true },
  { id: 'bn-2', placement: 'hero', heading: 'The Eid Edit', description: 'Zari, tilla and mirror work — set by hand for the days that matter.', buttonText: 'Shop The Edit', buttonUrl: '/collections/eid-edit', secondaryText: 'Shop All', secondaryUrl: '/shop', image: PHOTOS.maroon, align: 'left', position: 2, startsAt: null, endsAt: null, active: false },
  { id: 'bn-3', placement: 'promo', heading: 'The Embroidered Dobby Edit', description: 'Hand-embroidered maroon and gold on textured dobby weave — pieces made for the season’s evenings.', buttonText: 'Shop Embroidered Dobby', buttonUrl: `/shop/${DOBBY}`, secondaryText: '', secondaryUrl: '', image: PHOTOS.maroon, position: 1, startsAt: null, endsAt: null, active: true },
]

// ---------------------------------------------------------------- social links
const SOCIAL_LINKS = [
  { id: 'sl-1', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/alnain.pk', active: true, order: 1 },
  { id: 'sl-2', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/alnain.pk', active: true, order: 2 },
  { id: 'sl-3', platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@alnain.pk', active: true, order: 3 },
  { id: 'sl-4', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@alnain', active: true, order: 4 },
  { id: 'sl-5', platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/923001234567', active: true, order: 5 },
  { id: 'sl-6', platform: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com/alnain', active: false, order: 6 },
  { id: 'sl-7', platform: 'twitter', label: 'X / Twitter', url: 'https://x.com/alnain', active: false, order: 7 },
]

// ---------------------------------------------------------------- testimonials
const TESTIMONIALS = [
  { id: 't-1', name: 'Mahnoor Ali', city: 'Lahore', rating: 5, text: 'Al Nain has become my go-to for every Eid and shaadi. The embroidery quality rivals designer houses at twice the price.', avatar: 'https://i.pravatar.cc/100?img=44' },
  { id: 't-2', name: 'Ayesha Raza', city: 'Islamabad', rating: 5, text: 'The khaddar prints are unmatched. Colours stay fresh wash after wash, and delivery is always on time.', avatar: 'https://i.pravatar.cc/100?img=32' },
  { id: 't-3', name: 'Kiran Fatima', city: 'Karachi', rating: 5, text: 'Ordered two dobby co-ords with cash on delivery — the fit was perfect and the pearl-button detailing is beautiful.', avatar: 'https://i.pravatar.cc/100?img=25' },
  { id: 't-4', name: 'Hassan Javed', city: 'Multan', rating: 4, text: 'Ordered for my wife and sister — premium fabric, honest sizing, and COD nationwide. Exactly how online shopping should work in Pakistan.', avatar: 'https://i.pravatar.cc/100?img=68' },
]

// ---------------------------------------------------------------- messages (contact form submissions)
const MESSAGES = [
  { id: 'msg-1', name: 'Mahira Aslam', email: 'mahira@example.com', message: 'Do you offer custom stitching for the Roshanay dobby formal? I need a slightly longer kameez length for a December barat.', status: 'new', createdAt: daysAgo(1) },
  { id: 'msg-2', name: 'Usman Tariq', email: 'usman@example.com', message: 'My order arrived a day early — the quality is fantastic. Do you offer gift packaging for Eid orders?', status: 'read', createdAt: daysAgo(4) },
]

// ---------------------------------------------------------------- settings
function buildSettings() {
  return {
    general: {
      storeName: 'Al Nain',
      tagline: 'Heritage in Every Thread',
      email: 'info@alnain.pk',
      phone: '+92 300 1234567',
      address: 'F-7 Markaz, Islamabad, Pakistan',
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
    tax: { enabled: true, rate: 5, label: 'GST' },
    payments: [
      { id: 'cod', label: 'Cash on Delivery', description: 'Pay with cash when your order arrives at your doorstep.', enabled: true },
      { id: 'card', label: 'Credit / Debit Card', description: 'Visa and Mastercard. (Gateway integration pending — enable when connected.)', enabled: false },
      { id: 'bank', label: 'Bank Transfer', description: 'Direct transfer — order ships once payment is confirmed.', enabled: false, details: 'Meezan Bank · PK36 MEZN 0002 3401 0524 1601 · Al Nain' },
      { id: 'wallet', label: 'JazzCash / Easypaisa', description: 'Mobile wallet payment on 0300-1234567.', enabled: false },
    ],
    seo: {
      siteTitle: 'Al Nain — Premium Traditional Wear',
      metaDescription: 'Embroidered dobby and digital printed khaddar suits. Cash on delivery across Pakistan.',
      gtmId: '',
      googleAnalyticsId: '',
      facebookPixelId: '',
    },
  }
}

// ---------------------------------------------------------------- build all
export function buildSeed() {
  const settings = buildSettings()
  const products = buildProducts()
  const orders = buildOrders(products, settings)
  return {
    version: 4,
    seededAt: new Date().toISOString(),
    settings,
    products,
    categories: CATEGORIES,
    collections: COLLECTIONS.map((c) => ({
      ...c,
      productIds: products.filter((p) => p.collections.includes(c.slug)).map((p) => p.id),
    })),
    users: USERS,
    orders,
    reviews: buildReviews(),
    coupons: COUPONS,
    banners: BANNERS,
    socialLinks: SOCIAL_LINKS,
    testimonials: TESTIMONIALS,
    messages: MESSAGES,
    newsletter: [],
    meta: { orderSeq: 1014 + 1 },
  }
}
