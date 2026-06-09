// controllers/booking.controller.js
// createBooking · getMyBookings · getSellerBookings · getBookingById · updateStatus · getBookedDates
// submitCompletion · confirmCompletion
import { validationResult } from "express-validator";
import prisma from "../config/db.js";
import { incrementPromoUsage } from "./promoCode.controller.js";
import { computeAndSaveReliability } from "../services/reliability.service.js";

const COMMISSION_RATE = 0.15; // 15% platform fee

// ── @POST /api/bookings  (buyer only) ────────────────────────
export const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { gigId, packageType, eventDate, eventType, notes, promoCode } = req.body;

  try {
    const gig = await prisma.gig.findUnique({
      where:   { id: gigId },
      include: { vendor: true },
    });

    if (!gig)
      return res.status(404).json({ success: false, message: "Gig not found" });
    if (gig.status !== "active")
      return res.status(400).json({ success: false, message: "This gig is currently unavailable" });

    // Check vendor availability — reject if date is blocked
    const dateOnly = new Date(eventDate).toISOString().split("T")[0];
    const blockedEntry = await prisma.vendorAvailability.findFirst({
      where: {
        vendorId: gig.vendorId,
        date:     new Date(dateOnly + "T00:00:00.000Z"),
      },
    });
    if (blockedEntry)
      return res.status(400).json({ success: false, message: "Vendor is not available on the selected date" });

    // Determine price from chosen package
    const priceMap = {
      basic:    gig.basicPrice,
      standard: gig.standardPrice,
      premium:  gig.premiumPrice,
    };
    const baseAmount = priceMap[packageType];
    if (baseAmount === undefined)
      return res.status(400).json({ success: false, message: "Invalid package type" });

    // ── Promo code validation ──────────────────────────────────────
    let discount     = 0;
    let appliedCode  = "";

    if (promoCode?.trim()) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.trim().toUpperCase() },
      });

      if (!promo || promo.status === "inactive") {
        return res.status(400).json({ success: false, message: "Invalid or inactive promo code" });
      }
      if (promo.expiresAt && new Date() > promo.expiresAt) {
        return res.status(400).json({ success: false, message: "This promo code has expired" });
      }
      if (promo.usedCount >= promo.usageLimit) {
        return res.status(400).json({ success: false, message: "This promo code has reached its usage limit" });
      }
      if (baseAmount < promo.minOrder) {
        return res.status(400).json({
          success: false,
          message: `Minimum order of LKR ${promo.minOrder.toLocaleString()} required for this code`,
        });
      }

      discount    = promo.discountType === "percent"
        ? +((baseAmount * promo.discountValue) / 100).toFixed(2)
        : promo.discountValue;

      appliedCode = promo.code;
    }
    // ──────────────────────────────────────────────────────────────

    const totalAmount = Math.max(0, baseAmount - discount);
    const commission  = +(totalAmount * COMMISSION_RATE).toFixed(2);

    const booking = await prisma.booking.create({
      data: {
        buyerId:     req.user.id,
        gigId:       gig.id,
        vendorId:    gig.vendorId,
        packageType,
        eventDate:   new Date(eventDate),
        eventType:   eventType ?? "",
        notes:       notes     ?? "",
        totalAmount,
        commission,
        promoCode:   appliedCode,
        discount,
      },
      include: {
        gig:   { select: { title: true, category: true } },
        buyer: { select: { name: true, email: true } },
      },
    });

    // Increment promo usage counter (non-fatal)
    if (appliedCode) await incrementPromoUsage(appliedCode);

    return res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/bookings/my  (buyer only) ───────────────────────
