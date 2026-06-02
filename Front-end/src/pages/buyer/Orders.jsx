// Orders — my orders page with status tab filter
// Each tab shows orders matching that status.
// Empty state uses animated Lucide icons when no orders exist.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag, CheckCircle, Clock, XCircle,
  Package, MessageSquare, ChevronRight, Search,
  CalendarDays, ReceiptText, Download,
} from "lucide-react";
import { bookingApi } from "../../services/bookingApi";
import { adaptBooking } from "../../utils/adapters";
import { downloadCSV } from "../../utils/exportUtils";
import UserAvatar from "../../components/common/UserAvatar";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: "all",       label: "All Orders"  },
  { key: "pending",   label: "Pending"     },
  { key: "confirmed", label: "Confirmed"   },
  { key: "completed", label: "Completed"   },
  { key: "cancelled", label: "Cancelled"   },
];

const statusConfig = {
  confirmed: {
    badge:  "bg-accent-50 text-accent border border-accent/20",
    dot:    "bg-accent",
    icon:   CheckCircle,
    label:  "Confirmed",
  },
  pending: {
    badge:  "bg-secondary-50 text-secondary border border-secondary/20",
    dot:    "bg-secondary",
    icon:   Clock,
    label:  "Pending",
  },
  completed: {
    badge:  "bg-gray-100 text-gray-500 border border-gray-200",
    dot:    "bg-gray-400",
    icon:   CheckCircle,
    label:  "Completed",
  },
  cancelled: {
    badge:  "bg-red-50 text-red-500 border border-red-100",
    dot:    "bg-red-400",
    icon:   XCircle,
    label:  "Cancelled",
  },
};

const emptyConfig = {
  all: {
    title: "No orders yet",
    sub:   "Start by browsing vendors and sending a request for your event.",
    showCTA: true,
  },
  pending: {
    title: "No pending orders",
    sub:   "Orders waiting for vendor confirmation will appear here.",
    showCTA: true,
  },
  confirmed: {
    title: "No confirmed orders",
    sub:   "Once a vendor confirms your request, it will show up here.",
    showCTA: true,
  },
  completed: {
    title: "No completed orders",
    sub:   "Orders for past events will be archived here after completion.",
    showCTA: false,
  },
  cancelled: {
    title: "No cancelled orders",
    sub:   "You haven't cancelled any orders. Keep it up!",
    showCTA: false,
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Orders() {
  const navigate = useNavigate();
  const [active,   setActive]   = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    bookingApi.getMy()
      .then(({ data }) => setBookings((data.bookings || []).map(adaptBooking)))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = active === "all"
    ? bookings
    : bookings.filter((b) => b.status === active);

  function countFor(key) {
    return key === "all" ? bookings.length : bookings.filter(b => b.status === key).length;
  }

  function handleExportCSV() {
    const headers = ["Order ID", "Vendor", "Service", "Event Date", "Status", "Amount (LKR)"];
    const rows    = filtered.map(b => [
      b.id,
      b.vendorName || "Vendor",
      b.service    || "Service",
      b.date       || "",
      b.status,
      b.amount ?? 0,
    ]);
    const label = active === "all" ? "all" : active;
    const date  = new Date().toISOString().slice(0, 10);
    downloadCSV(headers, rows, `vizhiyal-orders-${label}-${date}.csv`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <p className="text-sm text-gray-400 mt-1">
            {loading ? "Loading…" : `${bookings.length} total order${bookings.length !== 1 ? "s" : ""} across all statuses`}
          </p>
        </div>
        {!loading && filtered.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* ── Status tab bar ──────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar bg-gray-100 rounded-2xl p-1.5 mb-6">
        {STATUS_TABS.map(({ key, label }) => {
          const count     = countFor(key);
          const isActive  = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              <span className={`text-xs min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Order cards / Empty state ──────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg        = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Status colour stripe */}
                <div className={`h-1 w-full ${cfg.dot}`} />

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">

                  {/* Vendor avatar */}
                  <div className="relative flex-shrink-0">
                    <UserAvatar src={""} name={order.vendorName} size={56} className="rounded-xl flex-shrink-0" />
                    {/* Online dot for pending */}
                    {order.status === "pending" && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>

                  {/* Order details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-800 truncate">
                        {order.vendorName}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                      <ReceiptText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {order.service}
                    </p>

                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                      Event date: <span className="font-medium text-gray-500">{order.date}</span>
                      <span className="ml-2 text-gray-300">·</span>
                      <span>Order #{order.id}</span>
                    </p>
                  </div>

                  {/* Amount + action buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 flex-shrink-0">
                    <p className="text-lg font-bold text-primary">
                      LKR {order.amount.toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/messages/${order.vendorId}`)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-primary border border-gray-200 hover:border-primary px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="flex items-center gap-1.5 text-xs font-medium bg-primary text-white hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState statusKey={active} onBrowse={() => navigate("/search")} />
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ statusKey, onBrowse }) {
  const cfg = emptyConfig[statusKey] || emptyConfig.all;

  // Pick an icon pair that feels right for the tab
  const iconMap = {
    all:       { main: Package,     accent: ShoppingBag },
    pending:   { main: Clock,       accent: ShoppingBag },
    confirmed: { main: CheckCircle, accent: ShoppingBag },
    completed: { main: CheckCircle, accent: ReceiptText  },
    cancelled: { main: XCircle,     accent: Package      },
  };
  const { main: MainIcon, accent: AccentIcon } = iconMap[statusKey] || iconMap.all;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">

      {/* Animated icon composition */}
      <div className="relative mb-8">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-40 scale-110" />

        {/* Main icon circle */}
        <div className="relative w-28 h-28 bg-gradient-to-br from-primary-50 to-primary/10 rounded-full flex items-center justify-center border border-primary/10">
          <MainIcon className="w-12 h-12 text-primary/50" />
        </div>

        {/* Bouncing accent badge */}
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-primary-50 rounded-full shadow-lg flex items-center justify-center animate-bounce">
          <AccentIcon className="w-5 h-5 text-secondary" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-700 mb-2">{cfg.title}</h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-8">{cfg.sub}</p>

      {cfg.showCTA && (
        <button
          onClick={onBrowse}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
        >
          <Search className="w-4 h-4" />
          Browse Vendors
        </button>
      )}
    </div>
  );
}
