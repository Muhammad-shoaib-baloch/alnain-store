import { Link } from 'react-router-dom'
import { Banknote, CalendarClock, ShoppingCart, Clock, Users, Package, AlertTriangle, ArrowRight } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import StatCard from '@/components/admin/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import SmartImage from '@/components/ui/SmartImage'
import { AreaChart, BarsChart, DonutChart, BarList } from '@/components/admin/Charts'
import { useSettings } from '@/context/SettingsContext'
import { usePageTitle } from '@/hooks'
import { formatDate, formatNumber, formatPrice } from '@/lib/format'
import { getDashboardStats, getSalesSeries, getTopProducts, getCategoryPerformance, listOrders } from '@/services/orders'
import { listInventory } from '@/services/catalog'

export default function AdminDashboard() {
  usePageTitle('Admin · Dashboard')
  const { dbVersion } = useSettings()
  void dbVersion

  const stats = getDashboardStats()
  const sales = getSalesSeries(30)
  const top = getTopProducts(5)
  const catPerf = getCategoryPerformance()
  const recent = listOrders({ perPage: 6 }).items
  const lowStock = listInventory().filter((r) => r.status !== 'in-stock').slice(0, 6)
  const maxTop = Math.max(...top.map((t) => t.revenue), 1)

  return (
    <div>
      <PageHeader title="Dashboard" sub="Store performance at a glance — last 30 days." />

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Banknote} label="Total Sales" value={formatPrice(stats.totalSales)} tone="gold" />
        <StatCard icon={CalendarClock} label="Today's Sales" value={formatPrice(stats.todaySales)} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.totalOrders} />
        <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders} />
        <StatCard icon={Users} label="Customers" value={stats.totalCustomers} />
        <StatCard icon={Package} label="Products" value={stats.totalProducts} sub={`${stats.lowStockVariants} low-stock variants`} />
      </div>

      {/* charts row 1 */}
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Sales Overview</h2>
            <span className="text-xs text-smoke">Revenue · last 30 days</span>
          </div>
          <AreaChart data={sales} formatValue={(v) => `Rs. ${formatNumber(v)}`} />
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Orders</h2>
            <span className="text-xs text-smoke">per day</span>
          </div>
          <BarsChart data={sales.map((d) => ({ label: d.label, value: d.orders }))} height={230} formatValue={(v) => `${v} orders`} />
        </div>
      </div>

      {/* charts row 2 */}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-5 font-display text-lg">Top Products</h2>
          <BarList
            items={top.map((t) => ({
              label: t.product.name,
              sub: `${t.qty} sold`,
              value: t.revenue,
              pct: Math.round((t.revenue / maxTop) * 100),
            }))}
            formatValue={(v) => formatPrice(v)}
          />
        </div>
        <div className="card p-5">
          <h2 className="mb-5 font-display text-lg">Category Performance</h2>
          <DonutChart data={catPerf} formatValue={(v) => formatPrice(v)} />
        </div>
      </div>

      {/* tables */}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* recent orders */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-lg">Recent Orders</h2>
            <Link to="/admin/orders" className="link-underline flex items-center gap-1 text-xs font-semibold text-gold-700">
              All Orders <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/admin/orders/${o.id}`} className="font-semibold text-gold-700 hover:underline">{o.number}</Link>
                      <p className="text-[11px] text-smoke">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="text-smoke">{o.customerName}</td>
                    <td className="font-medium">{formatPrice(o.total)}</td>
                    <td><StatusBadge value={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* low stock */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <AlertTriangle size={17} className="text-amber-500" /> Low Stock
            </h2>
            <Link to="/admin/inventory" className="link-underline flex items-center gap-1 text-xs font-semibold text-gold-700">
              Inventory <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Product</th><th>Variation</th><th>Stock</th><th>Status</th></tr>
              </thead>
              <tbody>
                {lowStock.map((row) => (
                  <tr key={row.variant.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <SmartImage src={row.variant.image || row.product.images[0]} alt={row.product.name} className="h-10 w-8 shrink-0 object-cover" />
                        <span className="max-w-[160px] truncate text-xs font-medium">{row.product.name}</span>
                      </div>
                    </td>
                    <td className="text-xs text-smoke">{Object.values(row.variant.options).join(' / ')}</td>
                    <td className="font-semibold">{row.variant.stock}</td>
                    <td><StatusBadge value={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
