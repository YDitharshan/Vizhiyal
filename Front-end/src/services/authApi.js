// services/authApi.js
import api from "../lib/axios.js";

export const authApi = {
  register:       (data)   => api.post("/auth/register", data),
  login:          (data)   => api.post("/auth/login", data),
  getMe:          ()       => api.get("/auth/me"),
  updateProfile:  (data)   => api.put("/auth/profile", data),
  changePassword: (data)   => api.put("/auth/change-password", data),
  becomeSeller:   (data)   => api.post("/auth/become-seller", data),
};
