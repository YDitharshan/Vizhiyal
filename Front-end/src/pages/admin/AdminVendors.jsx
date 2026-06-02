// AdminVendors.jsx — connected to real vendor API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, Search, CheckCircle, ShieldOff, ShieldCheck,
  ChevronRight, MapPin, Phone, Loader2,
} from "lucide-react";
import { vendorApi } from "../../services/vendorApi";
import { adminApi } from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const TABS = ["all", "active", "suspended"];

function adaptVendor(v) {
  const statusRaw = (v.sellerStatus || "APPROVED").toUpperCase();
  return {
    id:             v.id,
    name:           v.user?.name         || v.name         || "Vendor",
    avatar:         v.user?.avatar       || v.avatar       || "",
    email:          v.user?.email        || v.email        || "",
    businessName:   v.businessName       || "",
    location:       v.location           || "",
    phone:          v.phone              || "",
    categories:     v.categories         || [],
    suspendedReason:v.suspendedReason    || v.suspendReason || "",
    status:         statusRaw === "SUSPENDED" ? "suspended" : "approved",
  };
}

export default function AdminVendors() {
  const navigate = useNavigate();

  const [vendors,         setVendors]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [tab,             setTab]             = useState("all");
  const [query,           setQuery]           = useState("");
  const [suspendTarget,   setSuspendTarget]   = useState(null);
  const [reinstateTarget, setReinstateTarget] = useState(null);
  const [suspendInput,    setSuspendInput]    = useState("");
  const [showReasonBox,   setShowReasonBox]   = useState(false);
  const [updating,        setUpdating]        = useState(null);

  useEffect(() => {
    // fetch vendors that are approved or suspended only
    vendorApi.list()
      .then(({ data }) => {
        const raw = data.vendors || data || [];
        const adapted = raw.map(adaptVendor).filter(v => v.status === "approved" || v.status === "suspended");
        setVendors(adapted);
      })
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(v => {
    const matchesTab   = tab === "all" || (tab === "active" ? v.status === "approved" : v.status === "suspended");
    const q = query.toLowerCase();
    const matchesQuery = !query.trim() ||
      v.name.toLowerCase().includes(q) ||
      v.businessName.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  const activeCount    = vendors.filter(v => v.status === "approved").length;
  const suspendedCount = vendors.filter(v => v.status === "suspended").length;

  async function handleSuspendConfirm() {
    if (!suspendInput.trim() || !suspendTarget) return;
    setUpdating(suspendTarget.id);
    try {
      await adminApi.suspendVendor(suspendTarget.id, { reason: suspendInput.trim() });
      setVendors(prev => prev.map(v =>
        v.id === suspendTarget.id
          ? { ...v, status: "suspended", suspendedReason: suspendInput.trim() }
          : v
      ));
    } catch { /* silent */ } finally {
      setUpdating(null);
      setSuspendTarget(null);
      setSuspendInput("");
      setShowReasonBox(false);
    }
  }

  async function handleReinstate() {
    if (!reinstateTarget) return;
    setUpdating(reinstateTarget.id);
    try {
      await adminApi.reinstateVendor(reinstateTarget.id);
      setVendors(prev => prev.map(v =>
        v.id === reinstateTarget.id
          ? { ...v, status: "approved", suspendedReason: "" }
          : v
      ));
    } catch { /* silent */ } finally {
      setUpdating(null);
      setReinstateTarget(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${activeCount} active · ${suspendedCount} suspended`}
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, business or email..."
            className="px-3 py-2.5 text-sm focus:outline-none w-64"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map(t => {
          const count = t === "all" ? vendors.length : t === "active" ? activeCount : suspendedCount;
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
          <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No vendors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(vendor => {
            const isSuspended = vendor.status === "suspended";
            const isBusy      = updating === vendor.id;
            return (
              <div
                key={vendor.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <img
                  src={vendor.avatar || undefined}
                  alt={vendor.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/admin/sellers/${vendor.id}`)}
                  onError={e => { e.target.style.display = "none"; }}
                />

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/admin/sellers/${vendor.id}`)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{vendor.name}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                      isSuspended
                        ? "bg-orange-50 text-orange-500 border-orange-200"
                        : "bg-accent-50 text-accent border-accent/20"
                    }`}>
                      {isSuspended ? <ShieldOff className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {isSuspended ? "Suspended" : "Active"}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-medium">{vendor.businessName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {vendor.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" /> {vendor.location}
                      </span>
                    )}
                    {vendor.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="w-3 h-3" /> {vendor.phone}
                      </span>
                    )}
                  </div>
                  {vendor.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {vendor.categories.map(c => (
                        <span key={c} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {isSuspended && vendor.suspendedReason && (
                    <p className="text-xs text-orange-600 mt-1.5 bg-orange-50 px-2 py-1 rounded-lg">
                      Reason: {vendor.suspendedReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSuspended ? (
                    <button
                      onClick={() => setReinstateTarget(vendor)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 px-3 py-1.5 rounded-lg hover:bg-accent-50 transition-colors disabled:opacity-60"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Reinstate
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSuspendTarget(vendor); setShowReasonBox(true); }}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-60"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      Suspend
                    </button>
                  )}
                  <ChevronRight
                    className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500"
                    onClick={() => navigate(`/admin/sellers/${vendor.id}`)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suspend reason modal */}
      {showReasonBox && suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowReasonBox(false); setSuspendTarget(null); setSuspendInput(""); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-orange-50">
                <ShieldOff className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Suspend {suspendTarget.name}?</p>
                <p className="text-xs text-gray-500 mt-1">
                  This vendor will be hidden from buyers and unable to receive new orders. Provide a reason below.
                </p>
              </div>
            </div>
            <textarea
              rows={3}
              value={suspendInput}
              onChange={e => setSuspendInput(e.target.value)}
              placeholder="Reason for suspension…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReasonBox(false); setSuspendTarget(null); setSuspendInput(""); }}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendConfirm}
                disabled={!suspendInput.trim() || !!updating}
                className="flex-1 bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-orange-600 transition-colors disabled:opacity-40"
              >
                {updating ? "…" : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!reinstateTarget}
        title="Reinstate this vendor?"
        description={`${reinstateTarget?.name ?? "This vendor"} will regain full seller access. Their gigs will become visible to buyers again.`}
        confirmLabel="Reinstate"
        onConfirm={handleReinstate}
        onCancel={() => setReinstateTarget(null)}
      />
    </div>
  );
}
