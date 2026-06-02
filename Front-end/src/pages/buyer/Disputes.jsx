// Disputes.jsx — Buyer's dispute history page
// Lists all disputes the buyer has raised with status chips and links to the related order.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale, AlertCircle, Clock, CheckCircle, XCircle,
  ChevronRight, Loader2, Plus,
} from "lucide-react";
import { disputeApi } from "../../services/disputeApi";

// ── Config ────────────────────────────────────────────────────────────────────
const statusCfg = {
  open:         { label: "Open",         badge: "bg-blue-50 text-blue-600 border-blue-200",    icon: AlertCircle },
  under_review: { label: "Under Review", badge: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock       },
  resolved:     { label: "Resolved",     badge: "bg-green-50 text-green-600 border-green-200", icon: CheckCircle },
  closed:       { label: "Closed",       badge: "bg-gray-100 text-gray-500 border-gray-200",   icon: XCircle     },
};

const typeCfg = {
  no_show:       { label: "No Show",       badge: "bg-red-50 text-red-500 border-red-200"              },
  poor_quality:  { label: "Poor Quality",  badge: "bg-orange-50 text-orange-500 border-orange-200"     },
  wrong_service: { label: "Wrong Service", badge: "bg-purple-50 text-purple-600 border-purple-200"     },
  payment_issue: { label: "Payment Issue", badge: "bg-blue-50 text-blue-500 border-blue-200"           },
  other:         { label: "Other",         badge: "bg-gray-100 text-gray-500 border-gray-200"          },
};

const TABS = ["all", "open", "under_review", "resolved", "closed"];
const TAB_LABELS = {
  all:          "All",
  open:         "Open",
  under_review: "Under Review",
  resolved:     "Resolved",
  closed:       "Closed",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Disputes() {
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");

  useEffect(() => {
    disputeApi.getMy()
      .then(({ data }) => setDisputes(data.disputes ?? []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all"
    ? disputes
    : disputes.filter(d => d.status === tab);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> My Disputes
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${disputes.length} dispute${disputes.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Raise from an Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => {
          const count = t === "all"
            ? disputes.length
            : disputes.filter(d => d.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {TAB_LABELS[t]} ({loading ? "…" : count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Scale className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {tab === "all" ? "No disputes yet" : `No ${TAB_LABELS[tab].toLowerCase()} disputes`}
          </p>
          {tab === "all" && (
            <p className="text-sm text-gray-400 mt-1">
              You can raise a dispute from any confirmed or completed order.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const sCfg = statusCfg[d.status] ?? statusCfg.open;
            const tCfg = typeCfg[d.type]     ?? { label: d.type?.replace(/_/g, " "), badge: "bg-gray-100 text-gray-500 border-gray-200" };
            const StatusIcon = sCfg.icon;
            const gigTitle   = d.booking?.gig?.title ?? "Service";
            const amount     = d.booking?.totalAmount ?? 0;

            return (
              <div
                key={d.id}
                onClick={() => navigate(`/orders/${d.bookingId}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${tCfg.badge}`}>
                        {tCfg.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${sCfg.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sCfg.label}
                      </span>
                    </div>

                    {/* Service */}
                    <p className="text-sm font-semibold text-gray-800 truncate">{gigTitle}</p>

                    {/* Description preview */}
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{d.description}</p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="text-sm font-semibold text-primary">
                        LKR {amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        Filed {new Date(d.createdAt).toLocaleDateString("en-LK")}
                      </span>
                    </div>

                    {/* Resolution note (if resolved/closed) */}
                    {(d.status === "resolved" || d.status === "closed") && d.resolution && (
                      <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-600 border border-gray-100">
                        <span className="font-semibold text-gray-700">Resolution: </span>
                        {d.resolution}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
