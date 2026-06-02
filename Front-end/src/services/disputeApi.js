// services/disputeApi.js
import api from "../lib/axios.js";

export const disputeApi = {
  create:       (data)          => api.post("/disputes", data),
  getMy:        ()              => api.get("/disputes/my"),
  getAll:       (params)        => api.get("/disputes/all", { params }),
  getById:      (id)            => api.get(`/disputes/${id}`),
  updateStatus: (id, data)      => api.patch(`/disputes/${id}/status`, data),
};
