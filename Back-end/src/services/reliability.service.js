// services/reliability.service.js — TrustGraph Reliability Score
// A transparent, transaction-derived 0–100 trust signal for a vendor. Unlike a
// social follower count, every input is something the vendor EARNED through real
// bookings on the platform, so it can't be inflated off-platform.
//
// Factors (weights sum to 1.0):
//   rating      0.30  avg review rating / 5
//   experience  0.15  log-scaled completed jobs
//   verified    0.20  completed bookings backed by delivery evidence (Verified Work)
//   completion  0.15  completed / (completed + cancelled)
//   dispute     0.10  inverse of dispute rate
//   repeat      0.10  share of buyers who booked more than once
import prisma from "../config/db.js";

const WEIGHTS = {
  rating: 0.30, experience: 0.15, verified: 0.20,
  completion: 0.15, dispute: 0.10, repeat: 0.10,
};

// Scale references — kept small so a busy vendor saturates the factor.
const EXPERIENCE_SATURATION = 50; // completed jobs at which experience → ~1
const VERIFIED_SATURATION   = 5;  // verified jobs at which verified → 1

export function tierFor(score) {
  if (score >= 85) return "elite";
  if (score >= 70) return "reliable";
  if (score >= 50) return "established";
  return "new";
}

// Compute (but don't persist) the score for one vendor.
export async function computeReliability(vendorId) {
  const profile = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { avgRating: true, completedJobs: true, totalReviews: true },
  });
  if (!profile) return null;

  const [completed, cancelled, disputes, verified, buyerGroups] = await Promise.all([
    prisma.booking.count({ where: { vendorId, status: "completed" } }),
    prisma.booking.count({ where: { vendorId, status: "cancelled" } }),
    prisma.dispute.count({ where: { booking: { vendorId } } }),
    prisma.booking.count({ where: { vendorId, status: "completed", completionImages: { isEmpty: false } } }),
    prisma.booking.groupBy({ by: ["buyerId"], where: { vendorId, status: "completed" }, _count: true }),
  ]);

  const ratingScore     = clamp01((profile.avgRating || 0) / 5);
  const experienceScore = clamp01(Math.log1p(profile.completedJobs || 0) / Math.log1p(EXPERIENCE_SATURATION));
  const verifiedScore   = clamp01(verified / VERIFIED_SATURATION);
  const totalReal       = completed + cancelled;
  const completionScore = totalReal > 0 ? completed / totalReal : 1; // benefit of the doubt for new vendors
  const disputeScore    = 1 - clamp01(disputes / Math.max(1, completed));
  const distinctBuyers  = buyerGroups.length;
  const repeatBuyers    = buyerGroups.filter((g) => g._count > 1).length;
  const repeatScore     = distinctBuyers > 0 ? repeatBuyers / distinctBuyers : 0;

  const sub = {
    rating: ratingScore, experience: experienceScore, verified: verifiedScore,
    completion: completionScore, dispute: disputeScore, repeat: repeatScore,
  };
  const score = Math.round(100 * Object.keys(WEIGHTS).reduce((s, k) => s + WEIGHTS[k] * sub[k], 0));
  const tier = tierFor(score);

  const breakdown = {
    sub: Object.fromEntries(Object.entries(sub).map(([k, v]) => [k, +v.toFixed(3)])),
    weights: WEIGHTS,
    counts: { completed, cancelled, disputes, verified, distinctBuyers, repeatBuyers },
  };

  return { score, tier, breakdown };
}

// Compute and persist for one vendor. Safe to call fire-and-forget.
export async function computeAndSaveReliability(vendorId) {
  const r = await computeReliability(vendorId);
  if (!r) return null;
  await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: {
      reliabilityScore: r.score,
      reliabilityTier: r.tier,
      reliabilityBreakdown: r.breakdown,
      reliabilityUpdatedAt: new Date(),
    },
  });
  return r;
}

// Recompute for every vendor — used by the backfill script.
export async function computeAllReliability() {
  const vendors = await prisma.vendorProfile.findMany({ select: { id: true } });
  let n = 0;
  for (const v of vendors) {
    await computeAndSaveReliability(v.id);
    n++;
  }
  return n;
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
