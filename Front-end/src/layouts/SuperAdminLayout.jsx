// SuperAdminLayout — distinct dark sidebar layout for super admin
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Shield, LayoutDashboard, Users, Settings,
  ClipboardList, Activity, Menu, X, LogOut, ChevronLeft,
  TrendingUp, Megaphone, Tag, Database, Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/common/UserAvatar";

const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { label: "Dashboard",        icon: LayoutDashboard, path: "/superadmin"          },
      { label: "Revenue Analytics",icon: TrendingUp,       path: "/superadmin/revenue"  },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Admin Accounts",   icon: Users,           path: "/superadmin/admins"      },
      { label: "Role Permissions", icon: Lock,            path: "/superadmin/permissions" },
      { label: "Admin Activity",   icon: Activity,        path: "/superadmin/activity"    },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Announcements",    icon: Megaphone,       path: "/superadmin/announcements" },
      { label: "Promo Codes",      icon: Tag,             path: "/superadmin/promos"        },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Platform Settings",icon: Settings,        path: "/superadmin/settings" },
      { label: "Audit Logs",       icon: ClipboardList,   path: "/superadmin/audit"    },
      { label: "System Health",    icon: Activity,        path: "/superadmin/health"   },
      { label: "Backup & Recovery",icon: Database,        path: "/superadmin/backup"   },
    ],
  },
];

export default function SuperAdminLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { auth, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) =>
    path === "/superadmin"
      ? location.pathname === "/superadmin"
      : location.pathname.startsWith(path);

  const handleLogout = () => { logout(); navigate("/"); };

  const SidebarContent = ({ onNav }) => (
    <>
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 mb-1">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ label, icon: Icon, path }) => {
                const active = isActive(path);
                return (
                  <button
                    key={path}
                    onClick={() => { navigate(path); onNav?.(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pt-4 border-t border-white/10 space-y-1 flex-shrink-0">
        <button
          onClick={() => { navigate("/admin"); onNav?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin Panel
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors"
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
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-white/10 shadow-sm">
        <div className="h-16 px-4 sm:px-6 flex items-center gap-3">

          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white/70"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/superadmin")}
            className="text-white text-xl font-bold tracking-tight select-none flex items-center gap-2"
          >
            <Shield className="w-5 h-5 text-secondary" />
            vizhiyal<span className="text-secondary">.</span>
            <span className="ml-1 text-xs font-semibold bg-secondary text-white px-2 py-0.5 rounded-full align-middle">
              Super Admin
            </span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <UserAvatar
              src={auth?.avatar}
              name={auth?.name ?? "Super Admin"}
              size={32}
              className="border-2 border-secondary/50"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white">{auth?.name ?? "Super Admin"}</p>
              <p className="text-xs text-white/50">Super Administrator</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-gray-900 py-4 flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-gray-900 flex flex-col py-4">
              <div className="flex items-center justify-between px-4 mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span className="font-bold text-white text-sm">Super Admin</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <SidebarContent onNav={() => setSidebarOpen(false)} />
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
