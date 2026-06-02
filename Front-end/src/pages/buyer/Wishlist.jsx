// Wishlist — saved gigs page (gig-first system)
// Each gig is wishlisted independently. Heart on GigCard / VendorDetail
// writes the GIG ID to localStorage. This page fetches each gig individually.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Search, MapPin, Star, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { gigApi } from "../../services/gigApi";
import { adaptGig } from "../../utils/adapters";
import { useWishlist } from "../../hooks/useWishlist";
import ConfirmDialog from "../../components/ConfirmDialog";
import UserAvatar from "../../components/common/UserAvatar";

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, toggle } = useWishlist();
  const [savedGigs,    setSavedGigs]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);

  // Fetch each wishlisted gig by its ID
  useEffect(() => {
    if (wishlist.length === 0) {
      setSavedGigs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(wishlist.map(id => gigApi.getById(id).then(r => adaptGig(r.data.gig)).catch(() => null)))
      .then(results => setSavedGigs(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [wishlist.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeGig = savedGigs.find(g => g.id === removeTarget);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          My Wishlist
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {savedGigs.length} saved service{savedGigs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {savedGigs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedGigs.map(gig => (
            <WishlistGigCard
              key={gig.id}
              gig={gig}
              onRemove={() => setRemoveTarget(gig.id)}
              onView={() => navigate(`/vendor/${gig.vendorId}?gigId=${gig.id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyWishlist onBrowse={() => navigate("/search")} />
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove from wishlist?"
        description={`"${removeGig?.title ?? "This service"}" will be removed from your saved list. You can always save it again from the listing.`}
        confirmLabel="Remove"
        onConfirm={() => { toggle(removeTarget); setRemoveTarget(null); }}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}

// ── Wishlist gig card ─────────────────────────────────────────────────────────
function WishlistGigCard({ gig, onRemove, onView }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Cover image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/80 to-secondary/80">
        {gig.coverImage && (
          <img
            src={gig.coverImage}
            alt={gig.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={onView}
            onError={e => { e.target.style.display = "none"; }}
          />
        )}
        <span className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
          {gig.category}
        </span>
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
          title="Remove from wishlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Gig title */}
        <p className="text-sm font-semibold text-gray-800 leading-snug mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors" onClick={onView}>
          {gig.title}
        </p>

        {/* Vendor row */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <UserAvatar src={gig.profileImage} name={gig.vendorName} size={22} />
          <span className="text-xs text-gray-600 truncate">{gig.vendorName}</span>
          {gig.verified && <ShieldCheck className="w-3 h-3 text-accent flex-shrink-0" />}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{gig.location || "Sri Lanka"}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
            <span className="text-sm font-semibold text-gray-800">{gig.rating}</span>
            <span className="text-xs text-gray-400">({gig.reviewCount})</span>
          </div>
          {gig.startingPrice > 0 ? (
            <span className="text-sm font-bold text-primary">
              From LKR {gig.startingPrice.toLocaleString()}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Contact for price</span>
          )}
        </div>

        <button
          onClick={onView}
          className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
        >
          View Service
        </button>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyWishlist({ onBrowse }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-40 scale-110" />
        <div className="relative w-28 h-28 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center border border-red-100">
          <Heart className="w-12 h-12 text-red-300" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-red-100 rounded-full shadow-lg flex items-center justify-center animate-bounce">
          <Search className="w-5 h-5 text-secondary" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">No saved services yet</h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-8">
        Tap the heart icon on any service listing to save it here for easy access later.
      </p>
      <button
        onClick={onBrowse}
        className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
      >
        <Search className="w-4 h-4" />
        Browse Services
      </button>
    </div>
  );
}
