// services/bookingApi.js
import api from "../lib/axios.js";

export const bookingApi = {
  create:         (data)       => api.post("/bookings", data),
  getMy:          (params)     => api.get("/bookings/my", { params }),
  getSeller:      (params)     => api.get("/bookings/seller", { params }),
  getById:        (id)         => api.get(`/bookings/${id}`),
  updateStatus:   (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  // Seller submits completion evidence (images + note) → pending_completion
  submitCompletion:  (id, data) => api.post(`/bookings/${id}/submit-completion`, data),
  // Buyer accepts evidence → completed
  confirmCompletion: (id)       => api.post(`/bookings/${id}/confirm-completion`),
  // Returns array of ISO date strings that are already booked for the vendor
  getBookedDates:    (vendorId) => api.get(`/bookings/vendor/${vendorId}/booked-dates`),
  // Returns count of confirmed + in_progress bookings (vendor queue size)
  getQueueCount:     (vendorId) => api.get(`/bookings/vendor/${vendorId}/queue-count`),
};
