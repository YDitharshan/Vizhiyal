// VerifiedWork — Proof-of-Work portfolio for a vendor.
// Unlike a self-uploaded gallery, every item here is provably tied to a REAL
// completed booking on the platform (seller's delivery evidence + the buyer's
// review). This is the trust signal a pure social profile can't fake.
import { useEffect, useState } from "react";
import { BadgeCheck, Star, ShieldCheck, X, ChevronLeft, ChevronRight } from "lucide-react";
import { vendorApi } from "../../services/vendorApi";
import { resolveUrl } from "../../utils/uploadUrl";

export default function VerifiedWork({ vendorId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // { item, imgIdx } for lightbox

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    vendorApi.verifiedWork(vendorId, { limit: 12 })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [vendorId]);

  // Render nothing until there's at least one verified item (keeps new vendors clean).
  if (loading || items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-accent" />
          Verified Work
          <span className="text-xs font-bold text-accent bg-accent-50 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </h2>
      </div>
      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        Every photo below is from a real, completed booking on Vizhiyal — not a self-uploaded gallery.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const cover = resolveUrl(item.images?.[0]);
          return (
            <button
              key={item.bookingId}
              onClick={() => setActive({ item, imgIdx: 0 })}
              className="group text-left rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition"
            >
              <div className="relative h-28 bg-gradient-to-br from-accent/40 to-primary/40">
                {cover && (
                  <img src={cover} alt={item.gigTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = "none"; }} />
                )}
                <span className="absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold text-white bg-accent/90 px-1.5 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
                {item.images?.length > 1 && (
                  <span className="absolute bottom-1.5 right-1.5 text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded-full">
                    +{item.images.length - 1}
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-800 truncate">{item.eventType || item.gigTitle}</p>
                <div className="flex items-center justify-between mt-0.5">
                  {item.rating != null ? (
                    <span className="flex items-center gap-0.5 text-[11px] text-gray-600">
                      <Star className="w-3 h-3 text-secondary fill-secondary" /> {item.rating}.0
                    </span>
                  ) : <span className="text-[11px] text-gray-400">Completed</span>}
                  <span className="text-[10px] text-gray-400">
                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString("en-LK", { month: "short", year: "numeric" }) : ""}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <Lightbox
          item={active.item}
          imgIdx={active.imgIdx}
          onClose={() => setActive(null)}
          onNav={(d) => setActive((a) => {
            const n = a.item.images.length;
            return { ...a, imgIdx: (a.imgIdx + d + n) % n };
          })}
        />
      )}
    </div>
  );
}

// Lightbox with the full provenance receipt for one verified booking.
function Lightbox({ item, imgIdx, onClose, onNav }) {
  const img = resolveUrl(item.images?.[imgIdx]);
  return (
    <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center px-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={img} alt={item.gigTitle} className="w-full max-h-[60vh] object-contain rounded-xl" />
          {item.images.length > 1 && (
            <>
              <button onClick={() => onNav(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => onNav(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Provenance receipt */}
        <div className="bg-white rounded-xl mt-3 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck className="w-5 h-5 text-accent" />
            <p className="font-semibold text-gray-800">Verified delivery</p>
            <span className="ml-auto text-xs text-gray-400">
              {item.completedAt ? new Date(item.completedAt).toLocaleDateString("en-LK") : ""}
            </span>
          </div>
          <p className="text-sm text-gray-700">{item.gigTitle}{item.eventType ? ` · ${item.eventType}` : ""}</p>
          {item.rating != null && (
            <div className="flex items-center gap-1 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? "text-secondary fill-secondary" : "text-gray-200"}`} />
              ))}
              <span className="text-xs text-gray-500 ml-1">by {item.buyerName}</span>
            </div>
          )}
          {item.reviewComment && <p className="text-sm text-gray-600 italic mt-2">“{item.reviewComment}”</p>}
          <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Tied to a real completed booking · cannot be faked
          </p>
        </div>
      </div>
    </div>
  );
}
