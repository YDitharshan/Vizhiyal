// controllers/admin.controller.js
// Admin-only endpoints: stats, analytics, users, vendor actions, bookings, gigs,
// admin account management, announcements
import bcrypt from "bcryptjs";
import fs     from "fs";
import path   from "path";
import prisma  from "../config/db.js";
import { logAudit }  from "../utils/auditLog.js";
import { runBackup } from "../services/backup.service.js";

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const [totalUsers, pendingApprovals, activeOrders, activeGigs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { sellerStatus: "pending" } }),
      prisma.booking.count({ where: { status: { in: ["pending", "confirmed", "in_progress"] } } }),
      prisma.gig.count({ where: { status: "active" } }),
    ]);

    res.json({
      success: true,
      stats: { totalUsers, pendingApprovals, activeOrders, activeGigs },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    // Fetch all completed bookings with gig category
    const completedBookings = await prisma.booking.findMany({
      where:   { status: "completed" },
      include: { gig: { select: { category: true } } },
      orderBy: { createdAt: "asc" },
    });

    const totalBookings = await prisma.booking.count();

    // ── Summary ──
    const totalRevenue     = completedBookings.reduce((s, b) => s + b.totalAmount, 0);
    const commissionEarned = completedBookings.reduce((s, b) => s + b.commission,  0);
    const avgOrderValue    = completedBookings.length
      ? Math.round(totalRevenue / completedBookings.length)
      : 0;

    // Buyers who have 2+ completed bookings
    const buyerCounts = {};
    for (const b of completedBookings) {
      buyerCounts[b.buyerId] = (buyerCounts[b.buyerId] || 0) + 1;
    }
    const repeatBuyers = Object.values(buyerCounts).filter(c => c >= 2).length;

    const conversionRate = totalBookings > 0
      ? +((completedBookings.length / totalBookings) * 100).toFixed(1)
      : 0;

    // ── Monthly revenue — last 12 months ──
    const now         = new Date();
    const monthSlots  = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthSlots.push({
        year:  d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString("en-LK", { month: "short", year: "numeric" }),
      });
    }

    const monthlyRevenue = monthSlots.map(({ year, month, label }) => {
      const revenue = completedBookings
        .filter(b => {
          const d = new Date(b.createdAt);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((s, b) => s + b.totalAmount, 0);
      return { month: label, revenue: Math.round(revenue) };
    });

    // ── Category breakdown ──
    const catMap = {};
    for (const b of completedBookings) {
      const cat = b.gig?.category || "Other";
      if (!catMap[cat]) catMap[cat] = { orders: 0, revenue: 0 };
      catMap[cat].orders++;
      catMap[cat].revenue += b.totalAmount;
    }
    const safeTotalRevenue = totalRevenue || 1;
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, { orders, revenue }]) => ({
        category,
        orders,
        revenue: Math.round(revenue),
        pct:     Math.round((revenue / safeTotalRevenue) * 100),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ── Top vendors by revenue ──
    const vendorAgg = {};
    for (const b of completedBookings) {
      if (!vendorAgg[b.vendorId])
        vendorAgg[b.vendorId] = { vendorId: b.vendorId, orders: 0, revenue: 0 };
      vendorAgg[b.vendorId].orders++;
      vendorAgg[b.vendorId].revenue += b.totalAmount;
    }

    const topVendorIds = Object.values(vendorAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(v => v.vendorId);

    const vendorProfiles = await prisma.vendorProfile.findMany({
      where:  { id: { in: topVendorIds } },
      select: { id: true, businessName: true, avgRating: true },
    });
    const profileMap = Object.fromEntries(vendorProfiles.map(v => [v.id, v]));

    const topVendors = Object.values(vendorAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((v, i) => {
        const p = profileMap[v.vendorId] || {};
        return {
          rank:    i + 1,
          name:    p.businessName || "Unknown Vendor",
          revenue: Math.round(v.revenue),
          orders:  v.orders,
          rating:  +(p.avgRating || 0).toFixed(1),
        };
      });

    res.json({
      success: true,
      analytics: {
        summary: {
          totalRevenue:     Math.round(totalRevenue),
          totalOrders:      totalBookings,
          commissionEarned: Math.round(commissionEarned),
          avgOrderValue,
          repeatBuyers,
          conversionRate,
        },
        monthlyRevenue,
        categoryBreakdown,
        topVendors,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where:   { role: "buyer" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, avatar: true,
        phone: true, location: true, isActive: true, createdAt: true,
        _count: { select: { buyerBookings: true } },
      },
    });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/users/:id/status ────────────────────────────────────────
export const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const isActive = (status || "").toUpperCase() !== "SUSPENDED";
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { isActive },
      select: { id: true, name: true, isActive: true },
    });
    logAudit(req, {
      action:      isActive ? "Reinstated user account" : "Suspended user account",
      type:        "user",
      targetType:  "user",
      targetLabel: user.name,
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/vendors/:id ───────────────────────────────────────────────
export const getSellerById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: {
        id: true, name: true, email: true, avatar: true,
        phone: true, location: true, sellerStatus: true,
        isActive: true, createdAt: true,
        vendorProfile: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: "Seller not found" });
    res.json({ success: true, vendor: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/vendors ───────────────────────────────────────────────────
export const listSellerApplications = async (req, res) => {
  try {
    const sellers = await prisma.user.findMany({
      where:   { role: "seller" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, avatar: true,
        sellerStatus: true, isActive: true, createdAt: true,
        vendorProfile: {
          select: { businessName: true, category: true, location: true },
        },
      },
    });
    res.json({ success: true, vendors: sellers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/vendors/:id/approve ─────────────────────────────────────
export const approveVendor = async (req, res) => {
  try {
    // Fetch seller first so we can use their name as businessName default
    const existing = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // Update user status AND ensure a VendorProfile exists (upsert — never overwrites real data)
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where:  { id: req.params.id },
        data:   { sellerStatus: "approved", role: "seller" },
        select: { id: true, name: true, sellerStatus: true, role: true },
      }),
      prisma.vendorProfile.upsert({
        where:  { userId: req.params.id },
        update: {},   // don't overwrite data the seller already submitted
        create: {
          userId:       req.params.id,
          businessName: existing.name,
          category:     "General",
          description:  "",
          location:     "",
          portfolio:    [],
        },
      }),
    ]);

    logAudit(req, {
      action:      "Approved seller application",
      type:        "seller",
      targetType:  "user",
      targetLabel: user.name,
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/vendors/:id/reject ──────────────────────────────────────
export const rejectVendor = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { sellerStatus: "rejected" },
      select: { id: true, name: true, sellerStatus: true },
    });
    logAudit(req, {
      action:      "Rejected seller application",
      type:        "seller",
      targetType:  "user",
      targetLabel: user.name,
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/vendors/:id/suspend ─────────────────────────────────────
export const suspendVendor = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { isActive: false },
      select: { id: true, name: true, isActive: true },
    });
    logAudit(req, {
      action: "Suspended vendor", type: "seller", targetType: "user", targetLabel: user.name,
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/vendors/:id/reinstate ───────────────────────────────────
export const reinstateVendor = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { isActive: true },
      select: { id: true, name: true, isActive: true },
    });
    logAudit(req, {
      action: "Reinstated vendor", type: "seller", targetType: "user", targetLabel: user.name,
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/bookings ───────────────────────────────────────────────────
export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { id: true, name: true, email: true, avatar: true } },
        gig: {
          select: {
            id: true, title: true, category: true,
            vendor: { select: { id: true, businessName: true } },
          },
        },
      },
    });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/bookings/:id ────────────────────────────────────────────
export const updateBooking = async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status },
    });
    logAudit(req, {
      action:      `Updated order status to ${status}`,
      type:        "order",
      targetType:  "booking",
      targetLabel: booking.id.slice(0, 8),
    });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/gigs/:id/suspend ────────────────────────────────────────
export const suspendGig = async (req, res) => {
  try {
    const gig = await prisma.gig.update({
      where:  { id: req.params.id },
      data:   { status: "paused" },
      select: { id: true, title: true, status: true },
    });
    logAudit(req, {
      action: "Suspended gig", type: "gig", targetType: "gig", targetLabel: gig.title,
    });
    res.json({ success: true, gig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/gigs/:id/restore ────────────────────────────────────────
export const restoreGig = async (req, res) => {
  try {
    const gig = await prisma.gig.update({
      where:  { id: req.params.id },
      data:   { status: "active" },
      select: { id: true, title: true, status: true },
    });
    logAudit(req, {
      action: "Restored gig", type: "gig", targetType: "gig", targetLabel: gig.title,
    });
    res.json({ success: true, gig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/announcements ──────────────────────────────────────────────
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/announcements ─────────────────────────────────────────────
// Persists announcement + fans out Notification rows to targeted users
export const sendAnnouncement = async (req, res) => {
  const { title, body, target = "all", priority = "medium", expiresAt } = req.body;

  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ success: false, message: "Title and body are required" });
  }

  try {
    const roleFilter =
      target === "buyers"  ? { role: "buyer"  } :
      target === "sellers" ? { role: "seller" } :
      {};

    const users = await prisma.user.findMany({
      where:  { ...roleFilter, isActive: true },
      select: { id: true },
    });

    // Save announcement record first so we have its ID for the link field
    const announcement = await prisma.announcement.create({
      data: {
        title:       title.trim(),
        body:        body.trim(),
        target,
        priority,
        status:      "active",
        notified:    users.length,
        expiresAt:   expiresAt ? new Date(expiresAt) : null,
        createdById: req.user.id,
      },
      include: { createdBy: { select: { name: true } } },
    });

    // Fan-out notifications; link = "ann:<id>" so we can close them later
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          type:   "system",
          title:  title.trim(),
          body:   body.trim(),
          link:   `ann:${announcement.id}`,
          read:   false,
        })),
      });
    }

    logAudit(req, {
      action:      "Published announcement",
      type:        "system",
      targetType:  "announcement",
      targetLabel: title.trim(),
    });

    res.json({
      success:       true,
      announcement,
      notifiedCount: users.length,
      message:       `Announcement delivered to ${users.length} user${users.length !== 1 ? "s" : ""}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/announcements/:id/close ──────────────────────────────────
// Marks announcement inactive + marks all user notifications as read (closed for everyone)
export const closeAnnouncement = async (req, res) => {
  try {
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data:  { status: "inactive" },
    });

    // Mark every notification for this announcement as read → vanishes from inboxes
    await prisma.notification.updateMany({
      where: { link: `ann:${req.params.id}` },
      data:  { read: true },
    });

    logAudit(req, {
      action:      "Closed announcement",
      type:        "system",
      targetType:  "announcement",
      targetLabel: announcement.title,
    });
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/accounts — list all admin/superadmin users ─────────────────
export const getAdminAccounts = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where:   { role: { in: ["admin", "superadmin"] } },
      orderBy: { createdAt: "desc" },
      select:  { id: true, name: true, email: true, avatar: true, role: true, isActive: true, createdAt: true },
    });
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/accounts — create a new admin account (superadmin only) ───
export const createAdmin = async (req, res) => {
  const { name, email, role = "admin" } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ success: false, message: "Name and email are required" });
  }
  if (!["admin", "superadmin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be admin or superadmin" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Generate a one-time temporary password shown to superadmin
    const tempPassword = `Viz@${Math.random().toString(36).slice(2, 8)}`;
    const hashed       = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name:         name.trim(),
        email:        email.trim().toLowerCase(),
        password:     hashed,
        role,
        sellerStatus: "none",
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    logAudit(req, {
      action:      `Created ${role} account`,
      type:        "system",
      targetType:  "user",
      targetLabel: user.name,
    });
    res.status(201).json({ success: true, user, tempPassword });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/admin/accounts/:id/status — suspend / reinstate admin ──────────
export const toggleAdminStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const isActive = (status || "").toUpperCase() !== "SUSPENDED";
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { isActive },
      select: { id: true, name: true, isActive: true },
    });
    logAudit(req, {
      action:      isActive ? "Reinstated admin account" : "Suspended admin account",
      type:        "system",
      targetType:  "user",
      targetLabel: user.name,
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  SUPERADMIN ANALYTICS & PLATFORM PAGES (real data)
// ════════════════════════════════════════════════════════════════════════════

// ── GET /api/admin/revenue — deep revenue breakdown (Revenue Analytics page) ──
export const getRevenue = async (req, res) => {
  try {
    const completed = await prisma.booking.findMany({
      where:   { status: "completed" },
      include: { gig: { select: { category: true } } },
      orderBy: { createdAt: "asc" },
    });

    const totalGross      = completed.reduce((s, b) => s + b.totalAmount, 0);
    const totalCommission = completed.reduce((s, b) => s + b.commission,  0);
    const totalPayouts    = totalGross - totalCommission;
    const avgOrderValue   = completed.length ? Math.round(totalGross / completed.length) : 0;

    // ── Monthly breakdown — last 6 months ──
    const now   = new Date();
    const slots = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      slots.push({
        year:  d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString("en-LK", { month: "short", year: "numeric" }),
      });
    }
    const monthly = slots.map(({ year, month, label }) => {
      const rows = completed.filter(b => {
        const d = new Date(b.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      return {
        month:      label,
        gross:      Math.round(rows.reduce((s, b) => s + b.totalAmount, 0)),
        commission: Math.round(rows.reduce((s, b) => s + b.commission,  0)),
        orders:     rows.length,
      };
    });

    // Top month + month-over-month growth (last vs previous)
    const topMonth = monthly.reduce(
      (best, m) => (m.gross > best.gross ? m : best),
      { month: "—", gross: 0 },
    ).month;

    const last = monthly[monthly.length - 1]?.gross || 0;
    const prev = monthly[monthly.length - 2]?.gross || 0;
    const growth = prev > 0
      ? `${last >= prev ? "+" : ""}${(((last - prev) / prev) * 100).toFixed(1)}%`
      : (last > 0 ? "+100%" : "0%");

    // ── By category ──
    const catMap = {};
    for (const b of completed) {
      const cat = b.gig?.category || "Other";
      if (!catMap[cat]) catMap[cat] = { gross: 0, commission: 0, orders: 0 };
      catMap[cat].gross      += b.totalAmount;
      catMap[cat].commission += b.commission;
      catMap[cat].orders     += 1;
    }
    const byCategory = Object.entries(catMap)
      .map(([category, v]) => ({
        category,
        gross:      Math.round(v.gross),
        commission: Math.round(v.commission),
        orders:     v.orders,
      }))
      .sort((a, b) => b.gross - a.gross);

    res.json({
      success: true,
      revenue: {
        summary: {
          totalGross:      Math.round(totalGross),
          totalCommission: Math.round(totalCommission),
          totalPayouts:    Math.round(totalPayouts),
          avgOrderValue,
          topMonth,
          growth,
        },
        monthly,
        byCategory,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/audit-logs — chronological log + per-admin activity ────────
// Powers BOTH the Audit Logs page and the Admin Activity Feed.
export const getAuditLogs = async (req, res) => {
  try {
    const [logs, admins] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take:    200,
        include: { actor: { select: { id: true, name: true, avatar: true, role: true, isActive: true } } },
      }),
      prisma.user.findMany({
        where:   { role: { in: ["admin", "superadmin"] } },
        select:  { id: true, name: true, avatar: true, role: true, isActive: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const shaped = logs.map(l => ({
      id:          l.id,
      adminId:     l.actorId,
      admin:       l.actor?.name || l.actorName || "System",
      adminAvatar: l.actor?.avatar || "",
      adminRole:   l.actor?.role  || l.actorRole,
      action:      l.action,
      target:      l.targetLabel,
      type:        l.type,
      createdAt:   l.createdAt,
    }));

    res.json({ success: true, logs: shaped, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/system-health — live server / DB / storage metrics ─────────
function fmtBytes(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}
function dirSize(dir) {
  let total = 0;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return 0; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    try {
      if (e.isDirectory()) total += dirSize(full);
      else total += fs.statSync(full).size;
    } catch { /* skip unreadable */ }
  }
  return total;
}

export const getSystemHealth = async (req, res) => {
  try {
    // DB ping + latency
    let dbOk = true;
    let dbLatency = 0;
    const t0 = Date.now();
    try { await prisma.$queryRaw`SELECT 1`; dbLatency = Date.now() - t0; }
    catch { dbOk = false; }

    // Record counts (real)
    const [totalUsers, activeUsers, totalBookings, totalGigs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.gig.count(),
    ]);

    // Process metrics
    const mem        = process.memoryUsage();
    const heapPct    = Math.round((mem.heapUsed / mem.heapTotal) * 100);
    const uptimeSec  = Math.floor(process.uptime());
    const d = Math.floor(uptimeSec / 86400);
    const h = Math.floor((uptimeSec % 86400) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const uptimeLabel = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;

    // Uploads storage (real bytes on disk)
    const uploadsBytes = dirSize(path.join(process.cwd(), "public", "uploads"));

    const dbStatus      = dbOk ? "operational" : "down";
    const storageStatus = "operational";

    const services = [
      { name: "Web Server", status: "operational", uptime: uptimeLabel },
      { name: "Database",   status: dbStatus,       uptime: dbOk ? `${dbLatency} ms` : "unreachable" },
      { name: "Storage",    status: storageStatus,  uptime: fmtBytes(uploadsBytes) },
    ];

    const metrics = [
      { label: "DB Response Time", value: dbOk ? `${dbLatency} ms` : "—", status: !dbOk ? "bad" : dbLatency < 100 ? "good" : "warning", note: "live SELECT 1 round-trip" },
      { label: "Server Uptime",    value: uptimeLabel,                    status: "good",    note: "since last restart" },
      { label: "Memory (RSS)",     value: fmtBytes(mem.rss),              status: "good",    note: `heap ${heapPct}% used` },
      { label: "Uploads Storage",  value: fmtBytes(uploadsBytes),         status: uploadsBytes > 5 * 1024 ** 3 ? "warning" : "good", note: "files on disk" },
      { label: "Active Users",     value: String(activeUsers),            status: "good",    note: `${totalUsers} total accounts` },
      { label: "Records",          value: `${totalBookings + totalGigs}`, status: "good",    note: `${totalBookings} bookings · ${totalGigs} gigs` },
    ];

    res.json({
      success: true,
      health: {
        status:    dbOk ? "operational" : "degraded",
        checkedAt: new Date().toISOString(),
        uptimeLabel,
        services,
        metrics,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/backups — list backup history ──────────────────────────────
const serializeBackup = (b) => ({
  id:          b.id,
  type:        b.type,
  status:      b.status,
  size:        Number(b.sizeBytes) ? fmtBytes(Number(b.sizeBytes)) : "—",
  sizeBytes:   Number(b.sizeBytes),
  fileName:    b.fileName,
  initiatedBy: b.initiatedByName,
  error:       b.error,
  createdAt:   b.createdAt,
});

export const getBackups = async (req, res) => {
  try {
    const backups = await prisma.backup.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ success: true, backups: backups.map(serializeBackup) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/backups — run a real pg_dump now ──────────────────────────
export const createBackup = async (req, res) => {
  try {
    const record = await runBackup(req.user);
    logAudit(req, {
      action:      record.status === "success" ? "Ran database backup" : "Database backup failed",
      type:        "system",
      targetType:  "backup",
      targetLabel: record.fileName,
    });
    const ok = record.status === "success";
    res.status(ok ? 201 : 500).json({
      success: ok,
      backup:  serializeBackup(record),
      message: ok ? "Backup completed." : `Backup failed: ${record.error}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/backups/:id/restore — guarded (no destructive action) ─────
export const restoreBackup = async (req, res) => {
  try {
    const backup = await prisma.backup.findUnique({ where: { id: req.params.id } });
    if (!backup) return res.status(404).json({ success: false, message: "Backup not found" });

    logAudit(req, {
      action:      "Requested database restore",
      type:        "system",
      targetType:  "backup",
      targetLabel: backup.fileName,
    });

    // Restoring overwrites the live database — intentionally NOT executed here.
    // Operators should run `pg_restore`/`psql` against the dump file manually.
    res.json({
      success: false,
      guarded: true,
      message: "Restore is disabled in this environment for safety. " +
               `Restore the dump file '${backup.fileName}' manually using psql.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
