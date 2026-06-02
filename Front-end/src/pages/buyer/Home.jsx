// LoggedInHome — Fiverr-style home page for logged-in users
// Top navbar with search + icons, secondary category nav, welcome section,
// "based on what you like" sidebar + cards, vendor rows, footer.

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, MessageSquare, Heart,
  ChevronDown, ShoppingBag, X, ChevronRight,
  LogOut, ArrowLeftRight, LayoutGrid,
  // Category icons
  Camera, Sparkles, UtensilsCrossed, Building2, Music, Palette, Video, Cake,
  // Action card icons
  ClipboardList, Smartphone, UserCheck, Store,
} from "lucide-react";
import GigCard from "../../components/common/GigCard";
import UserAvatar from "../../components/common/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { gigApi } from "../../services/gigApi";
import { adaptGig } from "../../utils/adapters";
import { notificationApi } from "../../services/notificationApi";
import { messageApi      } from "../../services/messageApi";
import { useNotificationPoll } from "../../hooks/useNotificationPoll";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { HOME_CATEGORIES } from "../../utils/categories.js";

const categories = HOME_CATEGORIES; // ["All", "Photography", ...]

// ── Category metadata ─────────────────────────────────────────────────────────
const catIcon = {
  "All": LayoutGrid,
  "Photography": Camera,
  "Decoration": Sparkles,
  "Catering": UtensilsCrossed,
  "Venue": Building2,
  "Music & DJ": Music,
  "Makeup & Beauty": Palette,
  "Videography": Video,
  "Cakes & Sweets": Cake,
};

