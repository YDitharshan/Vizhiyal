// utils/adapters.js — map backend API shapes → frontend component shapes
import { resolveUrl } from "./uploadUrl";

// ── VendorProfile → VendorCard prop shape ────────────────────
export function adaptVendor(v) {
  // Collect real uploaded images from all active gigs; use first one as cover
  const gigImages = (v.gigs ?? [])
    .flatMap(g => Array.isArray(g.images) ? g.images : [])
    .filter(Boolean);

  // Lowest price across all returned active gigs (basic / standard / premium)
  const allPrices = (v.gigs ?? [])
    .flatMap(g => [g.basicPrice, g.standardPrice, g.premiumPrice])
    .filter(p => p > 0);
  const startingPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  return {
    id:            v.id,
    name:          v.businessName,
    category:      v.category,
    subcategory:   v.category,
    coverImage:    resolveUrl(gigImages[0]) || null,          // null → gradient in VendorCard
    profileImage:  resolveUrl(v.user?.avatar) || null,       // null → UserAvatar initials
    location:      v.location || v.user?.location || "Sri Lanka",
    verified:      v.isVerified,
    featured:      v.gigs?.some(g => g.featured) ?? false,
    rating:        +(v.avgRating || 0).toFixed(1),
    reviewCount:   v.totalReviews || 0,
    startingPrice,
  };
}

// ── Gig (public listing) → GigCard prop shape ────────────────
export function adaptGig(g) {
  return {
    id:            g.id,
    vendorId:      g.vendor?.id || g.vendorId,
    title:         g.title      || "",
    category:      g.category   || "",
    coverImage:    resolveUrl(g.images?.[0]) || null,         // null → gradient
    profileImage:  resolveUrl(g.vendor?.user?.avatar) || null,
    vendorName:    g.vendor?.businessName || "",
    location:      g.vendor?.location    || "",
    verified:      g.vendor?.isVerified || false,
    reliabilityScore: g.vendor?.reliabilityScore || 0,
    reliabilityTier:  g.vendor?.reliabilityTier  || "new",
    // Use gig-level rating (not vendor aggregate) — each gig is rated independently
    rating:        +(g.avgRating    || 0).toFixed(1),
    reviewCount:   g.totalReviews   || 0,
    startingPrice: g.basicPrice     || 0,
  };
}

// ── Booking → Orders list display shape ──────────────────────
export function adaptBooking(b) {
  return {
    id:         b.id,
    vendorId:   b.vendorId,
    vendorName: b.gig?.vendor?.businessName || "Vendor",
    service:    `${b.gig?.title || "Service"} – ${b.packageType} package`,
    date:       b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-LK") : "—",
    amount:     b.totalAmount,
    status:     b.status,
    gigImage:   resolveUrl(b.gig?.images?.[0]) || null,
    category:   b.gig?.category || "",
  };
}
