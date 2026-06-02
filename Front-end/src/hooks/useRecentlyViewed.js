// hooks/useRecentlyViewed.js
// Tracks which gigs the buyer has viewed, persisted in localStorage.
// Powers the "Based on what you've been looking for" section on the home page.
//
// Storage key : "vizhiyal_recently_viewed"
// Each entry  : { gigId, vendorId, category, gig (slim GigCard data), viewedAt }
// Max entries : 20

import { resolveUrl } from "../utils/uploadUrl";

const STORAGE_KEY = "vizhiyal_recently_viewed";
const MAX_ENTRIES = 20;

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {

  // ── Add / update a gig view ─────────────────────────────────────────────────
  // `gig` can be a raw API gig object (from VendorDetail) or an adapted gig.
  const addGig = (gig) => {
    if (!gig?.id || !gig?.vendorId) return;

    const prices = [gig.basicPrice, gig.standardPrice, gig.premiumPrice].filter(p => p > 0);
    const startingPrice = gig.startingPrice ?? (prices.length > 0 ? Math.min(...prices) : 0);
    const firstImage = Array.isArray(gig.images) ? gig.images[0] : null;

    const slim = {
      id:            gig.id,
      vendorId:      gig.vendorId,
      title:         gig.title         || "",
      category:      gig.category      || "",
      coverImage:    gig.coverImage    || resolveUrl(firstImage) || null,
      profileImage:  gig.profileImage  || resolveUrl(gig.vendor?.user?.avatar) || null,
      vendorName:    gig.vendorName    || gig.vendor?.businessName || "",
      location:      gig.location      || gig.vendor?.location || "",
      verified:      gig.verified      ?? gig.vendor?.isVerified ?? false,
      rating:        gig.rating        ?? +(gig.vendor?.avgRating    || 0).toFixed(1),
      reviewCount:   gig.reviewCount   ?? gig.vendor?.totalReviews   ?? 0,
      startingPrice,
    };

    const prev = readAll().filter(e => e.gigId !== gig.id);
    const updated = [
      { gigId: gig.id, vendorId: gig.vendorId, category: slim.category, gig: slim, viewedAt: Date.now() },
      ...prev,
    ].slice(0, MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Unique categories in recency order ─────────────────────────────────────
  const getRecentCategories = () => {
    const seen = new Set();
    return readAll()
      .filter(e => e.category && !seen.has(e.category) && seen.add(e.category))
      .map(e => e.category);
  };

  // ── Gigs for a category (most recent first), or all if "All" ───────────────
  const getRecentGigs = (category) => {
    const all = readAll().filter(e => e.gigId); // only gig-level entries
    if (!category || category === "All") {
      const seenIds = new Set();
      return all
        .filter(e => !seenIds.has(e.gigId) && seenIds.add(e.gigId))
        .map(e => e.gig);
    }
    return all.filter(e => e.category === category).map(e => e.gig);
  };

  // ── Quick check: does the buyer have any browsing history? ─────────────────
  const hasHistory = () => readAll().filter(e => e.gigId).length > 0;

  return { addGig, getRecentCategories, getRecentGigs, hasHistory };
}
