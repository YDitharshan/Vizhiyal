// controllers/recommend.controller.js
// Proxies recommendation requests to the Python ml-service, then hydrates the
// returned vendor_ids into full vendor objects (same shape as listVendors) so
// the frontend can reuse its existing VendorCard/GigCard components.
import prisma from "../config/db.js";
import { coordsForLocation } from "../utils/cityCoords.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Shared include so recommended vendors match the listVendors payload shape.
const VENDOR_INCLUDE = {
  user: { select: { name: true, avatar: true, location: true } },
  gigs: { where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 6 },
};

// ── @GET /api/recommend/vendors  (public) ─────────────────────
// Query params:
//   category   — service category (optional but recommended)
//   location   — customer city (resolved to lat/lng) — used if lat/lng absent
//   lat, lng   — explicit customer coordinates (override location)
//   budget     — customer budget in LKR
//   limit      — how many to return (default 6)
//   w_distance, w_rating, w_experience, w_price — optional ranking weights
export const recommendVendors = async (req, res) => {
  const {
    category, location, lat, lng, budget,
    limit = 6,
    w_distance, w_rating, w_experience, w_price,
  } = req.query;

  // Resolve coordinates: explicit lat/lng wins, else derive from city name.
  let latitude  = lat !== undefined ? Number(lat) : null;
  let longitude = lng !== undefined ? Number(lng) : null;
  if ((latitude === null || Number.isNaN(latitude)) && location) {
    const c = coordsForLocation(location);
    if (c) { latitude = c.lat; longitude = c.lng; }
  }

  // Only pass weights through if the caller actually set at least one.
  const weights = {};
  if (w_distance   !== undefined) weights.distance   = Number(w_distance);
  if (w_rating     !== undefined) weights.rating     = Number(w_rating);
  if (w_experience !== undefined) weights.experience = Number(w_experience);
  if (w_price      !== undefined) weights.price      = Number(w_price);

  const payload = {
    category: category || null,
    latitude:  Number.isFinite(latitude)  ? latitude  : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    budget: budget !== undefined ? Number(budget) : null,
    top_n: Number(limit),
    ...(Object.keys(weights).length && { weights }),
  };

  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Don't let a slow/hung ML service block the request indefinitely.
      signal: AbortSignal.timeout(4000),
    });

    if (!mlRes.ok) throw new Error(`ml-service ${mlRes.status}`);
    const { results = [] } = await mlRes.json();

    if (results.length === 0)
      return res.json({ success: true, source: "ml", vendors: [] });

    // Hydrate vendor_ids -> full vendor rows, preserving the ML ranking order
    // and attaching the recommendation metadata.
    const ids = results.map((r) => r.vendor_id);
    const rows = await prisma.vendorProfile.findMany({
      where: { id: { in: ids } },
      include: VENDOR_INCLUDE,
    });
    const byId = new Map(rows.map((v) => [v.id, v]));

    const vendors = results
      .map((r) => {
        const v = byId.get(r.vendor_id);
        if (!v) return null; // stale model entry — vendor no longer exists
        return {
          ...v,
          recommendation: {
            matchScore:  r.match_score,
            distanceKm:  r.distance_km,
            scores:      r.scores,
          },
        };
      })
      .filter(Boolean);

    return res.json({ success: true, source: "ml", vendors });
  } catch (err) {
    // Graceful fallback: ML service unreachable -> rank by rating in the DB so
    // the feature degrades instead of erroring out for the user.
    console.error("recommendVendors fallback:", err.message);
    try {
      const vendors = await prisma.vendorProfile.findMany({
        where: {
          gigs: { some: { status: "active" } },
          ...(category && { category: { equals: category, mode: "insensitive" } }),
          ...(location && { location: { contains: location, mode: "insensitive" } }),
        },
        orderBy: [{ avgRating: "desc" }, { completedJobs: "desc" }],
        take: Number(limit),
        include: VENDOR_INCLUDE,
      });
      return res.json({ success: true, source: "fallback", vendors });
    } catch (e2) {
      console.error("recommendVendors fallback error:", e2);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
};
