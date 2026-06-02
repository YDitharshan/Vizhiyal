// services/promoApi.js
import api from "../lib/axios.js";

export const promoApi = {
  validate:     (data)     => api.post("/promos/validate", data),
  getAll:       (params)   => api.get("/promos", { params }),
  create:       (data)     => api.post("/promos", data),
  toggleStatus: (id)       => api.patch(`/promos/${id}/status`),
  remove:       (id)       => api.delete(`/promos/${id}`),
};
