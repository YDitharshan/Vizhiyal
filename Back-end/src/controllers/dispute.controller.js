// controllers/dispute.controller.js
// createDispute · getMyDisputes · getDisputeById · updateDisputeStatus · getAllDisputes
import { validationResult } from "express-validator";
import prisma from "../config/db.js";
import { createNotification } from "./notification.controller.js";

// ── @POST /api/disputes  (buyer only) ────────────────────────
export const createDispute = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { bookingId, type, description } = req.body;

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.buyerId !== req.user.id)
      return res.status(403).json({ success: false, message: "Not your booking" });
    if (booking.status === "cancelled")
      return res.status(400).json({ success: false, message: "Cannot raise a dispute on a cancelled booking" });

    // One dispute per booking
    const existing = await prisma.dispute.findUnique({ where: { bookingId } });
    if (existing)
      return res.status(409).json({ success: false, message: "A dispute already exists for this booking" });

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        raisedById:  req.user.id,
        type,
        description,
      },
      include: {
        booking:  { select: { gigId: true, eventDate: true, totalAmount: true, status: true } },
        raisedBy: { select: { name: true, email: true } },
      },
    });

    // Notify the seller that a dispute was raised against their booking
    const bookingWithVendor = await prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { vendor: { select: { userId: true } } },
    });
    if (bookingWithVendor?.vendor?.userId) {
      await createNotification(
        bookingWithVendor.vendor.userId,
        "dispute",
        "Dispute Filed Against Your Service",
        `A buyer has filed a dispute for booking #${bookingId.slice(0, 8).toUpperCase()}.`,
        `/seller/orders/${bookingId}`
      );
    }

    return res.status(201).json({ success: true, dispute });
  } catch (err) {
    console.error("createDispute error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/disputes/my  (buyer sees own, seller sees disputes on their bookings) ─
export const getMyDisputes = async (req, res) => {
  try {
    let disputes;

    if (req.user.role === "buyer") {
      disputes = await prisma.dispute.findMany({
        where:   { raisedById: req.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              gig: { select: { title: true, category: true } },
            },
          },
        },
      });
    } else if (req.user.role === "seller") {
      // Get disputes on the seller's bookings
      const profile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!profile)
        return res.status(404).json({ success: false, message: "Vendor profile not found" });

      disputes = await prisma.dispute.findMany({
        where: {
          booking: { vendorId: profile.id },
        },
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              gig:   { select: { title: true, category: true } },
              buyer: { select: { name: true, avatar: true } },
            },
          },
          raisedBy: { select: { name: true } },
        },
      });
    }

    return res.json({ success: true, disputes });
  } catch (err) {
    console.error("getMyDisputes error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/disputes/all  (admin/superadmin only) ──────────
export const getAllDisputes = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { ...(status && { status }) };

  try {
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          raisedBy: { select: { name: true, email: true, avatar: true } },
          booking: {
            include: {
              gig:   { select: { title: true } },
              buyer: { select: { name: true } },
            },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return res.json({
      success: true,
      disputes,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("getAllDisputes error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/disputes/:id ────────────────────────────────────
export const getDisputeById = async (req, res) => {
  try {
    const dispute = await prisma.dispute.findUnique({
      where:   { id: req.params.id },
      include: {
        raisedBy: { select: { name: true, email: true, avatar: true } },
        booking: {
          include: {
            gig:   { select: { title: true, category: true } },
            buyer: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!dispute)
      return res.status(404).json({ success: false, message: "Dispute not found" });

    // Only raiser, the booking's vendor, or admin can view
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    const isRaiser = dispute.raisedById === req.user.id;

    let isVendor = false;
    if (req.user.role === "seller") {
      const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
      isVendor = profile && dispute.booking.vendorId === profile.id;
    }

    if (!isAdmin && !isRaiser && !isVendor)
      return res.status(403).json({ success: false, message: "Not authorised" });

    return res.json({ success: true, dispute });
  } catch (err) {
    console.error("getDisputeById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/disputes/:id/status  (admin only) ────────────
export const updateDisputeStatus = async (req, res) => {
  const { status, adminNote, resolution } = req.body;

  const valid = ["open", "under_review", "resolved", "closed"];
  if (!valid.includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });

  try {
    const dispute = await prisma.dispute.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(adminNote  !== undefined && { adminNote }),
        ...(resolution !== undefined && { resolution }),
      },
    });

    // Notify the buyer who raised the dispute
    const notifMap = {
      under_review: {
        title: "Dispute Under Review",
        body:  "Your dispute is now being reviewed by our team. We'll update you shortly.",
      },
      resolved: {
        title: "Dispute Resolved",
        body:  `Your dispute has been resolved. ${resolution ?? adminNote ?? ""}`.trim(),
      },
      closed: {
        title: "Dispute Closed",
        body:  `Your dispute has been closed. ${adminNote ?? ""}`.trim(),
      },
    };
    if (notifMap[status]) {
      await createNotification(
        dispute.raisedById,
        "dispute",
        notifMap[status].title,
        notifMap[status].body,
        `/orders/${dispute.bookingId}`
      );
    }

    return res.json({ success: true, dispute });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ success: false, message: "Dispute not found" });
    console.error("updateDisputeStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
