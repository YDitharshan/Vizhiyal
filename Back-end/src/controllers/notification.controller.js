// controllers/notification.controller.js
// getNotifications · markOneRead · markAllRead · deleteNotification
// createNotification (internal helper — not exposed as HTTP route)
import prisma from "../config/db.js";

// ── Internal helper — call this from other controllers ────────
// e.g. await createNotification(userId, "booking", "New Booking", "You have a new booking", "/seller/orders/xyz")
export const createNotification = async (userId, type, title, body = "", link = "") => {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  } catch (err) {
    // Non-fatal — log and continue
    console.error("createNotification error:", err.message);
  }
};

// ── @GET /api/notifications  (own notifications) ─────────────
export const getNotifications = async (req, res) => {
  const { read, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    userId: req.user.id,
    ...(read !== undefined && { read: read === "true" }),
  };

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, read: false } }),
    ]);

    return res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/notifications/announcements ────────────────────
// Returns unread announcement notifications (link starts with "ann:") for the
// current user — used to drive the announcement banner in buyer/seller portals.
// When admin closes an announcement, those records are marked read server-side,
// so they automatically disappear from the banner on next fetch.
export const getAnnouncementBanners = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        read:   false,
        link:   { startsWith: "ann:" },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, announcements: notifications });
  } catch (err) {
    console.error("getAnnouncementBanners error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/notifications/:id/read ───────────────────────
export const markOneRead = async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });
    if (notification.userId !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorised" });

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data:  { read: true },
    });

    return res.json({ success: true, notification: updated });
  } catch (err) {
    console.error("markOneRead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/notifications/read-all ───────────────────────
export const markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data:  { read: true },
    });

    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllRead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @DELETE /api/notifications/:id ───────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });
    if (notification.userId !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorised" });

    await prisma.notification.delete({ where: { id: req.params.id } });

    return res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
