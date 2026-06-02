// AdminOrderDetail.jsx — connected to real bookings API
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Clock, CheckCircle, XCircle, User,
  Calendar, DollarSign, Package, AlertTriangle, Loader2,
} from "lucide-react";
import { bookingApi } from "../../services/bookingApi";
import { adminApi } from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const statusCfg = {
  PENDING:   { label: "Pending",   badge: "bg-secondary-50 text-secondary border-secondary/20",  icon: Clock        },
  CONFIRMED: { label: "Confirmed", badge: "bg-accent-50 text-accent border-accent/20",           icon: CheckCircle  },
  COMPLETED: { label: "Completed", badge: "bg-primary-50 text-primary border-primary/20",        icon: CheckCircle  },
  CANCELLED: { label: "Cancelled", badge: "bg-red-50 text-red-500 border-red-200",               icon: XCircle      },
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [status,     setStatus]     = useState("PENDING");
  const [updating,   setUpdating]   = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    bookingApi.getById(id)
      .then(({ data }) => {
        const b = data.booking || data;
        const s = (b.status || "PENDING").toUpperCase();
        setOrder({
          id:        b.id,
          buyer:     b.buyer?.name   || "Buyer",
          buyerEmail:b.buyer?.email  || "",
          buyerAvatar:b.buyer?.avatar|| "",
          buyerId:   b.buyerId,
          seller:    b.gig?.vendor?.businessName || "Vendor",
          service:   b.gig?.title    || "Service",
          eventDate: b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-LK") : "—",
          amount:    b.totalAmount   || 0,
          createdAt: new Date(b.createdAt).toLocaleDateString("en-LK"),
        });
        setStatus(s);
      })
      .catch(() => setError("Order not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(newStatus) {
    setUpdating(true);
    try {
      await adminApi.updateBooking(id, { status: newStatus });
      setStatus(newStatus);
    } catch { /* silent */ } finally { setUpdating(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">{error || "Order not found."}</p>
          <button onClick={() => navigate("/admin/orders")} className="mt-3 text-sm text-primary hover:underline">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const cfg  = statusCfg[status] || statusCfg.PENDING;
  const Icon = cfg.icon;
  const isFinished = status === "COMPLETED" || status === "CANCELLED";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/orders")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-800 font-mono">{order.id?.slice(0, 8).toUpperCase()}</h1>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.badge}`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Placed on {order.createdAt}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Buyer
            </h2>
            <div className="flex items-center gap-3">
              <img
                src={order.buyerAvatar || undefined}
                alt={order.buyer}
                className="w-11 h-11 rounded-full object-cover"
                onError={e => { e.target.style.display = "none"; }}
              />
              <div>
                <p className="font-semibold text-gray-800">{order.buyer}</p>
                {order.buyerEmail && <p className="text-xs text-gray-400">{order.buyerEmail}</p>}
                <button
                  onClick={() => navigate(`/admin/users/${order.buyerId}`)}
                  className="text-xs text-primary hover:underline mt-0.5"
                >
                  View profile
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-2">Order Details</h2>
            <InfoRow icon={Package}    label="Service"    value={order.service} />
            <InfoRow icon={User}       label="Seller"     value={order.seller} />
            <InfoRow icon={Calendar}   label="Event Date" value={order.eventDate} />
            <InfoRow icon={DollarSign} label="Amount"     value={`LKR ${order.amount.toLocaleString()}`} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Status Timeline</h2>
            <div className="space-y-3">
              {["PENDING", "CONFIRMED", "COMPLETED"].map((s, i) => {
                const steps    = ["PENDING", "CONFIRMED", "COMPLETED"];
                const passed   = steps.indexOf(status) >= i;
                const isCancelled = status === "CANCELLED";
                const active   = status === s;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isCancelled && s === "PENDING" ? "bg-red-100 text-red-500" :
                      passed ? "bg-accent text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                      {isCancelled && s === "PENDING" ? <XCircle className="w-4 h-4" /> :
                       passed ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <p className={`text-sm font-medium ${
                      active ? "text-gray-800" : passed ? "text-gray-600" : "text-gray-400"
                    }`}>
                      {s === "PENDING" && isCancelled ? "Cancelled" : s.charAt(0) + s.slice(1).toLowerCase()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Admin Actions</h2>

            {!isFinished && (
              <>
                {status === "PENDING" && (
                  <button
                    onClick={() => changeStatus("CONFIRMED")}
                    disabled={updating}
                    className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl hover:bg-accent/90 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirm Order
                  </button>
                )}
                {status === "CONFIRMED" && (
                  <button
                    onClick={() => changeStatus("COMPLETED")}
                    disabled={updating}
                    className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Mark Completed
                  </button>
                )}
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={updating}
                  className="w-full border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" /> Cancel Order
                </button>
              </>
            )}

            {isFinished && (
              <div className={`text-center py-3 rounded-xl text-sm font-medium ${
                status === "COMPLETED" ? "bg-accent-50 text-accent" : "bg-red-50 text-red-500"
              }`}>
                {status === "COMPLETED" ? "Order completed" : "Order cancelled"}
              </div>
            )}

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Status changes are final and visible to both buyer and seller.
              </div>
            </div>
          </div>

          <div className="bg-primary text-white rounded-2xl p-5">
            <p className="text-xs font-medium opacity-70 mb-1">Order Value</p>
            <p className="text-2xl font-bold">LKR {order.amount.toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-1">
              {status === "COMPLETED" ? "Released to seller" : status === "CANCELLED" ? "Refunded to buyer" : "Held in escrow"}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showCancel}
        title="Cancel this order?"
        description="This order will be permanently cancelled. The buyer will be notified and any escrow amount will be refunded."
        confirmLabel="Cancel Order"
        onConfirm={() => { changeStatus("CANCELLED"); setShowCancel(false); }}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );
}
