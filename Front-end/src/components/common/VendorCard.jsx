// VendorCard — Fiverr-style card shown on Search & Dashboard pages
// Props: vendor object
// Heart button toggles wishlist (localStorage-backed via useWishlist hook)

import { useNavigate } from "react-router-dom";
import { MapPin, Star, Heart, Sparkles } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import UserAvatar from "./UserAvatar";

export default function VendorCard({ vendor }) {
  const navigate = useNavigate();
  const { toggle, isWishlisted } = useWishlist();
  const saved = isWishlisted(vendor.id);

  const handleClick = () => navigate(`/vendor/${vendor.id}`);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden border border-gray-100 group"
    >
      {/* Cover Image */}
      <div className="relative overflow-hidden h-44">
        {vendor.coverImage ? (
          <img
            src={vendor.coverImage}
            alt={vendor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 group-hover:scale-105 transition-transform duration-300" />
        )}
        {/* Category badge */}
        <span className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
          {vendor.category}
        </span>

        {/* Featured badge */}
        {vendor.featured && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-secondary text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
            <Sparkles className="w-3 h-3" /> Featured
          </span>
        )}

        {/* Heart / wishlist button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(vendor.id); }}
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
        {/* Vendor Info Row */}
        <div className="flex items-center gap-2 mb-2">
          <UserAvatar
            src={vendor.profileImage}
            name={vendor.name}
            size={32}
            className="border-2 border-primary-50 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{vendor.name}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 text-gray-400" />
              {vendor.location}
            </div>
          </div>
          {/* Verified badge */}
          {vendor.verified && (
            <span className="ml-auto flex-shrink-0 bg-accent/10 text-accent text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* Service subtitle */}
        <p className="text-xs text-gray-500 mb-2 truncate">{vendor.subcategory}</p>

        {/* Divider */}
        <hr className="border-gray-100 mb-2" />

        {/* Rating + Price Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
            <span className="text-sm font-semibold text-gray-800">{vendor.rating}</span>
            <span className="text-xs text-gray-400">({vendor.reviewCount})</span>
          </div>
          <div className="text-right">
            {vendor.startingPrice > 0 ? (
              <>
                <span className="text-xs text-gray-400">From </span>
                <span className="text-sm font-bold text-primary">
                  LKR {vendor.startingPrice.toLocaleString()}
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
