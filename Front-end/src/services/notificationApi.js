// services/notificationApi.js
import api from "../lib/axios.js";

export const notificationApi = {
  getAll:               (params) => api.get("/notifications", { params }),
  getAnnouncementBanners: ()     => api.get("/notifications/announcements"),
  markOneRead:          (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead:          ()       => api.patch("/notifications/read-all"),
  remove:               (id)     => api.delete(`/notifications/${id}`),
};
