// AdminActivityFeed.jsx — SuperAdmin: per-admin activity monitoring
import { useState } from "react";
import { Activity, Search } from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";

const adminAccounts = [
  { id: "ADM-001", name: "Saman Kumara",   avatar: "", role: "admin", status: "active"    },
  { id: "ADM-002", name: "Dilini Fernando",avatar: "", role: "admin", status: "active"    },
  { id: "ADM-003", name: "Tharindu Silva", avatar: "", role: "admin", status: "suspended" },
];

const adminActivity = [
  { id: "ACT-001", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "", action: "Approved seller application", target: "Nimal Perera",        type: "seller", time: "2026-03-22 10:15" },
  { id: "ACT-002", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "", action: "Suspended user account",      target: "Fathima Ali",         type: "user",   time: "2026-03-22 09:30" },
  { id: "ACT-003", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "", action: "Resolved dispute D-003",      target: "BK006 Dispute",       type: "order",  time: "2026-03-21 16:45" },
  { id: "ACT-004", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "", action: "Rejected seller application", target: "Rajeev S.",           type: "seller", time: "2026-03-21 14:00" },
  { id: "ACT-005", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "", action: "Removed flagged review",      target: "Elegant Event Decor", type: "gig",    time: "2026-03-21 11:20" },
  { id: "ACT-006", adminId: "ADM-003", admin: "Tharindu Silva",  adminAvatar: "", action: "Suspended gig",               target: "Elegant Event Decor", type: "gig",    time: "2026-03-20 15:10" },
  { id: "ACT-007", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "", action: "Confirmed order",             target: "BK003",               type: "order",  time: "2026-03-20 10:05" },
  { id: "ACT-008", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "", action: "Processed payout PO-002",     target: "Lens & Light Studio", type: "system", time: "2026-03-19 16:00" },
  { id: "ACT-009", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "", action: "Closed support ticket",       target: "Priya Nair",          type: "user",   time: "2026-03-19 11:30" },
  { id: "ACT-010", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "", action: "Approved seller application", target: "Pradeep Fernando",    type: "seller", time: "2026-03-18 09:15" },
];

const TYPE_COLORS = {
  seller: "bg-secondary-50 text-secondary border-secondary/20",
  user:   "bg-purple-50 text-purple-600 border-purple-200",
  order:  "bg-accent-50 text-accent border-accent/20",
  gig:    "bg-primary-50 text-primary border-primary/20",
  system: "bg-gray-100 text-gray-600 border-gray-200",
};

const TYPE_LABEL = {
  seller: "Seller", user: "User", order: "Order", gig: "Gig", system: "System",
};

export default function AdminActivityFeed() {
  const [filterAdmin, setFilterAdmin] = useState("all");
  const [filterType,  setFilterType]  = useState("all");
  const [query,       setQuery]       = useState("");

  const filtered = adminActivity.filter(a => {
    const matchAdmin = filterAdmin === "all" || a.adminId === filterAdmin;
    const matchType  = filterType  === "all" || a.type   === filterType;
    const q = query.toLowerCase();
    const matchQuery = !query.trim() ||
      a.admin.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.target.toLowerCase().includes(q);
    return matchAdmin && matchType && matchQuery;
  });

  // Stats per admin
  const adminStats = adminAccounts
    .filter(a => a.role === "admin")
    .map(a => ({
      ...a,
      count: adminActivity.filter(act => act.adminId === a.id).length,
    }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Activity Feed</h1>
        <p className="text-sm text-gray-400 mt-0.5">Live view of all admin actions on the platform</p>
      </div>

      {/* Per-admin stat cards */}
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
                <p className={`text-xs ${a.status === "suspended" ? "text-orange-500" : "text-gray-400"}`}>
                  {a.status === "suspended" ? "Suspended" : "Active"}
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{a.count}</p>
            <p className="text-xs text-gray-400">actions logged</p>
          </button>
        ))}
      </div>

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
        <div className="flex gap-2">
          {["all", "seller", "user", "order", "gig", "system"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filterType === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "all" ? `All (${adminActivity.length})` : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No activity found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {filtered.map(act => (
            <div key={act.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <UserAvatar src={act.adminAvatar} name={act.admin} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800">{act.admin}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[act.type]}`}>
                    {TYPE_LABEL[act.type]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {act.action} · <span className="font-medium text-gray-700">{act.target}</span>
                </p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{act.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
