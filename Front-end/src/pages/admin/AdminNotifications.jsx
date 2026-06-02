// AdminNotifications.jsx — connected to real notification API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, UserCheck, ShoppingCart, Settings, User, CheckCheck, Check, Loader2,
} from "lucide-react";
import { notificationApi } from "../../services/notificationApi";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_CFG = {
  application: { icon: UserCheck,    color: "bg-secondary-50 text-secondary"  },
  order:       { icon: ShoppingCart, color: "bg-accent-50 text-accent"        },
  system:      { icon: Settings,     color: "bg-primary-50 text-primary"      },
  user:        { icon: User,         color: "bg-purple-50 text-purple-600"    },
};

const TABS = ["all", "unread", "application", "order", "system", "user"];

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");

  useEffect(() => {
    notificationApi.getAll()
      .then(({ data }) => {
        const raw = data.notifications || data || [];
        setNotifs(raw.map(n => ({
          id:    n.id,
          title: n.title   || "Notification",
          body:  n.message || n.body || "",
          type:  (n.type   || "SYSTEM").toLowerCase(),
          read:  n.isRead  || false,
          time:  timeAgo(n.createdAt),
          link:  n.link    || null,
        })));
      })
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = notifs.filter(n => {
    if (tab === "all")    return true;
    if (tab === "unread") return !n.read;
    return n.type === tab;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  async function markRead(id) {
    try {
      await notificationApi.markOneRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  }

  async function handleClick(notif) {
    await markRead(notif.id);
    if (notif.link) navigate(notif.link);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {!loading && unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(t => {
          const count = t === "all" ? notifs.length
            : t === "unread" ? notifs.filter(n => !n.read).length
            : notifs.filter(n => n.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({loading ? "…" : count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No notifications here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const cfg  = TYPE_CFG[notif.type] || TYPE_CFG.system;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors cursor-pointer ${
                  !notif.read
                    ? "bg-white border-primary/20 shadow-sm hover:shadow-md"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${notif.read ? "text-gray-700" : "text-gray-900"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
                  {!notif.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                  {notif.read  && <Check className="w-3.5 h-3.5 text-gray-300" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
