// ReliabilityBadge — TrustGraph score pill.
// Shows a vendor's 0–100 Reliability Score (a transaction-derived trust signal,
// not followers). Colour + label come from the tier.
import { Gauge } from "lucide-react";

const TIERS = {
  elite:       { label: "Elite",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  reliable:    { label: "Reliable",    cls: "bg-green-50 text-green-700 border-green-200" },
  established: { label: "Established", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  new:         { label: "New",         cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

function tierFor(score) {
  if (score >= 85) return "elite";
  if (score >= 70) return "reliable";
  if (score >= 50) return "established";
  return "new";
}

export default function ReliabilityBadge({ score = 0, tier, showLabel = true, size = "md", className = "" }) {
  const t = TIERS[tier] || TIERS[tierFor(score)];
  const sizing = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 gap-0.5"
    : "text-xs px-2 py-1 gap-1";
  const icon = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <span
      title={`Reliability Score ${score}/100 — ${t.label}. Earned from real bookings (rating, completion, verified work, disputes, repeat buyers).`}
      className={`inline-flex items-center rounded-full border font-bold ${t.cls} ${sizing} ${className}`}
    >
      <Gauge className={icon} />
      {score}
      {showLabel && <span className="font-semibold opacity-80">· {t.label}</span>}
    </span>
  );
}
