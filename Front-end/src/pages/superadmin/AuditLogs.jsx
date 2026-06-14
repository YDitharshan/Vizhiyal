// AuditLogs.jsx — SuperAdmin: chronological log of all admin actions (real API)
// Reads GET /admin/audit-logs — rows are written by the audit logger whenever
// an admin approves a seller, suspends a user, publishes an announcement, etc.
import { useState, useEffect } from "react";
import { ClipboardList, Search, UserCheck, Users, ShoppingCart, Package, Settings, Loader2, RefreshCw } from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";
import { adminApi } from "../../services/adminApi";

const TYPE_CFG = {
  seller: { label: "Seller", color: "bg-secondary-50 text-secondary",  icon: UserCheck    },
  user:   { label: "User",   color: "bg-purple-50 text-purple-600",    icon: Users        },
  order:  { label: "Order",  color: "bg-accent-50 text-accent",        icon: ShoppingCart },
  gig:    { label: "Gig",    color: "bg-primary-50 text-primary",      icon: Package      },
  system: { label: "System", color: "bg-gray-100 text-gray-600",       icon: Settings     },
};

const TABS = ["all", "seller", "user", "order", "gig", "system"];

// Compact "x ago" relative time from an ISO timestamp.
function ago(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)     return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)     return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)     return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1)    return "Yesterday";
  if (d < 7)      return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5)      return `${w}w ago`;
  return new Date(iso).toLocaleDateString("en-LK");
}

export default function AuditLogs() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");
  const [query,   setQuery]   = useState("");

  function load() {
    setLoading(true);
    adminApi.getAuditLogs()
      .then(({ data }) => setLogs(data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const filtered = logs.filter(log => {
    const matchesTab = tab === "all" || log.type === tab;
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      (log.admin || "").toLowerCase().includes(q) ||
      (log.action || "").toLowerCase().includes(q) ||
      (log.target || "").toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${logs.length} recorded action${logs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search admin, action or target..."
              className="px-3 py-2.5 text-sm focus:outline-none w-60"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(t => {
          const count = t === "all" ? logs.length : logs.filter(l => l.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">{logs.length === 0 ? "No admin actions logged yet" : "No logs match your filter"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const cfg  = TYPE_CFG[log.type] || TYPE_CFG.system;
            const Icon = cfg.icon;
            return (
              <div key={log.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <UserAvatar src={log.adminAvatar} name={log.admin} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-medium text-gray-600">{log.admin}</span>
                    {log.target ? <> → {log.target}</> : null}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <p className="text-xs text-gray-400">{ago(log.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
