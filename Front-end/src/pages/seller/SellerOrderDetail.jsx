// SellerOrderDetail.jsx — connected to real booking API
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, Clock, XCircle, MessageSquare,
  Calendar, User, Package, DollarSign, Send, Scale,
  AlertTriangle, Loader2, Upload, X, ImageIcon, FileCheck,
} from "lucide-react";
import { bookingApi } from "../../services/bookingApi";
import { uploadApi  } from "../../services/uploadApi";
import { resolveUrl } from "../../utils/uploadUrl";
import UserAvatar from "../../components/common/UserAvatar";

const statusCfg = {
  PENDING:            { label: "Pending",            icon: Clock,       badge: "bg-secondary-50 text-secondary border border-secondary/20"     },
  CONFIRMED:          { label: "Confirmed",           icon: CheckCircle, badge: "bg-accent-50 text-accent border border-accent/20"              },
  IN_PROGRESS:        { label: "In Progress",         icon: Clock,       badge: "bg-blue-50 text-blue-600 border border-blue-200"               },
  PENDING_COMPLETION: { label: "Awaiting Buyer",      icon: FileCheck,   badge: "bg-purple-50 text-purple-600 border border-purple-200"         },
  COMPLETED:          { label: "Completed",           icon: CheckCircle, badge: "bg-primary-50 text-primary border border-primary/20"           },
  CANCELLED:          { label: "Cancelled",           icon: XCircle,     badge: "bg-red-50 text-red-500 border border-red-200"                  },
};

