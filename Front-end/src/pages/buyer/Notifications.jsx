// Notifications — full notifications screen (connected to real API)
// Filter tabs: All | Orders | Messages | Reminders | System
// Grouped by time period. Unread items highlighted. Mark as read per item or all.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, ShoppingBag, MessageSquare, CalendarDays,
  Info, CheckCheck, Check, ChevronRight,
  Package, Sparkles, Loader2,
} from "lucide-react";
import { notificationApi } from "../../services/notificationApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 2)  return "Yesterday";
  if (days  < 7)  return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-LK", { day: "numeric", month: "short" });
}

function getGroup(dateStr) {
  if (!dateStr) return "Earlier";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7)  return "This Week";
  return "Earlier";
}

// Map backend shape → UI shape
function adaptNotif(n) {
  return {
    id:    n.id,
    type:  (n.type || "system").toLowerCase(),
    title: n.title  || "Notification",
    desc:  n.body   || n.message || "",
    time:  timeAgo(n.createdAt),
    group: getGroup(n.createdAt),
    read:  n.read   ?? true,
    link:  n.link   || null,
  };
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",      label: "All"       },
  { key: "order",    label: "Orders"    },
  { key: "message",  label: "Messages"  },
  { key: "reminder", label: "Reminders" },
  { key: "system",   label: "System"    },
];

// ── Type config ───────────────────────────────────────────────────────────────

const typeConfig = {
  order: {
    icon:   ShoppingBag,
    bg:     "bg-primary-50",
    color:  "text-primary",
    border: "border-primary-100",
  },
  message: {
    icon:   MessageSquare,
    bg:     "bg-blue-50",
    color:  "text-blue-500",
    border: "border-blue-100",
  },
  reminder: {
    icon:   CalendarDays,
    bg:     "bg-secondary-50",
    color:  "text-secondary",
    border: "border-secondary-100",
  },
  system: {
    icon:   Info,
    bg:     "bg-gray-100",
    color:  "text-gray-500",
    border: "border-gray-200",
  },
};

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "Earlier"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate  = useNavigate();
  const [notifs,    setNotifs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Load from real API
  useEffect(() => {
    notificationApi.getAll({ limit: 50 })
      .then(({ data }) => setNotifs((data.notifications || []).map(adaptNotif)))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = activeTab === "all"
    ? notifs
    : notifs.filter(n => n.type === activeTab);

  const grouped = GROUP_ORDER.reduce((acc, group) => {
    const items = filtered.filter(n => n.group === group);
    if (items.length > 0) acc[group] = items;
    return acc;
  }, {});

  const tabUnread = (key) =>
    key === "all"
      ? unreadCount
      : notifs.filter(n => !n.read && n.type === key).length;

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event("notifications-read"));
    } catch { /* silent */ }
  };

  const markOneRead = async (id) => {
    try {
      await notificationApi.markOneRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      window.dispatchEvent(new Event("notifications-read"));
    } catch { /* silent */ }
  };

  const handleClick = (notif) => {
    if (!notif.read) markOneRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {!loading && unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              You have <span className="text-primary font-semibold">{unreadCount}</span> unread
              notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {!loading && unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:bg-primary-50 px-3 py-2 rounded-xl transition-colors border border-primary-100"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar bg-gray-100 rounded-2xl p-1.5 mb-6">
        {TABS.map(({ key, label }) => {
          const count    = tabUnread(key);
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center font-semibold ${
                  isActive ? "bg-primary text-white" : "bg-red-500 text-white"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <section key={group}>

              {/* Group label */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {group}
                </p>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {items.map((notif) => {
                  const cfg  = typeConfig[notif.type] || typeConfig.system;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                        !notif.read
                          ? "bg-primary-50/60 border-primary-100 hover:bg-primary-50"
                          : "bg-white border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {/* Unread blue dot */}
                      {!notif.read && (
                        <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0" />
                      )}

                      {/* Icon */}
                      <div className={`flex-shrink-0 w-11 h-11 ${cfg.bg} border ${cfg.border} rounded-2xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-sm leading-snug mb-0.5 ${!notif.read ? "font-semibold text-gray-800" : "font-medium text-gray-700"}`}>
                          {notif.title}
                        </p>
                        {notif.desc && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                            {notif.desc}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          {notif.time}
                        </p>
                      </div>

                      {/* Arrow (if has link) */}
                      {notif.link && (
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary flex-shrink-0 self-center transition-colors" />
                      )}

                      {/* Mark as read button */}
                      {!notif.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markOneRead(notif.id); }}
                          title="Mark as read"
                          className="absolute bottom-3 right-4 p-1 rounded-full hover:bg-primary-100 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState type={activeTab} onBrowse={() => navigate("/search")} />
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

const emptyConfig = {
  all:      { title: "You're all caught up!",     sub: "No notifications right now. Check back later.", icon: Bell,          accent: Sparkles  },
  order:    { title: "No order notifications",    sub: "Order updates will appear here.",               icon: ShoppingBag,   accent: Package   },
  message:  { title: "No message notifications",  sub: "New messages from vendors will show here.",     icon: MessageSquare, accent: Bell      },
  reminder: { title: "No reminders yet",          sub: "Event reminders will appear here.",             icon: CalendarDays,  accent: Bell      },
  system:   { title: "No system notifications",   sub: "Platform updates will appear here.",            icon: Info,          accent: Sparkles  },
};

function EmptyState({ type, onBrowse }) {
  const cfg        = emptyConfig[type] || emptyConfig.all;
  const MainIcon   = cfg.icon;
  const AccentIcon = cfg.accent;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30 scale-125" />
        <div className="relative w-28 h-28 bg-gradient-to-br from-primary-50 to-primary/10 rounded-full flex items-center justify-center border border-primary/10">
          <MainIcon className="w-12 h-12 text-primary/40" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-primary-50 rounded-full shadow-lg flex items-center justify-center animate-bounce">
          <AccentIcon className="w-5 h-5 text-secondary" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">{cfg.title}</h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-8">{cfg.sub}</p>
      {(type === "all" || type === "order") && (
        <button
          onClick={onBrowse}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse Vendors
        </button>
      )}
    </div>
  );
}
