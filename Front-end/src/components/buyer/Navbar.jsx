// Navbar — shared logged-in navbar for all inner pages
// Shows profile dropdown with role switcher (buyer ↔ seller) when user has both roles.
// Notification bell polls the API every 30 s for live unread count + preview.

import { useState, useRef, useEffect } from "react";
import {
  Search, Bell, MessageSquare, Heart,
  ChevronDown, ShoppingBag, X, Menu,
  LogOut, ArrowLeftRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationApi } from "../../services/notificationApi";
import { useNotificationPoll } from "../../hooks/useNotificationPoll";
import UserAvatar from "../common/UserAvatar";

// ── Tiny time-ago helper (no external deps) ───────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60)  return "just now";
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function Navbar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { auth, logout, switchRole } = useAuth();

  const [query,       setQuery]       = useState("");
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenu,  setMobileMenu]  = useState(false);

  const profileRef = useRef(null);

  // ── Live notification polling ─────────────────────────────────────────────
  const { unreadCount, setUnreadCount, recent, setRecent, refresh } = useNotificationPoll();

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Notification actions ──────────────────────────────────────────────────
  const handleNotifClick = async (n) => {
    if (!n.read) {
      try { await notificationApi.markOneRead(n.id); } catch { /* silent */ }
      setUnreadCount(c => Math.max(0, c - 1));
      setRecent(prev => prev.map(r => r.id === n.id ? { ...r, read: true } : r));
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try { await notificationApi.markAllRead(); } catch { /* silent */ }
    setUnreadCount(0);
    setRecent(prev => prev.map(r => ({ ...r, read: true })));
  };

  // Refresh list when dropdown opens
  const openNotifPanel = () => {
    setNotifOpen(true);
    setMobileMenu(false);
    setProfileOpen(false);
    refresh();
  };

  // ── Other handlers ────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/search");
    setMobileMenu(false);
  };

  const handleSwitchRole = () => {
    switchRole();
    setProfileOpen(false);
    const targetRole = auth?.currentRole === "buyer" ? "seller" : "buyer";
    navigate(targetRole === "seller" ? "/seller" : "/home");
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const hasBothRoles     = auth?.roles?.includes("buyer") && auth?.roles?.includes("seller");
  const sellerStatus     = auth?.sellerStatus ?? null;
  const isApprovedSeller = sellerStatus === "approved";

  const displayName   = auth?.name  ?? "My Account";
  const displayEmail  = auth?.email ?? "";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

        {/* ── Logo ──────────────────────────────────────────── */}
        <button
          onClick={() => navigate("/home")}
          className="text-primary text-xl font-bold tracking-tight flex-shrink-0 select-none"
        >
          vizhiyal<span className="text-secondary">.</span>
        </button>

        {/* ── Search bar (desktop) ───────────────────────────── */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-xl items-center bg-white border border-gray-300 rounded-full overflow-hidden hover:border-primary transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What service are you looking for today?"
            className="flex-1 px-4 py-2.5 text-sm focus:outline-none bg-transparent"
          />
          <button
            type="submit"
            className="bg-gray-800 hover:bg-gray-900 px-4 py-2 m-0.5 rounded-full transition-colors"
          >
            <Search className="w-4 h-4 text-white" />
          </button>
        </form>

        {/* ── Right actions ─────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">

          {/* ── Guest: Sign In / Register ──────────────────────── */}
          {!auth && (
            <>
              <button
                onClick={() => navigate("/login")}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
              >
                Join Free
              </button>
            </>
          )}

          {/* ── Authenticated-only icons ───────────────────── */}
          {auth && (<>

          {/* ── Notification bell ───────────────────────────── */}
          <div className="relative">
            <button
              onClick={notifOpen ? () => setNotifOpen(false) : openNotifPanel}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full leading-none">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)}>
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  {recent.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {recent.map(n => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                            !n.read ? "bg-primary/[.04]" : ""
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                            !n.read ? "bg-primary" : "bg-transparent"
                          }`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 leading-snug truncate">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              {relativeTime(n.createdAt)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-gray-100 px-4 py-2.5">
                    <button
                      onClick={() => { setNotifOpen(false); navigate("/notifications"); }}
                      className="w-full text-xs text-primary font-medium text-center hover:underline"
                    >
                      See all notifications →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <button
            onClick={() => navigate("/messages")}
            className={`relative p-2 rounded-full transition-colors ${isActive("/messages") ? "bg-primary-50 text-primary" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => navigate("/wishlist")}
            className={`p-2 rounded-full transition-colors ${isActive("/wishlist") ? "bg-red-50 text-red-500" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <Heart className={`w-5 h-5 ${isActive("/wishlist") ? "fill-red-400" : ""}`} />
          </button>

          {/* Orders */}
          <button
            onClick={() => navigate("/orders")}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border-l border-gray-100 ml-1 pl-3 ${
              isActive("/orders") ? "text-primary bg-primary-50" : "text-gray-700 hover:text-primary hover:bg-gray-50"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders
          </button>

          {/* ── Profile avatar + dropdown ─────────────────────── */}
          <div className="relative ml-2" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-1.5 group"
            >
              <UserAvatar
                src={auth?.avatar}
                name={displayName}
                size={32}
                className={`border-2 transition-colors ${
                  profileOpen || isActive("/profile") ? "border-primary" : "border-gray-200 group-hover:border-primary"
                }`}
              />
              <ChevronDown className={`w-3.5 h-3.5 hidden sm:block transition-transform transition-colors ${
                profileOpen ? "rotate-180 text-primary" : "text-gray-400 group-hover:text-primary"
              }`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden z-50">

                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar src={auth?.avatar} name={displayName} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Menu links */}
                <div className="py-1">
                  <MenuLink label="Profile"   onClick={() => { setProfileOpen(false); navigate("/profile"); }} />
                  <MenuLink label="My Disputes" onClick={() => { setProfileOpen(false); navigate("/disputes"); }} />

                  {isApprovedSeller ? (
                    <MenuLink label="Switch to Seller" highlight onClick={handleSwitchRole} />
                  ) : sellerStatus === "pending" ? (
                    <MenuLink label="Application Pending…" muted onClick={() => setProfileOpen(false)} />
                  ) : sellerStatus === "rejected" ? (
                    <MenuLink label="Application Rejected — Reapply" danger onClick={() => { setProfileOpen(false); navigate("/become-seller"); }} />
                  ) : (
                    <MenuLink label="Become a Seller" highlight onClick={() => { setProfileOpen(false); navigate("/become-seller"); }} />
                  )}

                  <MenuLink label="Account Settings" onClick={() => { setProfileOpen(false); navigate("/settings"); }} />

                  <div className="my-1 border-t border-gray-100" />

                  <MenuLink label="Sign Out" danger onClick={handleLogout} />
                </div>
              </div>
            )}
          </div>

          </>)}

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden ml-1 p-2 rounded-full hover:bg-gray-100 text-gray-600"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile search + nav ──────────────────────────────── */}
      {mobileMenu && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
          <form onSubmit={handleSearch} className="flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendors…"
              className="flex-1 px-4 py-2.5 text-sm bg-transparent focus:outline-none"
            />
            <button type="submit" className="bg-gray-800 px-4 py-2 m-0.5 rounded-full">
              <Search className="w-4 h-4 text-white" />
            </button>
          </form>
          <div className="flex flex-col gap-1">
            {!auth ? (
              <>
                <button
                  onClick={() => { navigate("/login");    setMobileMenu(false); }}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { navigate("/register"); setMobileMenu(false); }}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
                >
                  Join Free
                </button>
              </>
            ) : (
              <>
                {[
                  { label: "Home",         path: "/home"         },
                  { label: "Find Vendors", path: "/search"       },
                  { label: "My Orders",    path: "/orders"       },
                  { label: "My Disputes",  path: "/disputes"     },
                  { label: "Messages",     path: "/messages"     },
                  { label: "Wishlist",     path: "/wishlist"     },
                  { label: "My Profile",   path: "/profile"      },
                ].map(({ label, path }) => (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setMobileMenu(false); }}
                    className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(path) ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {hasBothRoles && (
                  <button
                    onClick={() => { handleSwitchRole(); setMobileMenu(false); }}
                    className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-secondary/5 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Switch to {auth?.currentRole === "buyer" ? "Seller" : "Buyer"}
                  </button>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileMenu(false); }}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ── Profile menu link helper ──────────────────────────────────────────────────
function MenuLink({ label, onClick, danger = false, highlight = false, muted = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : muted
          ? "text-gray-400 cursor-default"
          : highlight
          ? "text-accent font-medium hover:bg-gray-50"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
