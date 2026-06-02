// VendorDetail — full vendor profile page (connected to real API)
// CTA: "Contact Vendor" (→ chat) | "Request to Order" (→ popup modal)
// Modal: vendor profile preview + event description → sends to chat

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin, ShieldCheck, Clock, CheckCircle,
  MessageSquare, X, Send, ChevronDown,
  Star, ClipboardList, Heart, Images,
  ChevronLeft, ChevronRight, Loader2, Eye,
  ListOrdered, AlertCircle,
} from "lucide-react";
import StarRating from "../../components/common/StarRating";
import UserAvatar from "../../components/common/UserAvatar";
import { vendorApi } from "../../services/vendorApi";
import { gigApi    } from "../../services/gigApi";
import { reviewApi } from "../../services/reviewApi";
import { bookingApi } from "../../services/bookingApi";
import { useWishlist } from "../../hooks/useWishlist";
import { resolveUrl } from "../../utils/uploadUrl";
import { useAuth } from "../../context/AuthContext";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";

const eventTypes = [
  "Wedding", "Birthday Party", "Corporate Event",
  "Engagement", "Anniversary", "Graduation", "Other",
];

// ── Category-specific default features ────────────────────────────────────────
// These rows are injected into the comparison table (dimmed) for features that
// are commonly expected in a category but not explicitly listed by the vendor,
// so buyers know to ask — rather than assume the service doesn't include them.
const CATEGORY_DEFAULTS = {
  photography: [
    "Camera equipment", "Photo editing", "Digital delivery", "Online gallery",
    "Prints included", "Second photographer", "Drone photography", "Photo album/book",
    "Same-day preview", "Raw files delivery",
  ],
  videography: [
    "HD video recording", "4K resolution", "Drone footage", "Highlight reel",
    "Full ceremony video", "Same-day edit", "Color grading", "Music licensing",
  ],
  catering: [
    "Menu consultation", "Professional staff", "Setup & breakdown",
    "Vegetarian options", "Food tasting session", "Equipment rental",
    "Halal certified", "Custom menu design",
  ],
  decoration: [
    "Venue walkthrough", "Setup & removal", "Balloon decoration",
    "Floral arrangements", "Stage decoration", "Ambient lighting",
    "Photo booth setup", "Custom theme design",
  ],
  dj: [
    "Professional PA system", "Stage lighting", "MC services", "Song requests",
    "Wireless microphone", "Backup equipment", "Ceremony music", "Reception music",
  ],
  music: [
    "Professional PA system", "Stage lighting", "MC services", "Song requests",
    "Wireless microphone", "Backup equipment", "Ceremony music", "Reception music",
  ],
  makeup: [
    "Hair styling", "Airbrush foundation", "Touch-up kit", "Trial session",
    "False lashes", "Bridal makeup", "On-location service", "Skincare prep",
  ],
  venue: [
    "Private parking", "Catering kitchen", "Bridal/VIP suite", "Air conditioning",
    "Audio/visual system", "Tables & chairs", "Decoration permitted", "Security staff",
  ],
  planning: [
    "Vendor coordination", "Event timeline", "Budget management",
    "Day-of coordination", "RSVP management", "Guest seating plan",
    "Décor consultation", "Emergency support",
  ],
  transport: [
    "Air conditioning", "GPS tracking", "Professional driver", "Airport transfers",
    "Vehicle decoration", "Multiple stops", "On-time guarantee", "Backup vehicle",
  ],
};

function getCategoryDefaults(category) {
  if (!category) return [];
  const key = category.toLowerCase();
  for (const [k, defaults] of Object.entries(CATEGORY_DEFAULTS)) {
    if (key.includes(k)) return defaults;
  }
  return [];
}

// ── Build packages array from a raw gig API object ───────────────────────────
function buildPackages(gig) {
  if (!gig) return [];
  return [
    {
      name:        "Basic",
      price:       gig.basicPrice        || 0,
      description: gig.basicDescription  || gig.basicDesc  || "",
      features:    Array.isArray(gig.basicFeatures)    ? gig.basicFeatures    : [],
      popular:     false,
    },
    {
      name:        "Standard",
      price:       gig.standardPrice       || 0,
      description: gig.standardDescription || gig.standardDesc || "",
      features:    Array.isArray(gig.standardFeatures) ? gig.standardFeatures : [],
      popular:     true,
    },
    {
      name:        "Premium",
      price:       gig.premiumPrice        || 0,
      description: gig.premiumDescription  || gig.premiumDesc  || "",
      features:    Array.isArray(gig.premiumFeatures)  ? gig.premiumFeatures  : [],
      popular:     false,
    },
  ].filter((p) => p.price > 0);
}

