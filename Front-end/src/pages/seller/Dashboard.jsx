// SellerDashboard — 3 states based on sellerStatus + real API data
// pending  → under review screen
// rejected → rejection details + reapply CTA
// approved → full dashboard with live stats

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, XCircle, CheckCircle, AlertCircle, ChevronRight,
  ShoppingCart, Star, Users, DollarSign, MessageSquare,
  BarChart2, TrendingUp, Package, Briefcase, ArrowRight,
  Plus, UserCircle, Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { vendorApi } from "../../services/vendorApi";
import UserAvatar from "../../components/common/UserAvatar";
import { bookingApi } from "../../services/bookingApi";
import { messageApi } from "../../services/messageApi";

const COMMISSION = 0.15;

const statusCfg = {
  CONFIRMED: { badge: "bg-accent-50 text-accent border border-accent/20",          label: "Confirmed", icon: CheckCircle },
  PENDING:   { badge: "bg-secondary-50 text-secondary border border-secondary/20", label: "Pending",   icon: Clock       },
  COMPLETED: { badge: "bg-primary-50 text-primary border border-primary/20",       label: "Completed", icon: CheckCircle },
  CANCELLED: { badge: "bg-red-50 text-red-500 border border-red-200",              label: "Cancelled", icon: XCircle     },
};

// ── Sub-screens ───────────────────────────────────────────────────────────────
function PendingScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-secondary-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-10 h-10 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Under Review</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Your seller application has been submitted and is currently being reviewed by our admin team.
          You will receive a notification once a decision is made — usually within 2–3 business days.
        </p>
        <div className="bg-secondary-50 border border-secondary/20 rounded-xl p-4 text-left mb-6 space-y-2">
          {["Profile & business details", "Categories selected", "Experience & bio"].map(step => (
            <div key={step} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />{step}
            </div>
          ))}
          <div className="flex items-center gap-2 text-sm text-secondary font-medium">
            <Clock className="w-4 h-4 flex-shrink-0" />
            Admin verification — in progress
          </div>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

function RejectedScreen({ reason }) {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Not Approved</h2>
        <p className="text-sm text-gray-500 mb-4">
          Unfortunately your seller application was not approved. Please review the reason below and resubmit.
        </p>
        {reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Reason from Admin</p>
                <p className="text-sm text-red-600">{reason}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate("/become-seller")}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mb-3"
        >
          Edit & Reapply <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("/home")}
          className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

function ApprovedDashboard({ auth, navigate }) {
  const [vendor,        setVendor]        = useState(null);
  const [bookings,      setBookings]      = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      vendorApi.getMyProfile().catch(() => ({ data: null })),
      bookingApi.getSeller().catch(() => ({ data: { bookings: [] } })),
      messageApi.getConversations().catch(() => ({ data: { conversations: [] } })),
    ]).then(([{ data: vData }, { data: bData }, { data: cData }]) => {
      setVendor(vData?.vendor || vData);
      setBookings(bData.bookings || bData || []);
      setConversations((cData.conversations || cData || []).slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────
  const activeOrders  = bookings.filter(b => ["PENDING","CONFIRMED"].includes((b.status||"").toUpperCase()));
  const netEarnings   = bookings
    .filter(b => (b.status||"").toUpperCase() === "COMPLETED")
    .reduce((s, b) => s + Math.round((b.totalAmount || 0) * (1 - COMMISSION)), 0);
  const uniqueBuyers  = new Set(bookings.map(b => b.buyerId)).size;

  const sellerStats = [
    { label: "Total Earnings",  value: `LKR ${netEarnings.toLocaleString()}`, icon: DollarSign,   color: "bg-accent-50    text-accent"     },
    { label: "Active Orders",   value: String(activeOrders.length),           icon: ShoppingCart, color: "bg-primary-50   text-primary"    },
    { label: "Avg. Rating",     value: (vendor?.avgRating || 0).toFixed(1),   icon: Star,         color: "bg-secondary-50 text-secondary"  },
    { label: "Total Customers", value: String(uniqueBuyers),                  icon: Users,        color: "bg-purple-50    text-purple-600" },
  ];

  const recentActive = activeOrders.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {auth?.name?.split(" ")[0] ?? "Seller"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Here is your business overview</p>
        </div>
        <button
          onClick={() => navigate("/seller/gigs/create")}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Gig
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sellerStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Recent conversations / incoming requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Recent Messages
            </h2>
            {conversations.some(c => c.unreadCount > 0) && (
              <span className="text-xs bg-primary text-white font-semibold px-2 py-0.5 rounded-full">
                {conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)} unread
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {conversations.map(conv => {
                const other = conv.buyer || conv.seller || conv.otherUser || {};
                return (
                  <div key={conv.id} className="flex items-center gap-4 px-5 py-4">
                    <UserAvatar src={other.avatar} name={other.name || "User"} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{other.name || "User"}</p>
                        {conv.unreadCount > 0 && (
                          <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">{conv.unreadCount}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content || "No messages"}</p>
                    </div>
                    <button
                      onClick={() => navigate("/seller/messages")}
                      className="flex-shrink-0 text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1"
                    >
                      Reply <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-50">
            <button
              onClick={() => navigate("/seller/messages")}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              View all in Messages <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          <div className="space-y-1">
            {[
              { icon: UserCircle, label: "Edit Profile",    sub: "Update portfolio & details", path: "/seller/profile"  },
              { icon: Package,    label: "My Gigs",         sub: "Manage your services",       path: "/seller/gigs"     },
              { icon: TrendingUp, label: "Earnings Report", sub: "Monthly summary",            path: "/seller/earnings" },
              { icon: Briefcase,  label: "All Orders",      sub: "View order history",         path: "/seller/orders"   },
            ].map(({ icon: Icon, label, sub, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active orders table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            Active Orders
          </h2>
          <button onClick={() => navigate("/seller/orders")} className="text-xs text-primary font-medium hover:underline">
            View all
          </button>
        </div>

        {recentActive.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No active orders right now</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Buyer</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Event Date</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentActive.map(b => {
                  const statusKey = (b.status || "PENDING").toUpperCase();
                  const cfg  = statusCfg[statusKey] || statusCfg.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-semibold text-gray-700 font-mono">
                        {b.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{b.buyer?.name || "—"}</td>
                      <td className="px-5 py-3.5 text-gray-500">{b.gig?.title || "Service"} — {b.packageType || ""}</td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-LK") : "—"}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-primary">
                        LKR {(b.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/seller/orders/${b.id}`)}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const status = auth?.sellerStatus ?? null;

  if (status === "pending")  return <PendingScreen />;
  if (status === "rejected") return <RejectedScreen reason={auth?.sellerRejectionReason} />;
  return <ApprovedDashboard auth={auth} navigate={navigate} />;
}
