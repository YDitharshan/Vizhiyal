// AdminFeaturedGigs.jsx — connected to real gig API
import { useState, useEffect } from "react";
import { Sparkles, Star, Package, ToggleLeft, ToggleRight, AlertTriangle, Loader2 } from "lucide-react";
import { gigApi } from "../../services/gigApi";

const FEATURED_LIMIT = 3;
const TABS = ["all", "featured", "not_featured"];

export default function AdminFeaturedGigs() {
  const [gigs,     setGigs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    gigApi.list()
      .then(({ data }) => {
        const raw = data.gigs || data || [];
        setGigs(raw.map(g => ({
          id:       g.id,
          title:    g.title,
          seller:   g.vendor?.businessName || "Vendor",
          category: g.category,
          rating:   g.avgRating   || 0,
          orders:   g.totalOrders || g.ordersCount || 0,
          status:   (g.status || "ACTIVE").toUpperCase() === "SUSPENDED" ? "suspended" : "active",
          featured: g.featured || false,
        })));
      })
      .catch(() => setGigs([]))
      .finally(() => setLoading(false));
  }, []);

  const featuredCount = gigs.filter(g => g.featured).length;
  const atLimit = featuredCount >= FEATURED_LIMIT;

  const filtered = gigs.filter(g => {
    if (tab === "featured")     return g.featured;
    if (tab === "not_featured") return !g.featured;
    return true;
  });

  async function toggleFeatured(id) {
    const gig = gigs.find(g => g.id === id);
    if (!gig || toggling) return;
    if (!gig.featured && atLimit) return;
    const newFeatured = !gig.featured;
    setToggling(id);
    try {
      await gigApi.update(id, { featured: newFeatured });
      setGigs(prev => prev.map(g => g.id === id ? { ...g, featured: newFeatured } : g));
    } catch { /* silent */ } finally { setToggling(null); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Featured Gigs</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {loading ? "Loading…" : `${featuredCount} / ${FEATURED_LIMIT} gigs featured · Featured gigs appear prominently on the homepage`}
        </p>
      </div>

      {atLimit && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Featured limit reached</p>
            <p className="text-xs text-amber-600 mt-0.5">
              You can feature a maximum of {FEATURED_LIMIT} gigs at a time. Unfeature an existing gig to add a new one.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {TABS.map(t => {
          const count = t === "all" ? gigs.length : t === "featured" ? featuredCount : gigs.length - featuredCount;
          const label = t === "not_featured" ? "Not Featured" : t.charAt(0).toUpperCase() + t.slice(1);
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label} ({loading ? "…" : count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No gigs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(gig => {
            const isSuspended  = gig.status === "suspended";
            const canToggleOn  = gig.featured || !atLimit;
            const isToggling   = toggling === gig.id;
            return (
              <div
                key={gig.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${
                  gig.featured ? "border-secondary/40 bg-amber-50/20" : "border-gray-100"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-gray-800">{gig.title}</p>
                    {gig.featured && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" /> Featured
                      </span>
                    )}
                    {isSuspended && (
                      <span className="text-xs font-medium text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary font-medium">{gig.seller}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{gig.category}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {Number(gig.rating).toFixed(1)}
                    </span>
                    <span>{gig.orders} orders</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleFeatured(gig.id)}
                  disabled={!canToggleOn || isToggling}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    gig.featured
                      ? "text-primary"
                      : canToggleOn
                        ? "text-gray-400 hover:text-gray-600"
                        : "text-gray-200 cursor-not-allowed"
                  }`}
                  title={!canToggleOn ? "Featured limit reached" : gig.featured ? "Unfeature this gig" : "Feature this gig"}
                >
                  {isToggling ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : gig.featured ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                  <span className="hidden sm:inline text-xs">
                    {gig.featured ? "Featured" : "Not Featured"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
