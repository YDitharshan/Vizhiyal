// OrderDetail — dedicated order details page
// All necessary information in one place — no redirect to vendor profile.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, CheckCircle, Clock, XCircle,
  MapPin, ShieldCheck, Star, CalendarDays,
  MessageSquare, ReceiptText, Users,
  Package, AlertCircle, Printer, Download,
  Scale, Headphones, Loader2, RefreshCw,
  FileCheck, ImageIcon,
} from "lucide-react";
import StarRating from "../../components/common/StarRating";
import UserAvatar from "../../components/common/UserAvatar";
import { bookingApi } from "../../services/bookingApi";
import { reviewApi  } from "../../services/reviewApi";
import { disputeApi } from "../../services/disputeApi";
import { resolveUrl } from "../../utils/uploadUrl";

// ── Status config ─────────────────────────────────────────────────────────────

const statusConfig = {
  confirmed:          { badge: "bg-accent-50 text-accent border border-accent/20",                icon: CheckCircle, label: "Confirmed",          barColor: "bg-accent"     },
  pending:            { badge: "bg-secondary-50 text-secondary border border-secondary/20",       icon: Clock,       label: "Pending",            barColor: "bg-secondary"  },
  in_progress:        { badge: "bg-blue-50 text-blue-600 border border-blue-200",                 icon: Clock,       label: "In Progress",        barColor: "bg-blue-400"   },
  pending_completion: { badge: "bg-purple-50 text-purple-600 border border-purple-200",           icon: FileCheck,   label: "Review Required",    barColor: "bg-purple-400" },
  completed:          { badge: "bg-gray-100 text-gray-500 border border-gray-200",                icon: CheckCircle, label: "Completed",          barColor: "bg-gray-400"   },
  cancelled:          { badge: "bg-red-50 text-red-500 border border-red-100",                    icon: XCircle,     label: "Cancelled",          barColor: "bg-red-400"    },
};

// ── Order Timeline ────────────────────────────────────────────────────────────

const TIMELINE = [
  { key: "sent",               label: "Request Sent",         desc: "Your booking request was submitted."                                    },
  { key: "review",             label: "Under Review",         desc: "Vendor is reviewing your requirements."                                 },
  { key: "confirmed",          label: "Confirmed",            desc: "Vendor accepted and confirmed your order."                              },
  { key: "in_progress",        label: "In Progress",          desc: "Vendor is actively preparing for your event."                          },
  { key: "pending_completion", label: "Evidence Submitted",   desc: "Vendor has submitted completion evidence — please review and confirm."  },
  { key: "completed",          label: "Event Completed",      desc: "Service delivered successfully."                                        },
];

