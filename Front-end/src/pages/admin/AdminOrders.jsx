// AdminOrders.jsx — connected to real bookings API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { adminApi } from "../../services/adminApi";

const TABS = ["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

const statusCfg = {
  PENDING:   { label: "Pending",   badge: "bg-secondary-50 text-secondary border-secondary/20", icon: Clock        },
  CONFIRMED: { label: "Confirmed", badge: "bg-accent-50 text-accent border-accent/20",          icon: CheckCircle  },
  COMPLETED: { label: "Completed", badge: "bg-primary-50 text-primary border-primary/20",       icon: CheckCircle  },
  CANCELLED: { label: "Cancelled", badge: "bg-red-50 text-red-500 border-red-200",              icon: XCircle      },
};

const tabLabel = {
  all: "All", PENDING: "Pending", CONFIRMED: "Confirmed", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");

  useEffect(() => {
    adminApi.getBookings()
      .then(({ data }) => {
        const raw = data.bookings || data || [];
        setOrders(raw.map(b => ({
          id:        b.id,
          buyer:     b.buyer?.name || "Buyer",
          seller:    b.gig?.vendor?.businessName || "Vendor",
          service:   b.gig?.title || "Service",
          eventDate: b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-LK") : "—",
          amount:    b.totalAmount || 0,
          status:    (b.status || "PENDING").toUpperCase(),
          buyerId:   b.buyerId,
        })));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? orders : orders.filter(o => o.status === tab);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {loading ? "Loading…" : `${orders.length} platform orders`}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(t => {
          const count = t === "all" ? orders.length : orders.filter(o => o.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tabLabel[t]} ({loading ? "…" : count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Order ID</th>
                    <th className="px-5 py-3 font-medium">Buyer</th>
                    <th className="px-5 py-3 font-medium">Seller</th>
                    <th className="px-5 py-3 font-medium">Service</th>
                    <th className="px-5 py-3 font-medium">Event Date</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(order => {
                    const cfg  = statusCfg[order.status] || statusCfg.PENDING;
                    const Icon = cfg.icon;
                    return (
                      <tr key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-5 py-3.5 font-semibold text-gray-700 font-mono text-xs">{order.id?.slice(0, 8).toUpperCase()}</td>
                        <td className="px-5 py-3.5 text-gray-700">{order.buyer}</td>
                        <td className="px-5 py-3.5 text-gray-500">{order.seller}</td>
                        <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">{order.service}</td>
                        <td className="px-5 py-3.5 text-gray-500">{order.eventDate}</td>
                        <td className="px-5 py-3.5 font-semibold text-primary">LKR {order.amount.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
