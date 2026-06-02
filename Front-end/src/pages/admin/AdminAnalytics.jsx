// AdminAnalytics.jsx — real platform analytics from /api/admin/analytics
import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, TrendingUp, ShoppingCart, Users,
  DollarSign, Percent, Package, Star,
  Loader2, AlertCircle, RefreshCw, Printer,
} from "lucide-react";
import { adminApi }    from "../../services/adminApi";
import { printReport } from "../../utils/exportUtils";

const CATEGORY_COLORS = ["#263E8B", "#2CA36B", "#E3A437", "#8b5cf6", "#ef4444"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, iconBg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.getAnalytics()
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => setError("Failed to load analytics. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  // ── Error state ──
  if (error || !analytics) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm text-gray-500">{error || "No data available."}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, monthlyRevenue, categoryBreakdown, topVendors } = analytics;
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  // ── PDF export ──
  function handleExportPDF() {
    const date = new Date().toLocaleDateString("en-LK", { day: "2-digit", month: "long", year: "numeric" });
    printReport({
      title:    "Platform Analytics Report",
      subtitle: `Generated ${date}`,
      meta: [
        { label: "Total Revenue",      value: `LKR ${summary.totalRevenue.toLocaleString()}`    },
        { label: "Total Orders",        value: summary.totalOrders                               },
        { label: "Commission Earned",   value: `LKR ${summary.commissionEarned.toLocaleString()}` },
        { label: "Avg Order Value",     value: `LKR ${summary.avgOrderValue.toLocaleString()}`   },
        { label: "Repeat Buyers",       value: summary.repeatBuyers                              },
        { label: "Completion Rate",     value: `${summary.conversionRate}%`                      },
      ],
      headers: ["Rank", "Vendor", "Revenue (LKR)", "Orders", "Rating"],
      rows:    topVendors.map(v => [v.rank, v.name, v.revenue.toLocaleString(), v.orders, v.rating]),
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Platform-wide performance overview</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:border-primary hover:text-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            <Printer className="w-4 h-4" />
            PDF Report
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}  label="Total Revenue"
          value={`LKR ${summary.totalRevenue.toLocaleString()}`}
          sub="All time gross (completed)"
          iconBg="bg-primary-50 text-primary"
        />
        <StatCard
          icon={ShoppingCart} label="Total Orders"
          value={summary.totalOrders}
          sub="Platform bookings"
          iconBg="bg-accent-50 text-accent"
        />
        <StatCard
          icon={TrendingUp}  label="Commission Earned"
          value={`LKR ${summary.commissionEarned.toLocaleString()}`}
          sub="15% platform fee"
          iconBg="bg-secondary-50 text-secondary"
        />
        <StatCard
          icon={Package}     label="Avg Order Value"
          value={`LKR ${summary.avgOrderValue.toLocaleString()}`}
          sub="Per completed booking"
          iconBg="bg-purple-50 text-purple-500"
        />
        <StatCard
          icon={Users}       label="Repeat Buyers"
          value={summary.repeatBuyers}
          sub="Ordered 2+ times"
          iconBg="bg-blue-50 text-blue-500"
        />
        <StatCard
          icon={Percent}     label="Completion Rate"
          value={`${summary.conversionRate}%`}
          sub="Bookings completed"
          iconBg="bg-pink-50 text-pink-500"
        />
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Monthly Revenue (Last 12 Months)
        </h2>
        {monthlyRevenue.every(m => m.revenue === 0) ? (
          <p className="text-sm text-gray-400 text-center py-8">No completed orders yet — revenue will appear here.</p>
        ) : (
          <div className="space-y-3">
            {monthlyRevenue.map(row => {
              const widthPct = Math.round((row.revenue / maxRevenue) * 100);
              return (
                <div key={row.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-28 text-right flex-shrink-0">
                    {row.revenue > 0 ? `LKR ${row.revenue.toLocaleString()}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Category Breakdown
        </h2>
        {categoryBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No completed orders to break down yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-2.5 rounded-l-xl font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Orders</th>
                  <th className="px-4 py-2.5 font-medium">Revenue (LKR)</th>
                  <th className="px-4 py-2.5 rounded-r-xl font-medium">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categoryBreakdown.map((row, i) => (
                  <tr key={row.category} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.category}</td>
                    <td className="px-4 py-3 text-gray-600">{row.orders}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{row.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width:           `${row.pct}%`,
                              backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{row.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Vendors */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-secondary fill-secondary" />
          Top Vendors by Revenue
        </h2>
        {topVendors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No vendor data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-2.5 rounded-l-xl font-medium">Rank</th>
                  <th className="px-4 py-2.5 font-medium">Vendor</th>
                  <th className="px-4 py-2.5 font-medium">Revenue (LKR)</th>
                  <th className="px-4 py-2.5 font-medium">Orders</th>
                  <th className="px-4 py-2.5 rounded-r-xl font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topVendors.map(v => (
                  <tr key={v.rank} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        v.rank === 1 ? "bg-secondary text-white"       :
                        v.rank === 2 ? "bg-gray-200 text-gray-700"     :
                        v.rank === 3 ? "bg-orange-100 text-orange-600" :
                                       "bg-gray-100 text-gray-500"
                      }`}>
                        {v.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{v.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{v.orders}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-700">
                        <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                        {v.rating > 0 ? v.rating : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
