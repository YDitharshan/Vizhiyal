// lib/axios.js — central axios instance
// • Automatically attaches Bearer token to every request
// • Redirects to /login on 401 (token expired / invalid)
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach token ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vizhiyal_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("vizhiyal_token");
      localStorage.removeItem("vizhiyal_auth");
      // Only redirect if not already on guest pages
      const guestPaths = ["/", "/login", "/register"];
      if (!guestPaths.includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
