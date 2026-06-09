// prisma/seed-vendors.mjs
// Seeds ~50 realistic vendors (User + VendorProfile + Gigs) for testing the
// recommender end-to-end. Each profile's recommender feature columns
// (latitude/longitude/completedJobs/priceMin/priceMax) and rating stats are set
// directly and self-consistently, so no separate backfill is required for seed
// data. (The backfill script remains the tool for *real* production data.)
//
// Run from the Back-end folder (after `prisma db push`):
//   node prisma/seed-vendors.mjs
//
// Idempotent-ish: skips creation if 50+ vendor profiles already exist.

import bcrypt from "bcryptjs";
import prisma from "../src/config/db.js";
import { CITY_COORDS } from "../src/utils/cityCoords.js";

const CATEGORIES = [
  "Photography", "Videography", "Decoration", "Catering", "Venue",
  "DJ & Music", "Makeup & Beauty", "Cakes & Sweets", "Floral Design",
  "Event Planning",
];

const CITIES = Object.keys(CITY_COORDS);

// Realistic LKR price bands per category (basic floor).
const PRICE_BANDS = {
  "Photography":     [15000, 45000],
  "Videography":     [25000, 80000],
  "Decoration":      [20000, 120000],
  "Catering":        [500, 2500],      // per head
  "Venue":           [50000, 300000],
  "DJ & Music":      [20000, 70000],
  "Makeup & Beauty": [8000, 35000],
  "Cakes & Sweets":  [4000, 20000],
  "Floral Design":   [10000, 60000],
  "Event Planning":  [40000, 200000],
};

const FIRST = ["Asha", "Nimal", "Kasun", "Dilani", "Roshan", "Tharindu", "Sanduni",
  "Pradeep", "Iresha", "Chamara", "Nadeesha", "Suresh", "Hashini", "Ruwan",
  "Malsha", "Buddhika", "Gayani", "Lahiru", "Dinusha", "Sahan"];
const BIZ_SUFFIX = ["Studios", "Events", "Creations", "Lanka", "Productions",
  "Collective", "Co", "House", "Crew", "Designs"];

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];

async function main() {
  const existing = await prisma.vendorProfile.count();
  if (existing >= 50) {
    console.log(`ℹ️  ${existing} vendor profiles already exist — skipping seed.`);
    return;
  }

  const password = await bcrypt.hash("Vendor@123", 10);
  let created = 0;

  for (let i = 0; i < 50; i++) {
    const category = pick(CATEGORIES);
    const city = pick(CITIES);
    const coords = CITY_COORDS[city];
    const cityLabel = city.charAt(0).toUpperCase() + city.slice(1);

    const [floor, ceil] = PRICE_BANDS[category];
    const basic = Math.round(rand(floor, floor * 1.6) / 500) * 500;
    const standard = Math.round((basic * rand(1.5, 2.0)) / 500) * 500;
    const premium = Math.round((standard * rand(1.4, 1.9)) / 500) * 500;

    const avgRating = +rand(3.4, 5.0).toFixed(1);
    const totalReviews = randInt(0, 140);
    const completedJobs = randInt(0, 90);
    const isVerified = Math.random() < 0.4;

    const businessName = `${pick(FIRST)} ${pick(BIZ_SUFFIX)}`;
    const email = `vendor${i + 1}@vizhiyal.test`;

    // Create the user + profile + one gig.
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: businessName,
        email,
        password,
        role: "seller",
        sellerStatus: "approved",
        phone: `07${randInt(10000000, 99999999)}`,
        location: cityLabel,
      },
    });

    const profile = await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName,
        category,
        description: `${category} services based in ${cityLabel}.`,
        location: cityLabel,
        latitude: coords.lat,
        longitude: coords.lng,
        avgRating,
        totalReviews,
        completedJobs,
        isVerified,
        priceMin: basic,
        priceMax: premium,
      },
    });

    await prisma.gig.create({
      data: {
        vendorId: profile.id,
        title: `${category} by ${businessName}`,
        description: `Professional ${category.toLowerCase()} for weddings and events in ${cityLabel}.`,
        category,
        basicPrice: basic,
        standardPrice: standard,
        premiumPrice: premium,
        location: cityLabel,
        status: "active",
        avgRating,
        totalReviews,
      },
    });

    created++;
  }

  console.log(`✅  Seeded ${created} vendors (each with 1 active gig).`);
  console.log("    Login for any seeded vendor: <email> / Vendor@123");
}

main()
  .catch((e) => { console.error("❌  Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
