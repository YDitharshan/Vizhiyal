// controllers/availability.controller.js
// getAvailability · blockDate · unblockDate
import prisma from "../config/db.js";

/** Parse "YYYY-MM-DD" → midnight UTC Date object */
const toUTCDate = (dateStr) => new Date(dateStr + "T00:00:00.000Z");

/** Validate "YYYY-MM-DD" format */
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// ── @GET /api/vendors/:id/availability?month=YYYY-MM  (public) ──
export const getAvailability = async (req, res) => {
  const { id }    = req.params;
  const { month } = req.query;   // optional, e.g. "2025-04"

  try {
    let where = { vendorId: id };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, mon] = month.split("-").map(Number);
      where.date = {
        gte: new Date(Date.UTC(year, mon - 1, 1)),
        lt:  new Date(Date.UTC(year, mon,     1)),
      };
    }

    const records = await prisma.vendorAvailability.findMany({
      where,
      select:  { date: true },
      orderBy: { date: "asc" },
    });

    const blockedDates = records.map(r => r.date.toISOString().split("T")[0]);
    return res.json({ success: true, blockedDates });
  } catch (err) {
    console.error("getAvailability error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/vendors/me/availability?month=YYYY-MM  (seller own) ──
export const getMyAvailability = async (req, res) => {
  const { month } = req.query;

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    let where = { vendorId: profile.id };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, mon] = month.split("-").map(Number);
      where.date = {
        gte: new Date(Date.UTC(year, mon - 1, 1)),
        lt:  new Date(Date.UTC(year, mon,     1)),
      };
    }

    const records = await prisma.vendorAvailability.findMany({
      where,
      select:  { date: true },
      orderBy: { date: "asc" },
    });

    const blockedDates = records.map(r => r.date.toISOString().split("T")[0]);
    return res.json({ success: true, blockedDates });
  } catch (err) {
    console.error("getMyAvailability error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/vendors/availability  (seller) ─────────────────
// body: { date: "YYYY-MM-DD" }
export const blockDate = async (req, res) => {
  const { date } = req.body;
  if (!date || !isValidDate(date))
    return res.status(400).json({ success: false, message: "Provide date as YYYY-MM-DD" });

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    const d = toUTCDate(date);

    // Upsert — idempotent: blocking an already-blocked date is a no-op
    await prisma.vendorAvailability.upsert({
      where:  { vendorId_date: { vendorId: profile.id, date: d } },
      update: {},
      create: { vendorId: profile.id, date: d },
    });

    return res.json({ success: true, message: "Date blocked" });
  } catch (err) {
    console.error("blockDate error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @DELETE /api/vendors/availability  (seller) ───────────────
// body: { date: "YYYY-MM-DD" }
export const unblockDate = async (req, res) => {
  const { date } = req.body;
  if (!date || !isValidDate(date))
    return res.status(400).json({ success: false, message: "Provide date as YYYY-MM-DD" });

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    const d = toUTCDate(date);

    // deleteMany — safe even if the record doesn't exist
    await prisma.vendorAvailability.deleteMany({
      where: { vendorId: profile.id, date: d },
    });

    return res.json({ success: true, message: "Date unblocked" });
  } catch (err) {
    console.error("unblockDate error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
