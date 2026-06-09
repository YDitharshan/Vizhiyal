// prisma/seed-vendors-from-xlsx.mjs
// Seeds the 50 real sample vendors (from Vizhiyal_50_Realistic_Vendors.xlsx,
// pre-extracted to prisma/vendors-seed.json) so the recommender works
// end-to-end against real data.
//
// Crucially, each VendorProfile.id is set to the spreadsheet's VendorID
// (V001…V050) so the ids match what the ml-service returns — the recommend
// controller hydrates those ids straight from this table.
//
// Each vendor gets: a seller User, a VendorProfile with recommender feature
// columns set self-consistently, and one active Gig (so the card shows a price).
//
// Run from the Back-end folder (after `prisma db push`):
//   node prisma/seed-vendors-from-xlsx.mjs
//
// Idempotent: upserts by email / profile id / gig id, so re-running is safe.

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import prisma from "../src/config/db.js";
import { coordsForLocation } from "../src/utils/cityCoords.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const vendors = JSON.parse(
  readFileSync(resolve(__dirname, "vendors-seed.json"), "utf-8"),
);

async function main() {
  const password = await bcrypt.hash("Vendor@123", 10);
  let count = 0;

  for (const v of vendors) {
    const coords = coordsForLocation(v.location); // { lat, lng } | null
    const email = `${v.id.toLowerCase()}@vizhiyal.test`;

    // 1. Seller user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: v.businessName,
        phone: v.phone,
        location: v.location,
        bio: v.description,
      },
      create: {
        name: v.businessName,
        email,
        password,
        role: "seller",
        sellerStatus: "approved",
        phone: v.phone,
        location: v.location,
        bio: v.description,
      },
    });

    // 2. Vendor profile — id pinned to the spreadsheet VendorID so it matches
    //    the ml-service output.
    const profileData = {
      businessName: v.businessName,
      category: v.category,
      description: v.description,
      tagline: `${v.category} • ${v.location}`,
      location: v.location,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      avgRating: v.avgRating,
      totalReviews: v.totalReviews,
      completedJobs: v.completedJobs,
      isVerified: v.isVerified,
      priceMin: v.priceMin,
      priceMax: v.priceMax,
    };
    await prisma.vendorProfile.upsert({
      where: { id: v.id },
      update: profileData,
      create: { id: v.id, userId: user.id, ...profileData },
    });

    // 3. One active gig (deterministic id → idempotent), drives the card price.
    const gigId = `${v.id}-gig`;
    const gigData = {
      title: `${v.category} by ${v.businessName}`,
      description: v.portfolioDescription,
      category: v.category,
      basicPrice: v.priceMin,
      basicDesc: "Essential package",
      standardPrice: v.priceStd,
      standardDesc: "Most popular package",
      premiumPrice: v.priceMax,
      premiumDesc: "Full premium experience",
      location: v.location,
      status: "active",
      avgRating: v.avgRating,
      totalReviews: v.totalReviews,
    };
    await prisma.gig.upsert({
      where: { id: gigId },
      update: gigData,
      create: { id: gigId, vendorId: v.id, ...gigData },
    });

    count++;
  }

  console.log(`✅  Seeded ${count} vendors (User + VendorProfile + 1 active Gig).`);
  console.log("    Vendor logins: <vNNN>@vizhiyal.test / Vendor@123");
}

main()
  .catch((e) => { console.error("❌  Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
