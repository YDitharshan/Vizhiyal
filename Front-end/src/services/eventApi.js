// services/eventApi.js — Smart Event Bundle Builder
import api from "../lib/axios.js";

export const eventApi = {
  // AI Budget Concierge: split a budget across categories + recommend per slot.
  // data: { categories[], totalBudget, location, eventDate, eventType, guestCount, perCategory }
  plan:    (data) => api.post("/events/plan", data),
  // Atomically book the whole bundle.
  // data: { title, eventType, eventDate, location, guestCount, totalBudget, items[], plan }
  create:  (data) => api.post("/events", data),
  getMy:   ()     => api.get("/events/my"),
  getById: (id)   => api.get(`/events/${id}`),
};
