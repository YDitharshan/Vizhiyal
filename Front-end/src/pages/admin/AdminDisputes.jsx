// AdminDisputes.jsx — connected to real dispute API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Search, Clock, CheckCircle, AlertCircle, XCircle, ChevronRight, Loader2 } from "lucide-react";
import { disputeApi } from "../../services/disputeApi";

const TABS = ["all", "OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"];

const statusCfg = {
  OPEN:         { label: "Open",         badge: "bg-blue-50 text-blue-600 border-blue-200",    icon: AlertCircle },
  UNDER_REVIEW: { label: "Under Review", badge: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock       },
  RESOLVED:     { label: "Resolved",     badge: "bg-accent-50 text-accent border-accent/20",   icon: CheckCircle },
  CLOSED:       { label: "Closed",       badge: "bg-gray-100 text-gray-500 border-gray-200",   icon: XCircle     },
};

const typeCfg = {
  no_show:       { label: "No Show",        badge: "bg-red-50 text-red-500 border-red-200"              },
  poor_quality:  { label: "Poor Quality",   badge: "bg-orange-50 text-orange-500 border-orange-200"     },
  wrong_service: { label: "Wrong Service",  badge: "bg-purple-50 text-purple-600 border-purple-200"     },
  payment_issue: { label: "Payment Issue",  badge: "bg-secondary-50 text-secondary border-secondary/20" },
  other:         { label: "Other",          badge: "bg-gray-100 text-gray-500 border-gray-200"          },
};

const tabLabel = { all: "All", OPEN: "Open", UNDER_REVIEW: "Under Review", RESOLVED: "Resolved", CLOSED: "Closed" };

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");
  const [query,    setQuery]    = useState("");

  useEffect(() => {
    disputeApi.getAll()
      .then(({ data }) => {
        const raw = data.disputes || data || [];
        setDisputes(raw.map(d => ({
          id:          d.id,
          buyer:       d.raisedBy?.name   || "Buyer",
          buyerAvatar: d.raisedBy?.avatar || "",
          seller:      d.booking?.vendor?.businessName || "Vendor",
          service:     d.booking?.gig?.title || "Service",
          amount:      d.booking?.totalAmount || 0,
          status:      (d.status || "open").toUpperCase(),
          type:        d.type || "other",
          description: d.description,
          orderId:     d.bookingId,
          buyerId:     d.raisedById,
          createdAt:   new Date(d.createdAt).toLocaleDateString("en-LK"),
        })));
      })
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = disputes.filter(d => {
    const matchTab   = tab === "all" || d.status === tab;
    const matchQuery = !query.trim() ||
      d.buyer.toLowerCase().includes(query.toLowerCase()) ||
      d.seller.toLowerCase().includes(query.toLowerCase()) ||
      d.service.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQuery;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> Disputes
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${disputes.length} total disputes`}
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search buyer, seller, service…"
            className="px-3 py-2.5 text-sm focus:outline-none w-60" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => {
          const count = t === "all" ? disputes.length : disputes.filter(d => d.status === t).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {tabLabel[t]} ({loading ? "…" : count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Scale className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No disputes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const sCfg  = statusCfg[d.status]  || statusCfg.OPEN;
            const tCfg  = typeCfg[d.type]      || { label: d.type, badge: "bg-gray-100 text-gray-500 border-gray-200" };
            const SIcon = sCfg.icon;
            return (
              <div key={d.id} onClick={() => navigate(`/admin/disputes/${d.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${tCfg.badge}`}>{tCfg.label}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${sCfg.badge}`}>
                        <SIcon className="w-3 h-3" />{sCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <img src={d.buyerAvatar || undefined} alt={d.buyer}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        onError={e => { e.target.style.display = "none"; }} />
                      <span className="text-sm font-semibold text-gray-800">{d.buyer}</span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="text-sm text-gray-600 truncate">{d.seller}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{d.service}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-sm font-semibold text-primary">LKR {d.amount.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">{d.createdAt}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
