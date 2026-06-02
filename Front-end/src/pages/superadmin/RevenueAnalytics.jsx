// RevenueAnalytics.jsx — SuperAdmin: deep revenue + financial analytics
import { TrendingUp, DollarSign, Percent, ShoppingCart, ArrowUp } from "lucide-react";

const revenueData = {
  summary: {
    totalGross:      601000,
    totalCommission: 90150,
    totalPayouts:    510850,
    avgOrderValue:   9540,
    topMonth:        "March 2026",
    growth:          "+33.6%",
  },
  monthly: [
    { month: "Oct 2025", gross: 48000,  commission: 7200,  orders: 8  },
    { month: "Nov 2025", gross: 72000,  commission: 10800, orders: 12 },
    { month: "Dec 2025", gross: 135000, commission: 20250, orders: 17 },
    { month: "Jan 2026", gross: 89000,  commission: 13350, orders: 13 },
    { month: "Feb 2026", gross: 110000, commission: 16500, orders: 15 },
    { month: "Mar 2026", gross: 147000, commission: 22050, orders: 21 },
  ],
  byCategory: [
    { category: "Photography", gross: 68000, commission: 10200, orders: 2 },
    { category: "Videography", gross: 40000, commission: 6000,  orders: 1 },
    { category: "Catering",    gross: 65000, commission: 9750,  orders: 1 },
    { category: "Decoration",  gross: 50000, commission: 7500,  orders: 1 },
    { category: "Music & DJ",  gross: 18000, commission: 2700,  orders: 1 },
  ],
};

function lkr(n) { return `LKR ${Number(n).toLocaleString()}`; }

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function RevenueAnalytics() {
  const { summary, monthly, byCategory } = revenueData;
  const maxGross = Math.max(...monthly.map(m => m.gross));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Revenue Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform financial breakdown · All figures in LKR</p>
      </div>

      {/* Growth banner */}
      <div className="bg-gray-900 rounded-2xl p-5 flex items-center gap-4 text-white">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-secondary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/60">Month-over-Month Growth</p>
          <p className="text-3xl font-bold">{summary.growth}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50">Best Month</p>
          <p className="text-base font-semibold">{summary.topMonth}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}   label="Total Gross Revenue"  value={lkr(summary.totalGross)}      sub="All-time platform bookings" color="bg-primary-50 text-primary" />
        <StatCard icon={Percent}      label="Commission Earned"    value={lkr(summary.totalCommission)} sub="15% of gross revenue"       color="bg-secondary-50 text-secondary" />
        <StatCard icon={ArrowUp}      label="Total Payouts"        value={lkr(summary.totalPayouts)}    sub="Net paid to vendors"        color="bg-accent-50 text-accent" />
        <StatCard icon={ShoppingCart} label="Avg Order Value"      value={lkr(summary.avgOrderValue)}   sub="Per completed booking"      color="bg-purple-50 text-purple-600" />
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-5">Monthly Revenue Breakdown</h3>
        <div className="space-y-4">
          {monthly.map(m => {
            const grossPct   = Math.round((m.gross / maxGross) * 100);
            const commPct    = Math.round((m.commission / maxGross) * 100);
            return (
              <div key={m.month}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium w-24 flex-shrink-0">{m.month}</span>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{m.orders} orders</span>
                    <span className="text-accent font-medium">{lkr(m.commission)} commission</span>
                    <span className="font-semibold text-gray-700">{lkr(m.gross)}</span>
                  </div>
                </div>
                <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary/20 rounded-full"
                    style={{ width: `${grossPct}%` }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full bg-accent rounded-full"
                    style={{ width: `${commPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary/20 inline-block" /> Gross Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent inline-block" /> Commission Earned</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Revenue by Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-3">Category</th>
                <th className="text-right pb-3">Orders</th>
                <th className="text-right pb-3">Gross Revenue</th>
                <th className="text-right pb-3">Commission (15%)</th>
                <th className="text-right pb-3">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {byCategory.map(c => (
                <tr key={c.category} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-gray-700">{c.category}</td>
                  <td className="py-3 text-right text-gray-500">{c.orders}</td>
                  <td className="py-3 text-right font-medium text-gray-800">{lkr(c.gross)}</td>
                  <td className="py-3 text-right text-accent font-medium">{lkr(c.commission)}</td>
                  <td className="py-3 text-right text-gray-600">{lkr(c.gross - c.commission)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <tr>
                <td className="pt-3 font-bold text-gray-800">Total</td>
                <td className="pt-3 text-right font-bold text-gray-800">
                  {byCategory.reduce((s, c) => s + c.orders, 0)}
                </td>
                <td className="pt-3 text-right font-bold text-gray-800">
                  {lkr(byCategory.reduce((s, c) => s + c.gross, 0))}
                </td>
                <td className="pt-3 text-right font-bold text-accent">
                  {lkr(byCategory.reduce((s, c) => s + c.commission, 0))}
                </td>
                <td className="pt-3 text-right font-bold text-gray-700">
                  {lkr(byCategory.reduce((s, c) => s + c.gross - c.commission, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
