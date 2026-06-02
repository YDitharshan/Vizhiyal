// Earnings.jsx — connected to real payout + booking API
import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, ShoppingCart, Star,
  ArrowUpRight, ArrowDownRight, Banknote, CheckCircle, Loader2, AlertCircle,
  Download, Printer,
} from "lucide-react";
import { payoutApi } from "../../services/payoutApi";
import { bookingApi } from "../../services/bookingApi";
import { vendorApi  } from "../../services/vendorApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import { downloadCSV, printReport } from "../../utils/exportUtils";

const COMMISSION = 0.15; // 15% platform cut

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({ data }) {
  if (!data || data.length < 2) return null;

  const W   = 600;
  const H   = 180;
  const PAD = { top: 24, right: 24, bottom: 36, left: 56 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.amount), 1);
  const range  = maxVal;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    y:     PAD.top + chartH - p * chartH,
    label: `${((p * range) / 1000).toFixed(0)}k`,
  }));

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top  + chartH - (d.amount / range) * chartH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = [
    `M ${pts[0].x} ${pts[0].y}`,
    ...pts.slice(1).map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD.top + chartH}`,
    `L ${pts[0].x} ${PAD.top + chartH}`,
    "Z",
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }} aria-label="Monthly earnings">
      <defs>
        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#263E8B" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#263E8B" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={g.y} x2={PAD.left + chartW} y2={g.y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 3"} />
          <text x={PAD.left - 8} y={g.y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{g.label}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#earningsGrad)" />
      <path d={linePath} fill="none" stroke="#263E8B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <text x={p.x} y={PAD.top + chartH + 18} textAnchor="middle" fontSize="11" fill="#6B7280">{p.month}</text>
          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#263E8B" strokeWidth="2.5" />
          <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="10" fill="#6B7280" fontWeight="600">
            {(p.amount / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Earnings() {
  const [vendorProfile,    setVendorProfile]    = useState(null);
  const [completedOrders,  setCompletedOrders]  = useState([]);
  const [payouts,          setPayouts]          = useState([]);
  const [loading,          setLoading]          = useState(true);

  const [payoutOpen,       setPayoutOpen]       = useState(false);
  const [payoutAmount,     setPayoutAmount]     = useState("");
  const [payoutBank,       setPayoutBank]       = useState("");
  const [payoutAccount,    setPayoutAccount]    = useState("");
  const [payoutHolder,     setPayoutHolder]     = useState("");
  const [payoutError,      setPayoutError]      = useState("");
  const [payoutConfirm,    setPayoutConfirm]    = useState(false);
  const [payoutRequested,  setPayoutRequested]  = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [payoutApiError,   setPayoutApiError]   = useState("");

  useEffect(() => {
    Promise.all([
      vendorApi.getMyProfile().catch(() => ({ data: null })),
      bookingApi.getSeller({ limit: 500 }).catch(() => ({ data: { bookings: [] } })),
      payoutApi.getMy({ limit: 500 }).catch(() => ({ data: { payouts: [] } })),
    ]).then(([{ data: vData }, { data: bData }, { data: pData }]) => {
      setVendorProfile(vData?.vendor || vData);
      const completed = (bData.bookings || bData || []).filter(b =>
        (b.status || "").toUpperCase() === "COMPLETED"
      );
      setCompletedOrders(completed);
      setPayouts(pData.payouts || pData || []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived stats ────────────────────────────────────────────────
  const grossEarnings = completedOrders.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const netEarnings   = Math.round(grossEarnings * (1 - COMMISSION));

  const paidOut       = payouts
    .filter(p => (p.status || "").toUpperCase() === "PAID")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const available     = Math.max(0, netEarnings - paidOut);

  const activeOrdersCount = completedOrders.length; // already "completed" but shows in stats

  // Monthly chart data — last 6 months
  const monthlyData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ month: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month0: d.getMonth() });
    }
    return months.map(m => ({
      month:  m.month,
      amount: completedOrders
        .filter(b => {
          const bd = new Date(b.createdAt || b.eventDate);
          return bd.getMonth() === m.month0 && bd.getFullYear() === m.year;
        })
        .reduce((s, b) => s + Math.round((b.totalAmount || 0) * (1 - COMMISSION)), 0),
    }));
  })();

  // Transaction list — completed bookings as credits, payouts as debits
  const transactions = [
    ...completedOrders.map(b => ({
      id:      b.id,
      label:   `${b.gig?.title || "Service"} — ${b.packageType || "Package"}`,
      sub:     `${b.buyer?.name || "Buyer"} · ${new Date(b.createdAt || b.eventDate).toLocaleDateString("en-LK")}`,
      amount:  Math.round((b.totalAmount || 0) * (1 - COMMISSION)),
      type:    "credit",
    })),
    ...payouts
      .filter(p => (p.status || "").toUpperCase() === "PAID")
      .map(p => ({
        id:    p.id,
        label: `Payout to ${p.bankName || "Bank"}`,
        sub:   new Date(p.updatedAt || p.createdAt).toLocaleDateString("en-LK"),
        amount: p.amount || 0,
        type:  "debit",
      })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  const stats = [
    { label: "Total Earnings",   value: `LKR ${netEarnings.toLocaleString()}`,         icon: DollarSign,   color: "text-accent"     },
    { label: "Available",        value: `LKR ${available.toLocaleString()}`,            icon: TrendingUp,   color: "text-primary"    },
    { label: "Completed Orders", value: String(completedOrders.length),                 icon: ShoppingCart, color: "text-secondary"  },
    { label: "Avg. Rating",      value: `${(vendorProfile?.avgRating || 0).toFixed(1)}`, icon: Star,        color: "text-purple-500" },
  ];

  // ── Export helpers ───────────────────────────────────────────
  // Full transaction list (not capped at 10) for export
  const allTransactions = [
    ...completedOrders.map(b => ({
      date:   new Date(b.createdAt || b.eventDate).toLocaleDateString("en-LK"),
      type:   "Credit",
      label:  b.gig?.title || "Service",
      pkg:    b.packageType || "",
      buyer:  b.buyer?.name || "Buyer",
      amount: `+LKR ${Math.round((b.totalAmount || 0) * (1 - COMMISSION)).toLocaleString()}`,
    })),
    ...payouts
      .filter(p => (p.status || "").toUpperCase() === "PAID")
      .map(p => ({
        date:  new Date(p.updatedAt || p.createdAt).toLocaleDateString("en-LK"),
        type:  "Debit (Payout)",
        label: `Payout to ${p.bankName || "Bank"}`,
        pkg:   p.accountNumber || "",
        buyer: p.accountName || "",
        amount: `-LKR ${(p.amount || 0).toLocaleString()}`,
      })),
  ];

  function handleExportCSV() {
    const headers = ["Date", "Type", "Description", "Package / Account", "Buyer / Holder", "Amount (LKR)"];
    const rows    = allTransactions.map(t => [t.date, t.type, t.label, t.pkg, t.buyer, t.amount]);
    const date    = new Date().toISOString().slice(0, 10);
    downloadCSV(headers, rows, `vizhiyal-earnings-${date}.csv`);
  }

  function handleExportPDF() {
    printReport({
      title:    "Earnings Report",
      subtitle: `${vendorProfile?.businessName || "Seller"} · ${new Date().toLocaleDateString("en-LK")}`,
      meta: [
        { label: "Gross Earnings",    value: `LKR ${grossEarnings.toLocaleString()}`  },
        { label: "Net Earnings",      value: `LKR ${netEarnings.toLocaleString()}`    },
        { label: "Total Paid Out",    value: `LKR ${paidOut.toLocaleString()}`         },
        { label: "Available Balance", value: `LKR ${available.toLocaleString()}`      },
        { label: "Completed Orders",  value: completedOrders.length                   },
        { label: "Commission Rate",   value: "15%"                                    },
      ],
      headers: ["Date", "Type", "Description", "Package / Account", "Buyer / Holder", "Amount"],
      rows:    allTransactions.map(t => [t.date, t.type, t.label, t.pkg, t.buyer, t.amount]),
    });
  }

  async function submitPayout() {
    const amt = Number(payoutAmount);
    if (!payoutBank.trim())    { setPayoutError("Enter your bank name.");              return; }
    if (!payoutAccount.trim()) { setPayoutError("Enter your account number.");         return; }
    if (!payoutHolder.trim())  { setPayoutError("Enter the account holder name.");     return; }
    if (!amt || amt <= 0)      { setPayoutError("Enter a valid amount.");              return; }
    if (amt > available)       { setPayoutError(`Max available: LKR ${available.toLocaleString()}.`); return; }
    setPayoutError("");
    setPayoutConfirm(true);
  }

  async function confirmPayout() {
    setPayoutConfirm(false);
    setSubmitting(true);
    setPayoutApiError("");
    try {
      await payoutApi.request({
        amount:        Number(payoutAmount),
        bankName:      payoutBank.trim(),
        accountNumber: payoutAccount.trim(),
        accountName:   payoutHolder.trim(),
      });
      setPayoutRequested(true);
    } catch (err) {
      setPayoutApiError(err?.response?.data?.message || "Failed to submit payout request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Earnings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your financial overview</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                </div>
                <p className="text-xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Monthly Earnings (Net)</h2>
              <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                Last 6 months
              </span>
            </div>
            {monthlyData.every(m => m.amount === 0) ? (
              <p className="text-sm text-gray-400 text-center py-10">No completed orders in the last 6 months.</p>
            ) : (
              <LineChart data={monthlyData} />
            )}
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-800">Transaction History</h2>
              {allTransactions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    title="Download CSV"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    title="Print / Save as PDF"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              )}
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {transactions.map(txn => (
                  <div key={txn.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      txn.type === "credit" ? "bg-accent-50" : "bg-red-50"
                    }`}>
                      {txn.type === "credit"
                        ? <ArrowUpRight className="w-4 h-4 text-accent" />
                        : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{txn.label}</p>
                      <p className="text-xs text-gray-400">{txn.sub}</p>
                    </div>
                    <p className={`text-sm font-semibold flex-shrink-0 ${
                      txn.type === "credit" ? "text-accent" : "text-red-500"
                    }`}>
                      {txn.type === "credit" ? "+" : "-"}LKR {txn.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request Payout */}
          {payoutRequested ? (
            <div className="bg-accent-50 border border-accent/20 rounded-2xl p-6 flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-accent flex-shrink-0" />
              <div>
                <p className="font-semibold text-accent">Payout Requested!</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Your payout of <span className="font-semibold">LKR {Number(payoutAmount).toLocaleString()}</span> to{" "}
                  <span className="font-semibold">{payoutBank}</span> ({payoutAccount}) is being processed.
                  You will receive it within 2–3 business days.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-accent" />
                  <h2 className="font-semibold text-gray-800">Request Payout</h2>
                </div>
                <span className="text-xs bg-accent-50 text-accent font-semibold px-3 py-1 rounded-full border border-accent/20">
                  Available: LKR {available.toLocaleString()}
                </span>
              </div>

              {payoutApiError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{payoutApiError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payout Amount (LKR)</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={e => { setPayoutAmount(e.target.value); setPayoutError(""); }}
                    max={available}
                    placeholder={`Max: ${available.toLocaleString()}`}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    value={payoutBank}
                    onChange={e => { setPayoutBank(e.target.value); setPayoutError(""); }}
                    placeholder="e.g. Commercial Bank"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={payoutAccount}
                    onChange={e => { setPayoutAccount(e.target.value); setPayoutError(""); }}
                    placeholder="e.g. 1234 5678 9012"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Holder Name</label>
                  <input
                    type="text"
                    value={payoutHolder}
                    onChange={e => { setPayoutHolder(e.target.value); setPayoutError(""); }}
                    placeholder="Name on the bank account"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {payoutError && <p className="text-xs text-red-500 mt-3">{payoutError}</p>}

              <p className="text-xs text-gray-400 mt-3">
                A 15% platform commission has already been deducted. You receive the net amount shown above.
              </p>

              <button
                onClick={submitPayout}
                disabled={available <= 0 || submitting}
                className="mt-4 w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Banknote className="w-4 h-4" />}
                Request Payout
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={payoutConfirm}
        title="Confirm Payout Request"
        description={`Request LKR ${Number(payoutAmount).toLocaleString()} to ${payoutBank} (${payoutAccount})?`}
        confirmLabel="Yes, Request"
        onConfirm={confirmPayout}
        onCancel={() => setPayoutConfirm(false)}
      />
    </div>
  );
}
