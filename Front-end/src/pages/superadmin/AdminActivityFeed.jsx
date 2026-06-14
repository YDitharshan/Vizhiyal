// AdminActivityFeed.jsx — SuperAdmin: per-admin activity monitoring (real API)
// Reads GET /admin/audit-logs (logs + admin accounts) and groups by admin.
import { useState, useEffect } from "react";
import { Activity, Search, Loader2, RefreshCw } from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";
import { adminApi } from "../../services/adminApi";

const TYPE_COLORS = {
  seller: "bg-secondary-50 text-secondary border-secondary/20",
  user:   "bg-purple-50 text-purple-600 border-purple-200",
  order:  "bg-accent-50 text-accent border-accent/20",
  gig:    "bg-primary-50 text-primary border-primary/20",
  system: "bg-gray-100 text-gray-600 border-gray-200",
};
const TYPE_LABEL = { seller: "Seller", user: "User", order: "Order", gig: "Gig", system: "System" };

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-LK", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminActivityFeed() {
  const [logs,    setLogs]    = useState([]);
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterAdmin, setFilterAdmin] = useState("all");
  const [filterType,  setFilterType]  = useState("all");
  const [query,       setQuery]       = useState("");

  function load() {
    setLoading(true);
    adminApi.getAuditLogs()
      .then(({ data }) => { setLogs(data.logs || []); setAdmins(data.admins || []); })
      .catch(() => { setLogs([]); setAdmins([]); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const filtered = logs.filter(a => {
    const matchAdmin = filterAdmin === "all" || a.adminId === filterAdmin;
    const matchType  = filterType  === "all" || a.type === filterType;
    const q = query.toLowerCase();
    const matchQuery = !query.trim() ||
      (a.admin || "").toLowerCase().includes(q) ||
      (a.action || "").toLowerCase().includes(q) ||
      (a.target || "").toLowerCase().includes(q);
    return matchAdmin && matchType && matchQuery;
  });

  // Per-admin action counts derived from the real logs
  const adminStats = admins.map(a => ({
    ...a,
    count: logs.filter(l => l.adminId === a.id).length,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Activity Feed</h1>
          <p className="text-sm text-gray-400 mt-0.5">Live view of all admin actions on the platform</p>
        </div>
        <button
          onClick={load}
          className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Per-admin stat cards */}
      {adminStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {adminStats.map(a => (
            <button
              key={a.id}
              onClick={() => setFilterAdmin(filterAdmin === a.id ? "all" : a.id)}
              className={`bg-white rounded-2xl border shadow-sm p-4 text-left transition-all ${
                filterAdmin === a.id ? "border-primary ring-1 ring-primary" : "border-gray-100 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <UserAvatar src={a.avatar} name={a.name} size={36} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                  <p className={`text-xs ${a.isActive === false ? "text-orange-500" : "text-gray-400"}`}>
                    {a.role === "superadmin" ? "Super Admin" : "Admin"}
                    {a.isActive === false ? " · Suspended" : ""}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{a.count}</p>
              <p className="text-xs text-gray-400">actions logged</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden flex-1">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search action, target or admin..."
            className="px-3 py-2.5 text-sm focus:outline-none flex-1"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "seller", "user", "order", "gig", "system"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filterType === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "all" ? `All (${logs.length})` : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {logs.length === 0 ? "No activity yet" : "No activity matches your filter"}
          </p>
          {logs.length === 0 && (
            <p className="text-sm text-gray-400 mt-1">Admin actions (approvals, suspensions, etc.) will appear here.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {filtered.map(act => (
            <div key={act.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <UserAvatar src={act.adminAvatar} name={act.admin} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800">{act.admin}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[act.type] || TYPE_COLORS.system}`}>
                    {TYPE_LABEL[act.type] || "System"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {act.action}{act.target ? <> · <span className="font-medium text-gray-700">{act.target}</span></> : null}
                </p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{fmtTime(act.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