export const getMyBookings = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    buyerId: req.user.id,
    ...(status && { status }),
  };

  try {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          gig: {
            select: {
              title:    true,
              category: true,
              images:   true,
              vendor: {
                select: { businessName: true, isVerified: true },
              },
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      bookings,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/bookings/seller  (seller only) ─────────────────
export const getSellerBookings = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    const where = {
      vendorId: profile.id,
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          gig:   { select: { title: true, category: true } },
          buyer: { select: { name: true, email: true, avatar: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      bookings,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getSellerBookings error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/bookings/:id  (buyer or seller of that booking) ─
export const getBookingById = async (req, res) => {
  try {
    let booking = await prisma.booking.findUnique({
      where:   { id: req.params.id },
      include: {
        gig: {
          include: {
            vendor: {
              include: {
                user: { select: { name: true, avatar: true } },
              },
            },
          },
        },
        buyer:  { select: { name: true, email: true, avatar: true } },
        review: { select: { id: true, rating: true, comment: true, createdAt: true } },
      },
    });

    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    // Only buyer, the vendor (seller), or admin/superadmin can view
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    const isOwner =
      booking.buyerId === req.user.id ||
      (profile && booking.vendorId === profile.id) ||
      ["admin", "superadmin"].includes(req.user.role);

    if (!isOwner)
      return res.status(403).json({ success: false, message: "Not authorised" });

    // ── Auto-complete: pending_completion > 14 days → completed ──
    if (
      booking.status === "pending_completion" &&
      booking.completionSubmittedAt
    ) {
      const msElapsed = Date.now() - new Date(booking.completionSubmittedAt).getTime();
      const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
      if (daysElapsed >= 14) {
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data:  { status: "completed" },
          include: {
            gig: {
              include: {
                vendor: {
                  include: { user: { select: { name: true, avatar: true } } },
                },
              },
            },
            buyer:  { select: { name: true, email: true, avatar: true } },
            review: { select: { id: true, rating: true, comment: true, createdAt: true } },
          },
        });
        // Auto-completion also affects reliability.
        computeAndSaveReliability(booking.vendorId).catch(() => {});
      }
    }

    return res.json({ success: true, booking });
  } catch (err) {
    console.error("getBookingById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/bookings/vendor/:vendorId/queue-count  (public) ──
// Returns the number of currently active (confirmed + in_progress) bookings
// for a vendor — shown on the vendor detail page as "X orders in queue".
export const getVendorQueueCount = async (req, res) => {
  try {
    const count = await prisma.booking.count({
      where: {
        vendorId: req.params.vendorId,
        status:   { in: ["confirmed", "in_progress"] },
      },
    });
    return res.json({ success: true, count });
  } catch (err) {
    console.error("getVendorQueueCount error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/bookings/vendor/:vendorId/booked-dates  (public) ─
// Returns ISO date strings (YYYY-MM-DD) that are already taken by
// confirmed or in-progress bookings — used for date-picker blocking.
export const getBookedDates = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        vendorId: req.params.vendorId,
        status:   { in: ["confirmed", "in_progress"] },
      },
      select: { eventDate: true },
    });

    const dates = bookings.map(b => b.eventDate.toISOString().split("T")[0]);
    return res.json({ success: true, dates });
  } catch (err) {
    console.error("getBookedDates error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/bookings/:id/status  (seller or admin) ───────
// Allowed transitions:
//   seller : pending → confirmed | cancelled
//            confirmed → in_progress
//            (in_progress → pending_completion via /submit-completion)
//   admin  : any → any
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  // Sellers may NOT set completed or pending_completion via this endpoint;
  // those go through the dedicated evidence flow.
  const sellerAllowed = ["confirmed", "in_progress", "cancelled"];
  const adminAllowed  = ["pending", "confirmed", "in_progress", "pending_completion", "completed", "cancelled"];

  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  const allowed = isAdmin ? adminAllowed : sellerAllowed;

  if (!allowed.includes(status))
    return res.status(400).json({
      success: false,
      message: isAdmin
        ? "Invalid status"
        : "Sellers cannot set this status directly. Use the completion evidence flow.",
    });

  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    // Sellers can only update their own bookings
    if (req.user.role === "seller") {
      const profile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!profile || booking.vendorId !== profile.id)
        return res.status(403).json({ success: false, message: "Not authorised" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status },
    });

    // Completed/cancelled changes a vendor's reliability inputs — recompute.
    if (["completed", "cancelled"].includes(status))
      computeAndSaveReliability(updated.vendorId).catch(() => {});

    return res.json({ success: true, booking: updated });
  } catch (err) {
    console.error("updateBookingStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/bookings/:id/submit-completion  (seller only) ──
// Seller submits evidence (images + note) — moves status → pending_completion
export const submitCompletion = async (req, res) => {
  const { completionNote = "", completionImages = [] } = req.body;

  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    // Must be this seller's booking
    const profile = await prisma.vendorProfile.findUnique({
      where:   { userId: req.user.id },
      include: { user: { select: { name: true } } },
    });
    if (!profile || booking.vendorId !== profile.id)
      return res.status(403).json({ success: false, message: "Not authorised" });

    if (booking.status !== "in_progress")
      return res.status(400).json({
        success: false,
        message: `Cannot submit completion evidence from status: ${booking.status}`,
      });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status:               "pending_completion",
        completionNote,
        completionImages:     Array.isArray(completionImages) ? completionImages : [],
        completionSubmittedAt: new Date(),
      },
    });

    // Notify the buyer
    await prisma.notification.create({
      data: {
        userId: booking.buyerId,
        type:   "booking",
        title:  "Completion Evidence Submitted",
        body:   `${profile.businessName} has submitted completion evidence for your order. Please review and confirm within 14 days.`,
        link:   `/orders/${booking.id}`,
      },
    }).catch(() => {}); // non-fatal

    return res.json({ success: true, booking: updated });
  } catch (err) {
    console.error("submitCompletion error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/bookings/:id/confirm-completion  (buyer only) ──
// Buyer reviews evidence and confirms → moves status → completed
export const confirmCompletion = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    // Must be this buyer's booking
    if (booking.buyerId !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorised" });

    if (booking.status !== "pending_completion")
      return res.status(400).json({
        success: false,
        message: `Cannot confirm completion from status: ${booking.status}`,
      });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: "completed" },
    });

    // A completed booking changes this vendor's reliability inputs — recompute.
    computeAndSaveReliability(updated.vendorId).catch(() => {});

    // Notify the seller
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where:   { id: booking.vendorId },
      include: { user: { select: { id: true } } },
    });
    if (vendorProfile) {
      await prisma.notification.create({
        data: {
          userId: vendorProfile.user.id,
          type:   "booking",
          title:  "Order Completed 🎉",
          body:   "The buyer has confirmed your completion. The order is now marked as completed.",
          link:   `/seller/orders/${booking.id}`,
        },
      }).catch(() => {}); // non-fatal
    }

    return res.json({ success: true, booking: updated });
  } catch (err) {
    console.error("confirmCompletion error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
