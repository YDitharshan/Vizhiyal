// controllers/vendor.controller.js
// createProfile · getMyProfile · updateProfile · listVendors · getVendorById
import { validationResult } from "express-validator";
import prisma from "../config/db.js";

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

    // Create profile + sync phone/location back to User row in one transaction
    const [profile] = await prisma.$transaction([
      prisma.vendorProfile.create({
        data: {
          userId:         req.user.id,
          businessName,
          category,
          description:    description    ?? "",
          location:       location       ?? "",
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

  try {
    // Update vendor profile + sync phone/location to User row in one transaction
    const [profile] = await prisma.$transaction([
      prisma.vendorProfile.update({
        where: { userId: req.user.id },
        data: {
          ...(businessName    !== undefined && { businessName }),
          ...(category        !== undefined && { category }),
          ...(description     !== undefined && { description }),
          ...(location        !== undefined && { location }),
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
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, avatar: true, location: true, createdAt: true } },
        // Order newest-first so order matches the seller's own Gigs page
        gigs: { where: { status: "active" }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    return res.json({ success: true, vendor });
  } catch (err) {
    console.error("getVendorById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
