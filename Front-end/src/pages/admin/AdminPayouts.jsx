// AdminPayouts.jsx — connected to real payout API
import { useState, useEffect } from "react";
import { Banknote, Search, CheckCircle, Loader, Loader2 } from "lucide-react";
import { payoutApi } from "../../services/payoutApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const COMMISSION_RATE = 0.15;
const TABS = ["all", "pending", "processing", "paid"];

const statusCfg = {
  pending:    { label: "Pending",    cls: "bg-amber-50 text-amber-600 border-amber-200" },
  processing: { label: "Processing", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  paid:       { label: "Paid",       cls: "bg-accent-50 text-accent border-accent/20" },
};

function lkr(n) { return `LKR ${Number(n || 0).toLocaleString()}`; }

export default function AdminPayouts() {
  const [payouts,     setPayouts]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("all");
  const [query,       setQuery]       = useState("");
  const [confirmPaid, setConfirmPaid] = useState(null);
  const [updating,    setUpdating]    = useState(null);

  useEffect(() => {
    payoutApi.getAll()
      .then(({ data }) => {
        const raw = data.payouts || data || [];
        setPayouts(raw.map(p => ({
          id:           p.id,
          vendor:       p.vendorProfile?.businessName || p.vendor?.businessName || "Vendor",
          sellerName:   p.vendorProfile?.user?.name   || p.user?.name           || "Seller",
          vendorAvatar: p.vendorProfile?.user?.avatar || p.user?.avatar         || "",
          // amount from API is the net amount the vendor requested
          amount:       p.amount || 0,
          bankName:     p.bankName     || "",
          accountNumber:p.accountNumber|| "",
          status:       (p.status || "pending").toLowerCase(),
          requestedAt:  new Date(p.createdAt).toLocaleDateString("en-LK"),
        })));
      })
      .catch(() => setPayouts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = payouts.filter(p => {
    const matchTab   = tab === "all" || p.status === tab;
    const q = query.toLowerCase();
    const matchQuery = !query.trim() ||
      p.vendor.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q);
    return matchTab && matchQuery;
  });

  const pendingTotal    = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const processingCount = payouts.filter(p => p.status === "processing").length;
  const paidCount       = payouts.filter(p => p.status === "paid").length;

  async function markProcessing(id) {
    setUpdating(id);
    try {
      await payoutApi.updateStatus(id, { status: "processing" });
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "processing" } : p));
    } catch { /* silent */ } finally { setUpdating(null); }
  }

  async function markPaid() {
    setUpdating(confirmPaid.id);
    try {
      await payoutApi.updateStatus(confirmPaid.id, { status: "paid" });
      setPayouts(prev => prev.map(p => p.id === confirmPaid.id ? { ...p, status: "paid" } : p));
    } catch { /* silent */ } finally { setUpdating(null); setConfirmPaid(null); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payouts</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${payouts.length} payout requests · 15% commission deducted`}
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by vendor..."
            className="px-3 py-2.5 text-sm focus:outline-none w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Pending Payout</p>
          <p className="text-lg font-bold text-amber-600">{lkr(pendingTotal)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Processing</p>
          <p className="text-lg font-bold text-blue-600">{processingCount} requests</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Paid</p>
          <p className="text-lg font-bold text-accent">{paidCount} completed</p>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map(t => {
          const count = t === "all" ? payouts.length : payouts.filter(p => p.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({loading ? "…" : count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Banknote className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No payouts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(payout => {
            const gross      = Math.round(payout.amount / (1 - COMMISSION_RATE));
            const commission = gross - payout.amount;
            const cfg        = statusCfg[payout.status] || statusCfg.pending;
            const isBusy     = updating === payout.id;
            return (
              <div key={payout.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <img
                  src={payout.vendorAvatar || undefined}
                  alt={payout.vendor}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-gray-800">{payout.vendor}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-medium">{payout.sellerName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                    {payout.bankName && <span>{payout.bankName}</span>}
                    {payout.accountNumber && <span>Acc: {payout.accountNumber}</span>}
                    <span>Gross: {lkr(gross)}</span>
                    <span>Commission (15%): {lkr(commission)}</span>
                    <span>Requested: {payout.requestedAt}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right space-y-2">
                  <p className="text-base font-bold text-gray-800">{lkr(payout.amount)}</p>
                  {payout.status === "pending" && (
                    <button
                      onClick={() => markProcessing(payout.id)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-60"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Loader className="w-3.5 h-3.5" />}
                      Mark Processing
                    </button>
                  )}
                  {payout.status === "processing" && (
                    <button
                      onClick={() => setConfirmPaid(payout)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 px-3 py-1.5 rounded-lg hover:bg-accent-50 transition-colors disabled:opacity-60"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Paid
                    </button>
                  )}
                  {payout.status === "paid" && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                      <CheckCircle className="w-3.5 h-3.5" /> Paid
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmPaid}
        title="Mark payout as paid?"
        description={`Confirm that ${lkr(confirmPaid?.amount ?? 0)} has been transferred to ${confirmPaid?.vendor ?? "this vendor"} via bank transfer.`}
        confirmLabel="Confirm Paid"
        onConfirm={markPaid}
        onCancel={() => setConfirmPaid(null)}
      />
    </div>
  );
}
