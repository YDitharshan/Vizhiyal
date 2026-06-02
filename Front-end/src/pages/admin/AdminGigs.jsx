// AdminGigs.jsx — connected to real gig API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Star, ShoppingCart, Search, Loader2 } from "lucide-react";
import { gigApi } from "../../services/gigApi";
import { adminApi } from "../../services/adminApi";

function adaptGig(g) {
  const statusRaw = (g.status || "ACTIVE").toUpperCase();
  return {
    id:       g.id,
    title:    g.title,
    seller:   g.vendor?.businessName || "Vendor",
    category: g.category,
    rating:   g.avgRating     || 0,
    orders:   g.totalOrders   || g.ordersCount || 0,
    status:   statusRaw === "ACTIVE" ? "active" : "suspended",
  };
}

export default function AdminGigs() {
  const navigate = useNavigate();
  const [gigs,     setGigs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [query,    setQuery]    = useState("");
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    gigApi.list()
      .then(({ data }) => {
        const raw = data.gigs || data || [];
        setGigs(raw.map(adaptGig));
      })
      .catch(() => setGigs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = gigs.filter(g => {
    const matchesFilter = filter === "all" || g.status === filter;
    const matchesQuery  = !query.trim() ||
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.seller.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  async function toggleSuspend(id) {
    const gig = gigs.find(g => g.id === id);
    if (!gig || toggling) return;
    setToggling(id);
    try {
      if (gig.status === "active") {
        await adminApi.suspendGig(id);
        setGigs(prev => prev.map(g => g.id === id ? { ...g, status: "suspended" } : g));
      } else {
        await adminApi.restoreGig(id);
        setGigs(prev => prev.map(g => g.id === id ? { ...g, status: "active" } : g));
      }
    } catch { /* silent */ } finally { setToggling(null); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gigs</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${gigs.length} total gigs`}
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title or seller..."
            className="px-3 py-2.5 text-sm focus:outline-none w-56"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "active", "suspended"].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)} ({loading ? "…" : t === "all" ? gigs.length : gigs.filter(g => g.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No gigs found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Gig</th>
                  <th className="px-5 py-3 font-medium">Seller</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Rating</th>
                  <th className="px-5 py-3 font-medium">Orders</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(gig => (
                  <tr key={gig.id} onClick={() => navigate(`/admin/gigs/${gig.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3.5 font-medium text-gray-800 max-w-[200px] truncate">{gig.title}</td>
                    <td className="px-5 py-3.5 text-gray-500">{gig.seller}</td>
                    <td className="px-5 py-3.5 text-gray-500">{gig.category}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-gray-700">
                        <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                        {Number(gig.rating).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-gray-600">
                        <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                        {gig.orders}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        gig.status === "active"
                          ? "bg-accent-50 text-accent border-accent/20"
                          : "bg-red-50 text-red-500 border-red-200"
                      }`}>
                        {gig.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); toggleSuspend(gig.id); }}
                        disabled={toggling === gig.id}
                        className={`text-xs font-medium hover:underline disabled:opacity-60 ${
                          gig.status === "active" ? "text-red-500" : "text-accent"
                        }`}
                      >
                        {toggling === gig.id ? "…" : gig.status === "active" ? "Suspend" : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