// Map order status → how far along the timeline is
const timelineProgress = {
  pending:            { activeIdx: 1, cancelled: false },
  confirmed:          { activeIdx: 2, cancelled: false },
  in_progress:        { activeIdx: 3, cancelled: false },
  pending_completion: { activeIdx: 4, cancelled: false },
  completed:          { activeIdx: 5, cancelled: false },
  cancelled:          { activeIdx: 1, cancelled: true  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Extract package name from service string e.g. "Photography – Standard Package" → "Standard"
function parsePackageName(service = "") {
  const match = service.match(/[–\-]\s*(.+?)\s+Package/i);
  return match ? match[1] : null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");

  // Completion acceptance state
  const [acceptingCompletion, setAcceptingCompletion] = useState(false);
  const [completionAccepted,  setCompletionAccepted]  = useState(false);
  const [completionError,     setCompletionError]     = useState("");

  // Review state
  const [showReview,    setShowReview]    = useState(false);
  const [reviewRating,  setReviewRating]  = useState(0);
  const [hoverRating,   setHoverRating]   = useState(0);
  const [reviewText,    setReviewText]    = useState("");
  const [reviewDone,    setReviewDone]    = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError,   setReviewError]   = useState("");

  // Dispute state
  const [showDispute,    setShowDispute]    = useState(false);
  const [disputeType,    setDisputeType]    = useState("poor_quality");
  const [disputeDesc,    setDisputeDesc]    = useState("");
  const [disputeDone,    setDisputeDone]    = useState(false);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError,   setDisputeError]   = useState("");

  const fetchOrder = (quiet = false) => {
    if (!quiet) setLoading(true);
    else        setRefreshing(true);
    bookingApi.getById(id)
      .then(({ data }) => setOrder(data.booking))
      .catch(() => setError("Order not found"))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchOrder(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Loading order…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-gray-500 gap-3">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <p className="font-semibold text-gray-700">Order not found</p>
        <button onClick={() => navigate("/orders")} className="text-sm text-primary hover:underline">
          Back to Orders
        </button>
      </div>
    );
  }

  // Map API fields to display fields
  const vendor     = order.gig?.vendor ?? null;
  const cfg        = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const timeline   = timelineProgress[order.status] || timelineProgress.pending;

  // Derive package details from gig fields (basic / standard / premium)
  const pkgKey = (order.packageType || "basic").toLowerCase();
  const pkg = order.gig ? {
    description: order.gig[`${pkgKey}Description`] || "",
    features:    Array.isArray(order.gig[`${pkgKey}Features`]) ? order.gig[`${pkgKey}Features`] : [],
  } : null;

  const handleSubmitDispute = async () => {
    if (disputeDesc.trim().length < 20) {
      setDisputeError("Please describe the issue in at least 20 characters.");
      return;
    }
    setDisputeLoading(true);
    setDisputeError("");
    try {
      await disputeApi.create({ bookingId: order.id, type: disputeType, description: disputeDesc });
      setDisputeDone(true);
      setShowDispute(false);
      setDisputeDesc("");
    } catch (err) {
      setDisputeError(err.response?.data?.message || "Failed to submit dispute. Please try again.");
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) return;
    setReviewLoading(true);
    setReviewError("");
    try {
      await reviewApi.create({ bookingId: order.id, rating: reviewRating, comment: reviewText });
      setReviewDone(true);
      setShowReview(false);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAcceptCompletion = async () => {
    setAcceptingCompletion(true);
    setCompletionError("");
    try {
      await bookingApi.confirmCompletion(order.id);
      setCompletionAccepted(true);
      setOrder(o => o ? { ...o, status: "completed" } : o);
    } catch (err) {
      setCompletionError(err.response?.data?.message || "Failed to confirm. Please try again.");
    } finally {
      setAcceptingCompletion(false);
    }
  };

  // Pricing
  const subtotal   = order.totalAmount;
  const serviceFee = Math.round(subtotal * 0.05);
  const total      = subtotal + serviceFee;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            title="Refresh order status"
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className={`h-1.5 w-full ${cfg.barColor}`} />
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-800">Order #{order.id}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Event date: <span className="font-medium text-gray-600 ml-0.5">{new Date(order.eventDate).toLocaleDateString("en-LK")}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
            <p className="text-2xl font-bold text-primary">LKR {total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* ════════════════════════════════════════════════════════════
            LEFT — Main details
        ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">
              Order Progress
            </h2>
            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />

              <div className="space-y-0">
                {TIMELINE.map((step, i) => {
                  const isDone      = i <= timeline.activeIdx;
                  const isCurrent   = i === timeline.activeIdx;
                  const isCancelled = timeline.cancelled && i === timeline.activeIdx;

                  return (
                    <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* Circle */}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        isCancelled
                          ? "bg-red-50 border-red-300"
                          : isDone
                            ? "bg-primary border-primary"
                            : "bg-white border-gray-200"
                      }`}>
                        {isCancelled ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : isDone ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="pt-1">
                        <p className={`text-sm font-semibold ${
                          isCancelled ? "text-red-500"
                            : isDone  ? "text-gray-800"
                            : "text-gray-400"
                        }`}>
                          {isCancelled ? "Order Cancelled" : step.label}
                          {isCurrent && !isCancelled && (
                            <span className="ml-2 text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-medium">
                              Current
                            </span>
                          )}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDone ? "text-gray-400" : "text-gray-300"}`}>
                          {isCancelled ? "This order was cancelled." : step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Evidence Review Panel (pending_completion) ── */}
          {(order.status === "pending_completion" && !completionAccepted) && (() => {
            const submittedAt    = order.completionSubmittedAt ? new Date(order.completionSubmittedAt) : null;
            const daysElapsed    = submittedAt ? (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
            const daysRemaining  = Math.max(0, Math.ceil(14 - daysElapsed));
            const images         = Array.isArray(order.completionImages) ? order.completionImages : [];
            return (
              <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm overflow-hidden">
                {/* Header bar */}
                <div className="bg-purple-600 px-5 py-3 flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-white flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Vendor Submitted Completion Evidence</p>
                    <p className="text-xs text-purple-200 mt-0.5">
                      Please review and confirm — auto-completes in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Vendor note */}
                  {order.completionNote && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Vendor&apos;s Completion Note
                      </p>
                      <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                        <p className="text-sm text-gray-700 leading-relaxed">{order.completionNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Evidence photos */}
                  {images.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> Evidence Photos ({images.length})
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {images.map((url, i) => (
                          <a
                            key={i}
                            href={resolveUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-lg overflow-hidden border border-gray-200 block hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={resolveUrl(url)}
                              alt={`Evidence ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {!order.completionNote && images.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No evidence photos or note were provided.
                    </p>
                  )}

                  {completionError && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {completionError}
                    </p>
                  )}

                  {/* Accept button */}
                  <button
                    onClick={handleAcceptCompletion}
                    disabled={acceptingCompletion}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-60 transition-colors text-sm"
                  >
                    {acceptingCompletion
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
                      : <><CheckCircle className="w-4 h-4" /> Accept &amp; Mark as Completed</>
                    }
                  </button>
                  <p className="text-xs text-center text-gray-400">
                    If the service wasn&apos;t delivered properly, raise a dispute instead.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Confirmed completion banner */}
          {(completionAccepted || (order.status === "completed" && order.completionNote)) && (
            <div className="flex items-center gap-3 bg-accent-50 border border-accent/20 rounded-2xl px-5 py-4">
              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-accent">Order Completed</p>
                <p className="text-xs text-gray-500 mt-0.5">You confirmed the vendor&apos;s completion evidence.</p>
              </div>
            </div>
          )}

          {/* Vendor Information */}
          {vendor && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Vendor Details
              </h2>
              <div className="flex items-start gap-4">
                <UserAvatar src={vendor?.user?.avatar || null} name={vendor?.businessName || "Vendor"} size={64} className="rounded-xl border border-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-gray-800">{vendor?.businessName || "Vendor"}</p>
                    {vendor?.isVerified && (
                      <span className="flex items-center gap-1 text-xs text-accent bg-accent-50 px-2 py-0.5 rounded-full font-medium">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  {vendor?.category && (
                    <p className="text-sm text-gray-500 mb-1">{vendor.category}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-secondary" />
                      {(vendor?.avgRating || 0).toFixed(1)} ({vendor?.totalReviews || 0} reviews)
                    </span>
                    {vendor?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {vendor.location}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <StarRating rating={vendor?.avgRating || 0} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service / Package Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Service Details
            </h2>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ReceiptText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{order.gig?.title} – {order.packageType} package</p>
                {pkg && <p className="text-sm text-gray-500 mt-0.5">{pkg.description}</p>}
              </div>
            </div>

            {/* Package features */}
            {pkg?.features?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  What's included
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pkg.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Event Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={CalendarDays} label="Event Date"    value={new Date(order.eventDate).toLocaleDateString("en-LK")} />
              <InfoRow icon={Package}      label="Order ID"       value={`#${order.id}`} />
              <InfoRow icon={Clock}        label="Package"        value={order.packageType ? order.packageType.charAt(0).toUpperCase() + order.packageType.slice(1) : "—"} />
              <InfoRow icon={Users}        label="Vendor"         value={vendor?.businessName || "—"} />
              {order.notes && (
                <InfoRow icon={ReceiptText} label="Notes" value={order.notes} />
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT — Pricing + Actions (sticky)
        ════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Pricing breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Payment Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Service charge</span>
                <span className="font-medium">LKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform fee (5%)</span>
                <span>LKR {serviceFee.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex justify-between font-bold text-gray-800">
                <span>Total Paid</span>
                <span className="text-primary">LKR {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment status pill */}
            <div className={`mt-4 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl ${
              order.status === "cancelled"
                ? "bg-red-50 text-red-500"
                : order.status === "completed"
                  ? "bg-accent-50 text-accent"
                  : order.status === "pending_completion"
                    ? "bg-purple-50 text-purple-600"
                    : "bg-secondary-50 text-secondary"
            }`}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {order.status === "cancelled"
                ? "Payment refunded / not charged"
                : order.status === "completed"
                  ? "Payment released to vendor"
                  : order.status === "pending_completion"
                    ? "Awaiting your confirmation to release payment"
                    : "Payment held in escrow — safe"}
            </div>

            {/* Action buttons */}
            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => navigate("/messages", { state: { vendorUserId: vendor?.userId } })}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Message Vendor
              </button>

              {/* Leave a Review — completed orders without an existing review */}
              {order.status === "completed" && !reviewDone && !order.review && (
                <button
                  onClick={() => setShowReview(v => !v)}
                  className="w-full flex items-center justify-center gap-2 border border-secondary text-secondary text-sm font-semibold py-2.5 rounded-xl hover:bg-secondary-50 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  {showReview ? "Cancel Review" : "Leave a Review"}
                </button>
              )}
              {(reviewDone || !!order.review) && (
                <div className="flex items-center gap-2 bg-secondary-50 text-secondary text-xs font-semibold px-3 py-2.5 rounded-xl justify-center">
                  <Star className="w-3.5 h-3.5 fill-secondary" />
                  {order.review
                    ? `You rated ${order.review.rating} ★`
                    : "Review submitted!"}
                </div>
              )}

              {/* Raise a Dispute */}
              {(order.status === "confirmed" || order.status === "in_progress" || order.status === "pending_completion" || order.status === "completed") && !disputeDone && (
                <button
                  onClick={() => setShowDispute(true)}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 text-sm font-medium py-2.5 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                  Raise a Dispute
                </button>
              )}
              {disputeDone && (
                <div className="flex items-center gap-2 bg-red-50 text-red-500 text-xs font-semibold px-3 py-2.5 rounded-xl justify-center">
                  <Scale className="w-3.5 h-3.5" /> Dispute submitted
                </div>
              )}

              {order.status === "pending" && (
                <button className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 text-sm font-medium py-2.5 rounded-xl hover:bg-red-50 transition-colors">
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Review panel — inline below action buttons */}
          {showReview && !reviewDone && !order.review && (
            <div className="bg-white rounded-2xl border border-secondary/30 shadow-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Rate your experience</p>
              {/* Star picker */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5"
                  >
                    <Star className={`w-7 h-7 transition-colors ${
                      n <= (hoverRating || reviewRating) ? "fill-secondary text-secondary" : "text-gray-200 fill-gray-200"
                    }`} />
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience with this vendor..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
              />
              <button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || reviewLoading}
                className="w-full bg-secondary text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-colors disabled:opacity-40"
              >
                Submit Review
              </button>
            </div>
          )}

          {/* Vendor quick contact card */}
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">Need help?</p>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Have questions about your order? Message the vendor directly or contact support.
            </p>
            {vendor && (
              <div className="flex items-center gap-2 mb-3">
                <UserAvatar src={vendor?.user?.avatar || null} name={vendor?.businessName || "Vendor"} size={32} className="border border-white" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{vendor?.businessName || "Vendor"}</p>
                  <p className="text-xs text-gray-400">{vendor.category || "Event Service"}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => navigate("/support")}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/30 py-2 rounded-xl transition-colors"
            >
              <Headphones className="w-3.5 h-3.5" /> Contact Support
            </button>
          </div>
        </div>

      </div>
      {/* Dispute modal */}
      {showDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDispute(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50">
                <Scale className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Raise a Dispute</p>
                <p className="text-xs text-gray-500 mt-1">
                  Describe your issue clearly. Our team will review and respond within 24 hours.
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Dispute Type</label>
              <select
                value={disputeType}
                onChange={e => setDisputeType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="no_show">No Show — vendor did not show up</option>
                <option value="poor_quality">Poor Quality — service did not meet expectations</option>
                <option value="wrong_service">Wrong Service — different from what was agreed</option>
                <option value="payment_issue">Payment Issue — billing or payment problem</option>
                <option value="other">Other</option>
              </select>
            </div>
            <textarea
              rows={4}
              value={disputeDesc}
              onChange={e => { setDisputeDesc(e.target.value); setDisputeError(""); }}
              placeholder="Describe what happened in detail (min. 20 characters)…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
            {disputeError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{disputeError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDispute(false); setDisputeDesc(""); setDisputeError(""); }}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDispute}
                disabled={!disputeDesc.trim() || disputeLoading}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {disputeLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : "Submit Dispute"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-700">{value || "—"}</p>
      </div>
    </div>
  );
}