const PROGRESS_STEPS = [
  { key: "PENDING",            label: "Received"           },
  { key: "CONFIRMED",          label: "Accepted"           },
  { key: "IN_PROGRESS",        label: "In Progress"        },
  { key: "PENDING_COMPLETION", label: "Evidence Submitted" },
  { key: "COMPLETED",          label: "Completed"          },
];
const STATUS_ORDER = ["PENDING", "CONFIRMED", "IN_PROGRESS", "PENDING_COMPLETION", "COMPLETED"];

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function SellerOrderDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [status,   setStatus]   = useState("PENDING");
  const [updating, setUpdating] = useState(false);

  // Completion evidence state
  const [completionNote,   setCompletionNote]   = useState("");
  const [completionImages, setCompletionImages] = useState([]);
  const [uploadingImg,     setUploadingImg]     = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [evidenceError,    setEvidenceError]    = useState("");

  // Quote panel (PENDING state only)
  const [quoteAmount,   setQuoteAmount]   = useState("");
  const [quoteDesc,     setQuoteDesc]     = useState("");
  const [quoteIncludes, setQuoteIncludes] = useState("");
  const [quoteDelivery, setQuoteDelivery] = useState("");
  const [quoteSent,     setQuoteSent]     = useState(false);
  const [quoteError,    setQuoteError]    = useState("");

  useEffect(() => {
    bookingApi.getById(id)
      .then(({ data }) => {
        const b = data.booking || data;
        setOrder(b);
        setStatus((b.status || "pending").toUpperCase());
        // Pre-fill evidence if already submitted
        if (b.completionNote)   setCompletionNote(b.completionNote);
        if (b.completionImages) setCompletionImages(b.completionImages);
      })
      .catch(() => setError("Order not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(newStatus) {
    setUpdating(true);
    try {
      await bookingApi.updateStatus(id, newStatus);
      setStatus(newStatus.toUpperCase());
      setOrder(o => o ? { ...o, status: newStatus } : o);
    } catch { /* silent */ } finally {
      setUpdating(false);
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImg(true);
    setEvidenceError("");
    try {
      const results = await Promise.all(files.map(f => uploadApi.uploadImage(f)));
      const urls = results.map(r => r.data?.url || r.data?.path || "").filter(Boolean);
      setCompletionImages(prev => [...prev, ...urls]);
    } catch {
      setEvidenceError("Failed to upload one or more images. Please try again.");
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(idx) {
    setCompletionImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmitEvidence() {
    if (!completionNote.trim()) {
      setEvidenceError("Please add a completion note describing what was delivered.");
      return;
    }
    setSubmitting(true);
    setEvidenceError("");
    try {
      await bookingApi.submitCompletion(id, {
        completionNote,
        completionImages,
      });
      setStatus("PENDING_COMPLETION");
      setOrder(o => o ? { ...o, status: "pending_completion", completionNote, completionImages, completionSubmittedAt: new Date().toISOString() } : o);
    } catch (err) {
      setEvidenceError(err.response?.data?.message || "Failed to submit evidence. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">{error || "Order not found"}</p>
          <button onClick={() => navigate("/seller/orders")} className="mt-3 text-sm text-primary hover:underline">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const cfg        = statusCfg[status] || statusCfg.PENDING;
  const Icon       = cfg.icon;
  const hasDispute = order.disputes?.length > 0;
  const buyer      = order.buyer || {};
  const gig        = order.gig   || {};

  // Days remaining until auto-complete (for PENDING_COMPLETION)
  const daysRemaining = (() => {
    if (status !== "PENDING_COMPLETION" || !order.completionSubmittedAt) return 14;
    const elapsed = (Date.now() - new Date(order.completionSubmittedAt).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(14 - elapsed));
  })();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Dispute banner */}
      {hasDispute && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Scale className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Dispute Raised by Buyer</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The buyer has opened a dispute for this order. Our admin team is reviewing the case.
              Please check your messages and respond promptly.
            </p>
          </div>
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        </div>
      )}

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/seller/orders")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-800 font-mono">{id.slice(0, 8).toUpperCase()}</h1>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.badge}`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Received {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-LK") : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* ── Left — order info ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Buyer card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Buyer</h2>
            <div className="flex items-center gap-3">
              <UserAvatar src={buyer.avatar} name={buyer.name || "Buyer"} size={48} />
              <div>
                <p className="font-semibold text-gray-800">{buyer.name || "Buyer"}</p>
                <button
                  onClick={() => navigate("/seller/messages")}
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                >
                  <MessageSquare className="w-3 h-3" /> Send message
                </button>
              </div>
            </div>
          </div>

          {/* Order details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-2">Order Details</h2>
            <InfoRow icon={Package}    label="Service"      value={gig.title || "—"} />
            <InfoRow icon={Package}    label="Package"      value={`${order.packageType || "Basic"} Package`} />
            <InfoRow icon={Calendar}   label="Event Date"   value={order.eventDate ? new Date(order.eventDate).toLocaleDateString("en-LK") : "—"} />
            <InfoRow icon={DollarSign} label="Order Amount" value={`LKR ${(order.totalAmount || 0).toLocaleString()}`} />
            {order.notes && (
              <InfoRow icon={User} label="Buyer Notes" value={order.notes} />
            )}
          </div>

          {/* ── PENDING: Custom Quote ── */}
          {status === "PENDING" && !quoteSent && (
            <div className="bg-white rounded-2xl border border-primary/20 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-gray-800">Send Custom Quote</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Quote Price (LKR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">LKR</span>
                    <input
                      type="number"
                      value={quoteAmount}
                      onChange={e => { setQuoteAmount(e.target.value); setQuoteError(""); }}
                      placeholder="e.g. 35000"
                      className={`w-full border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${quoteError ? "border-red-400" : "border-gray-200"}`}
                    />
                  </div>
                  {quoteError && <p className="text-xs text-red-500 mt-1">{quoteError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Offer Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={quoteDesc}
                    onChange={e => { setQuoteDesc(e.target.value); setQuoteError(""); }}
                    placeholder="Describe exactly what you will deliver for this price…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">What&apos;s Included</label>
                  <textarea
                    rows={2}
                    value={quoteIncludes}
                    onChange={e => setQuoteIncludes(e.target.value)}
                    placeholder="e.g. 8 hours coverage · 300 edited photos · Online gallery"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Time</label>
                  <select
                    value={quoteDelivery}
                    onChange={e => setQuoteDelivery(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select delivery time…</option>
                    <option>Same day</option>
                    <option>1–3 days</option>
                    <option>3–5 days</option>
                    <option>5–7 days</option>
                    <option>1–2 weeks</option>
                    <option>2–4 weeks</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (!quoteAmount)      { setQuoteError("Please enter a quote price"); return; }
                    if (!quoteDesc.trim()) { setQuoteError("Please describe your offer"); return; }
                    setQuoteSent(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  Send Quote to Buyer
                </button>
              </div>
            </div>
          )}

          {quoteSent && (
            <div className="bg-accent-50 border border-accent/20 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <p className="text-sm font-semibold text-accent">Quote Sent — Awaiting Buyer Confirmation</p>
              </div>
              <div className="bg-white rounded-xl border border-accent/10 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="font-bold text-primary">LKR {Number(quoteAmount).toLocaleString()}</span>
                </div>
                {quoteDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery</span>
                    <span className="font-medium text-gray-700">{quoteDelivery}</span>
                  </div>
                )}
                {quoteDesc && (
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{quoteDesc}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── IN_PROGRESS: Submit Completion Evidence ── */}
          {status === "IN_PROGRESS" && (
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-purple-500" />
                <h2 className="font-semibold text-gray-800">Submit Completion Evidence</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Once you&apos;re done, upload photos and add a note describing what was delivered.
                The buyer will receive a notification to review and confirm.
              </p>

              {/* Note */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Completion Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={e => { setCompletionNote(e.target.value); setEvidenceError(""); }}
                  placeholder="Describe what was delivered — e.g. '8-hour wedding coverage complete, 400 photos delivered via gallery link, 2 highlight reels sent via email.'"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
              </div>

              {/* Image upload */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Evidence Photos <span className="text-gray-400">(optional)</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-purple-200 rounded-xl p-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  {uploadingImg ? (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="text-xs text-gray-500">
                    {uploadingImg ? "Uploading…" : "Click to upload photos"}
                  </span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* Image preview grid */}
                {completionImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                    {completionImages.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={resolveUrl(url)}
                          alt={`Evidence ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {evidenceError && (
                <p className="text-xs text-red-500 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {evidenceError}
                </p>
              )}

              <button
                onClick={handleSubmitEvidence}
                disabled={submitting || uploadingImg}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-60 transition-colors text-sm"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><FileCheck className="w-4 h-4" /> Submit Evidence to Buyer</>
                }
              </button>
            </div>
          )}

          {/* ── PENDING_COMPLETION: Evidence sent, awaiting buyer ── */}
          {status === "PENDING_COMPLETION" && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-800">Evidence Submitted</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    Waiting for buyer confirmation · auto-completes in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Submitted note */}
              {order.completionNote && (
                <div className="bg-white rounded-xl border border-purple-100 p-4 mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Your Note</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{order.completionNote}</p>
                </div>
              )}

              {/* Submitted images */}
              {completionImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {completionImages.map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-purple-100">
                      <img
                        src={resolveUrl(url)}
                        alt={`Evidence ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right — actions ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Actions</h2>

            {/* Step 1 — Pending */}
            {status === "PENDING" && (
              <>
                <button
                  onClick={() => changeStatus("confirmed")}
                  disabled={updating}
                  className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl hover:bg-accent/90 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Accept Order
                </button>
                <button
                  onClick={() => changeStatus("cancelled")}
                  disabled={updating}
                  className="w-full border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Decline Order
                </button>
              </>
            )}

            {/* Step 2 — Confirmed */}
            {status === "CONFIRMED" && (
              <button
                onClick={() => changeStatus("in_progress")}
                disabled={updating}
                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Start Working
              </button>
            )}

            {/* Step 3 — In Progress: prompt to scroll to evidence form */}
            {status === "IN_PROGRESS" && (
              <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-center leading-relaxed">
                Fill in the <span className="font-semibold text-blue-600">Completion Evidence</span> form on the left when the work is done.
              </div>
            )}

            {/* Step 4 — Pending completion */}
            {status === "PENDING_COMPLETION" && (
              <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 text-center leading-relaxed">
                Evidence sent to buyer. Auto-completes in{" "}
                <span className="font-semibold">{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</span>{" "}
                if buyer doesn&apos;t respond.
              </div>
            )}

            {(status === "COMPLETED" || status === "CANCELLED") && (
              <p className="text-xs text-gray-400 text-center py-2">
                {status === "COMPLETED" ? "✓ Order completed." : "✗ Order cancelled."}
              </p>
            )}

            <button
              onClick={() => navigate("/seller/messages")}
              className="w-full border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Message Buyer
            </button>
          </div>

          {/* Order progress tracker */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 text-sm mb-4">Order Progress</h2>
            {PROGRESS_STEPS.map((step, i) => {
              const currentIdx = STATUS_ORDER.indexOf(status);
              const stepIdx    = STATUS_ORDER.indexOf(step.key);
              const done       = stepIdx <= currentIdx && status !== "CANCELLED";
              const isCurrent  = stepIdx === currentIdx && status !== "CANCELLED";
              return (
                <div key={step.key} className="flex items-center gap-2 mb-3 last:mb-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-xs font-bold transition-all ${
                    done ? "bg-primary border-primary text-white" : "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm font-medium ${isCurrent ? "text-primary" : done ? "text-gray-700" : "text-gray-400"}`}>
                    {step.label}
                    {isCurrent && (
                      <span className="ml-1.5 text-xs bg-primary-50 text-primary px-1.5 py-0.5 rounded-full">Now</span>
                    )}
                  </span>
                </div>
              );
            })}
            {status === "CANCELLED" && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Order was cancelled
              </p>
            )}
          </div>

          {/* Amount card */}
          <div className="bg-primary text-white rounded-2xl p-5">
            <p className="text-xs font-medium opacity-70 mb-1">Order Value</p>
            <p className="text-2xl font-bold">LKR {(order.totalAmount || 0).toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-1">
              {status === "COMPLETED" ? "Released to your account" : "Held in escrow"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
