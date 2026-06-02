// SellerApplications.jsx — connected to real vendor API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, ChevronRight, UserCheck, ShieldOff, Loader2 } from "lucide-react";
import { adminApi } from "../../services/adminApi";

const TABS = ["all", "PENDING", "APPROVED", "SUSPENDED", "REJECTED"];

const statusCfg = {
  PENDING:   { label: "Pending",   badge: "bg-secondary-50 text-secondary border border-secondary/20", icon: Clock       },
  APPROVED:  { label: "Approved",  badge: "bg-accent-50 text-accent border border-accent/20",          icon: CheckCircle },
  SUSPENDED: { label: "Suspended", badge: "bg-orange-50 text-orange-500 border border-orange-200",     icon: ShieldOff   },
  REJECTED:  { label: "Rejected",  badge: "bg-red-50 text-red-500 border border-red-200",              icon: XCircle     },
};

const tabLabel = {
  all: "All", PENDING: "Pending", APPROVED: "Approved", SUSPENDED: "Suspended", REJECTED: "Rejected",
};

export default function SellerApplications() {
  const navigate = useNavigate();
  const [sellers,  setSellers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");

  useEffect(() => {
    adminApi.listSellerApplications()
      .then(({ data }) => {
        const raw = data.vendors || [];
        setSellers(raw.map(v => ({
          id:           v.id,
          name:         v.name  || "Seller",
          avatar:       v.avatar || "",
          businessName: v.vendorProfile?.businessName || "",
          categories:   v.vendorProfile?.category ? [v.vendorProfile.category] : [],
          location:     v.vendorProfile?.location  || "",
          status:       (v.sellerStatus || "PENDING").toUpperCase(),
          appliedAt:    v.createdAt ? new Date(v.createdAt).toLocaleDateString("en-LK") : "—",
        })));
      })
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? sellers : sellers.filter(s => s.status === tab);
  const pendingCount = sellers.filter(s => s.status === "PENDING").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Seller Applications</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {loading ? "Loading…" : `${pendingCount} pending review`}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(t => {
          const count = t === "all" ? sellers.length : sellers.filter(s => s.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tabLabel[t]} ({loading ? "…" : count})
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
          <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No applications in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(seller => {
            const cfg  = statusCfg[seller.status] || statusCfg.PENDING;
            const Icon = cfg.icon;
            return (
              <div
                key={seller.id}
                onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <img
                  src={seller.avatar || undefined}
                  alt={seller.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{seller.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.badge}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{seller.businessName}</p>
                  {seller.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {seller.categories.map(c => (
                        <span key={c} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{seller.appliedAt}</p>
                  {seller.location && <p className="text-xs text-gray-400">{seller.location}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
