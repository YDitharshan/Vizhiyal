// controllers/gig.controller.js
// listGigs · getGigById · createGig · updateGig · deleteGig · getMyGigs
import { validationResult } from "express-validator";
import prisma from "../config/db.js";

// ── @GET /api/gigs  (public) ──────────────────────────────────
// Query: category, search, minPrice, maxPrice, featured,
//        location, verified, minRating, sortBy, page, limit
export const listGigs = async (req, res) => {
  const {
    category, search, minPrice, maxPrice, featured,
    location, verified, minRating,
    sortBy, page = 1, limit = 12,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Normalise DJ/Music alias
  const CATEGORY_ALIASES = { "dj & music": "Music & DJ", "music & dj": "Music & DJ" };
  const normCat = category ? (CATEGORY_ALIASES[category.toLowerCase()] ?? category) : null;

  // Vendor-level filters (only add key if at least one filter is active)
  const vendorFilter = {
    ...(verified === "true" && { isVerified: true }),
    ...(minRating          && { avgRating: { gte: Number(minRating) } }),
    ...(location           && { location:  { contains: location, mode: "insensitive" } }),
  };

  const where = {
    status: "active",
    ...(normCat && { category: { equals: normCat, mode: "insensitive" } }),
    ...(featured === "true" && { featured: true }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...((minPrice || maxPrice) && {
      basicPrice: {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      },
    }),
    ...(Object.keys(vendorFilter).length > 0 && { vendor: vendorFilter }),
  };

  const orderByMap = {
    rating:     [{ vendor: { avgRating:    "desc" } }, { createdAt: "desc" }],
    reviews:    [{ vendor: { totalReviews: "desc" } }, { createdAt: "desc" }],
    newest:     [{ createdAt: "desc" }],
    price_asc:  [{ basicPrice: "asc"  }],
    price_desc: [{ basicPrice: "desc" }],
  };
  const orderBy = orderByMap[sortBy] ?? [{ featured: "desc" }, { vendor: { avgRating: "desc" } }, { createdAt: "desc" }];

  try {
    const [gigs, total] = await Promise.all([
      prisma.gig.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              avgRating: true,
              totalReviews: true,
              isVerified: true,
              location: true,
              user: { select: { name: true, avatar: true } },
            },
          },
        },
      }),
      prisma.gig.count({ where }),
    ]);

    return res.json({
      success: true,
      gigs,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("listGigs error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/gigs/:id  (public) ─────────────────────────────
export const getGigById = async (req, res) => {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: {
          include: {
            user: { select: { name: true, avatar: true, location: true } },
          },
        },
      },
    });

    if (!gig)
      return res.status(404).json({ success: false, message: "Gig not found" });

    return res.json({ success: true, gig });
  } catch (err) {
    console.error("getGigById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/gigs/my  (seller only) ─────────────────────────
export const getMyGigs = async (req, res) => {
  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found. Create one first." });

    const gigs = await prisma.gig.findMany({
      where:   { vendorId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, gigs });
  } catch (err) {
    console.error("getMyGigs error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/gigs  (seller only) ───────────────────────────
export const createGig = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    title, description, category,
    basicPrice,    basicDescription,    basicFeatures,
    standardPrice, standardDescription, standardFeatures,
    premiumPrice,  premiumDescription,  premiumFeatures,
    tags, location, responseTime,
    images,
  } = req.body;

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(400).json({ success: false, message: "Create a vendor profile before adding gigs" });

    // Max 4 active gigs per seller
    const count = await prisma.gig.count({ where: { vendorId: profile.id } });
    if (count >= 4)
      return res.status(400).json({ success: false, message: "Maximum of 4 gigs allowed per seller" });

    const gig = await prisma.gig.create({
      data: {
        vendorId:         profile.id,
        title,
        description,
        category,
        basicPrice:       Number(basicPrice),
        basicDesc:        basicDescription    ?? "",
        basicFeatures:    Array.isArray(basicFeatures)    ? basicFeatures    : [],
        standardPrice:    Number(standardPrice),
        standardDesc:     standardDescription ?? "",
        standardFeatures: Array.isArray(standardFeatures) ? standardFeatures : [],
        premiumPrice:     Number(premiumPrice),
        premiumDesc:      premiumDescription  ?? "",
        premiumFeatures:  Array.isArray(premiumFeatures)  ? premiumFeatures  : [],
        tags:             Array.isArray(tags)             ? tags             : [],
        location:         location    ?? "",
        responseTime:     Number(responseTime) || 7,
        images:           Array.isArray(images) ? images : [],
      },
    });

    return res.status(201).json({ success: true, gig });
  } catch (err) {
    console.error("createGig error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PUT /api/gigs/:id  (seller only, own gig) ───────────────
export const updateGig = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig)
      return res.status(404).json({ success: false, message: "Gig not found" });
    if (gig.vendorId !== profile.id)
      return res.status(403).json({ success: false, message: "Not authorised to edit this gig" });

    const {
      title, description, category,
      basicPrice,    basicDescription,    basicFeatures,
      standardPrice, standardDescription, standardFeatures,
      premiumPrice,  premiumDescription,  premiumFeatures,
      tags, location, responseTime,
      images, status,
    } = req.body;

    const updated = await prisma.gig.update({
      where: { id: req.params.id },
      data: {
        ...(title               !== undefined && { title }),
        ...(description         !== undefined && { description }),
        ...(category            !== undefined && { category }),
        ...(basicPrice          !== undefined && { basicPrice:       Number(basicPrice) }),
        ...(basicDescription    !== undefined && { basicDesc:        basicDescription }),
        ...(basicFeatures       !== undefined && { basicFeatures:    basicFeatures }),
        ...(standardPrice       !== undefined && { standardPrice:    Number(standardPrice) }),
        ...(standardDescription !== undefined && { standardDesc:     standardDescription }),
        ...(standardFeatures    !== undefined && { standardFeatures: standardFeatures }),
        ...(premiumPrice        !== undefined && { premiumPrice:     Number(premiumPrice) }),
        ...(premiumDescription  !== undefined && { premiumDesc:      premiumDescription }),
        ...(premiumFeatures     !== undefined && { premiumFeatures:  premiumFeatures }),
        ...(tags                !== undefined && { tags }),
        ...(location            !== undefined && { location }),
        ...(responseTime        !== undefined && { responseTime:     Number(responseTime) }),
        ...(images              !== undefined && { images }),
        ...(status              !== undefined && { status }),
      },
    });

    return res.json({ success: true, gig: updated });
  } catch (err) {
    console.error("updateGig error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @DELETE /api/gigs/:id  (seller only, own gig) ────────────
export const deleteGig = async (req, res) => {
  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig)
      return res.status(404).json({ success: false, message: "Gig not found" });
    if (gig.vendorId !== profile.id)
      return res.status(403).json({ success: false, message: "Not authorised to delete this gig" });

    await prisma.gig.delete({ where: { id: req.params.id } });

    return res.json({ success: true, message: "Gig deleted" });
  } catch (err) {
    console.error("deleteGig error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
