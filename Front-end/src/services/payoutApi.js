// services/payoutApi.js
import api from "../lib/axios.js";

export const payoutApi = {
  request:      (data)        => api.post("/payouts", data),
  getMy:        (params)      => api.get("/payouts/my", { params }),
  getAll:       (params)      => api.get("/payouts/all", { params }),
  updateStatus: (id, data)    => api.patch(`/payouts/${id}/status`, data),
};
