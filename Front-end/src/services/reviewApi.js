// services/reviewApi.js
import api from "../lib/axios.js";

export const reviewApi = {
  create:         (data)   => api.post("/reviews", data),
  getByVendor:    (id, params) => api.get(`/reviews/vendor/${id}`, { params }),
  getByGig:       (id, params) => api.get(`/reviews/gig/${id}`, { params }),
  getAll:         (params) => api.get("/reviews/all", { params }),
  flag:           (id)     => api.patch(`/reviews/${id}/flag`),
  remove:         (id)     => api.patch(`/reviews/${id}/remove`),
};
