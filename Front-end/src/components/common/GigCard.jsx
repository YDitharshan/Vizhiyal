// GigCard — Fiverr-style card for a single gig listing
// Props: gig (from adaptGig)
// Clicking → /vendor/:vendorId?gigId=:id  (opens VendorDetail with this gig pre-selected)

import { useNavigate } from "react-router-dom";
import { MapPin, Star, Heart, ShieldCheck } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import UserAvatar from "./UserAvatar";
import ReliabilityBadge from "./ReliabilityBadge";

export default function GigCard({ gig }) {
  const navigate = useNavigate();
  // Wishlist is per-gig — each gig is an independent listing
  const { toggle, isWishlisted } = useWishlist();
  const saved = isWishlisted(gig.id);

  const handleClick = () => navigate(`/vendor/${gig.vendorId}?gigId=${gig.id}`);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden border border-gray-100 group"
    >
      {/* Cover Image */}
      <div className="relative overflow-hidden h-44">
        {gig.coverImage ? (
          <img
            src={gig.coverImage}
            alt={gig.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 group-hover:scale-105 transition-transform duration-300" />
        )}

        {/* Category badge */}
        <span className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
          {gig.category}
        </span>

        {/* Wishlist heart */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(gig.id); }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
            saved
              ? "bg-red-500 text-white"
              : "bg-white/90 text-gray-500 hover:bg-red-50 hover:text-red-500"
          }`}
          title={saved ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-white" : ""}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Gig title */}
        <p
          className="text-sm font-semibold text-gray-800 leading-snug mb-2 line-clamp-2"
          title={gig.title}
        >
          {gig.title}
        </p>

        {/* Vendor row */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <UserAvatar
            src={gig.profileImage}
            name={gig.vendorName}
            size={22}
            className="border border-primary-50 flex-shrink-0"
          />
          <span className="text-xs text-gray-600 truncate">{gig.vendorName}</span>
          {gig.verified && (
            <ShieldCheck className="w-3 h-3 text-accent flex-shrink-0" />
          )}
          {gig.reliabilityScore >= 70 && (
            <ReliabilityBadge
              score={gig.reliabilityScore}
              tier={gig.reliabilityTier}
              size="sm"
              showLabel={false}
              className="ml-auto flex-shrink-0"
            />
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{gig.location || "Sri Lanka"}</span>
        </div>

        <hr className="border-gray-100 mb-2" />

        {/* Rating + Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
            <span className="text-sm font-semibold text-gray-800">{gig.rating}</span>
            <span className="text-xs text-gray-400">({gig.reviewCount})</span>
          </div>
          <div className="text-right">
            {gig.startingPrice > 0 ? (
              <>
                <span className="text-xs text-gray-400">From </span>
                <span className="text-sm font-bold text-primary">
                  LKR {gig.startingPrice.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-gray-400">Contact for price</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
