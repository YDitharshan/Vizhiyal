// controllers/vendor.controller.js
// createProfile · getMyProfile · updateProfile · listVendors · getVendorById
import { validationResult } from "express-validator";
import prisma from "../config/db.js";
import { coordsForLocation } from "../utils/cityCoords.js";

// ── @POST /api/vendors/profile  (seller only) ─────────────────
export const createProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    businessName, category, description, location, portfolio, phone,
    tagline, languages, portfolioItems, workExperience, skills, certifications,
  } = req.body;

  try {
    // Only one profile per seller
    const existing = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (existing)
      return res.status(409).json({ success: false, message: "Vendor profile already exists" });

    // Derive coordinates from the city so the recommender can use distance.
    const coords = coordsForLocation(location);

    // Create profile + sync phone/location back to User row in one transaction
    const [profile] = await prisma.$transaction([
      prisma.vendorProfile.create({
        data: {
          userId:         req.user.id,
          businessName,
          category,
          description:    description    ?? "",
          location:       location       ?? "",
          latitude:       coords?.lat    ?? null,
          longitude:      coords?.lng    ?? null,
          portfolio:      portfolio      ?? [],
          tagline:        tagline        ?? "",
          languages:      languages      ?? [],
          portfolioItems: portfolioItems ?? [],
          workExperience: workExperience ?? [],
          skills:         skills         ?? [],
          certifications: certifications ?? [],
        },
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(phone    && { phone }),
          ...(location && { location }),
        },
      }),
    ]);

    return res.status(201).json({ success: true, vendor: profile });
  } catch (err) {
    console.error("createProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/vendors/me/profile  (seller only) ──────────────
export const getMyProfile = async (req, res) => {
  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        gigs: true,
        // Pull phone & location from User so the profile page can pre-fill them
        user: { select: { name: true, phone: true, location: true, avatar: true } },
      },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "No vendor profile found" });

    // Return as "vendor" (consistent with other endpoints)
    return res.json({ success: true, vendor: profile });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PUT /api/vendors/profile  (seller only) ─────────────────
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    businessName, category, description, location, portfolio, phone,
    tagline, languages, portfolioItems, workExperience, skills, certifications,
  } = req.body;

  // When location changes, re-derive coordinates for the recommender.
  const coords = location !== undefined ? coordsForLocation(location) : undefined;

  try {
    // Update vendor profile + sync phone/location to User row in one transaction
    const [profile] = await prisma.$transaction([
      prisma.vendorProfile.update({
        where: { userId: req.user.id },
        data: {
          ...(businessName    !== undefined && { businessName }),
          ...(category        !== undefined && { category }),
          ...(description     !== undefined && { description }),
          ...(location        !== undefined && { location, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null }),
          ...(portfolio       !== undefined && { portfolio }),
          ...(tagline         !== undefined && { tagline }),
          ...(languages       !== undefined && { languages }),
          ...(portfolioItems  !== undefined && { portfolioItems }),
          ...(workExperience  !== undefined && { workExperience }),
          ...(skills          !== undefined && { skills }),
          ...(certifications  !== undefined && { certifications }),
        },
        include: {
          user: { select: { name: true, phone: true, location: true, avatar: true } },
        },
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(phone    !== undefined && { phone }),
          ...(location !== undefined && { location }),
        },
      }),
    ]);

    return res.json({ success: true, vendor: profile });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    console.error("updateProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/vendors  (public) ───────────────────────────────
// Query params: category, location, search, verified, minRating, sortBy, page, limit
export const listVendors = async (req, res) => {
  const {
    category, location, search,
    verified,            // "true" → isVerified: true only
    minRating,           // e.g. "4.0" → avgRating >= 4.0
    sortBy,              // "rating" | "reviews" | "newest"  (price sort stays client-side)
    page = 1, limit = 12,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Normalise legacy category aliases so old DB records still match
  const CATEGORY_ALIASES = { "dj & music": "Music & DJ", "music & dj": "Music & DJ" };
  const normCat = category ? (CATEGORY_ALIASES[category.toLowerCase()] ?? category) : null;

  const where = {
    // Only list vendors that have at least one active gig
    gigs: { some: { status: "active" } },
    ...(verified === "true" && { isVerified: true }),
    // Category filter: match vendors whose PROFILE category matches,
    // OR who have at least one ACTIVE GIG in that category.
    // This makes a vendor discoverable under every category they offer a gig in,
    // even if their profile category is different (e.g. a DJ vendor with a photography gig).
    ...(normCat && {
      OR: [
        { category: { equals: normCat, mode: "insensitive" } },
        { gigs: { some: { status: "active", category: { equals: normCat, mode: "insensitive" } } } },
      ],
    }),
    ...(location  && { location: { contains: location, mode: "insensitive" } }),
    ...(search    && {
      OR: [
        { businessName: { contains: search, mode: "insensitive" } },
        { description:  { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(minRating && { avgRating: { gte: Number(minRating) } }),
  };

  const orderByMap = {
    rating:  { avgRating:    "desc" },
    reviews: { totalReviews: "desc" },
    newest:  { createdAt:    "desc" },
  };
  const orderBy = orderByMap[sortBy] ?? { avgRating: "desc" };

  try {
    const [vendors, total] = await Promise.all([
      prisma.vendorProfile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          user: { select: { name: true, avatar: true, location: true } },
          gigs: { where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 6 },
        },
      }),
      prisma.vendorProfile.count({ where }),
    ]);

    return res.json({
      success: true,
      vendors,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("listVendors error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/vendors/:id  (public) ──────────────────────────
export const getVendorById = async (req, res) => {
  try {
    const [vendor, verifiedWorkCount] = await Promise.all([
      prisma.vendorProfile.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { name: true, avatar: true, location: true, createdAt: true } },
          // Order newest-first so order matches the seller's own Gigs page
          gigs: { where: { status: "active" }, orderBy: { createdAt: "desc" } },
        },
      }),
      // "Verified work" = completed bookings backed by delivery evidence.
      prisma.booking.count({
        where: {
          vendorId: req.params.id,
          status: "completed",
          completionImages: { isEmpty: false },
        },
      }),
    ]);

    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    return res.json({ success: true, vendor: { ...vendor, verifiedWorkCount } });
  } catch (err) {
    console.error("getVendorById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/vendors/:id/verified-work  (public) ────────────
// Proof-of-Work portfolio: every item is provably tied to a REAL completed
// booking on the platform (delivery evidence submitted by the seller + the
// buyer's review). Unlike a self-uploaded gallery, these cannot be faked —
// the moat a pure social profile can't replicate.
export const getVerifiedWork = async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    vendorId: req.params.id,
    status: "completed",
    completionImages: { isEmpty: false },
  };

  try {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { completionSubmittedAt: "desc" },
        select: {
          id: true,
          eventType: true,
          completionNote: true,
          completionImages: true,
          completionSubmittedAt: true,
          packageType: true,
          gig:    { select: { id: true, title: true, category: true } },
          buyer:  { select: { name: true } },
          review: { select: { rating: true, comment: true, createdAt: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    // Shape each booking into a "verified work" provenance item.
    const items = bookings.map((b) => ({
      bookingId:   b.id,
      gigId:       b.gig?.id,
      gigTitle:    b.gig?.title || "",
      category:    b.gig?.category || "",
      eventType:   b.eventType || "",
      images:      b.completionImages,
      note:        b.completionNote || "",
      completedAt: b.completionSubmittedAt,
      // Buyer name partially masked for privacy (e.g. "Nimal P.")
      buyerName:   maskName(b.buyer?.name),
      reviewed:    !!b.review,
      rating:      b.review?.rating ?? null,
      reviewComment: b.review?.comment ?? "",
    }));

    return res.json({
      success: true,
      items,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getVerifiedWork error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/vendors/:id/works-with  (public) ───────────────
// TrustGraph synergy: vendors with a proven track record of serving the SAME
// events as this one (co-occurrence in Event bundles). A signal only a booking
// graph can produce — "this caterer has done N events with this DJ".
export const getWorksWith = async (req, res) => {
  const vendorId = req.params.id;
  const limit = Number(req.query.limit) || 6;

  try {
    // Events this vendor was part of, with the other vendors on each event.
    const events = await prisma.event.findMany({
      where: { bookings: { some: { vendorId } } },
      select: { bookings: { select: { vendorId: true } } },
    });

    // Count co-occurrences with every other vendor.
    const coCount = new Map();
    for (const ev of events) {
      const others = new Set(ev.bookings.map((b) => b.vendorId).filter((id) => id && id !== vendorId));
      for (const id of others) coCount.set(id, (coCount.get(id) || 0) + 1);
    }

    if (coCount.size === 0)
      return res.json({ success: true, partners: [] });

    const ids = [...coCount.keys()];
    const vendors = await prisma.vendorProfile.findMany({
      where: { id: { in: ids } },
      select: {
        id: true, businessName: true, category: true, location: true,
        avgRating: true, totalReviews: true, isVerified: true,
        reliabilityScore: true, reliabilityTier: true,
        user: { select: { avatar: true } },
      },
    });

    const partners = vendors
      .map((v) => ({ ...v, coEvents: coCount.get(v.id) }))
      .sort((a, b) => b.coEvents - a.coEvents || b.reliabilityScore - a.reliabilityScore)
      .slice(0, limit);

    return res.json({ success: true, partners });
  } catch (err) {
    console.error("getWorksWith error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// "Nimal Perera" → "Nimal P." — keep buyer identity light-touch on a public page.
function maskName(name) {
  if (!name) return "Verified buyer";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
