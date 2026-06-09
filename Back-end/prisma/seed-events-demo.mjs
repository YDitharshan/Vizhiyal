// prisma/seed-events-demo.mjs
// Demo data for the two new flagship features:
//   • Verified Work  — completed bookings WITH delivery evidence + a buyer
//                      review, so vendor pages show the Proof-of-Work portfolio.
//   • Event Bundle   — one multi-vendor Event grouping several bookings, so
//                      "My Events" / Event Detail have something to show.
//
// Builds on top of the vendors/gigs created by seed-vendors.mjs.
// Run from the Back-end folder (after `prisma db push` + `node prisma/seed-vendors.mjs`):
//   node prisma/seed-events-demo.mjs
//
// Idempotent: re-running won't duplicate the demo buyer, the verified work,
// or the event bundle.

import bcrypt from "bcryptjs";
import prisma from "../src/config/db.js";

const COMMISSION_RATE = 0.15;

const BUYER = {
  name: "Demo Buyer",
  email: "demo.buyer@vizhiyal.test",
  password: "Buyer@123",
};

// Generic event photos (https → resolveUrl passes them through untouched).
const EVENT_PHOTOS = [
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=70",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=70",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=70",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=70",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=70",
  "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=70",
];

const REVIEW_COMMENTS = [
  "Absolutely brilliant — exceeded every expectation. Our guests are still talking about it!",
  "Professional, punctual and so talented. Worth every rupee.",
  "Made our day stress-free and beautiful. Highly recommend.",
  "Fantastic work and lovely to deal with. Would book again in a heartbeat.",
  "Captured our event perfectly. The quality blew us away.",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysAhead = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

async function ensureBuyer() {
  const password = await bcrypt.hash(BUYER.password, 10);
  return prisma.user.upsert({
    where: { email: BUYER.email },
    update: {},
    create: {
      name: BUYER.name,
      email: BUYER.email,
      password,
      role: "buyer",
      sellerStatus: "none",
      location: "Colombo",
    },
  });
}

// One completed booking + delivery evidence + a review = one Verified Work item.
async function makeVerifiedBooking(buyer, gig, whenDaysAgo) {
  const images = [pick(EVENT_PHOTOS), pick(EVENT_PHOTOS)];
  const completedAt = daysAgo(whenDaysAgo);
  const totalAmount = gig.basicPrice;
  const commission = +(totalAmount * COMMISSION_RATE).toFixed(2);

  const booking = await prisma.booking.create({
    data: {
      buyerId: buyer.id,
      gigId: gig.id,
      vendorId: gig.vendorId,
      packageType: "standard",
      eventDate: completedAt,
      eventType: pick(["Wedding", "Birthday", "Corporate", "Engagement"]),
      notes: "[demo-verified]",
      totalAmount,
      commission,
      status: "completed",
      completionNote: "Delivered as agreed — full set handed over to the client.",
      completionImages: images,
      completionSubmittedAt: completedAt,
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      buyerId: buyer.id,
      vendorId: gig.vendorId,
      gigId: gig.id,
      rating: rand(4, 5),
      comment: pick(REVIEW_COMMENTS),
    },
  });

  return booking;
}

async function seedVerifiedWork(buyer) {
  const already = await prisma.booking.count({ where: { notes: "[demo-verified]" } });
  if (already > 0) {
    console.log(`ℹ️  Verified-work demo bookings already exist (${already}) — skipping.`);
    return;
  }

  // Spread evidence across ~10 distinct vendors so several vendor pages light up.
  const gigs = await prisma.gig.findMany({
    where: { status: "active" },
    select: { id: true, vendorId: true, basicPrice: true, category: true },
    take: 200,
  });
  if (gigs.length === 0) {
    console.log("⚠️  No gigs found — run `node prisma/seed-vendors.mjs` first.");
    return;
  }

  // One gig per vendor, first 10 vendors.
  const seenVendor = new Set();
  const chosen = [];
  for (const g of gigs) {
    if (seenVendor.has(g.vendorId)) continue;
    seenVendor.add(g.vendorId);
    chosen.push(g);
    if (chosen.length >= 10) break;
  }

  let count = 0;
  for (const g of chosen) {
    const n = rand(1, 3); // 1–3 verified jobs per vendor
    for (let i = 0; i < n; i++) {
      await makeVerifiedBooking(buyer, g, rand(20, 240));
      count++;
    }
  }
  console.log(`✅  Created ${count} verified-work bookings across ${chosen.length} vendors.`);
}

async function seedEventBundle(buyer) {
  const TITLE = "Demo Wedding Bundle";
  const existing = await prisma.event.findFirst({
    where: { buyerId: buyer.id, title: TITLE },
  });
  if (existing) {
    console.log("ℹ️  Demo event bundle already exists — skipping.");
    return;
  }

  // One gig from each of these categories (distinct vendors), if available.
  const wanted = ["Venue", "Catering", "Photography", "Decoration", "DJ & Music"];
  const items = [];
  const usedVendors = new Set();

  for (const cat of wanted) {
    const gig = await prisma.gig.findFirst({
      where: {
        status: "active",
        category: { equals: cat, mode: "insensitive" },
        vendorId: { notIn: [...usedVendors] },
      },
      select: { id: true, vendorId: true, basicPrice: true, category: true },
      orderBy: { basicPrice: "asc" },
    });
    if (gig) { items.push(gig); usedVendors.add(gig.vendorId); }
  }

  if (items.length === 0) {
    console.log("⚠️  No gigs available to build the demo event bundle.");
    return;
  }

  const eventDate = daysAhead(45);
  const totalBudget = Math.round(items.reduce((s, g) => s + g.basicPrice, 0) * 1.2);

  const event = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        buyerId: buyer.id,
        title: TITLE,
        eventType: "Wedding",
        eventDate,
        location: "Colombo",
        guestCount: 200,
        totalBudget,
        status: "planning",
        plan: items.map((g) => ({ category: g.category, budget: g.basicPrice })),
      },
    });

    await tx.booking.createMany({
      data: items.map((g, i) => ({
        eventId: ev.id,
        buyerId: buyer.id,
        gigId: g.id,
        vendorId: g.vendorId,
        packageType: "basic",
        eventDate,
        eventType: "Wedding",
        notes: "[demo-bundle]",
        totalAmount: g.basicPrice,
        commission: +(g.basicPrice * COMMISSION_RATE).toFixed(2),
        // Vary statuses so the detail page shows a realistic mix.
        status: i === 0 ? "confirmed" : "pending",
      })),
    });

    return ev;
  });

  console.log(`✅  Created "${TITLE}" with ${items.length} bundled bookings (budget ${totalBudget.toLocaleString()}).`);
}

