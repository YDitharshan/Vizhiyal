// AdminReviews.jsx — connected to real review API
import { useState, useEffect } from "react";
import { Star, Flag, Trash2, Search, RotateCcw, Loader2 } from "lucide-react";
import { reviewApi } from "../../services/reviewApi";
import ConfirmDialog from "../../components/ConfirmDialog";

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews,      setReviews]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("all");
  const [query,        setQuery]        = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);

  useEffect(() => {
    reviewApi.getAll()
      .then(({ data }) => {
        const raw = data.reviews || data || [];
        setReviews(raw.map(r => ({
          id:          r.id,
          buyer:       r.buyer?.name     || "Anonymous",
          buyerAvatar: r.buyer?.avatar   || "",
          gigTitle:    r.gig?.title      || "Service",
          seller:      r.gig?.vendor?.businessName || "Vendor",
          rating:      r.rating,
          date:        new Date(r.createdAt).toLocaleDateString("en-LK"),
          comment:     r.comment,
          flagged:     r.flagged  || false,
          removed:     r.removed  || false,
        })));
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const flaggedCount = reviews.filter(r => r.flagged && !r.removed).length;
  const removedCount = reviews.filter(r => r.removed).length;

  const filtered = reviews.filter(r => {
    const matchTab =
      tab === "flagged" ? r.flagged && !r.removed :
      tab === "removed" ? r.removed : true;
    const q = query.toLowerCase();
    return matchTab && (!q ||
      r.buyer.toLowerCase().includes(q) ||
      r.gigTitle.toLowerCase().includes(q) ||
      r.seller.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q));
  });

  async function handleRemove() {
    try {
      await reviewApi.remove(removeTarget.id);
      setReviews(prev => prev.map(r => r.id === removeTarget.id ? { ...r, removed: true, flagged: false } : r));
    } catch { /* silent */ } finally { setRemoveTarget(null); }
  }

  async function handleFlag(id) {
    try {
      await reviewApi.flag(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, flagged: !r.flagged } : r));
    } catch { /* silent */ }
  }

  function handleRestore(id) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, removed: false } : r));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${reviews.length} total · ${flaggedCount} flagged · ${removedCount} removed`}
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search buyer, gig or content…"
            className="px-3 py-2.5 text-sm focus:outline-none w-64" />
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { key: "all",     label: `All (${reviews.length})` },
          { key: "flagged", label: `Flagged (${flaggedCount})` },
          { key: "removed", label: `Removed (${removedCount})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${
              r.removed ? "border-gray-100 opacity-60" : r.flagged ? "border-orange-200" : "border-gray-100"
            }`}>
              <div className="flex items-start gap-4">
                <img src={r.buyerAvatar || undefined} alt={r.buyer}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  onError={e => { e.target.style.display = "none"; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{r.buyer}</p>
                    <StarDisplay rating={r.rating} />
                    <span className="text-xs text-gray-400">{r.date}</span>
                    {r.flagged && !r.removed && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                        <Flag className="w-3 h-3" /> Flagged
                      </span>
                    )}
                    {r.removed && (
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Removed</span>
                    )}
                  </div>
                  <p className="text-xs text-primary font-medium mb-1">
                    {r.gigTitle} · <span className="text-gray-500">{r.seller}</span>
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  {!r.removed ? (
                    <>
                      <button onClick={() => handleFlag(r.id)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          r.flagged ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}>
                        <Flag className="w-3 h-3" />{r.flagged ? "Unflag" : "Flag"}
                      </button>
                      <button onClick={() => setRemoveTarget(r)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />Remove
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleRestore(r.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />Restore
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove this review?"
        description={`"${removeTarget?.comment?.slice(0, 60)}…" will be hidden from the gig page.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
