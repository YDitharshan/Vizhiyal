// SuperAdmin Dashboard — connected to real API + inline demo data for logs/metrics
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Users, Store, ShoppingCart, Package,
  DollarSign, AlertTriangle, ClipboardList,
  Settings, Activity, UserCheck, ChevronRight, Loader2,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import { vendorApi } from "../../services/vendorApi";

const AUDIT_TYPE_COLOR = {
  seller: "bg-secondary-50 text-secondary",
  user:   "bg-purple-50 text-purple-600",
  order:  "bg-accent-50 text-accent",
  gig:    "bg-primary-50 text-primary",
  system: "bg-gray-100 text-gray-600",
};

// Demo audit logs — replace with real API when audit endpoint is available
const demoAuditLogs = [
  { id: 1, admin: "Ruwanthi Silva",  adminAvatar: "", action: "Approved seller application",     target: "Lens & Light Studio",    type: "seller", time: "2m ago"  },
  { id: 2, admin: "Kasun Bandara",   adminAvatar: "", action: "Suspended user account",          target: "U-00142",                type: "user",   time: "15m ago" },
  { id: 3, admin: "Ruwanthi Silva",  adminAvatar: "", action: "Resolved dispute",                target: "Dispute #DIS-008",       type: "order",  time: "1h ago"  },
  { id: 4, admin: "Kasun Bandara",   adminAvatar: "", action: "Suspended gig listing",           target: "Budget Wedding Photos",  type: "gig",    time: "3h ago"  },
  { id: 5, admin: "Nadeeka Perera",  adminAvatar: "", action: "Updated platform commission rate", target: "System Settings",        type: "system", time: "1d ago"  },
];

// Demo system metrics
const demoMetrics = [
  { label: "API Response",    value: "142ms",  status: "good",    note: "Average over last hour" },
  { label: "Uptime",          value: "99.96%", status: "good",    note: "This month" },
  { label: "Storage Used",    value: "68%",    status: "warning", note: "14.2 GB of 21 GB" },
  { label: "Active Sessions", value: "347",    status: "good",    note: "Right now" },
  { label: "Queue Depth",     value: "12",     status: "good",    note: "Jobs pending" },
  { label: "Error Rate",      value: "0.04%",  status: "good",    note: "Last 24 hours" },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [platformStats, setPlatformStats] = useState(null);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [pendingApps,   setPendingApps]   = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats().catch(() => ({ data: {} })),
      vendorApi.list().catch(() => ({ data: [] })),
    ]).then(([{ data: sData }, { data: vData }]) => {
      const s = sData.stats || sData;
      setPlatformStats({
        totalUsers:    s.totalUsers    ?? 0,
        totalVendors:  s.totalVendors  ?? 0,
        totalOrders:   s.totalOrders   ?? 0,
        activeGigs:    s.activeGigs    ?? 0,
        totalRevenue:  s.totalRevenue  ?? 0,
        adminAccounts: s.adminAccounts ?? 0,
      });

      const vendors = vData.vendors || vData || [];
      const pending = vendors.filter(v => (v.sellerStatus || "").toUpperCase() === "PENDING");
      setPendingCount(pending.length);
      setPendingApps(pending.slice(0, 3).map(v => ({
        id:           v.id,
        name:         v.user?.name       || "Vendor",
        avatar:       v.user?.avatar     || "",
        businessName: v.businessName     || "",
      })));
    }).finally(() => setLoading(false));
  }, []);

  const stats = platformStats ? [
    { label: "Total Users",    value: platformStats.totalUsers.toLocaleString(),                   icon: Users,       color: "bg-primary-50 text-primary"    },
    { label: "Total Vendors",  value: platformStats.totalVendors,                                  icon: Store,       color: "bg-secondary-50 text-secondary" },
    { label: "Total Orders",   value: platformStats.totalOrders,                                   icon: ShoppingCart,color: "bg-accent-50 text-accent"       },
    { label: "Active Gigs",    value: platformStats.activeGigs,                                    icon: Package,     color: "bg-purple-50 text-purple-600"   },
    { label: "Total Revenue",  value: `LKR ${(platformStats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign,  color: "bg-green-50 text-green-600"     },
    { label: "Admin Accounts", value: platformStats.adminAccounts,                                 icon: Shield,      color: "bg-gray-100 text-gray-600"      },
  ] : [];

  const superAdminLinks = [
    { label: "Admin Accounts",    icon: Users,        path: "/superadmin/admins",   desc: "Manage admin user accounts" },
    { label: "Platform Settings", icon: Settings,     path: "/superadmin/settings", desc: "Commission, flags & email" },
    { label: "Audit Logs",        icon: ClipboardList,path: "/superadmin/audit",    desc: "Recorded admin actions" },
    { label: "System Health",     icon: Activity,     path: "/superadmin/health",   desc: "Uptime & performance metrics" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-400">Full platform control & oversight</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Elevated Privileges Active</p>
          <p className="text-xs text-white/60 mt-0.5">
            Actions taken here affect all platform users, admins and vendors. Proceed with care.
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div
          onClick={() => navigate("/admin/sellers")}
          className="bg-secondary-50 border border-secondary/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary-50/80 transition-colors"
        >
          <div className="w-10 h-10 bg-secondary text-white rounded-xl flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary">
              {pendingCount} Seller Application{pendingCount > 1 ? "s" : ""} Awaiting Review
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Admins need to action these — or handle them yourself</p>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary" />
        </div>
      )}

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Super admin quick links */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" /> Super Admin Controls
          </h2>
          {superAdminLinks.map(({ label, icon: Icon, path, desc }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Recent audit log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Recent Activity
            </h2>
            <button
              onClick={() => navigate("/superadmin/audit")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {demoAuditLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3.5">
                <img
                  src={log.adminAvatar}
                  alt={log.admin}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{log.action}</p>
                  <p className="text-xs text-gray-400 truncate">{log.admin} → {log.target}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${AUDIT_TYPE_COLOR[log.type]}`}>
                  {log.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System health snapshot */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> System Health Snapshot
          </h2>
          <button
            onClick={() => navigate("/superadmin/health")}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Full report <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {demoMetrics.map(m => (
            <div key={m.label} className={`rounded-xl border p-3 ${
              m.status === "good" ? "bg-accent-50 border-accent/20" : "bg-secondary-50 border-secondary/20"
            }`}>
              <div className={`w-2 h-2 rounded-full mb-2 ${m.status === "good" ? "bg-accent" : "bg-secondary"}`} />
              <p className="text-sm font-bold text-gray-800">{m.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
