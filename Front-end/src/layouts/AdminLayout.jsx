// AdminLayout — wrapper for admin pages
// Sticky top bar + collapsible sidebar with section groups

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotificationPoll } from "../hooks/useNotificationPoll";
import {
  LayoutDashboard, Users, ShoppingCart, Package,
  UserCheck, Bell, Menu, X, LogOut, Shield, Store,
  BarChart2, Scale, Star, Banknote, Headphones, Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/common/UserAvatar";

const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin"           },
      { label: "Analytics", icon: BarChart2,        path: "/admin/analytics" },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { label: "Applications", icon: UserCheck,   path: "/admin/sellers"  },
      { label: "Vendors",      icon: Store,        path: "/admin/vendors"  },
      { label: "Users",        icon: Users,        path: "/admin/users"    },
      { label: "Orders",       icon: ShoppingCart, path: "/admin/orders"   },
      { label: "Gigs",         icon: Package,      path: "/admin/gigs"     },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Disputes",      icon: Scale,      path: "/admin/disputes" },
      { label: "Reviews",       icon: Star,       path: "/admin/reviews"  },
      { label: "Payouts",       icon: Banknote,   path: "/admin/payouts"  },
      { label: "Support",       icon: Headphones, path: "/admin/support"  },
      { label: "Featured Gigs", icon: Sparkles,   path: "/admin/featured" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", icon: Bell, path: "/admin/notifications", isNotif: true },
    ],
  },
];

function NavItems({ items, isActive, navigate, onNavigate, notifUnread }) {
  return (
    <div className="space-y-0.5">
      {items.map(({ label, icon: Icon, path, isNotif }) => {
        const active = isActive(path);
        const badge  = isNotif ? notifUnread : 0;
        return (
          <button
            key={path}
            onClick={() => { navigate(path); onNavigate?.(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              active ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {badge > 0 && (
              <span className={`text-xs font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ${
                active ? "bg-white text-primary" : "bg-primary text-white"
              }`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { auth, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotificationPoll();

  const isActive = (path) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const SidebarContent = ({ onNavigate }) => (
    <>
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                {section.title}
              </p>
            )}
            <NavItems
              items={section.items}
              isActive={isActive}
              navigate={navigate}
              onNavigate={onNavigate}
              notifUnread={unreadCount}
            />
          </div>
        ))}
      </nav>
      <div className="px-3 pt-4 border-t border-gray-100 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-primary border-b border-primary-dark shadow-sm">
        <div className="h-16 px-4 sm:px-6 flex items-center gap-3">

          <button
            className="lg:hidden p-2 rounded-lg hover:bg-primary-dark/30 text-white/80"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="text-white text-xl font-bold tracking-tight select-none"
          >
            vizhiyal<span className="text-secondary">.</span>
            <span className="ml-2 text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full align-middle">
              Admin
            </span>
          </button>

          <div className="flex-1" />

          <button
            onClick={() => navigate("/admin/notifications")}
            className="relative p-2 rounded-full hover:bg-white/10 text-white/80"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-primary">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 ml-2">
            <UserAvatar
              src={auth?.avatar}
              name={auth?.name ?? "Admin"}
              size={32}
              className="border-2 border-white/30"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white">{auth?.name ?? "Admin"}</p>
              <p className="text-xs text-white/60">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 py-4 flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-white shadow-2xl flex flex-col py-4">
              <div className="flex items-center justify-between px-4 mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">Admin Panel</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </aside>
          </>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
