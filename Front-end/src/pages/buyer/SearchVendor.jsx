// SearchVendor — browse & filter vendors (connected to real API)
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import GigCard from "../../components/common/GigCard";
import { gigApi } from "../../services/gigApi";
import { adaptGig } from "../../utils/adapters";
import { CATEGORIES } from "../../utils/categories.js";

const categories = ["All", ...CATEGORIES];

const locations = [
  "All","Colombo","Kandy","Galle","Jaffna",
  "Negombo","Kurunegala","Anuradhapura","Matara",
];

const priceRanges = [
  { label: "Any Price",      min: 0,     max: Infinity },
  { label: "Under LKR 10k", min: 0,     max: 10000    },
  { label: "LKR 10k – 30k", min: 10000, max: 30000    },
  { label: "LKR 30k – 70k", min: 30000, max: 70000    },
  { label: "LKR 70k+",      min: 70000, max: Infinity  },
];

const ratingOptions = [4.5, 4.0, 3.5];
const LIMIT = 12;

export default function SearchVendor() {
  const [searchParams] = useSearchParams();

  // Pre-fill from URL query params (e.g. coming from landing page category click)
  const urlCategory = searchParams.get("category") || "";
  const urlSearch   = searchParams.get("search")   || "";

  const [query,       setQuery]       = useState(urlSearch);
  const [debouncedQ,  setDebouncedQ]  = useState(urlSearch);
  const [category,    setCategory]    = useState(
    categories.includes(urlCategory) ? urlCategory : "All"
  );
  const [location,    setLocation]    = useState("All");
  const [priceIdx,    setPriceIdx]    = useState(0);
  const [minRating,   setMinRating]   = useState(0);
  const [verified,    setVerified]    = useState(false);
  const [showFilter,  setShowFilter]  = useState(false);
  const [sortBy,      setSortBy]      = useState("rating");

  const [gigs,       setGigs]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);

  // Debounce search query 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Reset to page 1 on any filter change
  useEffect(() => { setPage(1); }, [debouncedQ, category, location, priceIdx, minRating, verified, sortBy]);

  // Fetch from API
  useEffect(() => {
    setLoading(true);
    const { min, max } = priceRanges[priceIdx];
    const params = {
      page,
      limit:   LIMIT,
      sortBy,
      ...(debouncedQ         && { search:    debouncedQ }),
      ...(category !== "All" && { category }),
      ...(location !== "All" && { location }),
      ...(verified           && { verified:  "true" }),
      ...(minRating > 0      && { minRating }),
      ...(priceIdx !== 0     && { minPrice: min, ...(max !== Infinity && { maxPrice: max }) }),
    };

    gigApi.list(params)
      .then(({ data }) => {
        const list = (data.gigs || []).map(adaptGig);
        setGigs(list);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => setGigs([]))
      .finally(() => setLoading(false));
  }, [debouncedQ, category, location, priceIdx, minRating, verified, sortBy, page]);

  const clearFilters = () => {
    setQuery(""); setCategory("All"); setLocation("All");
    setPriceIdx(0); setMinRating(0); setVerified(false);
  };

  const hasFilters = category !== "All" || location !== "All" || priceIdx !== 0 || minRating !== 0 || verified;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Top search bar */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Find Vendors</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search photography, catering, venues..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
          </button>
        </div>
      </div>

      <div className="flex gap-6">

        {/* Sidebar filters */}
        <aside className={`${showFilter ? "block" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
              )}
            </div>

            <FilterSection title="Category">
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      category === c
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Location">
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {locations.map(l => <option key={l} value={l}>{l === "All" ? "All Locations" : l}</option>)}
              </select>
            </FilterSection>

            <FilterSection title="Price Range">
              <div className="space-y-1.5">
                {priceRanges.map((r, i) => (
                  <label key={r.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" checked={priceIdx === i} onChange={() => setPriceIdx(i)} className="accent-primary" />
                    <span className={`text-sm ${priceIdx === i ? "text-primary font-medium" : "text-gray-600"}`}>{r.label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Minimum Rating">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} className="accent-primary" />
                  <span className={`text-sm ${minRating === 0 ? "text-primary font-medium" : "text-gray-600"}`}>Any rating</span>
                </label>
                {ratingOptions.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} className="accent-primary" />
                    <span className={`text-sm ${minRating === r ? "text-primary font-medium" : "text-gray-600"}`}>{r}+ ★</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Verified only</span>
              <button
                onClick={() => setVerified(!verified)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${verified ? "bg-primary" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${verified ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? "Searching…" : <><span className="font-semibold text-gray-800">{total}</span> services found</>}
            </p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="rating">Best Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : gigs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {gigs.map(g => <GigCard key={g.id} gig={g} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page ? "bg-primary text-white" : "border border-gray-200 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">No vendors found</h3>
              <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="text-sm text-primary font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded" />
        <div className="flex justify-between pt-1">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
