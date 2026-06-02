// services/adminApi.js — admin-only endpoints
import api from "../lib/axios.js";

export const adminApi = {
  // ── Stats / Analytics ─────────────────────────────────────────────
  getStats:        ()       => api.get("/admin/stats"),
  getAnalytics:    ()       => api.get("/admin/analytics"),

  // ── Users ─────────────────────────────────────────────────────────
  getUsers:        (params) => api.get("/admin/users", { params }),
  getUserById:     (id)     => api.get(`/admin/users/${id}`),
  updateUserStatus:(id, data) => api.patch(`/admin/users/${id}/status`, data),

  // ── Vendor applications ───────────────────────────────────────────
  listSellerApplications: ()      => api.get("/admin/vendors"),
  getSellerById:   (id)     => api.get(`/admin/vendors/${id}`),
  approveVendor:   (id)     => api.patch(`/admin/vendors/${id}/approve`),
  rejectVendor:    (id, data) => api.patch(`/admin/vendors/${id}/reject`, data),
  suspendVendor:   (id, data) => api.patch(`/admin/vendors/${id}/suspend`, data),
  reinstateVendor: (id)     => api.patch(`/admin/vendors/${id}/reinstate`),

  // ── All bookings (admin view) ─────────────────────────────────────
  getBookings:     (params) => api.get("/admin/bookings", { params }),
  updateBooking:   (id, data) => api.patch(`/admin/bookings/${id}`, data),

  // ── Gig admin actions ─────────────────────────────────────────────
  suspendGig:      (id)     => api.patch(`/admin/gigs/${id}/suspend`),
  restoreGig:      (id)     => api.patch(`/admin/gigs/${id}/restore`),

  // ── Announcements ─────────────────────────────────────────────────
  getAnnouncements:  ()     => api.get("/admin/announcements"),
  sendAnnouncement:  (data) => api.post("/admin/announcements", data),
  closeAnnouncement: (id)   => api.patch(`/admin/announcements/${id}/close`),

  // ── Admin accounts (superadmin only) ──────────────────────────
  getAdminAccounts:    ()         => api.get("/admin/accounts"),
  createAdmin:         (data)     => api.post("/admin/accounts", data),
  toggleAdminStatus:   (id, data) => api.patch(`/admin/accounts/${id}/status`, data),
};
