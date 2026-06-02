// hooks/useNotificationPoll.js
// Polls GET /api/notifications every 30 s and exposes unreadCount + recent list.
// Only active while a user is logged in. Exports a manual `refresh()` so callers
// can re-fetch immediately after marking notifications as read.

import { useState, useEffect, useRef, useCallback } from "react";
import { notificationApi } from "../services/notificationApi";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotificationPoll() {
  const { auth } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [recent,      setRecent]      = useState([]);
  const timerRef = useRef(null);

  const poll = useCallback(async () => {
    try {
      const { data } = await notificationApi.getAll({ limit: 5 });
      setUnreadCount(data.unreadCount ?? 0);
      setRecent(data.notifications  ?? []);
    } catch {
      // Silent — never let a poll failure crash the UI
    }
  }, []); // auth.id captured below via the effect dep

  useEffect(() => {
    if (!auth) {
      setUnreadCount(0);
      setRecent([]);
      clearInterval(timerRef.current);
      return;
    }

    poll(); // immediate first fetch
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [auth?.id, poll]); // restart when user changes (login / logout)

  // Refresh immediately when another component marks notifications as read
  // (SellerNotifications / buyer Notifications dispatch this after mark-read calls)
  useEffect(() => {
    const handler = () => poll();
    window.addEventListener("notifications-read", handler);
    return () => window.removeEventListener("notifications-read", handler);
  }, [poll]);

  // Expose manual refresh for post-read-mark actions
  const refresh = useCallback(() => poll(), [poll]);

  return { unreadCount, setUnreadCount, recent, setRecent, refresh };
}