// ── Package comparison table ───────────────────────────────────────────────────
// Renders a grid: features as rows, packages as columns.
// ✓ (accent) = included in that package, — (dim) = not listed.
// Rows for common-category features not yet listed by the vendor are appended
// at the bottom in a dimmed "ask vendor" section.
function PackageComparison({ packages, category }) {
  // Union of all features listed by the vendor across all packages
  const vendorFeatures = [...new Set(packages.flatMap((p) => p.features))];

  // Category defaults not yet covered by the vendor's own feature lists
  const defaults      = getCategoryDefaults(category);
  const extraDefaults = defaults.filter(
    (d) => !vendorFeatures.some((f) => f.toLowerCase() === d.toLowerCase()),
  );

  const hasAnyFeatures = vendorFeatures.length > 0 || extraDefaults.length > 0;

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm border-collapse min-w-[420px]">

        {/* ── Package header row ── */}
        <thead>
          <tr>
            <th className="w-[38%] py-2 pr-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              {hasAnyFeatures ? "What's included" : ""}
            </th>
            {packages.map((pkg) => (
              <th key={pkg.name} className="py-2 px-2 text-center border-b border-gray-100">
                <div
                  className={`rounded-xl p-2.5 ${
                    pkg.popular
                      ? "bg-primary-50 border border-primary/20"
                      : "border border-gray-100"
                  }`}
                >
                  {pkg.popular && (
                    <span className="block text-[10px] bg-primary text-white px-2 py-0.5 rounded-full mb-1 w-fit mx-auto font-semibold">
                      Popular
                    </span>
                  )}
                  <p className="font-bold text-gray-800 text-sm">{pkg.name}</p>
                  <p className="text-primary font-bold text-base mt-0.5">
                    LKR {pkg.price.toLocaleString()}
                  </p>
                  {pkg.description && (
                    <p className="text-[11px] text-gray-400 mt-1 leading-tight">{pkg.description}</p>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Feature rows ── */}
        {hasAnyFeatures && (
          <tbody>
            {/* Vendor-listed features */}
            {vendorFeatures.map((feature) => (
              <tr key={feature} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="py-2.5 pr-3 text-xs text-gray-700 font-medium">{feature}</td>
                {packages.map((pkg) => {
                  const included = pkg.features.some(
                    (f) => f.toLowerCase() === feature.toLowerCase(),
                  );
                  return (
                    <td key={pkg.name} className="py-2.5 px-2 text-center">
                      {included ? (
                        <CheckCircle className="w-4 h-4 text-accent mx-auto" />
                      ) : (
                        <span className="text-gray-300 font-medium">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Category-default features the vendor hasn't explicitly listed */}
            {extraDefaults.length > 0 && (
              <>
                <tr>
                  <td colSpan={packages.length + 1} className="pt-4 pb-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Common in this category — ask vendor to confirm
                    </span>
                  </td>
                </tr>
                {extraDefaults.map((feature) => (
                  <tr key={feature} className="border-b border-gray-50 opacity-50">
                    <td className="py-2 pr-3 text-xs text-gray-500 italic">{feature}</td>
                    {packages.map((pkg) => (
                      <td key={pkg.name} className="py-2 px-2 text-center">
                        <span className="text-gray-200 font-medium">—</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        )}
      </table>
    </div>
  );
}

// ── Request to Order Modal ─────────────────────────────────────────────────────
function RequestModal({ vendor, bookedDates = [], onClose, onSend }) {
  const [eventType,    setEventType]   = useState("");
  const [eventDate,    setEventDate]   = useState("");
  const [guestCount,   setGuestCount]  = useState("");
  const [description,  setDescription] = useState("");
  const [error,        setError]       = useState("");

  // Determine if selected date is already booked
  const dateBooked = eventDate && bookedDates.includes(eventDate);

  const handleSend = () => {
    if (!description.trim()) {
      setError("Please describe your requirements before sending.");
      return;
    }
    if (dateBooked) {
      setError("The vendor is not available on this date. Please choose another date.");
      return;
    }
    setError("");

    const lines = [
      "[REQUEST] Order Request",
      "",
      eventType  ? `Event Type: ${eventType}`        : null,
      eventDate  ? `Event Date: ${eventDate}`        : null,
      guestCount ? `Estimated Guests: ${guestCount}` : null,
      "",
      description.trim(),
    ].filter((l) => l !== null);

    onSend(lines.join("\n"));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Request to Order</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Vendor profile card */}
          <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl p-3">
            <UserAvatar
              src={vendor.profileImage}
              name={vendor.name}
              size={48}
              className="border-2 border-white shadow-sm flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{vendor.name}</p>
              <p className="text-xs text-gray-500 truncate">{vendor.subcategory} · {vendor.location}</p>
              <StarRating rating={vendor.rating} size="sm" />
            </div>
            {vendor.verified && (
              <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0 ml-auto" />
            )}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Event Type
            </label>
            <div className="relative">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white pr-8"
              >
                <option value="">Select event type (optional)</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date + Guest count row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => { setEventDate(e.target.value); setError(""); }}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  dateBooked ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {dateBooked && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> Vendor not available on this date
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Est. Guests
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 150"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Description — required */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Describe Your Requirements <span className="text-red-400 normal-case font-normal">(required)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Tell the vendor about your event — theme, style, special requests, budget expectations..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(""); }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed ${
                error ? "border-red-400" : "border-gray-200"
              }`}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VendorDetail Page ─────────────────────────────────────────────────────────
export default function VendorDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  // Show preview banner when a seller visits this page
  const searchParams = new URLSearchParams(location.search);
  const isPreview    = searchParams.get("preview") === "true";
  // Which specific gig to display (seller passes ?gigId= from their gig list)
  const previewGigId = searchParams.get("gigId") || null;

  const [vendor,         setVendor]         = useState(null);
  const [selectedGigId,  setSelectedGigId]  = useState(null);
  const [reviews,        setReviews]        = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [bookedDates,    setBookedDates]    = useState([]);
  const [queueCount,     setQueueCount]     = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [showModal,      setShowModal]      = useState(false);
  const [portfolioIdx,   setPortfolioIdx]   = useState(0);
  const [lightbox,       setLightbox]       = useState(null);

  const { auth } = useAuth();
  const { addGig } = useRecentlyViewed();
  const { toggle, isWishlisted } = useWishlist();
  // Wishlist is per-gig — each gig is an independent listing
  const saved = selectedGigId ? isWishlisted(selectedGigId) : false;

  // Redirect guests to login, remembering where they wanted to go
  const requireAuth = () => {
    if (!auth) {
      navigate("/login", { state: { from: location } });
      return false;
    }
    return true;
  };

  useEffect(() => {
    setLoading(true);
    setError("");

    // In preview mode, fetch the seller's own gigs (ALL statuses, including paused)
    // alongside the public vendor profile. This ensures the seller can preview
    // every gig — including ones that are currently paused and hidden from buyers.
    const gigsFetch = isPreview
      ? gigApi.getMy().then(({ data }) => data.gigs || []).catch(() => [])
      : Promise.resolve(null); // null = use gigs from public vendor endpoint

    Promise.all([vendorApi.getById(id), gigsFetch])
      .then(([{ data: vData }, sellerGigs]) => {
        const v           = vData.vendor || vData;
        const publicGigs  = Array.isArray(v.gigs) ? v.gigs : [];
        // Use seller gigs (all statuses) in preview mode; public (active-only) for buyers
        const gigs        = sellerGigs !== null ? sellerGigs : publicGigs;

        setVendor({
          id:              v.id,
          userId:          v.userId,
          name:            v.businessName    || "Vendor",
          subcategory:     v.category        || "",
          vendorCategory:  v.category        || "",
          location:        v.location        || "Sri Lanka",
          rating:          +(v.avgRating     || 0).toFixed(1),
          completedOrders: v.completedOrders || 0,
          verified:        v.isVerified      || false,
          profileImage:    resolveUrl(v.user?.avatar) || null,
          tags:            Array.isArray(v.tags) ? v.tags : [],
          description:     v.description     || "",
          // All raw gigs — images/reviews/packages derived from selectedGigId on render
          allGigs:         gigs,
        });

        // Pick the initial gig: honour ?gigId= param (seller preview), else first active gig
        const initialGig = (previewGigId && gigs.find((g) => g.id === previewGigId))
          || gigs.find((g) => g.status === "active")
          || gigs[0];
        setSelectedGigId(initialGig?.id || null);
      })
      .catch(() => setError("Failed to load vendor details."))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch booked dates + queue count once vendor profile is loaded ───────
  useEffect(() => {
    if (!vendor?.id) return;
    bookingApi.getBookedDates(vendor.id)
      .then(({ data }) => setBookedDates(data.dates || []))
      .catch(() => {}); // non-fatal
    bookingApi.getQueueCount(vendor.id)
      .then(({ data }) => setQueueCount(data.count ?? 0))
      .catch(() => {}); // non-fatal
  }, [vendor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch reviews for the currently selected gig ──────────────────────
  useEffect(() => {
    if (!selectedGigId) return;
    setReviewsLoading(true);
    setReviews([]);
    reviewApi.getByGig(selectedGigId)
      .then(({ data }) => {
        const list = (data.reviews || []).map((r) => ({
          name:    r.buyer?.name || "Anonymous",
          rating:  r.rating,
          date:    new Date(r.createdAt).toLocaleDateString("en-LK"),
          comment: r.comment,
        }));
        setReviews(list);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [selectedGigId]);

  // ── Record the currently-selected gig in recently-viewed (skip seller preview) ─
  useEffect(() => {
    if (!vendor || isPreview || !selectedGigId) return;
    const gig = (vendor.allGigs || []).find(g => g.id === selectedGigId);
    if (!gig) return;
    addGig({
      id:           gig.id,
      vendorId:     vendor.id,
      title:        gig.title    || "",
      category:     gig.category || vendor.vendorCategory || "",
      images:       gig.images   || [],
      basicPrice:   gig.basicPrice    || 0,
      standardPrice: gig.standardPrice || 0,
      premiumPrice: gig.premiumPrice   || 0,
      vendor: {
        businessName: vendor.name,
        avgRating:    vendor.rating,
        totalReviews: vendor.completedOrders,
        isVerified:   vendor.verified,
        location:     vendor.location,
        user: { avatar: vendor.profileImage },
      },
    });
  }, [vendor?.id, selectedGigId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset gallery index when the selected gig changes ─────────────
  useEffect(() => {
    setPortfolioIdx(0);
    setLightbox(null);
  }, [selectedGigId]);

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────
  if (error || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-gray-500">
        <p className="text-lg font-semibold">{error || "Vendor not found"}</p>
        <button onClick={() => navigate("/search")} className="mt-3 text-primary text-sm hover:underline">
          Back to search
        </button>
      </div>
    );
  }

  // ── Derived values — recalculated on every render from selectedGigId ────────
  const activeGigs    = (vendor.allGigs || []).filter(g => g.status === "active");
  const hasActiveGigs = activeGigs.length > 0;

  const selectedRawGig = vendor.allGigs?.find((g) => g.id === selectedGigId)
    || activeGigs[0]
    || vendor.allGigs?.[0]
    || null;

  // Portfolio: ONLY the selected gig's own images (no cross-gig mixing)
  const portfolio  = (selectedRawGig?.images || []).map(resolveUrl).filter(Boolean);
  const coverImage = portfolio[0] || null;

  const packages     = buildPackages(selectedRawGig);
  const gigCategory  = selectedRawGig?.category || vendor.vendorCategory || "";
  const deliveryDays = selectedRawGig?.responseTime || 7;
  const lowestPkg    = packages.length > 0
    ? packages.reduce((a, b) => (a.price < b.price ? a : b))
    : { name: "Custom", price: 0 };

  const handleSendRequest = (message) => {
    setShowModal(false);
    if (!requireAuth()) return;
    navigate("/messages", { state: { vendorUserId: vendor.userId, requestMessage: message } });
  };

  return (
    <>
      {/* Request to Order Modal */}
      {showModal && (
        <RequestModal
          vendor={vendor}
          bookedDates={bookedDates}
          onClose={() => setShowModal(false)}
          onSend={handleSendRequest}
        />
      )}

      {/* ── Preview Mode Banner — shown when seller uses "Preview as Buyer" ─── */}
      {isPreview && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-secondary text-white px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Preview Mode</span>
            <span className="opacity-80 hidden sm:inline">— This is exactly how buyers see your profile.</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
          >
            ← Back to Gigs
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Back button */}
        {!isPreview && (
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-4 transition-colors"
          >
            ← Back
          </button>
        )}

        {/* Cover image — first image of selected gig; falls back to branded gradient */}
        <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 mb-6 bg-gradient-to-br from-primary/80 to-secondary/80">
          {coverImage && (
            <img
              src={coverImage}
              alt={vendor.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-end gap-3">
            {/* Avatar — shows uploaded photo or initials */}
            {vendor.profileImage ? (
              <img
                src={vendor.profileImage}
                alt={vendor.name}
                className="w-14 h-14 rounded-full border-2 border-white object-cover shadow-lg"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-white bg-secondary flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">
                  {vendor.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              {/* Gig title is the primary heading — each gig is its own listing */}
              <h1 className="text-white text-xl font-bold leading-tight">
                {selectedRawGig?.title || vendor.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-white/80 text-sm">{vendor.name}</p>
                {vendor.verified && <ShieldCheck className="w-4 h-4 text-accent" />}
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {gigCategory && (
              <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                {gigCategory}
              </span>
            )}
            <button
              onClick={() => { if (selectedGigId) toggle(selectedGigId); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
                saved ? "bg-red-500 text-white" : "bg-white/90 text-gray-500 hover:bg-red-50 hover:text-red-500"
              }`}
              title={saved ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── "Not accepting bookings" banner — shown when all gigs are paused ─ */}
        {!hasActiveGigs && !isPreview && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Not currently accepting bookings</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This vendor has temporarily paused all their services. Check back later or contact them directly to enquire.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* ── Left: About + Reviews ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Service switcher — only shown in seller PREVIEW mode ── */}
            {/* In buyer mode each gig is its own independent listing (no switching) */}
            {isPreview && vendor.allGigs?.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Services offered</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.allGigs.map((g) => {
                    const isPaused = g.status === "paused";
                    const isActive = selectedGigId === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGigId(g.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                          isActive
                            ? isPaused
                              ? "bg-gray-400 text-white border-gray-400 shadow-sm"
                              : "bg-primary text-white border-primary shadow-sm"
                            : isPaused
                              ? "bg-gray-50 text-gray-400 border-gray-200"
                              : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {g.title}
                        {isPreview && isPaused && (
                          <span className="text-[10px] bg-white/30 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                            Paused
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {isPreview && vendor.allGigs.some(g => g.status === "paused") && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                    ⚠ Paused gigs are hidden from buyers. Activate them in your Gigs page to make them visible.
                  </p>
                )}
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatBox label="Rating"    value={`${+(selectedRawGig?.avgRating || 0).toFixed(1)} ★ (${selectedRawGig?.totalReviews || 0})`} icon={Star} iconColor="text-secondary" />
              <StatBox label="Completed" value={`${vendor.completedOrders}+ orders`}          icon={CheckCircle} iconColor="text-accent"    />
              <StatBox label="Delivery"  value={`${deliveryDays} days`}                    icon={Clock}       iconColor="text-gray-400"  />
              <StatBox
                label="In Queue"
                value={queueCount === null ? "—" : queueCount === 0 ? "Available" : `${queueCount} order${queueCount === 1 ? "" : "s"}`}
                icon={ListOrdered}
                iconColor={queueCount === 0 ? "text-accent" : queueCount >= 5 ? "text-red-400" : "text-secondary"}
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-gray-400" />
              {vendor.location}
            </div>

            {/* Tags */}
            {vendor.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vendor.tags.map((tag) => (
                  <span key={tag} className="bg-primary-50 text-primary text-xs font-medium px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* About */}
            {vendor.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-semibold text-gray-800 mb-2">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{vendor.description}</p>
              </div>
            )}

            {/* Portfolio gallery — updates to show selected gig's images first */}
            {portfolio.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Images className="w-4 h-4 text-primary" />
                    Portfolio
                  </h2>
                  <span className="text-xs text-gray-400">{portfolio.length} photos</span>
                </div>

                {/* Main featured image */}
                <div
                  className="relative rounded-xl overflow-hidden h-56 cursor-pointer group mb-2"
                  onClick={() => setLightbox(portfolioIdx)}
                >
                  <img
                    src={portfolio[portfolioIdx]}
                    alt={`Portfolio ${portfolioIdx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                      View full size
                    </span>
                  </div>
                  {portfolio.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPortfolioIdx(i => (i - 1 + portfolio.length) % portfolio.length); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPortfolioIdx(i => (i + 1) % portfolio.length); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {portfolio.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPortfolioIdx(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        portfolioIdx === idx ? "border-primary" : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img src={img} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lightbox */}
            {lightbox !== null && (
              <div
                className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center px-4"
                onClick={() => setLightbox(null)}
              >
                <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
                  <X className="w-6 h-6" />
                </button>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); setLightbox(i => (i - 1 + portfolio.length) % portfolio.length); setPortfolioIdx(i => (i - 1 + portfolio.length) % portfolio.length); }}
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <img
                  src={portfolio[lightbox]}
                  alt="Portfolio"
                  className="max-w-full max-h-[85vh] rounded-xl object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); setLightbox(i => (i + 1) % portfolio.length); setPortfolioIdx(i => (i + 1) % portfolio.length); }}
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <p className="absolute bottom-4 text-white/60 text-sm">{lightbox + 1} / {portfolio.length}</p>
              </div>
            )}

            {/* Gig switcher moved to top of page — see above the stats row */}

            {/* Packages — comparison table (driven by selectedGigId) */}
            {packages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Packages</h2>
                <PackageComparison packages={packages} category={gigCategory} />
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Send a request to get a custom quote from this vendor
                </p>
              </div>
            )}

            {/* Reviews — gig-specific, re-fetched when selected gig changes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Reviews
                {!reviewsLoading && (
                  <span className="ml-2 text-sm font-normal text-gray-400">({reviews.length})</span>
                )}
              </h2>
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r, i) => (
                    <div key={i} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <UserAvatar src={undefined} name={r.name} size={32} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                          <StarRating rating={r.rating} size="sm" />
                        </div>
                        <span className="ml-auto text-xs text-gray-400">{r.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 pl-11">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">No reviews yet for this service.</p>
              )}
            </div>
          </div>

          {/* ── Right: Sticky CTA sidebar ──────────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20 space-y-3">

              {/* Price teaser */}
              <div className="pb-3 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                <p className="text-2xl font-bold text-primary">
                  {lowestPkg.price > 0 ? `LKR ${lowestPkg.price.toLocaleString()}` : "Contact for price"}
                </p>
                {lowestPkg.price > 0 && (
                  <p className="text-xs text-gray-500">{lowestPkg.name} package · {deliveryDays} days delivery</p>
                )}
              </div>

              {/* Vendor quick info */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={vendor.profileImage}
                  name={vendor.name}
                  size={40}
                  className="border-2 border-primary-100"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{vendor.name}</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Usually replies within 1h</span>
                  </div>
                </div>
              </div>

              {/* Queue count pill */}
              {queueCount !== null && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                  queueCount === 0
                    ? "bg-accent-50 text-accent"
                    : queueCount >= 5
                      ? "bg-red-50 text-red-500"
                      : "bg-secondary-50 text-secondary"
                }`}>
                  <ListOrdered className="w-3.5 h-3.5 flex-shrink-0" />
                  {queueCount === 0
                    ? "No active orders — highly available"
                    : `${queueCount} order${queueCount === 1 ? "" : "s"} currently in queue`}
                </div>
              )}

              {isPreview ? (
                /* ── Preview mode: replace CTAs with info note ── */
                <div className="bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 text-center">
                  <Eye className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <p className="text-xs font-semibold text-secondary">Seller Preview</p>
                  <p className="text-xs text-gray-500 mt-0.5">Buyers will see these action buttons here</p>
                </div>
              ) : !hasActiveGigs ? (
                /* ── No active gigs: show paused notice + contact-only option ── */
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
                    <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-amber-800">No active services</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      This vendor has paused all services. You can still reach out to ask about availability.
                    </p>
                  </div>

                  {/* Contact is still possible — only booking is blocked */}
                  <button
                    onClick={() => { if (requireAuth()) navigate("/messages", { state: { vendorUserId: vendor.userId } }); }}
                    className="w-full border-2 border-gray-300 text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Vendor
                  </button>
                </>
              ) : (
                <>
                  {/* ── PRIMARY CTA: Request to Order ── */}
                  <button
                    onClick={() => { if (requireAuth()) setShowModal(true); }}
                    className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                  >
                    <ClipboardList className="w-4 h-4" /> Request to Order
                  </button>

                  {/* ── SECONDARY CTA: Contact Vendor ── */}
                  <button
                    onClick={() => { if (requireAuth()) navigate("/messages", { state: { vendorUserId: vendor.userId } }); }}
                    className="w-full border-2 border-primary text-primary text-sm font-semibold py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Vendor
                  </button>

                  {/* Trust note */}
                  <div className="flex items-start gap-2 bg-accent-50 rounded-xl px-3 py-2.5 mt-1">
                    <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Your payment is only released after the event is completed — escrow protected.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ── Stat box helper ───────────────────────────────────────────────────────────
function StatBox({ label, value, icon: Icon, iconColor = "text-secondary" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto ${iconColor}`} />
      <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
