// AuditLogs.jsx — SuperAdmin: chronological log of all admin actions
import { useState } from "react";
import { ClipboardList, Search, UserCheck, Users, ShoppingCart, Package, Settings } from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";

const auditLogs = [
  { id: "AL-001", admin: "Saman Kumara",    adminAvatar: "", action: "Approved seller application",    target: "Nimal Perera",     type: "seller", time: "10 min ago" },
  { id: "AL-002", admin: "Dilini Fernando", adminAvatar: "", action: "Suspended user account",         target: "Fathima Ali",      type: "user",   time: "2h ago"     },
  { id: "AL-003", admin: "Saman Kumara",    adminAvatar: "", action: "Cancelled order",                target: "BK006",            type: "order",  time: "3h ago"     },
  { id: "AL-004", admin: "Dilini Fernando", adminAvatar: "", action: "Rejected seller application",    target: "Rajeev S.",        type: "seller", time: "Yesterday"  },
  { id: "AL-005", admin: "Tharindu Silva",  adminAvatar: "", action: "Suspended gig",                  target: "Elegant Decor",    type: "gig",    time: "2d ago"     },
  { id: "AL-006", admin: "Saman Kumara",    adminAvatar: "", action: "Reinstated user account",        target: "Ravi Kumar",       type: "user",   time: "3d ago"     },
  { id: "AL-007", admin: "Nadeeka Perera",  adminAvatar: "", action: "Created admin account",          target: "Saman Kumara",     type: "system", time: "4d ago"     },
  { id: "AL-008", admin: "Nadeeka Perera",  adminAvatar: "", action: "Changed commission rate to 10%", target: "Platform",         type: "system", time: "1w ago"     },
  { id: "AL-009", admin: "Dilini Fernando", adminAvatar: "", action: "Confirmed order",                target: "BK002",            type: "order",  time: "1w ago"     },
  { id: "AL-010", admin: "Tharindu Silva",  adminAvatar: "", action: "Restored gig",                   target: "Beat Masters DJ",  type: "gig",    time: "2w ago"     },
];

const TYPE_CFG = {
  seller: { label: "Seller", color: "bg-secondary-50 text-secondary",  icon: UserCheck    },
  user:   { label: "User",   color: "bg-purple-50 text-purple-600",    icon: Users        },
  order:  { label: "Order",  color: "bg-accent-50 text-accent",        icon: ShoppingCart },
  gig:    { label: "Gig",    color: "bg-primary-50 text-primary",      icon: Package      },
  system: { label: "System", color: "bg-gray-100 text-gray-600",       icon: Settings     },
};

const TABS = ["all", "seller", "user", "order", "gig", "system"];

export default function AuditLogs() {
  const [tab,   setTab]   = useState("all");
  const [query, setQuery] = useState("");

  const filtered = auditLogs.filter(log => {
    const matchesTab   = tab === "all" || log.type === tab;
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      log.admin.toLowerCase().includes(q)  ||
      log.action.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">{auditLogs.length} recorded actions</p>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(t => {
          const count = t === "all" ? auditLogs.length : auditLogs.filter(l => l.type === t).length;
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
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No logs found</p>
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
                    <span className="font-medium text-gray-600">{log.admin}</span> → {log.target}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <p className="text-xs text-gray-400">{log.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
