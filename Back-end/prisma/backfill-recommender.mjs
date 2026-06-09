// prisma/backfill-recommender.mjs
// Populates the recommender feature columns on existing vendor_profiles:
//   • latitude / longitude  — derived from `location` via the city lookup
//   • completedJobs          — count of that vendor's completed bookings
//   • priceMin / priceMax    — min/max across all the vendor's gig packages
//
// Run from the Back-end folder, against a DB that already has the columns
// (apply with `npx prisma db push` first):
//   node prisma/backfill-recommender.mjs

import prisma from "../src/config/db.js";
import { coordsForLocation } from "../src/utils/cityCoords.js";

async function run() {
  const vendors = await prisma.vendorProfile.findMany({
    select: { id: true, location: true },
  });

  let updated = 0;

  for (const v of vendors) {
    // 1. Coordinates from city name
    const coords = coordsForLocation(v.location);

    // 2. Completed-jobs count (the "previous work" signal)
    const completedJobs = await prisma.booking.count({
      where: { vendorId: v.id, status: "completed" },
    });

    // 3. Price range across all of this vendor's gig packages
    const gigs = await prisma.gig.findMany({
      where: { vendorId: v.id },
      select: { basicPrice: true, standardPrice: true, premiumPrice: true },
    });
    const prices = gigs.flatMap((g) =>
      [g.basicPrice, g.standardPrice, g.premiumPrice].filter(
        (p) => typeof p === "number" && p > 0,
      ),
    );
    const priceMin = prices.length ? Math.min(...prices) : null;
    const priceMax = prices.length ? Math.max(...prices) : null;

    await prisma.vendorProfile.update({
      where: { id: v.id },
      data: {
        latitude:  coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        completedJobs,
        priceMin,
        priceMax,
      },
    });
    updated++;
  }

  console.log(`✅  Backfilled recommender features for ${updated} vendor(s).`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error("❌  Backfill failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
