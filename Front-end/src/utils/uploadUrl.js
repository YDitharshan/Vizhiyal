// uploadUrl.js — converts relative /uploads/... paths to full backend URLs
// Backend stores images as "/uploads/filename.jpg" (relative).
// These must be resolved to the absolute backend URL for <img> tags to work,
// since the browser cannot serve them from the Vite dev server without the proxy.

// Strip "/api" suffix from VITE_API_URL to get the backend root
// e.g.  "http://localhost:5000/api"  →  "http://localhost:5000"
const RAW = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BACKEND = RAW.replace(/\/api\/?$/, "");

/**
 * Converts a relative upload path to an absolute URL pointing at the backend.
 *
 * "/uploads/abc.jpg"           → "http://localhost:5000/uploads/abc.jpg"
 * "http://cdn.example/x.jpg"  → "http://cdn.example/x.jpg"   (unchanged)
 * null / undefined / ""        → null
 */
export function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND}${url.startsWith("/") ? "" : "/"}${url}`;
}
