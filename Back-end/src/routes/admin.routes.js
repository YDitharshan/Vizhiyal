// routes/admin.routes.js — all admin-only endpoints
import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getStats, getAnalytics,
  getUsers, updateUserStatus,
  listSellerApplications, getSellerById,
  approveVendor, rejectVendor, suspendVendor, reinstateVendor,
  getBookings, updateBooking,
  suspendGig, restoreGig,
  getAnnouncements, sendAnnouncement, closeAnnouncement,
  getAdminAccounts, createAdmin, toggleAdminStatus,
} from "../controllers/admin.controller.js";

const router        = Router();
const adminOnly     = [protect, authorize("admin", "superadmin")];
const superAdminOnly = [protect, authorize("superadmin")];

// ── Stats & Analytics ────────────────────────────────────────────
router.get("/stats",     ...adminOnly, getStats);
router.get("/analytics", ...adminOnly, getAnalytics);

// ── Users ────────────────────────────────────────────────────────
router.get("/users",               ...adminOnly, getUsers);
router.patch("/users/:id/status",  ...adminOnly, updateUserStatus);

// ── Vendor applications ──────────────────────────────────────────
router.get("/vendors",                 ...adminOnly, listSellerApplications);
router.get("/vendors/:id",             ...adminOnly, getSellerById);
router.patch("/vendors/:id/approve",   ...adminOnly, approveVendor);
router.patch("/vendors/:id/reject",    ...adminOnly, rejectVendor);
router.patch("/vendors/:id/suspend",   ...adminOnly, suspendVendor);
router.patch("/vendors/:id/reinstate", ...adminOnly, reinstateVendor);

// ── Bookings ─────────────────────────────────────────────────────
router.get("/bookings",        ...adminOnly, getBookings);
router.patch("/bookings/:id",  ...adminOnly, updateBooking);

// ── Gigs ─────────────────────────────────────────────────────────
router.patch("/gigs/:id/suspend", ...adminOnly, suspendGig);
router.patch("/gigs/:id/restore", ...adminOnly, restoreGig);

// ── Announcements ────────────────────────────────────────────────
router.get("/announcements",              ...adminOnly,     getAnnouncements);
router.post("/announcements",             ...adminOnly,     sendAnnouncement);
router.patch("/announcements/:id/close",  ...adminOnly,     closeAnnouncement);

// ── Admin accounts (superadmin only) ────────────────────────────
router.get("/accounts",               ...superAdminOnly, getAdminAccounts);
router.post("/accounts",              ...superAdminOnly, createAdmin);
router.patch("/accounts/:id/status",  ...superAdminOnly, toggleAdminStatus);

export default router;
