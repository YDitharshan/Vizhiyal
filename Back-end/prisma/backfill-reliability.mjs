// prisma/backfill-reliability.mjs
// Recomputes the TrustGraph Reliability Score for every vendor from current
// booking/review/dispute data. Run after seeding, or on a schedule.
//
//   node prisma/backfill-reliability.mjs   (from the Back-end folder)
import prisma from "../src/config/db.js";
import { computeAllReliability } from "../src/services/reliability.service.js";

async function main() {
  const n = await computeAllReliability();
  console.log(`✅  Recomputed reliability for ${n} vendors.`);

  // Small distribution summary so you can eyeball the result.
  const tiers = await prisma.vendorProfile.groupBy({ by: ["reliabilityTier"], _count: true });
  console.log("   Tiers:", tiers.map((t) => `${t.reliabilityTier}=${t._count}`).join("  "));
}

main()
  .catch((e) => { console.error("❌  Backfill failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
