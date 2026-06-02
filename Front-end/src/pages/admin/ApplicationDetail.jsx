// ApplicationDetail.jsx — connected to real vendor + admin API
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, Phone, CheckCircle, XCircle, Clock,
  AlertCircle, User, Briefcase, FileText, ShieldOff, ShieldCheck, Loader2,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const EXP_LABEL = {
  "0-1": "Less than 1 year", "1-3": "1–3 years", "3-5": "3–5 years",
  "5-10": "5–10 years",       "10+": "10+ years",
};

export default function ApplicationDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [seller,          setSeller]          = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [updating,        setUpdating]        = useState(false);

  // Decision state
  const [decision,        setDecision]        = useState(null);   // "APPROVED" | "REJECTED" | null
  const [confirmed,       setConfirmed]       = useState(false);
  const [rejectNote,      setRejectNote]      = useState("");
  const [showReject,      setShowReject]      = useState(false);

  // Suspend / reinstate
  const [suspended,        setSuspended]       = useState(false);
  const [showSuspend,      setShowSuspend]     = useState(false);
  const [suspendInput,     setSuspendInput]    = useState("");
  const [suspendReason,    setSuspendReason]   = useState("");
  const [confirmReinstate, setConfirmReinstate]= useState(false);

  useEffect(() => {
    adminApi.getSellerById(id)
      .then(({ data }) => {
        const v = data.vendor || data;
        const statusRaw = (v.sellerStatus || "PENDING").toUpperCase();
        setSeller({
          id:            v.id,
          name:          v.name    || "Vendor",
          avatar:        v.avatar  || "",
          email:         v.email   || "",
          businessName:  v.vendorProfile?.businessName || "",
          location:      v.vendorProfile?.location     || v.location || "",
          phone:         v.phone   || "",
          categories:    v.vendorProfile?.category ? [v.vendorProfile.category] : [],
          bio:           v.vendorProfile?.description  || "",
          experience:    "",
          portfolioNote: "",
          rejectionReason: "",
          suspendedReason: "",
          status:        statusRaw,
          appliedAt:     v.createdAt ? new Date(v.createdAt).toLocaleDateString("en-LK") : "—",
        });
        // initialise UI state from existing status
        if (statusRaw === "APPROVED")  { setDecision("APPROVED"); setConfirmed(true); }
        if (statusRaw === "REJECTED")  { setDecision("REJECTED"); setConfirmed(true); }
        if (statusRaw === "SUSPENDED") { setDecision("APPROVED"); setConfirmed(true); setSuspended(true); }
      })
      .catch(() => setError("Application not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    setUpdating(true);
    try {
      await adminApi.approveVendor(id);
      setDecision("APPROVED");
      setConfirmed(true);
      setSeller(prev => prev ? { ...prev, status: "APPROVED" } : prev);
    } catch { /* silent */ } finally { setUpdating(false); }
  }

  async function handleReject() {
    if (!rejectNote.trim()) return;
    setUpdating(true);
    try {
      await adminApi.rejectVendor(id, { reason: rejectNote.trim() });
      setDecision("REJECTED");
      setConfirmed(true);
      setShowReject(false);
    } catch { /* silent */ } finally { setUpdating(false); }
  }

  async function handleSuspendConfirm() {
    if (!suspendInput.trim()) return;
    setUpdating(true);
    try {
      await adminApi.suspendVendor(id, { reason: suspendInput.trim() });
      setSuspended(true);
      setSuspendReason(suspendInput.trim());
      setShowSuspend(false);
      setSuspendInput("");
    } catch { /* silent */ } finally { setUpdating(false); }
  }

  async function handleReinstate() {
    setUpdating(true);
    try {
      await adminApi.reinstateVendor(id);
      setSuspended(false);
      setSuspendReason("");
      setConfirmReinstate(false);
    } catch { /* silent */ } finally { setUpdating(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );

  if (error || !seller) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">{error || "Application not found."}</p>
          <button onClick={() => navigate("/admin/sellers")} className="mt-3 text-sm text-primary hover:underline">
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/sellers")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Seller Application</h1>
          <p className="text-xs text-gray-400">ID: {seller.id} · Applied: {seller.appliedAt}</p>
        </div>
      </div>

      {/* Suspension banner */}
      {suspended && (
        <div className="rounded-2xl p-4 flex items-start gap-3 bg-orange-50 border border-orange-200">
          <ShieldOff className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-700">Vendor Suspended</p>
            {suspendReason && <p className="text-xs text-orange-600 mt-0.5">Reason: {suspendReason}</p>}
          </div>
        </div>
      )}

      {/* Decision banner */}
      {confirmed && !suspended && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${
          decision === "APPROVED" ? "bg-accent-50 border border-accent/20" : "bg-red-50 border border-red-200"
        }`}>
          {decision === "APPROVED"
            ? <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            : <XCircle    className="w-5 h-5 text-red-500 flex-shrink-0" />}
          <div>
            <p className={`text-sm font-semibold ${decision === "APPROVED" ? "text-accent" : "text-red-600"}`}>
              {decision === "APPROVED" ? "Application Approved" : "Application Rejected"}
            </p>
            {decision === "REJECTED" && rejectNote && (
              <p className="text-xs text-red-500 mt-0.5">Reason: {rejectNote}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={seller.avatar || undefined}
                alt={seller.name}
                className="w-16 h-16 rounded-2xl object-cover"
                onError={e => { e.target.style.display = "none"; }}
              />
              <div>
                <h2 className="text-lg font-bold text-gray-800">{seller.name}</h2>
                <p className="text-sm text-primary font-medium">{seller.businessName}</p>
                <p className="text-xs text-gray-400">{seller.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {seller.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {seller.location}
                </div>
              )}
              {seller.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {seller.phone}
                </div>
              )}
              {seller.experience && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {EXP_LABEL[seller.experience] || seller.experience}
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {seller.categories.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Services Applied For
              </h3>
              <div className="flex flex-wrap gap-2">
                {seller.categories.map(c => (
                  <span key={c} className="bg-primary-50 text-primary border border-primary/20 text-sm font-medium px-3 py-1 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {seller.bio && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> About
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{seller.bio}</p>
            </div>
          )}

          {/* Portfolio note */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Portfolio Note
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">{seller.portfolioNote || "Not provided."}</p>
          </div>

          {/* Prior rejection reason */}
          {seller.rejectionReason && decision !== "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Previous Rejection Reason</p>
                  <p className="text-sm text-red-600 mt-1">{seller.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 space-y-4">
            <h3 className="font-semibold text-gray-800">Decision</h3>

            {/* Pending — approve / reject */}
            {!confirmed && (
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={updating}
                  className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve Application
                </button>

                {!showReject ? (
                  <button
                    onClick={() => setShowReject(true)}
                    disabled={updating}
                    className="w-full border border-red-200 text-red-500 font-semibold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      placeholder="Explain the reason for rejection..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowReject(false)}
                        className="flex-1 border border-gray-200 text-gray-600 font-medium py-2 rounded-xl text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={!rejectNote.trim() || updating}
                        className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-xl text-sm hover:bg-red-600 transition-colors disabled:opacity-40"
                      >
                        {updating ? "…" : "Confirm Reject"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* After decision */}
            {confirmed && (
              <div className={`text-center py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                suspended
                  ? "bg-orange-50 text-orange-600"
                  : decision === "APPROVED"
                    ? "bg-accent-50 text-accent"
                    : "bg-red-50 text-red-500"
              }`}>
                {suspended
                  ? <><ShieldOff className="w-4 h-4" /> Vendor Suspended</>
                  : decision === "APPROVED"
                    ? <><CheckCircle className="w-4 h-4" /> Approved</>
                    : <><XCircle className="w-4 h-4" /> Rejected</>}
              </div>
            )}

            {/* Suspend / Reinstate — only for approved vendors */}
            {confirmed && decision === "APPROVED" && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor Controls</p>

                {!suspended ? (
                  <>
                    {!showSuspend ? (
                      <button
                        onClick={() => setShowSuspend(true)}
                        disabled={updating}
                        className="w-full border border-orange-200 text-orange-600 font-semibold py-2.5 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                      >
                        <ShieldOff className="w-4 h-4" />
                        Suspend Vendor
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={suspendInput}
                          onChange={e => setSuspendInput(e.target.value)}
                          placeholder="Reason for suspension…"
                          className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowSuspend(false); setSuspendInput(""); }}
                            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2 rounded-xl text-sm hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSuspendConfirm}
                            disabled={!suspendInput.trim() || updating}
                            className="flex-1 bg-orange-500 text-white font-semibold py-2 rounded-xl text-sm hover:bg-orange-600 transition-colors disabled:opacity-40"
                          >
                            {updating ? "…" : "Confirm"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {suspendReason && (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-orange-700 mb-1">Suspension Reason</p>
                        <p className="text-xs text-orange-600 leading-relaxed">{suspendReason}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setConfirmReinstate(true)}
                      disabled={updating}
                      className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Reinstate Vendor
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                Applied {seller.appliedAt}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReinstate}
        title="Reinstate this vendor?"
        description={`${seller.name} will regain full seller access on the platform.`}
        confirmLabel="Reinstate"
        onConfirm={handleReinstate}
        onCancel={() => setConfirmReinstate(false)}
      />
    </div>
  );
}
