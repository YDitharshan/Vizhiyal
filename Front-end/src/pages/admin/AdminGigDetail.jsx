// AdminGigDetail.jsx — connected to real gig API
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Star, ShoppingCart, MapPin,
  Package, CheckCircle, XCircle, Clock, Loader2,
} from "lucide-react";
import { gigApi } from "../../services/gigApi";
import { adminApi } from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const TIERS = ["basic", "standard", "premium"];

function buildPackages(g) {
  return {
    basic: {
      price:        g.basicPrice        || 0,
      description:  g.basicDescription  || "",
      features:     g.basicFeatures     || [],
    },
    standard: {
      price:        g.standardPrice     || 0,
      description:  g.standardDescription || "",
      features:     g.standardFeatures  || [],
    },
    premium: {
      price:        g.premiumPrice      || 0,
      description:  g.premiumDescription || "",
      features:     g.premiumFeatures   || [],
    },
  };
}

export default function AdminGigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gig,           setGig]           = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [status,        setStatus]        = useState("active");
  const [activeTier,    setActiveTier]    = useState("standard");
  const [confirmAction, setConfirmAction] = useState(null);
  const [updating,      setUpdating]      = useState(false);

  useEffect(() => {
    gigApi.getById(id)
      .then(({ data }) => {
        const g = data.gig || data;
        setGig({
          id:          g.id,
          title:       g.title,
          description: g.description,
          category:    g.category,
          location:    g.location || "",
          seller:      g.vendor?.businessName || "Vendor",
          rating:      g.avgRating   || 0,
          orders:      g.totalOrders || g.ordersCount || 0,
          packages:    buildPackages(g),
        });
        setStatus((g.status || "ACTIVE").toUpperCase() === "SUSPENDED" ? "suspended" : "active");
      })
      .catch(() => setError("Gig not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction() {
    setUpdating(true);
    try {
      if (status === "active") {
        await adminApi.suspendGig(id);
        setStatus("suspended");
      } else {
        await adminApi.restoreGig(id);
        setStatus("active");
      }
    } catch { /* silent */ } finally { setUpdating(false); setConfirmAction(null); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );

  if (error || !gig) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">{error || "Gig not found."}</p>
          <button onClick={() => navigate("/admin/gigs")} className="mt-3 text-sm text-primary hover:underline">
            Back to Gigs
          </button>
        </div>
      </div>
    );
  }

  const pkg = gig.packages[activeTier];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/gigs")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-800">{gig.title}</h1>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
              status === "active"
                ? "bg-accent-50 text-accent border-accent/20"
                : "bg-red-50 text-red-500 border-red-200"
            }`}>
              {status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {status === "active" ? "Active" : "Suspended"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">by {gig.seller} · {gig.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Overview</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{gig.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {gig.location && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {gig.location}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-600">
                <Star className="w-4 h-4 text-secondary fill-secondary" />
                {Number(gig.rating).toFixed(1)} rating
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <ShoppingCart className="w-4 h-4 text-primary" />
                {gig.orders} orders
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Packages</h2>

            <div className="flex gap-2 mb-4">
              {TIERS.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTier(t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                    activeTier === t ? "bg-primary text-white" : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {pkg && (
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary text-xl">LKR {pkg.price.toLocaleString()}</p>
                </div>
                {pkg.description && (
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                )}
                {pkg.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {pkg.price === 0 && (
                  <p className="text-xs text-gray-400 italic">Package not configured</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <Star className="w-5 h-5 text-secondary fill-secondary mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800">{Number(gig.rating).toFixed(1)}</p>
              <p className="text-xs text-gray-400">Rating</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <ShoppingCart className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800">{gig.orders}</p>
              <p className="text-xs text-gray-400">Orders</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Admin Actions</h2>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-0.5">Seller</p>
              <p className="text-sm font-semibold text-gray-800">{gig.seller}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-0.5">Category</p>
              <p className="text-sm font-semibold text-gray-800">{gig.category}</p>
            </div>
            {status === "active" ? (
              <button
                onClick={() => setConfirmAction("suspend")}
                disabled={updating}
                className="w-full border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm disabled:opacity-60"
              >
                Suspend Gig
              </button>
            ) : (
              <button
                onClick={() => setConfirmAction("restore")}
                disabled={updating}
                className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl hover:bg-accent/90 transition-colors text-sm disabled:opacity-60"
              >
                Restore Gig
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "suspend"}
        title="Suspend this gig?"
        description={`"${gig.title}" will be hidden from all buyers and no new bookings can be made. The seller will be notified.`}
        confirmLabel="Suspend Gig"
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "restore"}
        title="Restore this gig?"
        description={`"${gig.title}" will be visible to buyers again and available for new bookings.`}
        confirmLabel="Restore Gig"
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
