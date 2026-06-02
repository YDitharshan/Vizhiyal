// controllers/payout.controller.js
// requestPayout · getMyPayouts · getAllPayouts · updatePayoutStatus
import { validationResult } from "express-validator";
import prisma from "../config/db.js";
import { createNotification } from "./notification.controller.js";

const COMMISSION_RATE = 0.15;

// ── @POST /api/payouts  (seller only) ────────────────────────
export const requestPayout = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { amount, bankName, accountNumber, accountName } = req.body;

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    const grossAmount  = Number(amount);
    const commission   = +(grossAmount * COMMISSION_RATE).toFixed(2);
    const netAmount    = +(grossAmount - commission).toFixed(2);

    // Prevent duplicate pending payout
    const pendingExists = await prisma.payout.findFirst({
      where: { vendorId: profile.id, status: "pending" },
    });
    if (pendingExists)
      return res.status(409).json({ success: false, message: "You already have a pending payout request" });

    const payout = await prisma.payout.create({
      data: {
        vendorId:      profile.id,
        amount:        grossAmount,
        commission,
        netAmount,
        bankName:      bankName      ?? "",
        accountNumber: accountNumber ?? "",
        accountName:   accountName   ?? "",
      },
    });

    return res.status(201).json({ success: true, payout });
  } catch (err) {
    console.error("requestPayout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/payouts/my  (seller only) ──────────────────────
export const getMyPayouts = async (req, res) => {
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

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.payout.count({ where }),
    ]);

    return res.json({
      success: true,
      payouts,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("getMyPayouts error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/payouts/all  (admin only) ──────────────────────
export const getAllPayouts = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { ...(status && { status }) };

  try {
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    return res.json({
      success: true,
      payouts,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("getAllPayouts error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/payouts/:id/status  (admin only) ─────────────
// Transitions: pending → processing → paid | rejected
export const updatePayoutStatus = async (req, res) => {
  const { status, adminNote } = req.body;

  const valid = ["pending", "processing", "paid", "rejected"];
  if (!valid.includes(status))
    return res.status(400).json({ success: false, message: "Invalid payout status" });

  try {
    const payout = await prisma.payout.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(adminNote   !== undefined && { adminNote }),
        ...(status === "paid" && { processedAt: new Date() }),
      },
      include: {
        vendor: { include: { user: true } },
      },
    });

    // Notify the seller
    const notifMap = {
      processing: { title: "Payout Processing", body: `Your payout of LKR ${payout.netAmount.toLocaleString()} is being processed.` },
      paid:       { title: "Payout Sent! 🎉",   body: `LKR ${payout.netAmount.toLocaleString()} has been sent to your bank account.` },
      rejected:   { title: "Payout Rejected",   body: `Your payout request was rejected. ${adminNote ?? ""}`.trim() },
    };

    if (notifMap[status]) {
      await createNotification(
        payout.vendor.user.id,
        "payout",
        notifMap[status].title,
        notifMap[status].body,
        "/seller/earnings"
      );
    }

    return res.json({ success: true, payout });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ success: false, message: "Payout not found" });
    console.error("updatePayoutStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
