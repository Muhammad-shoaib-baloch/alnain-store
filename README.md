# Al Nain (النين) — Traditional Suit E-Commerce Store

A complete, production-style traditional fashion e-commerce frontend built with **React + Vite + Tailwind CSS**.
Storefront, customer account area and full admin dashboard — powered by a mock data layer (localStorage) that is
structured to be swapped for a real REST/Laravel/Node API without touching the UI.

Brand imagery lives in `public/images/` (logo, hero banner and campaign photos) — replace files there to update
visuals without code changes.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Demo accounts

| Role     | Email             | Password    |
| -------- | ----------------- | ----------- |
| Admin    | admin@alnain.pk   | admin123    |
| Customer | sara@example.com  | customer123 |

(One-click demo login buttons are on the `/login` page.)

## What's inside

- **Storefront** — compact 6-section home (hero, two categories, new arrivals, campaign, testimonials, newsletter), shop with advanced
  URL-synced filters (category, price range, size, color, fabric, collection, availability, rating, discount, sort,
  search, grid/list, pagination), product detail with variations (color/size/fabric → price/SKU/stock/image update),
  quick view, size guide, reviews, related + recently viewed, cart with coupons, checkout (COD default, PKR),
  order confirmation, info pages, global search overlay.
- **Customer account** — dashboard, orders with status tracker + cancel, profile + avatar + password, addresses CRUD
  with default, wishlist (persists per user, merges guest list on login), settings.
- **Admin** (`/admin`, admin role required) — dashboard with SVG charts (sales, orders, top products, category
  performance), products CRUD with multi-image upload + variation builder (auto-generated combinations, per-variant
  SKU/price/stock/image/status), categories (nested), collections, orders management (status/payment/tracking/notes/
  refund/cancel with restock), **messages** (contact-form submissions with new/read states), customers, coupons
  (percentage/fixed, scoping, limits, dates), reviews moderation, inventory with inline stock editing, homepage
  banners, **social links** (rendered dynamically in the footer — nothing hardcoded), and store settings (general,
  currency, shipping, tax, payment methods, SEO + **Google Tag Manager**, demo-data reset).

## Google Tag Manager

Set your container ID in **Admin → Settings → SEO** (create one free at tagmanager.google.com). The app injects the
GTM script automatically and pushes `page_view`, `add_to_cart` and `purchase` events to the dataLayer — manage GA4,
Meta Pixel and other tags from the GTM dashboard without code changes.

## Swapping in a real backend

All data access goes through `src/services/*` (catalog, orders, auth, coupons, reviews, marketing, settings).
Replace those functions with HTTP calls (they are the only code that touches `src/lib/db.js`); pages already consume
them through `useMockFetch`, which mirrors async loading with skeleton states.

`src/data/seed.js` documents every entity shape (Product, ProductVariant, Category, Collection, Order, Review, Coupon,
Banner, SocialLink, StoreSettings, User/Address).

## Notes

- Currency: **PKR (Rs.)**, configurable in Admin → Settings → Currency.
- Payments: **Cash on Delivery** enabled by default; card/bank/wallet exist as configurable methods.
- Store name/email/etc. are configurable in Admin → Settings → General (store email: info@alnain.pk).
- Product imagery mixes Al Nain campaign photos (`public/images/`) with stock placeholders; every image has an
  elegant branded fallback if it fails to load.
