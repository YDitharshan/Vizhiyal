// services/vendorApi.js
import api from "../lib/axios.js";

export const vendorApi = {
  list:          (params) => api.get("/vendors", { params }),
  getById:       (id)     => api.get(`/vendors/${id}`),
  // Proof-of-Work portfolio: items provably tied to real completed bookings
  verifiedWork:  (id, params) => api.get(`/vendors/${id}/verified-work`, { params }),
  // TrustGraph synergy: vendors with a track record on the same events
  worksWith:     (id, params) => api.get(`/vendors/${id}/works-with`, { params }),
  getMyProfile:  ()       => api.get("/vendors/me/profile"),
  createProfile: (data)   => api.post("/vendors/profile", data),
  updateProfile: (data)   => api.put("/vendors/profile", data),

  // Availability (public — buyer view)
  getAvailability:   (id, month) => api.get(`/vendors/${id}/availability`, { params: { month } }),
  // Availability (seller — own profile)
  getMyAvailability: (month)     => api.get("/vendors/me/availability",    { params: { month } }),
  blockDate:   (date) => api.post("/vendors/availability",   { date }),
  unblockDate: (date) => api.delete("/vendors/availability", { data: { date } }),
};
