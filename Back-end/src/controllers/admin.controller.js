// controllers/admin.controller.js
// Admin-only endpoints: stats, analytics, users, vendor actions, bookings, gigs,
// admin account management, announcements
import bcrypt from "bcryptjs";
import prisma  from "../config/db.js";

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
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
