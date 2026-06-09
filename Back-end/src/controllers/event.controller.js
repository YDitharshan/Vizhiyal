// controllers/event.controller.js
// Smart Event Bundle Builder + AI Budget Concierge.
//   planEvent    — proxy to ml-service /plan, hydrate vendor_ids → bookable gigs
//   createEvent  — atomically create one Event + many Bookings (single checkout)
//   getMyEvents  — buyer's events with their bundled bookings
//   getEventById — one event with full booking/gig/vendor detail
import { validationResult } from "express-validator";
import prisma from "../config/db.js";
import { coordsForLocation } from "../utils/cityCoords.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const COMMISSION_RATE = 0.15; // keep in step with booking.controller.js

// Domain budget priors mirrored from the ml-service, used only by the DB
// fallback when the ML service is unreachable so the split still makes sense.
const CATEGORY_BUDGET_WEIGHTS = {
  "venue": 0.24, "catering": 0.24, "photography": 0.11, "videography": 0.09,
  "decoration": 0.09, "dj & music": 0.06, "sound system": 0.04, "lighting": 0.03,
  "makeup & beauty": 0.04, "cakes & sweets": 0.03, "floral design": 0.03,
  "event planning": 0.05, "mc & host": 0.02,
};
const DEFAULT_CATEGORY_WEIGHT = 0.05;

// ── Helper: which of these vendors are NOT free on `dateOnly` ──
// A vendor is unavailable if they've blocked the date OR already have a
// confirmed / in-progress booking on it. Returns a Set of vendorIds.
async function unavailableVendorIds(vendorIds, dateOnly) {
  if (!vendorIds.length || !dateOnly) return new Set();
  const dayStart = new Date(dateOnly + "T00:00:00.000Z");
  const dayEnd   = new Date(dateOnly + "T23:59:59.999Z");

  const [blocked, booked] = await Promise.all([
    prisma.vendorAvailability.findMany({
      where: { vendorId: { in: vendorIds }, date: dayStart },
      select: { vendorId: true },
    }),
    prisma.booking.findMany({
      where: {
        vendorId: { in: vendorIds },
        status:   { in: ["confirmed", "in_progress"] },
        eventDate: { gte: dayStart, lte: dayEnd },
      },
      select: { vendorId: true },
    }),
  ]);

  return new Set([...blocked, ...booked].map((r) => r.vendorId));
}

// ── Helper: pick the best in-budget active gig for a vendor+category ──
// Prefer a gig in the requested category whose basic price fits the slot
// budget (highest such price = best value); else cheapest in category;
// else the vendor's cheapest active gig overall.
function pickGig(gigs, category, slotBudget) {
  const cat = (category || "").toLowerCase();
  const inCat = gigs.filter((g) => (g.category || "").toLowerCase() === cat);
  const pool  = inCat.length ? inCat : gigs;
  if (!pool.length) return null;

  const within = pool.filter((g) => g.basicPrice <= slotBudget);
  if (within.length) {
    // best value: most expensive gig that still fits the slot budget
    return within.reduce((a, b) => (b.basicPrice > a.basicPrice ? b : a));
  }
  // nothing fits — fall back to the cheapest so the buyer can still swap
  return pool.reduce((a, b) => (b.basicPrice < a.basicPrice ? b : a));
}