// A small pool of extra buyers so past events have varied buyers — makes the
// reliability "repeat buyers" + "distinct buyers" signals realistic.
async function ensureExtraBuyers() {
  const password = await bcrypt.hash("Buyer@123", 10);
  const defs = [
    { name: "Ishara Fernando", email: "demo.buyer2@vizhiyal.test" },
    { name: "Kavindu Silva",   email: "demo.buyer3@vizhiyal.test" },
  ];
  const out = [];
  for (const d of defs) {
    out.push(await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { name: d.name, email: d.email, password, role: "buyer", sellerStatus: "none", location: "Colombo" },
    }));
  }
  return out;
}

// Past, COMPLETED multi-vendor events — the raw material for the TrustGraph:
// co-occurrence (who worked the same events) + completion/repeat/verified signals.
async function seedPastBundles(buyers) {
  const existing = await prisma.event.findFirst({ where: { title: { startsWith: "[demo-past]" } } });
  if (existing) {
    console.log("ℹ️  Past demo bundles already exist — skipping.");
    return;
  }

  // One gig per vendor; take the first ~16 vendors as the "active community" so
  // they co-occur often (a denser, more interesting synergy graph).
  const all = await prisma.gig.findMany({
    where: { status: "active" },
    select: { id: true, vendorId: true, basicPrice: true, category: true },
    take: 200,
  });
  const seen = new Set();
  const pool = [];
  for (const g of all) {
    if (seen.has(g.vendorId)) continue;
    seen.add(g.vendorId);
    pool.push(g);
  }
  const community = pool.slice(0, 16);
  if (community.length < 3) {
    console.log("⚠️  Not enough vendors to build past bundles.");
    return;
  }

  let events = 0, bookings = 0;
  for (let e = 0; e < 7; e++) {
    const chosen = shuffle(community).slice(0, rand(3, 4));
    const buyer = pick(buyers);
    const when = daysAgo(rand(30, 320));

    const ev = await prisma.event.create({
      data: {
        buyerId: buyer.id,
        title: `[demo-past] ${pick(["Wedding", "Birthday", "Corporate", "Engagement"])} #${e + 1}`,
        eventType: "Wedding",
        eventDate: when,
        location: "Colombo",
        guestCount: rand(80, 300),
        totalBudget: Math.round(chosen.reduce((s, g) => s + g.basicPrice, 0) * 1.2),
        status: "completed",
        plan: chosen.map((g) => ({ category: g.category, budget: g.basicPrice })),
        createdAt: when,
      },
    });

    for (const g of chosen) {
      const b = await prisma.booking.create({
        data: {
          eventId: ev.id,
          buyerId: buyer.id,
          gigId: g.id,
          vendorId: g.vendorId,
          packageType: "standard",
          eventDate: when,
          eventType: "Wedding",
          notes: "[demo-past]",
          totalAmount: g.basicPrice,
          commission: +(g.basicPrice * COMMISSION_RATE).toFixed(2),
          status: "completed",
          completionNote: "Delivered as agreed.",
          completionImages: [pick(EVENT_PHOTOS)],
          completionSubmittedAt: when,
        },
      });
      if (Math.random() < 0.75) {
        await prisma.review.create({
          data: { bookingId: b.id, buyerId: buyer.id, vendorId: g.vendorId, gigId: g.id, rating: rand(4, 5), comment: pick(REVIEW_COMMENTS) },
        });
      }
      bookings++;
    }
    events++;
  }
  console.log(`✅  Created ${events} past event bundles (${bookings} completed bookings) for synergy + reliability.`);
}

async function main() {
  const buyer = await ensureBuyer();
  console.log(`👤  Demo buyer ready: ${BUYER.email} / ${BUYER.password}`);

  await seedVerifiedWork(buyer);
  await seedEventBundle(buyer);

  const extras = await ensureExtraBuyers();
  await seedPastBundles([buyer, ...extras]);

  console.log("🎉  Demo seed complete.");
}

main()
  .catch((e) => { console.error("❌  Demo seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
