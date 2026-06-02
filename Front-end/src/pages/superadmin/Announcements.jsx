// Announcements.jsx — SuperAdmin: DB-backed announcements with real fan-out
// Create → saves to DB + fans out Notification rows to all targeted users
// Close  → marks announcement inactive + marks all user notifications as read
import { useState, useEffect, useCallback } from "react";
import {
  Megaphone, Plus, X, CheckCircle, AlertTriangle, Info,
  Users, Store, Loader2, Send, RefreshCw,
} from "lucide-react";
import { adminApi }  from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

// ── Config ────────────────────────────────────────────────────────────────────

const TARGET_OPTS = [
  { value: "all",     label: "All Users"    },
  { value: "buyers",  label: "Buyers Only"  },
  { value: "sellers", label: "Sellers Only" },
];

const PRIORITY_OPTS = ["low", "medium", "high"];

const priorityCfg = {
  high:   { label: "High",   cls: "bg-red-50 text-red-500 border-red-200",       icon: AlertTriangle, iconCls: "text-red-500",   bg: "bg-red-50"   },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: Megaphone,     iconCls: "text-amber-500", bg: "bg-amber-50" },
  low:    { label: "Low",    cls: "bg-gray-100 text-gray-500 border-gray-200",   icon: Info,          iconCls: "text-gray-400",  bg: "bg-gray-100" },
};

const statusCfg = {
  active:   { label: "Active",   cls: "bg-accent-50 text-accent border-accent/20" },
  inactive: { label: "Closed",   cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

const blank = { title: "", body: "", target: "all", priority: "medium", expiresAt: "" };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Announcements() {
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(blank);
  const [publishing,    setPublishing]    = useState(false);
  const [publishError,  setPublishError]  = useState("");
  const [successBanner, setSuccessBanner] = useState(null); // { count, title }
  const [closeTarget,   setCloseTarget]   = useState(null);
  const [closing,       setClosing]       = useState(null);
  const [tab,           setTab]           = useState("all");

  // ── Load from DB ──
  const load = useCallback(() => {
    setLoading(true);
    adminApi.getAnnouncements()
      .then(({ data }) => setItems(data.announcements || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount   = items.filter(a => a.status === "active").length;
  const inactiveCount = items.filter(a => a.status === "inactive").length;
  const filtered      = items.filter(a => tab === "all" ? true : a.status === tab);

  // ── Publish ──
  async function handleCreate() {
    if (!form.title.trim() || !form.body.trim()) return;
    setPublishing(true);
    setPublishError("");
    try {
      const { data } = await adminApi.sendAnnouncement({
        title:    form.title.trim(),
        body:     form.body.trim(),
        target:   form.target,
        priority: form.priority,
        expiresAt: form.expiresAt || undefined,
      });
      setItems(prev => [data.announcement, ...prev]);
      setSuccessBanner({ count: data.notifiedCount ?? 0, title: form.title.trim() });
      setForm(blank);
      setShowForm(false);
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err) {
      setPublishError(err.response?.data?.message || "Failed to publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  // ── Close (deactivate for everyone) ──
  async function handleClose() {
    if (!closeTarget) return;
    setClosing(closeTarget.id);
    try {
      await adminApi.closeAnnouncement(closeTarget.id);
      setItems(prev => prev.map(a =>
        a.id === closeTarget.id ? { ...a, status: "inactive" } : a
      ));
    } catch { /* silent */ } finally {
      setClosing(null);
      setCloseTarget(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${activeCount} active · ${inactiveCount} closed`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowForm(v => !v); setPublishError(""); }}
            className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div className="flex items-center gap-3 bg-accent-50 border border-accent/20 text-accent px-4 py-3 rounded-2xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">
            <span className="font-bold">"{successBanner.title}"</span> delivered to{" "}
            <span className="font-bold">{successBanner.count} user{successBanner.count !== 1 ? "s" : ""}</span>.
          </p>
          <button onClick={() => setSuccessBanner(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compose form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Compose Announcement
          </h3>

          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title"
            maxLength={120}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <textarea
            rows={3}
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Message shown to users in their notification inbox…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Audience</label>
              <select
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                {TARGET_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                {PRIORITY_OPTS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Expires On (optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            Will notify all <span className="font-semibold text-gray-700 mx-1">
              {form.target === "all" ? "active users" : form.target === "buyers" ? "active buyers" : "active sellers"}
            </span> immediately. Closing it later will mark their notification as read.
          </div>

          {publishError && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {publishError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setForm(blank); setPublishError(""); }}
              disabled={publishing}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.title.trim() || !form.body.trim() || publishing}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {publishing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                : <><Send className="w-4 h-4" /> Publish & Send</>}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {items.length > 0 && (
        <div className="flex gap-2">
          {["all", "active", "inactive"].map(t => {
            const count = t === "all" ? items.length : t === "active" ? activeCount : inactiveCount;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t === "inactive" ? "Closed" : t.charAt(0).toUpperCase() + t.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-primary/40" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">No announcements yet</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Compose and broadcast a message to all users or a specific audience.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ann => {
            const pCfg   = priorityCfg[ann.priority] || priorityCfg.low;
            const sCfg   = statusCfg[ann.status]     || statusCfg.active;
            const PIcon  = pCfg.icon;
            const isOpen = ann.status === "active";
            return (
              <div
                key={ann.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-opacity ${
                  isOpen ? "border-gray-100" : "border-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">

                  {/* Priority icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${pCfg.bg}`}>
                    <PIcon className={`w-4 h-4 ${pCfg.iconCls}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-800">{ann.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${pCfg.cls}`}>
                        {pCfg.label}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sCfg.cls}`}>
                        {sCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">{ann.body}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                      <span>
                        Target:{" "}
                        <span className="font-medium text-gray-600 capitalize">
                          {ann.target === "all" ? "All Users" : ann.target}
                        </span>
                      </span>
                      <span>
                        Notified: <span className="font-medium text-gray-600">{ann.notified} users</span>
                      </span>
                      <span>Sent: {new Date(ann.createdAt).toLocaleDateString("en-LK")}</span>
                      {ann.createdBy?.name && <span>By: {ann.createdBy.name}</span>}
                      {ann.expiresAt && (
                        <span>Expires: {new Date(ann.expiresAt).toLocaleDateString("en-LK")}</span>
                      )}
                    </div>
                  </div>

                  {/* Close button (active only) */}
                  {isOpen && (
                    <button
                      onClick={() => setCloseTarget(ann)}
                      disabled={closing === ann.id}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {closing === ann.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <X className="w-3.5 h-3.5" />}
                      Close for all
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Close confirmation */}
      <ConfirmDialog
        open={!!closeTarget}
        title="Close this announcement?"
        description={`"${closeTarget?.title}" will be marked as read in every user's notification inbox and removed from active view.`}
        confirmLabel="Close for everyone"
        onConfirm={handleClose}
        onCancel={() => setCloseTarget(null)}
      />
    </div>
  );
}