// ── @POST /api/events/plan  (buyer) ───────────────────────────
// Body: { categories[], totalBudget, location?, lat?, lng?, eventDate?,
//         eventType?, guestCount?, perCategory? }
export const planEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    categories, totalBudget, location, lat, lng,
    eventDate, guestCount = 0, perCategory = 3,
  } = req.body;

  // Resolve customer coordinates: explicit lat/lng wins, else derive from city.
  let latitude  = lat !== undefined ? Number(lat) : null;
  let longitude = lng !== undefined ? Number(lng) : null;
  if ((latitude === null || Number.isNaN(latitude)) && location) {
    const c = coordsForLocation(location);
    if (c) { latitude = c.lat; longitude = c.lng; }
  }

  const dateOnly = eventDate ? new Date(eventDate).toISOString().split("T")[0] : null;

  try {
    let allocations;
    let source = "ml";

    try {
      const mlRes = await fetch(`${ML_SERVICE_URL}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories,
          total_budget: Number(totalBudget),
          latitude:  Number.isFinite(latitude)  ? latitude  : null,
          longitude: Number.isFinite(longitude) ? longitude : null,
          guest_count: Number(guestCount) || 0,
          per_category: Number(perCategory),
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!mlRes.ok) throw new Error(`ml-service ${mlRes.status}`);
      ({ allocations } = await mlRes.json());
    } catch (mlErr) {
      // Graceful fallback: split budget with the same priors, rank by rating.
      console.error("planEvent ML fallback:", mlErr.message);
      source = "fallback";
      allocations = await dbFallbackPlan(categories, Number(totalBudget), location, Number(perCategory));
    }

    // Hydrate every candidate vendor_id → real vendor + a bookable gig.
    const allVendorIds = [
      ...new Set(allocations.flatMap((a) => (a.candidates || []).map((c) => c.vendor_id))),
    ];

    const [vendors, gigs, unavailable] = await Promise.all([
      prisma.vendorProfile.findMany({
        where: { id: { in: allVendorIds } },
        include: { user: { select: { name: true, avatar: true, location: true } } },
      }),
      prisma.gig.findMany({
        where: { vendorId: { in: allVendorIds }, status: "active" },
      }),
      unavailableVendorIds(allVendorIds, dateOnly),
    ]);

    const vendorById = new Map(vendors.map((v) => [v.id, v]));
    const gigsByVendor = new Map();
    for (const g of gigs) {
      if (!gigsByVendor.has(g.vendorId)) gigsByVendor.set(g.vendorId, []);
      gigsByVendor.get(g.vendorId).push(g);
    }

    const hydrated = allocations.map((a) => {
      const options = (a.candidates || [])
        .map((c) => {
          const vendor = vendorById.get(c.vendor_id);
          if (!vendor) return null; // stale model entry
          const gig = pickGig(gigsByVendor.get(c.vendor_id) || [], a.category, a.budget);
          if (!gig) return null;     // vendor has no active gig to book
          return {
            vendor: {
              id: vendor.id,
              businessName: vendor.businessName,
              location: vendor.location || vendor.user?.location || "",
              isVerified: vendor.isVerified,
              avgRating: vendor.avgRating,
              totalReviews: vendor.totalReviews,
              avatar: vendor.user?.avatar || null,
            },
            gig: {
              id: gig.id,
              title: gig.title,
              category: gig.category,
              images: gig.images,
              basicPrice: gig.basicPrice,
              standardPrice: gig.standardPrice,
              premiumPrice: gig.premiumPrice,
            },
            recommendation: {
              matchScore: c.match_score,
              distanceKm: c.distance_km,
              scores: c.scores,
            },
            withinBudget: gig.basicPrice <= a.budget,
            available: !unavailable.has(c.vendor_id),
          };
        })
        .filter(Boolean);

      // Bookable (available) options first, then by match score.
      options.sort((x, y) =>
        (y.available - x.available) ||
        ((y.recommendation.matchScore ?? 0) - (x.recommendation.matchScore ?? 0)));

      return {
        category: a.category,
        budget: a.budget,
        budgetShare: a.budget_share,
        options,
      };
    });

    return res.json({ success: true, source, totalBudget: Number(totalBudget), allocations: hydrated });
  } catch (err) {
    console.error("planEvent error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DB-only budget split used when the ML service is down. Mirrors the ML
// response shape ({ category, budget, budget_share, candidates[] }).
async function dbFallbackPlan(categories, totalBudget, location, perCategory) {
  const cats = [...new Set((categories || []).map((c) => String(c).trim()).filter(Boolean))];
  const raw = cats.map((c) => CATEGORY_BUDGET_WEIGHTS[c.toLowerCase()] ?? DEFAULT_CATEGORY_WEIGHT);
  const denom = raw.reduce((s, w) => s + w, 0) || 1;

  return Promise.all(
    cats.map(async (category, i) => {
      const budget = +(totalBudget * (raw[i] / denom)).toFixed(2);
      const vendors = await prisma.vendorProfile.findMany({
        where: {
          gigs: { some: { status: "active", category: { equals: category, mode: "insensitive" } } },
          ...(location && { location: { contains: location, mode: "insensitive" } }),
        },
        orderBy: [{ avgRating: "desc" }, { completedJobs: "desc" }],
        take: perCategory,
        select: { id: true },
      });
      return {
        category,
        budget,
        budget_share: +(raw[i] / denom).toFixed(4),
        candidates: vendors.map((v) => ({
          vendor_id: v.id, match_score: null, distance_km: null, scores: null,
        })),
      };
    })
  );
}

// ── @POST /api/events  (buyer only) ───────────────────────────
// Body: { title, eventType, eventDate, location, guestCount, totalBudget,
//         items: [{ gigId, packageType }], plan? }
// Creates the Event and all its Bookings in one transaction.
export const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    title, eventType = "", eventDate, location = "",
    guestCount = 0, totalBudget = 0, items, plan = [],
  } = req.body;

  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ success: false, message: "Select at least one service to book" });

  try {
    const dateOnly = new Date(eventDate).toISOString().split("T")[0];
    const dayStart = new Date(dateOnly + "T00:00:00.000Z");
    const dayEnd   = new Date(dateOnly + "T23:59:59.999Z");

    // Load all chosen gigs up front.
    const gigIds = items.map((it) => it.gigId);
    const gigs = await prisma.gig.findMany({
      where: { id: { in: gigIds } },
      include: { vendor: { select: { id: true, businessName: true, user: { select: { id: true } } } } },
    });
    const gigById = new Map(gigs.map((g) => [g.id, g]));

    // Validate each item and pre-compute its booking payload.
    const priceField = { basic: "basicPrice", standard: "standardPrice", premium: "premiumPrice" };
    const bookingsData = [];
    const sellerUserIds = [];

    for (const it of items) {
      const gig = gigById.get(it.gigId);
      if (!gig)
        return res.status(404).json({ success: false, message: `Gig ${it.gigId} not found` });
      if (gig.status !== "active")
        return res.status(400).json({ success: false, message: `"${gig.title}" is unavailable` });

      const pkg = it.packageType || "basic";
      const baseAmount = gig[priceField[pkg]];
      if (baseAmount === undefined)
        return res.status(400).json({ success: false, message: "Invalid package type" });

      // Availability guard (block + clashing booking)
      const [blocked, clash] = await Promise.all([
        prisma.vendorAvailability.findFirst({ where: { vendorId: gig.vendorId, date: dayStart } }),
        prisma.booking.findFirst({
          where: {
            vendorId: gig.vendorId,
            status: { in: ["confirmed", "in_progress"] },
            eventDate: { gte: dayStart, lte: dayEnd },
          },
        }),
      ]);
      if (blocked || clash)
        return res.status(409).json({
          success: false,
          message: `${gig.vendor.businessName} is no longer available on ${dateOnly}. Please swap them out.`,
        });

      const totalAmount = baseAmount;
      const commission  = +(totalAmount * COMMISSION_RATE).toFixed(2);

      bookingsData.push({
        buyerId:   req.user.id,
        gigId:     gig.id,
        vendorId:  gig.vendorId,
        packageType: pkg,
        eventDate: new Date(eventDate),
        eventType,
        notes:     "",
        totalAmount,
        commission,
      });
      if (gig.vendor.user?.id) sellerUserIds.push(gig.vendor.user.id);
    }

    // Create Event + its Bookings atomically.
    const event = await prisma.$transaction(async (tx) => {
      const ev = await tx.event.create({
        data: {
          buyerId: req.user.id,
          title,
          eventType,
          eventDate: new Date(eventDate),
          location,
          guestCount: Number(guestCount) || 0,
          totalBudget: Number(totalBudget) || 0,
          status: "planning",
          plan: Array.isArray(plan) ? plan : [],
        },
      });
      await tx.booking.createMany({
        data: bookingsData.map((b) => ({ ...b, eventId: ev.id })),
      });
      return ev;
    });

    // Notify each seller about their new bundle booking (non-fatal).
    await prisma.notification.createMany({
      data: [...new Set(sellerUserIds)].map((userId) => ({
        userId,
        type:  "booking",
        title: "New Event Bundle Booking 🎉",
        body:  `You're part of a "${title}" event bundle on ${dateOnly}. Review and confirm your booking.`,
        link:  "/seller/orders",
      })),
    }).catch(() => {});

    const full = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        bookings: { include: { gig: { select: { title: true, category: true, images: true } } } },
      },
    });

    return res.status(201).json({ success: true, event: full });
  } catch (err) {
    console.error("createEvent error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/events/my  (buyer) ──────────────────────────────
export const getMyEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { buyerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        bookings: {
          select: {
            id: true, status: true, totalAmount: true, packageType: true,
            gig: { select: { title: true, category: true, images: true } },
          },
        },
      },
    });
    return res.json({ success: true, events });
  } catch (err) {
    console.error("getMyEvents error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/events/:id  (owner or admin) ────────────────────
export const getEventById = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          include: {
            gig: {
              select: {
                title: true, category: true, images: true,
                vendor: { select: { id: true, businessName: true, isVerified: true } },
              },
            },
          },
        },
      },
    });

    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });

    const isOwner =
      event.buyerId === req.user.id || ["admin", "superadmin"].includes(req.user.role);
    if (!isOwner)
      return res.status(403).json({ success: false, message: "Not authorised" });

    return res.json({ success: true, event });
  } catch (err) {
    console.error("getEventById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
