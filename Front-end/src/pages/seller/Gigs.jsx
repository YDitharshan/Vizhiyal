// Gigs.jsx — Seller's gig management, connected to real API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Star, ShoppingCart, Pencil, Pause, Play,
  Trash2, Package, AlertCircle, Loader2, Eye,
} from "lucide-react";
import { gigApi } from "../../services/gigApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import { resolveUrl } from "../../utils/uploadUrl";

const GIG_LIMIT = 4;

const statusCfg = {
  ACTIVE: { label: "Active", badge: "bg-accent-50 text-accent border border-accent/20"     },
  PAUSED: { label: "Paused", badge: "bg-gray-100 text-gray-500 border border-gray-200"     },
  active: { label: "Active", badge: "bg-accent-50 text-accent border border-accent/20"     },
  paused: { label: "Paused", badge: "bg-gray-100 text-gray-500 border border-gray-200"     },
};

function adaptGig(g) {
  const minPrice = Math.min(
    g.basicPrice    || Infinity,
    g.standardPrice || Infinity,
    g.premiumPrice  || Infinity,
  );
  return {
    id:          g.id,
    vendorId:    g.vendorId,   // VendorProfile ID — used for the buyer preview link
    title:       g.title       || "Untitled Gig",
    category:    g.category    || "",
    status:      (g.status     || "ACTIVE").toUpperCase(),
    rating:      +(g.avgRating || 0).toFixed(1),
    reviewCount: g.totalReviews || 0,
    orders:      g.totalOrders  || 0,
    minPrice:    minPrice === Infinity ? 0 : minPrice,
    // gigs store uploaded images in the `images` field (not `portfolio`)
    thumbnail:   Array.isArray(g.images) && g.images.length > 0 ? resolveUrl(g.images[0]) : null,
  };
}

export default function Gigs() {
  const navigate = useNavigate();
  const [gigs,         setGigs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggling,     setToggling]     = useState(null); // id being toggled

  useEffect(() => {
    gigApi.getMy()
      .then(({ data }) => {
        const raw = data.gigs || data || [];
        setGigs(raw.map(adaptGig));
      })
      .catch(() => setGigs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? gigs : gigs.filter(g => g.status === filter.toUpperCase());
  const atLimit  = gigs.length >= GIG_LIMIT;

  async function toggleStatus(id) {
    const gig     = gigs.find(g => g.id === id);
    const newStatus = gig.status === "ACTIVE" ? "paused" : "active";
    setToggling(id);
    try {
      await gigApi.update(id, { status: newStatus });
      setGigs(prev => prev.map(g =>
        g.id === id ? { ...g, status: newStatus.toUpperCase() } : g
      ));
    } catch { /* silent */ } finally {
      setToggling(null);
    }
  }

  async function confirmDelete() {
    try {
      await gigApi.remove(deleteTarget);
      setGigs(prev => prev.filter(g => g.id !== deleteTarget));
    } catch { /* silent */ } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Gigs</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${gigs.length} / ${GIG_LIMIT} gigs used`}
          </p>
        </div>
        <button
          onClick={() => !atLimit && navigate("/seller/gigs/create")}
          disabled={atLimit || loading}
          title={atLimit ? "You have reached the 4-gig limit" : "Create a new gig"}
          className={`flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-colors ${
            atLimit || loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
        >
          <Plus className="w-4 h-4" />
          Create New Gig
        </button>
      </div>

      {/* Limit banner */}
      {atLimit && (
        <div className="flex items-start gap-3 bg-secondary-50 border border-secondary/30 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-secondary-700">
            <span className="font-semibold">Gig limit reached.</span> You can have a maximum of {GIG_LIMIT} gigs. Delete one to create a new one.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && (
        <div className="flex gap-2">
          {["all", "active", "paused"].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === tab
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab === "all"
                ? `All (${gigs.length})`
                : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${gigs.filter(g => g.status === tab.toUpperCase()).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No gigs found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first gig to start receiving orders</p>
          <button
            onClick={() => navigate("/seller/gigs/create")}
            className="mt-4 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
          >
            Create Gig
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(gig => {
            const cfg = statusCfg[gig.status] || statusCfg.ACTIVE;
            return (
              <div key={gig.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row">

                  {/* Thumbnail — shows uploaded image or a neutral placeholder */}
                  <div className="sm:w-40 h-32 sm:h-auto flex-shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                    {gig.thumbnail ? (
                      <img
                        src={gig.thumbnail}
                        alt={gig.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                      />
                    ) : null}
                    <div className={`w-full h-full items-center justify-center flex-col text-gray-400 ${gig.thumbnail ? "hidden" : "flex"}`}>
                      <Package className="w-8 h-8 mb-1 opacity-40" />
                      <span className="text-xs opacity-60">No image</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          {gig.category && (
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                              {gig.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 leading-snug">{gig.title}</h3>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                          {gig.rating} ({gig.reviewCount})
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                          {gig.orders} orders
                        </span>
                      </div>
                    </div>

                    {/* Price + actions */}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        From{" "}
                        <span className="font-semibold text-primary text-base">
                          {gig.minPrice > 0 ? `LKR ${gig.minPrice.toLocaleString()}` : "—"}
                        </span>
                        {gig.minPrice > 0 && <span className="text-xs text-gray-400"> / Basic package</span>}
                      </p>

                      <div className="flex items-center gap-2">
                        {/* Preview — open the buyer-facing vendor page */}
                        {gig.vendorId && (
                          <button
                            onClick={() => navigate(`/vendor/${gig.vendorId}?preview=true&gigId=${gig.id}`)}
                            className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary transition-colors"
                            title="Preview as buyer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/seller/gigs/${gig.id}/edit`)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(gig.id)}
                          disabled={toggling === gig.id}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                          title={gig.status === "ACTIVE" ? "Pause" : "Activate"}
                        >
                          {toggling === gig.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : gig.status === "ACTIVE"
                              ? <Pause className="w-4 h-4" />
                              : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(gig.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this gig?"
        description="This gig will be permanently removed. Buyers will no longer be able to find or book it. This cannot be undone."
        confirmLabel="Delete Gig"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
