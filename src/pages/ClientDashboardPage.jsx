import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  MessageSquare,
  Bell,
  Settings,
  UserCircle2,
  MapPin,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { vendors, brand } from "../src-data";

const myBookings = [
  {
    id: "BK-101",
    vendor: "Amazing Wedding Planners",
    package: "Gold Package",
    date: "Oct 24, 2026",
    totalAmount: "LKR 150,000",
    paidAmount: "LKR 50,000",
    pendingAmount: "LKR 100,000",
    status: "Confirmed",
    paymentStatus: "Partially Paid",
  },
  {
    id: "BK-102",
    vendor: "Glow Party Hub",
    package: "Platinum Package",
    date: "Dec 15, 2026",
    totalAmount: "LKR 280,000",
    paidAmount: "LKR 280,000",
    pendingAmount: "LKR 0",
    status: "In Progress",
    paymentStatus: "Fully Paid",
  },
];

const mockMessages = [
  {
    sender: "Amazing Wedding Planners",
    time: "10:30 AM",
    text: "We have updated the floral arrangements as requested.",
    unread: true,
  },
  {
    sender: "Glow Party Hub",
    time: "Yesterday",
    text: "The DJ setup will be completed by 4 PM on the event day.",
    unread: false,
  },
];

function AppButton({ children, onClick, variant = "primary", className = "" }) {
  const base =
    "rounded-full px-5 py-3 text-sm font-semibold transition duration-300 flex items-center justify-center gap-2";
  const style =
    variant === "primary"
      ? { backgroundColor: brand.primary, color: "white" }
      : { backgroundColor: "white", color: "#0f172a", border: "1px solid #e2e8f0" };

  return (
    <button onClick={onClick} className={`${base} ${className}`} style={style}>
      {children}
    </button>
  );
}

export default function ClientDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state || { email: "client@vizhiyal.com", role: "Client" };

  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const Sidebar = () => (
    <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm h-fit">
      <div className="mb-5 text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
        Client Menu
      </div>
      <div className="space-y-3">
        {[
          { id: "overview", icon: LayoutDashboard, label: "Dashboard Overview" },
          { id: "search", icon: Search, label: "Find Vendors" },
          { id: "bookings", icon: CalendarDays, label: "My Bookings & Payments" },
          { id: "messages", icon: MessageSquare, label: "Messages" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition"
            style={
              activeTab === item.id
                ? { backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }
                : { color: "#475569" }
            }
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </div>
    </aside>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-500">Upcoming Events</div>
          <div className="mt-3 text-3xl font-black text-slate-950">2</div>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-500">Total Spent</div>
          <div className="mt-3 text-3xl font-black text-slate-950">LKR 330k</div>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-500">Unread Messages</div>
          <div className="mt-3 text-3xl font-black text-slate-950">1</div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Recent Notifications</h3>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <CheckCircle2 style={{ color: brand.accent }} />
            Your booking with Amazing Wedding Planners is confirmed.
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <CreditCard style={{ color: brand.secondary }} />
            Payment reminder: LKR 100,000 due for BK-101.
          </div>
        </div>
      </div>
    </div>
  );

  const SearchTab = () => {
    const filtered = vendors.filter(
      (v) =>
        v.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm outline-none"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((vendor) => (
            <div
              key={vendor.id}
              className="flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <img
                  src={vendor.image}
                  alt={vendor.company}
                  className="mb-4 h-32 w-full rounded-xl object-cover"
                />
                <h4 className="text-lg font-bold text-slate-900">{vendor.company}</h4>
                <div className="mb-2 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin size={14} /> {vendor.location} • {vendor.category}
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">{vendor.short}</p>
              </div>

              <AppButton
                className="mt-4 w-full"
                onClick={() => navigate(`/vendor/${vendor.id}`)}
              >
                View Packages & Book
              </AppButton>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BookingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900">My Bookings & Payment Summary</h3>
      <div className="space-y-4">
        {myBookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-slate-500">
                  Booking ID: {booking.id} • {booking.date}
                </div>
                <h4 className="text-lg font-bold text-slate-900">{booking.vendor}</h4>
                <div className="text-sm font-semibold" style={{ color: brand.primary }}>
                  {booking.package}
                </div>
              </div>
              <span
                className="h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent }}
              >
                {booking.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <div className="text-slate-500">Total Amount</div>
                <div className="font-bold text-slate-900">{booking.totalAmount}</div>
              </div>
              <div>
                <div className="text-slate-500">Paid Amount</div>
                <div className="font-bold text-slate-900">{booking.paidAmount}</div>
              </div>
              <div>
                <div className="text-slate-500">Pending Amount</div>
                <div className="font-bold" style={{ color: brand.secondary }}>
                  {booking.pendingAmount}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Payment Status</div>
                <div className="font-bold text-slate-900">{booking.paymentStatus}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const MessagesTab = () => (
    <div className="flex h-[600px] flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Vendor Messages</h3>
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {mockMessages.map((msg, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                {msg.sender}
                {msg.unread && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: brand.accent }}
                  />
                )}
              </div>
              <span className="text-xs text-slate-500">{msg.time}</span>
            </div>
            <p className="text-sm text-slate-700">{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
        <input
          type="text"
          placeholder="Type a message to a vendor..."
          className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none"
        />
        <AppButton>Send</AppButton>
      </div>
    </div>
  );

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] pb-20">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
              <UserCircle2 size={34} style={{ color: brand.primary }} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
                Client Dashboard
              </div>
              <div className="text-2xl font-black text-slate-950">
                Welcome back, {user?.email ? user.email.split("@")[0] : "Client"}!
              </div>
              <div className="mt-1 text-sm text-slate-500">Plan and manage your events</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Bell size={16} /> Notifications
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Settings size={16} /> Settings
            </button>
            <AppButton onClick={() => navigate("/")}>Back to Home</AppButton>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Sidebar />
          <div className="min-h-[500px]">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "search" && <SearchTab />}
            {activeTab === "bookings" && <BookingsTab />}
            {activeTab === "messages" && <MessagesTab />}
          </div>
        </div>
      </div>
    </section>
  );
}