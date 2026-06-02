// PromoCodes.jsx — SuperAdmin: manage discount / promo codes (connected to promoApi)
import { useState, useEffect } from "react";
import { Tag, Plus, X, CheckCircle, Copy, Loader2 } from "lucide-react";
import { promoApi } from "../../services/promoApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const TABS = ["all", "active", "inactive", "expired"];

const statusCfg = {
  active:   { label: "Active",   cls: "bg-accent-50 text-accent border-accent/20" },
  inactive: { label: "Inactive", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  expired:  { label: "Expired",  cls: "bg-red-50 text-red-400 border-red-200" },
};

const blank = {
  code: "", description: "", discountType: "percent",
  discountValue: "", minOrder: "", usageLimit: "", expiresAt: "",
};

function lkr(n) { return `LKR ${Number(n).toLocaleString()}`; }

export default function PromoCodes() {
  const [codes,        setCodes]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(blank);
  const [creating,     setCreating]     = useState(false);
  const [tab,          setTab]          = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toggling,     setToggling]     = useState(null);
  const [copied,       setCopied]       = useState(null);

  useEffect(() => {
    promoApi.getAll()
      .then(res => {
        const data = res.data;
        setCodes(Array.isArray(data) ? data : data.promos ?? data.data ?? []);
      })
      .catch(() => setCodes([]))
      .finally(() => setLoading(false));
  }, []);

  const adapt = c => ({
    ...c,
    status:       (c.status || "active").toLowerCase(),
    discountType: c.discountType || c.type || "percent",
    usedCount:    c.usedCount ?? c.usageCount ?? 0,
    usageLimit:   c.usageLimit ?? c.maxUses ?? 999,
    minOrder:     c.minOrder ?? c.minOrderAmount ?? 0,
  });

  const adapted  = codes.map(adapt);
  const filtered = adapted.filter(c => tab === "all" || c.status === tab);

  async function handleCreate() {
    if (!form.code.trim() || !form.discountValue || !form.expiresAt) return;
    setCreating(true);
    try {
      const res = await promoApi.create({
        code:          form.code.trim().toUpperCase(),
        description:   form.description,
        discountType:  form.discountType,
        discountValue: Number(form.discountValue),
        minOrder:      Number(form.minOrder) || 0,
        usageLimit:    Number(form.usageLimit) || 999,
        expiresAt:     form.expiresAt,
      });
      const created = res.data?.promo ?? res.data;
      setCodes(prev => [created, ...prev]);
      setForm(blank);
      setShowForm(false);
    } catch {
      // silently fail — backend may not be up
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(id) {
    if (toggling) return;
    setToggling(id);
    try {
      await promoApi.toggleStatus(id);
      setCodes(prev => prev.map(c =>
        c.id === id && (c.status || "active").toLowerCase() !== "expired"
          ? { ...c, status: (c.status || "active").toLowerCase() === "active" ? "inactive" : "active" }
          : c
      ));
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await promoApi.remove(deleteTarget.id);
      setCodes(prev => prev.filter(c => c.id !== deleteTarget.id));
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promo Codes</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {adapted.filter(c => c.status === "active").length} active codes
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Promo Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Create Promo Code</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER10"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Discount Type</label>
              <select
                value={form.discountType}
                onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (LKR)</option>
              </select>
            </div>
          </div>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (shown internally)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Value ({form.discountType === "percent" ? "%" : "LKR"})
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder="10"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Min Order (LKR)</label>
              <input
                type="number"
                value={form.minOrder}
                onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                placeholder="10000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Usage Limit</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                placeholder="100"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Expires On</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setForm(blank); }}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.code.trim() || !form.discountValue || !form.expiresAt}
              className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Code
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => {
          const count = t === "all" ? adapted.length : adapted.filter(c => c.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No promo codes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const cfg     = statusCfg[c.status] || statusCfg.inactive;
            const usedPct = c.usageLimit > 0 ? Math.round((c.usedCount / c.usageLimit) * 100) : 0;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        onClick={() => copyCode(c.code)}
                        className="font-mono text-base font-bold text-gray-800 hover:text-primary flex items-center gap-1.5"
                        title="Copy code"
                      >
                        {c.code}
                        {copied === c.code
                          ? <CheckCircle className="w-3.5 h-3.5 text-accent" />
                          : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {c.discountType === "percent" ? `${c.discountValue}% off` : `LKR ${c.discountValue} off`}
                      </span>
                    </div>
                    {c.description && <p className="text-sm text-gray-500 mb-2">{c.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                      {c.minOrder > 0 && <span>Min order: {lkr(c.minOrder)}</span>}
                      <span>Expires: {c.expiresAt}</span>
                    </div>
                    {/* Usage bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{c.usedCount} / {c.usageLimit} uses</span>
                        <span>{usedPct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${usedPct >= 90 ? "bg-red-400" : "bg-accent"}`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {c.status !== "expired" && (
                      <button
                        onClick={() => toggleStatus(c.id)}
                        disabled={toggling === c.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 disabled:opacity-60 ${
                          c.status === "active"
                            ? "text-gray-500 border-gray-200 hover:bg-gray-50"
                            : "text-accent border-accent/30 hover:bg-accent-50"
                        }`}
                      >
                        {toggling === c.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        {c.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this promo code?"
        description={`Code "${deleteTarget?.code}" will be permanently deleted and can no longer be used by buyers.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
