// controllers/review.controller.js
// createReview · getVendorReviews · getGigReviews · flagReview · removeReview
import { validationResult } from "express-validator";
import prisma from "../config/db.js";

// ── @POST /api/reviews  (buyer only) ─────────────────────────
// One review per completed booking
export const createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { bookingId, rating, comment } = req.body;

  try {
    // Verify booking belongs to this buyer and is completed
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.buyerId !== req.user.id)
      return res.status(403).json({ success: false, message: "Not your booking" });
    if (booking.status !== "completed")
      return res.status(400).json({ success: false, message: "Can only review completed bookings" });

    // Check no existing review
    const existing = await prisma.review.findUnique({ where: { bookingId } });
    if (existing)
      return res.status(409).json({ success: false, message: "You have already reviewed this booking" });

    const review = await prisma.review.create({
      data: {
        bookingId,
        buyerId:  req.user.id,
        vendorId: booking.vendorId,
        gigId:    booking.gigId,
        rating:   Number(rating),
        comment:  comment ?? "",
      },
      include: {
        buyer: { select: { name: true, avatar: true } },
      },
    });

    // Recalculate both vendor-level AND gig-level rating stats
    const [vendorStats, gigStats] = await Promise.all([
      prisma.review.aggregate({
        where:  { vendorId: booking.vendorId, removed: false },
        _avg:   { rating: true },
        _count: { rating: true },
      }),
      prisma.review.aggregate({
        where:  { gigId: booking.gigId, removed: false },
        _avg:   { rating: true },
        _count: { rating: true },
      }),
    ]);

    await Promise.all([
      prisma.vendorProfile.update({
        where: { id: booking.vendorId },
        data: {
          avgRating:    vendorStats._avg.rating   ?? 0,
          totalReviews: vendorStats._count.rating ?? 0,
        },
      }),
      prisma.gig.update({
        where: { id: booking.gigId },
        data: {
          avgRating:    gigStats._avg.rating   ?? 0,
          totalReviews: gigStats._count.rating ?? 0,
        },
      }),
    ]);

    return res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("createReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/reviews/vendor/:vendorId  (public) ─────────────
export const getVendorReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const where = { vendorId: req.params.vendorId, removed: false };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { name: true, avatar: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getVendorReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/reviews/gig/:gigId  (public) ───────────────────
export const getGigReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const where = { gigId: req.params.gigId, removed: false };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { name: true, avatar: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return res.json({ success: true, reviews, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    console.error("getGigReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/reviews/:id/flag  (admin only) ───────────────
export const flagReview = async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data:  { flagged: true },
    });
    return res.json({ success: true, review });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ success: false, message: "Review not found" });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/reviews/:id/remove  (admin only) ─────────────
export const removeReview = async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data:  { removed: true, flagged: false },
    });

    // Recalculate both vendor-level AND gig-level rating stats after removal
    const [vendorStats, gigStats] = await Promise.all([
      prisma.review.aggregate({
        where:  { vendorId: review.vendorId, removed: false },
        _avg:   { rating: true },
        _count: { rating: true },
      }),
      prisma.review.aggregate({
        where:  { gigId: review.gigId, removed: false },
        _avg:   { rating: true },
        _count: { rating: true },
      }),
    ]);

    await Promise.all([
      prisma.vendorProfile.update({
        where: { id: review.vendorId },
        data: {
          avgRating:    vendorStats._avg.rating   ?? 0,
          totalReviews: vendorStats._count.rating ?? 0,
        },
      }),
      prisma.gig.update({
        where: { id: review.gigId },
        data: {
          avgRating:    gigStats._avg.rating   ?? 0,
          totalReviews: gigStats._count.rating ?? 0,
        },
      }),
    ]);

    return res.json({ success: true, message: "Review removed" });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ success: false, message: "Review not found" });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/reviews/all  (admin only) ──────────────────────
export const getAllReviews = async (req, res) => {
  const { flagged, removed, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    ...(flagged !== undefined && { flagged: flagged === "true" }),
    ...(removed !== undefined && { removed: removed === "true" }),
  };

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          buyer:  { select: { name: true, avatar: true } },
          vendor: { select: { businessName: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return res.json({ success: true, reviews, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    console.error("getAllReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