// ── Time-ago helper ───────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const actionCards = [
  { icon: ClipboardList, title: "Post a requirement", desc: "Get tailored offers for your needs." },
  { icon: Smartphone, title: "Download the app", desc: "Stay productive, anywhere you go." },
  { icon: UserCheck, title: "Complete your profile", desc: "You've added 25% of your profile." },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function LoggedInHome() {
  const navigate = useNavigate();
  const { auth, logout, switchRole } = useAuth();
  const { getRecentCategories, getRecentGigs, hasHistory } = useRecentlyViewed();

  // ── Real notifications ────────────────────────────────────────
  const { unreadCount, setUnreadCount, recent, setRecent, refresh } = useNotificationPoll();

  // ── Real message unread count ─────────────────────────────────
  const [msgUnread, setMsgUnread] = useState(0);
  useEffect(() => {
    if (!auth) return;
    messageApi.getConversations()
      .then(({ data }) => {
        const total = (data.conversations || []).reduce((sum, c) => sum + (c.unread ?? 0), 0);
        setMsgUnread(total);
      })
      .catch(() => {});
  }, [auth?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notification actions
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

  const openNotifPanel = () => {
    setNotifOpen(true);
    setProfileOpen(false);
    refresh();
  };

  const [query,       setQuery]       = useState("");
  // Default to first recently viewed category; fall back to "All"
  const [activeCat,   setActiveCat]   = useState(() => {
    const recent = getRecentCategories();
    return recent[0] || "All";
  });
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [catGigs,     setCatGigs]     = useState([]);
  const [allGigs,     setAllGigs]     = useState([]);
  const [proGigs,     setProGigs]     = useState([]);
  const [vendorLoading, setVendorLoading] = useState(true);
  const profileRef = useRef(null);
  const scrollRef  = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Show recently viewed gigs for the active category; fall back to API
  useEffect(() => {
    const recent = getRecentGigs(activeCat);
    if (recent.length > 0) {
      setCatGigs(recent);
      setVendorLoading(false);
      return;
    }
    // No history for this category → fetch from API
    setVendorLoading(true);
    gigApi.list({ ...(activeCat !== "All" && { category: activeCat }), limit: 8 })
      .then(({ data }) => setCatGigs((data.gigs || []).map(adaptGig)))
      .catch(() => setCatGigs([]))
      .finally(() => setVendorLoading(false));
  }, [activeCat]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch general + verified gigs once
  useEffect(() => {
    gigApi.list({ limit: 6 }).then(({ data }) =>
      setAllGigs((data.gigs || []).map(adaptGig))
    ).catch(() => {});
    gigApi.list({ limit: 5, verified: "true" }).then(({ data }) =>
      setProGigs((data.gigs || []).map(adaptGig))
    ).catch(() => {});
  }, []);

  // Role helpers — new auth shape uses single `role` field
  const isSeller    = auth?.role === "seller";
  const hasBothRoles = isSeller; // sellers can switch to buyer view

  const [banners, setBanners] = useState([]);
  useEffect(() => {
    notificationApi.getAnnouncementBanners()
      .then(({ data }) => setBanners(data.announcements || []))
      .catch(() => setBanners([]));
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/");
  };

  const handleSwitchRole = () => {
    setProfileOpen(false);
    switchRole();
    navigate("/seller");
  };

  const handleSwitchToSeller = () => {
    switchRole();
    navigate("/seller");
  };

  // Only fall back to allGigs when "All" is selected and catGigs is empty.
  // For specific categories, show whatever the API returned (even if empty).
  const displayGigs = activeCat === "All" && catGigs.length === 0
    ? allGigs.slice(0, 4)
    : catGigs;

  // Sidebar shows recently accessed categories; falls back to all if no history
  const recentCats = getRecentCategories();
  const userHasHistory = hasHistory();
  // Show recently accessed cats + "All" at top; fall back to full list
  const sidebarCats = userHasHistory
    ? ["All", ...recentCats]
    : categories; // full list including "All"

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/search");
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ═══════════════════════════════════════════════════════════
          TOP NAVBAR
      ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

          {/* Logo */}
          <button
            onClick={() => navigate("/home")}
            className="text-primary text-xl font-bold tracking-tight flex-shrink-0 select-none"
          >
            vizhiyal<span className="text-secondary">.</span>
          </button>

          {/* Search bar — center */}
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
              className="bg-gray-800 hover:bg-gray-900 px-4 py-2.5 m-0.5 rounded-full transition-colors"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </form>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">

            {/* Notification bell */}
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
                          <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)}>
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>

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
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.read ? "bg-primary/[.04]" : ""}`}
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 leading-snug truncate">{n.title}</p>
                              {n.body && <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>}
                              <p className="text-[10px] text-gray-400 mt-1">{relativeTime(n.createdAt)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

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
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {msgUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white leading-none">
                  {msgUnread > 99 ? "99+" : msgUnread}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => navigate("/wishlist")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* Orders */}
            <button
              onClick={() => navigate("/orders")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors border-l border-gray-100 ml-1 pl-3"
            >
              <ShoppingBag className="w-4 h-4" />
              Orders
            </button>

            {/* Profile avatar + dropdown */}
            <div className="relative ml-1" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-1.5 group"
              >
                <UserAvatar src={auth?.avatar} name={auth?.name} size={32} className="border-2 border-primary" />
                <ChevronDown className={`w-3.5 h-3.5 hidden sm:block transition-transform transition-colors ${profileOpen ? "rotate-180 text-primary" : "text-gray-400 group-hover:text-primary"}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar src={auth?.avatar} name={auth?.name} size={36} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{auth?.name ?? "My Account"}</p>
                        <p className="text-xs text-gray-400 truncate">{auth?.email ?? ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <ProfileLink label="Profile"          onClick={() => { setProfileOpen(false); navigate("/profile"); }} />
                    {hasBothRoles
                      ? <ProfileLink label="Switch to Seller" highlight onClick={handleSwitchRole} />
                      : auth?.sellerStatus === "pending"
                      ? <ProfileLink label="Application Pending…" muted onClick={() => setProfileOpen(false)} />
                      : auth?.sellerStatus === "rejected"
                      ? <ProfileLink label="Reapply as Seller" danger onClick={() => { setProfileOpen(false); navigate("/become-seller"); }} />
                      : <ProfileLink label="Become a Seller"  highlight onClick={() => { setProfileOpen(false); navigate("/become-seller"); }} />
                    }
                    <ProfileLink label="Account Settings" onClick={() => { setProfileOpen(false); navigate("/settings"); }} />
                    <div className="my-1 border-t border-gray-100" />
                    <ProfileLink label="Sign Out" danger onClick={handleLogout} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Secondary Category Nav ─────────────────────────────── */}
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto hide-scrollbar">
            <div className="flex items-center">
              {categories.map((cat) => {
                  const CatIcon = catIcon[cat] ?? Sparkles;
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        cat === "All"
                          ? navigate("/search")
                          : navigate(`/search?category=${encodeURIComponent(cat)}`)
                      }
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 border-transparent text-gray-600 hover:text-primary hover:border-primary transition-colors"
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                      {cat}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </header>


      {/* ═══════════════════════════════════════════════════════════
          ANNOUNCEMENTS BANNER
      ═══════════════════════════════════════════════════════════ */}
      {banners.map(ann => {
        const priority = ann.priority || "low";
        return (
          <div key={ann.id} className={`flex items-start gap-3 px-4 py-3 text-sm ${
            priority === "high"   ? "bg-red-50 border-b border-red-100 text-red-700" :
            priority === "medium" ? "bg-amber-50 border-b border-amber-100 text-amber-700" :
            "bg-primary-50 border-b border-primary-100 text-primary"
          }`}>
            <span className="flex-1">
              <span className="font-semibold">{ann.title}: </span>{ann.message || ann.body}
            </span>
            <button
              onClick={async () => {
                await notificationApi.markOneRead(ann.id).catch(() => {});
                setBanners(prev => prev.filter(b => b.id !== ann.id));
              }}
              className="flex-shrink-0 opacity-60 hover:opacity-100 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* ═══════════════════════════════════════════════════════════
          BASED ON WHAT YOU MIGHT LIKE
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-4 px-4 max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          {userHasHistory ? "Based on what you've been looking for" : "Browse by category"}
        </h2>

        <div className="flex gap-6">
          {/* Category sidebar */}
          <aside className="hidden lg:flex flex-col gap-0.5 w-52 flex-shrink-0">
            {sidebarCats.map((cat) => {
              const CatIcon = catIcon[cat] ?? Sparkles;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                    activeCat === cat
                      ? "bg-primary text-white font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                  }`}
                >
                  <CatIcon className="w-4 h-4 flex-shrink-0" />
                  {cat}
                </button>
              );
            })}
            {/* Link to full browse page */}
            {userHasHistory && (
              <button
                onClick={() => navigate("/search")}
                className="text-left px-3 py-2.5 rounded-lg text-xs text-primary font-medium hover:bg-primary-50 transition-colors mt-1"
              >
                Browse all categories →
              </button>
            )}
          </aside>

          {/* Horizontal vendor card scroll */}
          <div className="flex-1 overflow-hidden">
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
              {vendorLoading
                ? Array.from({ length: 4 }).map((_, i) => <VendorSkeleton key={i} />)
                : displayGigs.length === 0
                ? (
                  <div className="flex items-center justify-center w-full py-10 text-gray-400 text-sm">
                    No services found in {activeCat}
                  </div>
                )
                : displayGigs.map((g) => (
                  <div key={g.id} className="w-60 flex-shrink-0">
                    <GigCard gig={g} />
                  </div>
                ))}
              {/* Show all card */}
              <div className="w-40 flex-shrink-0 flex items-center justify-center">
                <button
                  onClick={() => navigate(
                    activeCat && activeCat !== "All"
                      ? `/search?category=${encodeURIComponent(activeCat)}`
                      : "/search"
                  )}
                  className="flex flex-col items-center gap-2 text-primary group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">Show all</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          VENDORS YOU MAY LIKE
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gray-50 mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">Vendors you may like</h2>
            <button
              onClick={() => navigate("/search")}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              Show All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
            {allGigs.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <VendorSkeleton key={i} />)
              : allGigs.map((g) => (
              <div key={g.id} className="w-60 flex-shrink-0">
                <GigCard gig={g} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          MOST POPULAR IN [CATEGORY]
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Most popular in{" "}
              <span className="text-primary">{activeCat}</span>
            </h2>
            <button
              onClick={() => navigate("/search")}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              Show All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(catGigs.length > 0 ? catGigs : allGigs).slice(0, 4).map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          VERIFIED PRO VENDORS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-800">Verified Pro vendors</h2>
            <button
              onClick={() => navigate("/search")}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              Show All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-5">Hand-vetted talent for your most important events</p>
          <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
            {proGigs.length === 0
              ? Array.from({ length: 3 }).map((_, i) => <VendorSkeleton key={i} />)
              : proGigs.map((g) => (
              <div key={g.id} className="w-60 flex-shrink-0">
                <GigCard gig={g} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SELLER SWITCH BANNER
      ═══════════════════════════════════════════════════════════ */}
      {hasBothRoles ? (
        <section className="py-6 px-4 bg-secondary/5 border-y border-secondary/20">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">You also have a Seller account</p>
                <p className="text-sm text-gray-500">Switch to your seller dashboard to manage services and orders.</p>
              </div>
            </div>
            <button
              onClick={handleSwitchToSeller}
              className="flex items-center gap-2 bg-secondary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-secondary-dark transition-colors flex-shrink-0"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Switch to Seller
            </button>
          </div>
        </section>
      ) : (
        <section className="py-6 px-4 bg-primary/5 border-y border-primary/10">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Want to offer your services?</p>
                <p className="text-sm text-gray-500">Create a seller account and start earning on Vizhiyal.</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors flex-shrink-0"
            >
              <Store className="w-4 h-4" />
              Become a Seller
            </button>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          FOOTER (compact)
      ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 mt-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white text-lg font-bold">
            vizhiyal<span className="text-secondary">.</span>
          </p>
          <p className="text-xs text-center sm:text-left">
            © Vizhiyal International Ltd. 2026 · Group 30 · OUSL
          </p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function VendorSkeleton() {
  return (
    <div className="w-60 flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded w-full" />
        <div className="flex justify-between pt-1">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

function ProfileLink({ label, onClick, danger = false, highlight = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
        danger ? "text-gray-500" : highlight ? "text-accent font-medium" : "text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
