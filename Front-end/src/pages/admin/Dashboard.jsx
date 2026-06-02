// Admin Dashboard — connected to real API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, ShoppingCart, Package,
  Clock, CheckCircle, XCircle, ChevronRight, AlertCircle, Loader2,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import { vendorApi } from "../../services/vendorApi";

const statusCfg = {
  PENDING:   { label: "Pending",   badge: "bg-secondary-50 text-secondary border-secondary/20", icon: Clock       },
  CONFIRMED: { label: "Confirmed", badge: "bg-accent-50 text-accent border-accent/20",          icon: CheckCircle },
  COMPLETED: { label: "Completed", badge: "bg-primary-50 text-primary border-primary/20",       icon: CheckCircle },
  CANCELLED: { label: "Cancelled", badge: "bg-red-50 text-red-500 border-red-200",              icon: XCircle     },
  APPROVED:  { label: "Approved",  badge: "bg-accent-50 text-accent border-accent/20",          icon: CheckCircle },
  REJECTED:  { label: "Rejected",  badge: "bg-red-50 text-red-500 border-red-200",              icon: XCircle     },
  SUSPENDED: { label: "Suspended", badge: "bg-orange-50 text-orange-500 border-orange-200",     icon: AlertCircle },
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [pendingApps, setPendingApps] = useState([]);
  const [recentOrders,setRecentOrders]= useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats().catch(() => ({ data: {} })),
      vendorApi.list().catch(() => ({ data: [] })),
      adminApi.getBookings().catch(() => ({ data: [] })),
    ]).then(([{ data: sData }, { data: vData }, { data: bData }]) => {
      // stats card data
      const s = sData.stats || sData;
      setStats({
        totalUsers:       s.totalUsers       ?? 0,
        pendingApprovals: s.pendingApprovals  ?? 0,
        activeOrders:     s.activeOrders      ?? 0,
        activeGigs:       s.activeGigs        ?? 0,
      });

      // pending seller applications (top 3)
      const vendors = vData.vendors || vData || [];
      const pending = vendors
        .filter(v => (v.sellerStatus || "").toUpperCase() === "PENDING")
        .slice(0, 3)
        .map(v => ({
          id:           v.id,
          name:         v.user?.name       || v.name       || "Vendor",
          avatar:       v.user?.avatar     || v.avatar     || "",
          businessName: v.businessName     || "",
          status:       "PENDING",
        }));
      setPendingApps(pending);

      // recent orders (top 4)
      const bookings = bData.bookings || bData || [];
      const recent = bookings.slice(0, 4).map(b => ({
        id:     b.id,
        buyer:  b.buyer?.name || "Buyer",
        seller: b.gig?.vendor?.businessName || "Vendor",
        amount: b.totalAmount || 0,
        status: (b.status || "PENDING").toUpperCase(),
      }));
      setRecentOrders(recent);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Total Users",       value: stats.totalUsers,       icon: Users,        color: "bg-primary-50 text-primary"    },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock,        color: "bg-secondary-50 text-secondary" },
    { label: "Active Orders",     value: stats.activeOrders,     icon: ShoppingCart, color: "bg-accent-50 text-accent"      },
    { label: "Active Gigs",       value: stats.activeGigs,       icon: Package,      color: "bg-purple-50 text-purple-600"  },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending applications alert */}
      {pendingApps.length > 0 && (
        <div
          className="bg-secondary-50 border border-secondary/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary-50/80 transition-colors"
          onClick={() => navigate("/admin/sellers")}
        >
          <div className="w-10 h-10 bg-secondary text-white rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary">
              {stats?.pendingApprovals || pendingApps.length} Seller Application{(stats?.pendingApprovals || pendingApps.length) !== 1 ? "s" : ""} Awaiting Review
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Review and approve or reject seller applications</p>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary flex-shrink-0" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent seller applications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Recent Applications
            </h2>
            <button
              onClick={() => navigate("/admin/sellers")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {pendingApps.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <UserCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No pending applications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingApps.map(seller => {
                const cfg  = statusCfg[seller.status] || statusCfg.PENDING;
                const Icon = cfg.icon;
                return (
                  <div
                    key={seller.id}
                    onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <img
                      src={seller.avatar || undefined}
                      alt={seller.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{seller.name}</p>
                      <p className="text-xs text-gray-400">{seller.businessName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.badge}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Recent Orders
            </h2>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(order => {
                const cfg  = statusCfg[order.status] || statusCfg.PENDING;
                const Icon = cfg.icon;
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 font-mono">{order.id?.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 truncate">{order.buyer} → {order.seller}</p>
                    </div>
                    <p className="text-xs font-semibold text-primary flex-shrink-0">LKR {order.amount.toLocaleString()}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${cfg.badge}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
