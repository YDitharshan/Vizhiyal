// AdminDisputeDetail.jsx — connected to real dispute API
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Scale, CheckCircle, XCircle, Clock,
  User, AlertCircle, MessageSquare, Loader2,
} from "lucide-react";
import { disputeApi } from "../../services/disputeApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const statusCfg = {
  OPEN:         { label: "Open",         banner: "bg-blue-50 border-blue-200 text-blue-700",    icon: AlertCircle },
  UNDER_REVIEW: { label: "Under Review", banner: "bg-amber-50 border-amber-200 text-amber-700", icon: Clock       },
  RESOLVED:     { label: "Resolved",     banner: "bg-accent-50 border-accent/30 text-accent",   icon: CheckCircle },
  CLOSED:       { label: "Closed",       banner: "bg-gray-100 border-gray-200 text-gray-500",   icon: XCircle     },
};

const typeCfg = {
  no_show:       { label: "No Show",        badge: "bg-red-50 text-red-500 border-red-200"              },
  poor_quality:  { label: "Poor Quality",   badge: "bg-orange-50 text-orange-500 border-orange-200"     },
  wrong_service: { label: "Wrong Service",  badge: "bg-purple-50 text-purple-600 border-purple-200"     },
  payment_issue: { label: "Payment Issue",  badge: "bg-secondary-50 text-secondary border-secondary/20" },
  other:         { label: "Other",          badge: "bg-gray-100 text-gray-500 border-gray-200"          },
};

export default function AdminDisputeDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [dispute,        setDispute]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [localStatus,    setLocalStatus]    = useState("OPEN");
  const [resolutionNote, setResolutionNote] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [confirmClose,   setConfirmClose]   = useState(false);
  const [updating,       setUpdating]       = useState(false);

  useEffect(() => {
    disputeApi.getById(id)
      .then(({ data }) => {
        const d = data.dispute || data;
        setDispute({
          id:          d.id,
          buyer:       d.raisedBy?.name   || "Buyer",
          buyerAvatar: d.raisedBy?.avatar || "",
          buyerId:     d.raisedById,
          seller:      d.booking?.vendor?.businessName || "Vendor",
          service:     d.booking?.gig?.title || "Service",
          amount:      d.booking?.totalAmount || 0,
          orderId:     d.bookingId,
          status:      (d.status || "open").toUpperCase(),
          type:        d.type || "other",
          description: d.description,
          resolution:  d.resolution || "",
          adminNote:   d.adminNote  || "",
          createdAt:   new Date(d.createdAt).toLocaleDateString("en-LK"),
        });
        setLocalStatus((d.status || "open").toUpperCase());
        setResolutionNote(d.resolution || "");
      })
      .catch(() => setError("Dispute not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(newStatus, extra = {}) {
    setUpdating(true);
    try {
      // Backend expects lowercase status
      await disputeApi.updateStatus(id, { status: newStatus.toLowerCase(), ...extra });
      setLocalStatus(newStatus.toUpperCase());
    } catch { /* silent */ } finally { setUpdating(false); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>;

  if (error || !dispute) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Scale className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error || "Dispute not found."}</p>
          <button onClick={() => navigate("/admin/disputes")} className="mt-3 text-sm text-primary hover:underline">Back to Disputes</button>
        </div>
      </div>
    );
  }

  const sCfg  = statusCfg[localStatus]  || statusCfg.OPEN;
  const tCfg  = typeCfg[dispute.type]   || { label: dispute.type?.replace(/_/g, " "), badge: "bg-gray-100 text-gray-500 border-gray-200" };
  const SIcon = sCfg.icon;
  const isActionable = localStatus === "OPEN" || localStatus === "UNDER_REVIEW";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/disputes")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> Dispute
            </h1>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${tCfg.badge}`}>{tCfg.label}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Opened on {dispute.createdAt}</p>
        </div>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${sCfg.banner}`}>
        <SIcon className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">Status: {sCfg.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Dispute Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Type</p>
                <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${tCfg.badge}`}>{tCfg.label}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{dispute.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Opened</p>
                <p className="text-sm font-medium text-gray-700">{dispute.createdAt}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Buyer
            </h2>
            <div className="flex items-center gap-3">
              <img src={dispute.buyerAvatar || undefined} alt={dispute.buyer}
                className="w-11 h-11 rounded-full object-cover"
                onError={e => { e.target.style.display = "none"; }} />
              <div>
                <p className="font-semibold text-gray-800">{dispute.buyer}</p>
                <button onClick={() => navigate(`/admin/users/${dispute.buyerId}`)}
                  className="text-xs text-primary hover:underline mt-0.5">View profile</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" /> Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Order ID</span>
                <button onClick={() => navigate(`/admin/orders/${dispute.orderId}`)}
                  className="font-semibold text-primary hover:underline font-mono">
                  {dispute.orderId?.slice(0, 8).toUpperCase()}
                </button>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Seller</span>
                <span className="font-medium text-gray-700">{dispute.seller}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service</span>
                <span className="font-medium text-gray-700 text-right max-w-[60%]">{dispute.service}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-400">Amount in Dispute</span>
                <span className="font-bold text-primary text-base">LKR {dispute.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Resolution Panel</h2>
            {isActionable ? (
              <>
                <textarea value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                  rows={4} placeholder="Write resolution note (required to resolve)…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <div className="space-y-2">
                  {localStatus === "OPEN" && (
                    <button onClick={() => changeStatus("UNDER_REVIEW")} disabled={updating}
                      className="w-full bg-amber-500 text-white font-semibold py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2">
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Mark Under Review
                    </button>
                  )}
                  <button
                    onClick={() => { if (!resolutionNote.trim()) return; setConfirmResolve(true); }}
                    disabled={!resolutionNote.trim() || updating}
                    className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Resolve Dispute
                  </button>
                  <button onClick={() => setConfirmClose(true)} disabled={updating}
                    className="w-full border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Close Dispute
                  </button>
                </div>
                {!resolutionNote.trim() && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />A resolution note is required to resolve.
                  </p>
                )}
              </>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-2">Resolution Note</p>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed">
                  {resolutionNote || <span className="italic text-gray-400">No resolution note.</span>}
                </div>
                <div className={`mt-3 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border ${sCfg.banner}`}>
                  <SIcon className="w-4 h-4" />{sCfg.label}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResolve}
        title="Resolve this dispute?"
        description="This will mark the dispute as resolved and notify both parties."
        confirmLabel="Resolve"
        onConfirm={() => { changeStatus("RESOLVED", { resolution: resolutionNote }); setConfirmResolve(false); }}
        onCancel={() => setConfirmResolve(false)}
      />
      <ConfirmDialog
        open={confirmClose}
        title="Close this dispute?"
        description="Closing marks it as closed without a formal resolution. Both parties will be notified."
        confirmLabel="Close Dispute"
        onConfirm={() => { changeStatus("CLOSED"); setConfirmClose(false); }}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}
