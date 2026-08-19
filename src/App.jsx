import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import ScrollToTop from '@/components/routing/ScrollToTop'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import StorefrontLayout from '@/layouts/StorefrontLayout'
import { useSettings } from '@/context/SettingsContext'
import { initGTM, trackPageView } from '@/lib/gtm'

// storefront
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import ProductDetail from '@/pages/ProductDetail'
import Collections from '@/pages/Collections'
import CollectionDetail from '@/pages/CollectionDetail'
import SearchResults from '@/pages/SearchResults'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'
import InfoPage from '@/pages/InfoPage'
import NotFound from '@/pages/NotFound'

// auth
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// customer account
import AccountLayout from '@/pages/account/AccountLayout'
import AccountDashboard from '@/pages/account/Dashboard'
import AccountOrders from '@/pages/account/Orders'
import AccountOrderDetail from '@/pages/account/OrderDetail'
import AccountProfile from '@/pages/account/Profile'
import AccountAddresses from '@/pages/account/Addresses'
import AccountWishlist from '@/pages/account/Wishlist'
import AccountSettings from '@/pages/account/Settings'

// admin
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminProducts from '@/pages/admin/Products'
import AdminProductEdit from '@/pages/admin/ProductEdit'
import AdminCategories from '@/pages/admin/Categories'
import AdminCollections from '@/pages/admin/Collections'
import AdminOrders from '@/pages/admin/Orders'
import AdminOrderDetail from '@/pages/admin/OrderDetail'
import AdminMessages from '@/pages/admin/Messages'
import AdminCustomers from '@/pages/admin/Customers'
import AdminCoupons from '@/pages/admin/Coupons'
import AdminReviews from '@/pages/admin/Reviews'
import AdminInventory from '@/pages/admin/Inventory'
import AdminBanners from '@/pages/admin/Banners'
import AdminSocialLinks from '@/pages/admin/SocialLinks'
import AdminSettings from '@/pages/admin/Settings'

const INFO_PATHS = ['about', 'contact', 'faq', 'shipping', 'returns', 'privacy-policy', 'terms', 'refund-policy']

/** Injects GTM (container ID from store settings) and pushes SPA page views. */
function AnalyticsBridge() {
  const { settings } = useSettings()
  const location = useLocation()
  const gtmId = settings?.seo?.gtmId

  useEffect(() => {
    initGTM(gtmId)
  }, [gtmId])

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title)
  }, [location])

  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AnalyticsBridge />
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:slug" element={<CollectionDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:number" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {INFO_PATHS.map((slug) => (
            <Route key={slug} path={`/${slug}`} element={<InfoPage />} />
          ))}

          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<AccountDashboard />} />
              <Route path="orders" element={<AccountOrders />} />
              <Route path="orders/:id" element={<AccountOrderDetail />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="addresses" element={<AccountAddresses />} />
              <Route path="wishlist" element={<AccountWishlist />} />
              <Route path="settings" element={<AccountSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductEdit />} />
            <Route path="products/:id/edit" element={<AdminProductEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="social-links" element={<AdminSocialLinks />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
