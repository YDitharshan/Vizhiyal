// controllers/promoCode.controller.js
// createPromo · listPromos · validatePromo · toggleStatus · deletePromo
import { validationResult } from "express-validator";
import prisma from "../config/db.js";

// ── @POST /api/promos  (superadmin only) ─────────────────────
export const createPromo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { code, discountType, discountValue, minOrder, usageLimit, expiresAt } = req.body;

  try {
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing)
      return res.status(409).json({ success: false, message: "Promo code already exists" });

    const promo = await prisma.promoCode.create({
      data: {
        code:          code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrder:      minOrder   ? Number(minOrder)   : 0,
        usageLimit:    usageLimit ? Number(usageLimit) : 100,
        expiresAt:     expiresAt  ? new Date(expiresAt) : null,
        createdById:   req.user.id,
      },
    });

    return res.status(201).json({ success: true, promo });
  } catch (err) {
    console.error("createPromo error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/promos  (superadmin only) ──────────────────────
export const listPromos = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { ...(status && { status }) };

  try {
    const [promos, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
        },
      }),
      prisma.promoCode.count({ where }),
    ]);

    return res.json({
      success: true,
      promos,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("listPromos error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/promos/validate  (buyer only) ─────────────────
// Called at checkout to verify a code and return discount amount
export const validatePromo = async (req, res) => {
  const { code, orderAmount } = req.body;

  if (!code)
    return res.status(400).json({ success: false, message: "Promo code is required" });
  if (!orderAmount || isNaN(orderAmount))
    return res.status(400).json({ success: false, message: "Order amount is required" });

  try {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo)
      return res.status(404).json({ success: false, message: "Invalid promo code" });

    if (promo.status === "inactive")
      return res.status(400).json({ success: false, message: "This promo code is no longer active" });

    if (promo.expiresAt && new Date() > promo.expiresAt)
      return res.status(400).json({ success: false, message: "This promo code has expired" });

    if (promo.usedCount >= promo.usageLimit)
      return res.status(400).json({ success: false, message: "This promo code has reached its usage limit" });

    if (Number(orderAmount) < promo.minOrder)
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of LKR ${promo.minOrder.toLocaleString()} required`,
      });

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "percent") {
      discount = +((Number(orderAmount) * promo.discountValue) / 100).toFixed(2);
    } else {
      discount = promo.discountValue;
    }

    return res.json({
      success:  true,
      discount,
      promoId:  promo.id,
      code:     promo.code,
      message:  `Promo applied — LKR ${discount.toLocaleString()} off`,
    });
  } catch (err) {
    console.error("validatePromo error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Internal helper — increment usedCount after booking ──────
export const incrementPromoUsage = async (code) => {
  try {
    await prisma.promoCode.update({
      where: { code: code.toUpperCase() },
      data:  { usedCount: { increment: 1 } },
    });
  } catch (err) {
    console.error("incrementPromoUsage error:", err.message);
  }
};

// ── @PATCH /api/promos/:id/status  (superadmin only) ─────────
export const togglePromoStatus = async (req, res) => {
  try {
    const promo = await prisma.promoCode.findUnique({ where: { id: req.params.id } });
    if (!promo)
      return res.status(404).json({ success: false, message: "Promo code not found" });

    const updated = await prisma.promoCode.update({
      where: { id: req.params.id },
      data:  { status: promo.status === "active" ? "inactive" : "active" },
    });

    return res.json({ success: true, promo: updated });
  } catch (err) {
    console.error("togglePromoStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @DELETE /api/promos/:id  (superadmin only) ───────────────
export const deletePromo = async (req, res) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Promo code deleted" });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ success: false, message: "Promo code not found" });
    console.error("deletePromo error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
