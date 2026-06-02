// SellerLayout — wrapper for all seller (vendor) pages
// Top navbar: logo + Switch to Buyer + avatar only
// Sidebar: full nav with unread badges on Messages & Notifications

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationApi } from "../services/notificationApi";
import {
  LayoutDashboard, Package, MessageSquare,
  DollarSign, Bell, UserCircle, ShoppingCart,
  Menu, X, LogOut, ArrowLeftRight, Headphones,
  AlertTriangle, Info, Megaphone, Star, CalendarDays,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotificationPoll } from "../hooks/useNotificationPoll";
import UserAvatar from "../components/common/UserAvatar";


const NAV_ITEMS = [
  { label: "Dashboard",     icon: LayoutDashboard, path: "/seller"               },
  { label: "My Gigs",       icon: Package,         path: "/seller/gigs"          },
  { label: "Orders",        icon: ShoppingCart,    path: "/seller/orders"        },
  { label: "Messages",      icon: MessageSquare,   path: "/seller/messages"      },
  { label: "Earnings",      icon: DollarSign,      path: "/seller/earnings"      },
  { label: "Reviews",       icon: Star,            path: "/seller/reviews"       },
  { label: "Availability",  icon: CalendarDays,    path: "/seller/availability"  },
  { label: "Notifications", icon: Bell,            path: "/seller/notifications" },
  { label: "Support",       icon: Headphones,      path: "/seller/support"       },
  // Profile accessible via avatar in top navbar
];

function NavButton({ item, isActive, onClick, unread = 0 }) {
  const { label, icon: Icon, path } = item;
  const active = isActive(path);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {unread > 0 && (
        <span className={`text-xs font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ${
          active ? "bg-white text-primary" : "bg-primary text-white"
        }`}>
          {unread}
        </span>
      )}
    </button>
  );
}

export default function SellerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout, switchRole } = useAuth();

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [banners,      setBanners]      = useState([]);

  // Live unread notification count (polls every 30 s)
  const { unreadCount } = useNotificationPoll();

  // Fetch real announcement banners from backend
  useEffect(() => {
    notificationApi.getAnnouncementBanners()
      .then(({ data }) => setBanners(data.announcements || []))
      .catch(() => setBanners([]));
  }, []);

  const isActive = (path) =>
    path === "/seller"
      ? location.pathname === "/seller"
      : location.pathname.startsWith(path);

  const handleSwitchToBuyer = () => {
    switchRole();
    navigate("/home");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const annIcon = (priority) => {
    if (priority === "high")   return <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
    if (priority === "medium") return <Megaphone className="w-4 h-4 flex-shrink-0" />;
    return <Info className="w-4 h-4 flex-shrink-0" />;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">

      {/* ── Top Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-16 px-4 sm:px-6 flex items-center gap-3">

          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <button
            onClick={() => navigate("/seller")}
            className="text-primary text-xl font-bold tracking-tight select-none"
          >
            vizhiyal<span className="text-secondary">.</span>
            <span className="ml-2 text-xs font-semibold bg-secondary text-white px-2 py-0.5 rounded-full align-middle">
              Seller
            </span>
          </button>

          <div className="flex-1" />

          {/* Switch to Buyer — only here, not in sidebar */}
          <button
            onClick={handleSwitchToBuyer}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="hidden sm:inline">Switch to Buyer</span>
          </button>

          {/* Avatar */}
          <div className="cursor-pointer" onClick={() => navigate("/seller/profile")}>
            <UserAvatar
              src={auth?.avatar}
              name={auth?.name}
              size={32}
              className="border-2 border-secondary"
            />
          </div>
        </div>
      </header>

      {/* ── Announcement Banners ─────────────────────────────────────── */}
      {banners.map(ann => {
        const priority = ann.priority || "low";
        return (
          <div
            key={ann.id}
            className={`flex items-start gap-3 px-4 py-2.5 text-sm flex-shrink-0 ${
              priority === "high"
                ? "bg-red-50 border-b border-red-100 text-red-700"
                : priority === "medium"
                ? "bg-secondary-50 border-b border-secondary/20 text-secondary"
                : "bg-blue-50 border-b border-blue-100 text-blue-700"
            }`}
          >
            {annIcon(priority)}
            <span className="flex-1">
              <span className="font-semibold">{ann.title}: </span>
              {ann.message || ann.body}
            </span>
            <button
              onClick={async () => {
                await notificationApi.markOneRead(ann.id).catch(() => {});
                setBanners(prev => prev.filter(b => b.id !== ann.id));
              }}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar (desktop) ─────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 py-4 flex-shrink-0">
          <nav className="flex-1 px-3 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <NavButton
                key={item.path}
                item={item}
                isActive={isActive}
                onClick={() => navigate(item.path)}
                unread={item.path === "/seller/notifications" ? unreadCount : 0}
              />
            ))}
          </nav>

          {/* Sign out only — Switch to Buyer is in top navbar */}
          <div className="px-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Mobile Sidebar Drawer ──────────────────────────────────── */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-white shadow-2xl flex flex-col py-4">
              <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-primary font-bold text-lg">
                  vizhiyal<span className="text-secondary">.</span>
                </span>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <nav className="flex-1 px-3 space-y-0.5">
                {NAV_ITEMS.map(item => (
                  <NavButton
                    key={item.path}
                    item={item}
                    isActive={isActive}
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    unread={item.path === "/seller/notifications" ? unreadCount : 0}
                  />
                ))}
              </nav>

              <div className="px-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </aside>
          </>
        )}

        {/* ── Page content ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
