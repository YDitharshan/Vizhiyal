// AdminUserDetail.jsx — connected to real admin users API
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, MapPin, Phone, Calendar,
  ShoppingCart, DollarSign, Clock, CheckCircle, XCircle, Loader2,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const statusCfg = {
  PENDING:   { label: "Pending",   badge: "bg-secondary-50 text-secondary border-secondary/20", icon: Clock       },
  CONFIRMED: { label: "Confirmed", badge: "bg-accent-50 text-accent border-accent/20",          icon: CheckCircle },
  COMPLETED: { label: "Completed", badge: "bg-primary-50 text-primary border-primary/20",       icon: CheckCircle },
  CANCELLED: { label: "Cancelled", badge: "bg-red-50 text-red-500 border-red-200",              icon: XCircle     },
};

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user,          setUser]          = useState(null);
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [status,        setStatus]        = useState("active");
  const [confirmAction, setConfirmAction] = useState(null);
  const [updating,      setUpdating]      = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.getUserById(id),
      adminApi.getBookings({ buyerId: id }),
    ])
      .then(([{ data: uData }, { data: bData }]) => {
        const u = uData.user || uData;
        const st = (u.status || "ACTIVE").toUpperCase() === "SUSPENDED" ? "suspended" : "active";
        setUser({
          id:         u.id,
          name:       u.name   || "User",
          email:      u.email  || "",
          avatar:     u.avatar || "",
          phone:      u.phone  || "",
          location:   u.location || "",
          joined:     u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-LK") : "—",
          totalSpent: u.totalSpent || 0,
        });
        setStatus(st);

        const raw = bData.bookings || bData || [];
        setOrders(raw.map(b => ({
          id:        b.id,
          service:   b.gig?.title || "Service",
          seller:    b.gig?.vendor?.businessName || "Vendor",
          eventDate: b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-LK") : "—",
          amount:    b.totalAmount || 0,
          status:    (b.status || "PENDING").toUpperCase(),
        })));
      })
      .catch(() => setError("User not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction() {
    const newStatus = status === "active" ? "SUSPENDED" : "ACTIVE";
    setUpdating(true);
    try {
      await adminApi.updateUserStatus(id, { status: newStatus });
      setStatus(newStatus === "SUSPENDED" ? "suspended" : "active");
    } catch { /* silent */ } finally { setUpdating(false); setConfirmAction(null); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">{error || "User not found."}</p>
          <button onClick={() => navigate("/admin/users")} className="mt-3 text-sm text-primary hover:underline">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const totalSpent = orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + o.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/users")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">User Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 space-y-5">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={user.avatar || undefined}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
                onError={e => { e.target.style.display = "none"; }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                    status === "active"
                      ? "bg-accent-50 text-accent border-accent/20"
                      : "bg-red-50 text-red-500 border-red-200"
                  }`}>
                    {status === "active" ? "Active" : "Suspended"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{user.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {user.phone}
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {user.location}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Joined {user.joined}
              </div>
            </div>
          </div>

          {/* Order history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800">Order History</h2>
              <p className="text-xs text-gray-400 mt-0.5">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
            </div>
            {orders.length === 0 ? (
              <div className="p-10 text-center">
                <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map(order => {
                  const cfg  = statusCfg[order.status] || statusCfg.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 font-mono">{order.id?.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 truncate">{order.service}</p>
                        <p className="text-xs text-gray-400">{order.seller} · {order.eventDate}</p>
                      </div>
                      <p className="text-sm font-bold text-primary flex-shrink-0">LKR {order.amount.toLocaleString()}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.badge}`}>
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

        {/* Right — stats + actions */}
        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <ShoppingCart className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800">{orders.length}</p>
              <p className="text-xs text-gray-400">Orders</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <DollarSign className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800">{(totalSpent / 1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-400">LKR spent</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Admin Actions</h2>
            {status === "active" ? (
              <button
                onClick={() => setConfirmAction("suspend")}
                disabled={updating}
                className="w-full border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm disabled:opacity-60"
              >
                Suspend Account
              </button>
            ) : (
              <button
                onClick={() => setConfirmAction("reinstate")}
                disabled={updating}
                className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl hover:bg-accent/90 transition-colors text-sm disabled:opacity-60"
              >
                Reinstate Account
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "suspend"}
        title="Suspend this account?"
        description={`${user.name} will lose access to the platform immediately. They will not be able to log in or make bookings until reinstated.`}
        confirmLabel="Suspend"
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "reinstate"}
        title="Reinstate this account?"
        description={`${user.name}'s account will be restored and they will regain full access to the platform.`}
        confirmLabel="Reinstate"
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
