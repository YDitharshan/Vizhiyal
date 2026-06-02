// SellerOrders.jsx — connected to real booking API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, XCircle, ShoppingCart, ChevronRight, Loader2 } from "lucide-react";
import { bookingApi } from "../../services/bookingApi";

const TABS = ["all", "pending", "confirmed", "completed", "cancelled"];

const statusCfg = {
  PENDING:   { label: "Pending",   icon: Clock,       badge: "bg-secondary-50 text-secondary border border-secondary/20" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle, badge: "bg-accent-50 text-accent border border-accent/20"         },
  COMPLETED: { label: "Completed", icon: CheckCircle, badge: "bg-primary-50 text-primary border border-primary/20"      },
  CANCELLED: { label: "Cancelled", icon: XCircle,     badge: "bg-red-50 text-red-500 border border-red-200"             },
};

function adaptOrder(b) {
  return {
    id:          b.id,
    buyer:       b.buyer?.name || "Buyer",
    buyerAvatar: b.buyer?.avatar || "",
    gig:         b.gig?.title   || "Service",
    package:     b.packageType  || "Basic",
    eventDate:   new Date(b.eventDate).toLocaleDateString("en-LK"),
    amount:      b.totalAmount  || 0,
    status:      (b.status || "PENDING").toUpperCase(),
  };
}

export default function SellerOrders() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");

  useEffect(() => {
    bookingApi.getSeller()
      .then(({ data }) => {
        const raw = data.bookings || data || [];
        setOrders(raw.map(adaptOrder));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const statusMatch = (order, t) => t === "all" || order.status === t.toUpperCase();
  const filtered = orders.filter(o => statusMatch(o, tab));
  const countFor = (t) => t === "all" ? orders.length : orders.filter(o => o.status === t.toUpperCase()).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {loading ? "Loading…" : `${orders.length} total orders`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)} ({loading ? "…" : countFor(t)})
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No orders in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg  = statusCfg[order.status] || statusCfg.PENDING;
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Buyer info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={order.buyerAvatar}
                      alt={order.buyer}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{order.buyer}</p>
                      <p className="text-xs text-gray-500 truncate">{order.gig} · {order.package} Package</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
                    <span>Event: {order.eventDate}</span>
                    <span className="font-semibold text-primary text-sm">LKR {order.amount.toLocaleString()}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium border ${cfg.badge}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* View */}
                  <button
                    onClick={() => navigate(`/seller/orders/${order.id}`)}
                    className="flex-shrink-0 flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                  >
                    View <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
