// SellerNotifications.jsx — connected to real notification API
import { useState, useEffect } from "react";
import { ShoppingBag, MessageSquare, DollarSign, Bell, CheckCheck, Check, Loader2 } from "lucide-react";
import { notificationApi } from "../../services/notificationApi";

const typeConfig = {
  ORDER:   { icon: ShoppingBag,  color: "bg-primary-50 text-primary"  },
  MESSAGE: { icon: MessageSquare,color: "bg-blue-50 text-blue-500"    },
  PAYMENT: { icon: DollarSign,   color: "bg-accent-50 text-accent"    },
  SYSTEM:  { icon: Bell,         color: "bg-gray-100 text-gray-500"   },
  // lowercase fallbacks
  order:   { icon: ShoppingBag,  color: "bg-primary-50 text-primary"  },
  message: { icon: MessageSquare,color: "bg-blue-50 text-blue-500"    },
  payment: { icon: DollarSign,   color: "bg-accent-50 text-accent"    },
  system:  { icon: Bell,         color: "bg-gray-100 text-gray-500"   },
};

const TABS = ["all", "ORDER", "MESSAGE", "PAYMENT", "SYSTEM"];
const tabLabel = { all: "All", ORDER: "Orders", MESSAGE: "Messages", PAYMENT: "Payments", SYSTEM: "System" };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function SellerNotifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");

  useEffect(() => {
    notificationApi.getAll()
      .then(({ data }) => setNotifs(data.notifications || data || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all"
    ? notifs
    : notifs.filter(n => (n.type || "").toUpperCase() === tab);

  // Backend field is `read` (not `isRead`)
  const unreadCount = (t) => t === "all"
    ? notifs.filter(n => !n.read).length
    : notifs.filter(n => (n.type || "").toUpperCase() === t && !n.read).length;

  async function markAll() {
    try {
      await notificationApi.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      // Tell the sidebar badge to refresh immediately
      window.dispatchEvent(new Event("notifications-read"));
    } catch { /* silent */ }
  }

  async function markOne(id) {
    try {
      await notificationApi.markOneRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      window.dispatchEvent(new Event("notifications-read"));
    } catch { /* silent */ }
  }

  const totalUnread = notifs.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${totalUnread} unread`}
          </p>
        </div>
        {!loading && totalUnread > 0 && (
          <button
            onClick={markAll}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(t => {
          const count = unreadCount(t);
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tabLabel[t] || t}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t ? "bg-white text-primary" : "bg-primary text-white"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No notifications</p>
            </div>
          ) : (
            filtered.map(n => {
              const type = (n.type || "system").toUpperCase();
              const cfg  = typeConfig[type] || typeConfig.SYSTEM;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                    !n.read ? "border-primary/20 bg-primary-50/30" : "border-gray-100"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                    {!n.read && (
                      <button
                        onClick={() => markOne(n.id)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
