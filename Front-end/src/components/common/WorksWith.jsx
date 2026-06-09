// WorksWith — TrustGraph synergy rail ("Dream Team").
// Vendors with a proven track record of serving the SAME events as this one.
// Derived from Event-bundle co-occurrence — a signal only a booking graph yields.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ShieldCheck, Link2 } from "lucide-react";
import { vendorApi } from "../../services/vendorApi";
import { resolveUrl } from "../../utils/uploadUrl";
import UserAvatar from "./UserAvatar";
import ReliabilityBadge from "./ReliabilityBadge";

export default function WorksWith({ vendorId }) {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    vendorApi.worksWith(vendorId, { limit: 6 })
      .then(({ data }) => setPartners(data.partners || []))
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading || partners.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-primary" />
        Works well together
      </h2>
      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        Vendors who've delivered the same events as this one — a proven team, not a guess.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {partners.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/vendor/${p.id}`)}
            className="flex items-center gap-3 text-left rounded-xl border border-gray-100 hover:border-primary/40 hover:shadow-sm transition p-3"
          >
            <UserAvatar src={resolveUrl(p.user?.avatar)} name={p.businessName} size={40} className="border border-primary-50 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{p.businessName}</p>
                {p.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
              </div>
              <p className="text-xs text-gray-400 truncate">{p.category}</p>
              <div className="flex items-center gap-2 mt-1">
                {p.reliabilityScore > 0 && <ReliabilityBadge score={p.reliabilityScore} tier={p.reliabilityTier} size="sm" showLabel={false} />}
                <span className="text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {p.coEvents} event{p.coEvents === 1 ? "" : "s"} together
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
