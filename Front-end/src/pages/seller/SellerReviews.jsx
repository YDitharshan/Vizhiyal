// SellerReviews — connected to real review API
import { useState, useEffect } from "react";
import { Star, MessageSquare, Flag, Search, Loader2 } from "lucide-react";
import { vendorApi } from "../../services/vendorApi";
import { reviewApi } from "../../services/reviewApi";

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "fill-secondary text-secondary" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

const TAB_ALL      = "all";
const TAB_POSITIVE = "positive";
const TAB_CRITICAL = "critical";
const TAB_FLAGGED  = "flagged";

export default function SellerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState(TAB_ALL);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    // First get the seller's vendor profile to get the vendorId
    vendorApi.getMyProfile()
      .then(({ data }) => {
        const v   = data.vendor || data;
        const vid = v.id;
        return reviewApi.getByVendor(vid);
      })
      .then(({ data }) => {
        const raw = data.reviews || data || [];
        const adapted = raw.map(r => ({
          id:          r.id,
          buyer:       r.buyer?.name || "Anonymous",
          buyerAvatar: r.buyer?.avatar || "",
          gigTitle:    r.gig?.title   || "Service",
          rating:      r.rating,
          date:        new Date(r.createdAt).toLocaleDateString("en-LK"),
          comment:     r.comment,
          flagged:     r.flagged || false,
        }));
        setReviews(adapted);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reviews
    .filter(r => {
      if (tab === TAB_POSITIVE) return r.rating >= 4;
      if (tab === TAB_CRITICAL) return r.rating <= 3;
      if (tab === TAB_FLAGGED)  return r.flagged;
      return true;
    })
    .filter(r => {
      const q = search.toLowerCase();
      return !q
        || r.buyer.toLowerCase().includes(q)
        || r.gigTitle.toLowerCase().includes(q)
        || r.comment.toLowerCase().includes(q);
    });

  const avgRating    = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const flaggedCount = reviews.filter(r => r.flagged).length;

  const tabs = [
    { key: TAB_ALL,      label: "All",      count: reviews.length },
    { key: TAB_POSITIVE, label: "Positive", count: reviews.filter(r => r.rating >= 4).length },
    { key: TAB_CRITICAL, label: "Critical", count: reviews.filter(r => r.rating <= 3).length },
    { key: TAB_FLAGGED,  label: "Flagged",  count: flaggedCount },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Reviews</h1>
        <p className="text-sm text-gray-400 mt-0.5">Buyer feedback on your gigs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-primary">{avgRating}</p>
              <div className="flex justify-center mt-1 mb-1">
                <StarRow rating={Math.round(Number(avgRating) || 0)} />
              </div>
              <p className="text-xs text-gray-400">Average Rating</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-accent">{reviews.length}</p>
              <div className="flex justify-center mt-2 mb-1">
                <MessageSquare className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xs text-gray-400">Total Reviews</p>
            </div>
            <div className={`rounded-2xl border shadow-sm p-5 text-center ${flaggedCount > 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-100"}`}>
              <p className={`text-3xl font-bold ${flaggedCount > 0 ? "text-red-500" : "text-gray-300"}`}>{flaggedCount}</p>
              <div className="flex justify-center mt-2 mb-1">
                <Flag className={`w-4 h-4 ${flaggedCount > 0 ? "text-red-400" : "text-gray-300"}`} />
              </div>
              <p className="text-xs text-gray-400">Flagged</p>
            </div>
          </div>

          {/* Tabs + search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    tab === t.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t.key ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search reviews…"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Review list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 ${r.flagged ? "border-red-200" : "border-gray-100"}`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={r.buyerAvatar}
                      alt={r.buyer}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.buyer}</p>
                          <p className="text-xs text-gray-400 truncate">{r.gigTitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRow rating={r.rating} />
                          <span className="text-xs text-gray-400">{r.date}</span>
                          {r.flagged && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              <Flag className="w-3 h-3" /> Flagged
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
