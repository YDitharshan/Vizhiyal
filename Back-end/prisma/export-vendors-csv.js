// prisma/export-vendors-csv.js
// Exports the vendor catalogue to a CSV the ml-service trains on.
// Columns: vendor_id, category, latitude, longitude, avg_rating,
//          total_reviews, completed_jobs, price_min, price_max, is_verified
//
// Run from the Back-end folder (after backfill-recommender.mjs):
//   node prisma/export-vendors-csv.js
// Output: ../ml-service/data/vendors.csv

import prisma from "../src/config/db.js";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Override with VENDORS_CSV_OUT (e.g. inside Docker where the ml-service data
// dir is bind-mounted at a different path). Defaults to the sibling ml-service.
const OUT_PATH =
  process.env.VENDORS_CSV_OUT || resolve(__dirname, "../../ml-service/data/vendors.csv");

const HEADER = [
  "vendor_id", "category", "latitude", "longitude", "avg_rating",
  "total_reviews", "completed_jobs", "price_min", "price_max", "is_verified",
];

// Minimal CSV-safe cell: quote when the value contains a comma/quote/newline.
function cell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function run() {
  const vendors = await prisma.vendorProfile.findMany({
    select: {
      id: true, category: true, latitude: true, longitude: true,
      avgRating: true, totalReviews: true, completedJobs: true,
      priceMin: true, priceMax: true, isVerified: true,
    },
  });

  const rows = vendors.map((v) =>
    [
      v.id, v.category, v.latitude, v.longitude, v.avgRating,
      v.totalReviews, v.completedJobs, v.priceMin, v.priceMax, v.isVerified,
    ].map(cell).join(","),
  );

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, [HEADER.join(","), ...rows].join("\n") + "\n");

  console.log(`✅  Exported ${vendors.length} vendor(s) to ${OUT_PATH}`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error("❌  Export failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
