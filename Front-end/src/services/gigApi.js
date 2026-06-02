// services/gigApi.js
import api from "../lib/axios.js";

export const gigApi = {
  list:    (params) => api.get("/gigs", { params }),
  getById: (id)     => api.get(`/gigs/${id}`),
  getMy:   ()       => api.get("/gigs/my/gigs"),
  create:  (data)   => api.post("/gigs", data),
  update:  (id, data) => api.put(`/gigs/${id}`, data),
  remove:  (id)     => api.delete(`/gigs/${id}`),
};
