// PaymentSummary — order review + booking creation
// Receives vendor, package, booking from router state

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, CheckCircle, CreditCard, Smartphone, Building2, ChevronLeft, Lock, Tag, X, Loader2 } from "lucide-react";
import { promoApi } from "../../services/promoApi";
import { bookingApi } from "../../services/bookingApi";

const paymentMethods = [
  { id: "card",   label: "Credit / Debit Card",  icon: CreditCard },
  { id: "mobile", label: "Mobile Payment",        icon: Smartphone },
  { id: "bank",   label: "Bank Transfer",         icon: Building2 },
];

export default function PaymentSummary() {
  const navigate    = useNavigate();
  const state       = useLocation().state || {};
  const { vendor, booking, fromOffer } = state;
  const pkg         = state.package;

  const [method,       setMethod]       = useState("card");
  const [confirmed,    setConfirmed]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [promoInput,    setPromoInput]    = useState("");
  const [appliedPromo,  setAppliedPromo]  = useState(null); // { code, discount }
  const [promoError,    setPromoError]    = useState("");
  const [promoLoading,  setPromoLoading]  = useState(false);
  const [bookingError,  setBookingError]  = useState("");

  // Pricing breakdown
  const subtotal   = pkg?.price ?? 0;
  const serviceFee = Math.round(subtotal * 0.05);
  const discount   = appliedPromo?.discount || 0;
  const total      = subtotal + serviceFee - discount;

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const { data } = await promoApi.validate({ code: promoInput.trim(), orderAmount: subtotal });
      setAppliedPromo({ code: data.code, discount: data.discount });
    } catch (err) {
      setPromoError(err.response?.data?.message || "Invalid promo code.");
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  }

  const handleConfirm = async () => {
    setLoading(true);
    setBookingError("");
    try {
      await bookingApi.create({
        gigId:       booking?.gigId || vendor?.id,
        packageType: pkg?.name?.toLowerCase() || "basic",
        eventDate:   booking?.eventDate || new Date().toISOString(),
        eventType:   booking?.eventType || "",
        notes:       booking?.notes || "",
        promoCode:   appliedPromo?.code || "",
      });
      setConfirmed(true);
    } catch (err) {
      setBookingError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your payment to <span className="font-semibold text-gray-700">{vendor?.name}</span> is confirmed.
          {fromOffer
            ? " The vendor has been notified and your order is now active."
            : " The vendor will contact you within 24 hours."
          }
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 text-left mb-6 space-y-2 text-sm">
          <Row label="Package"   value={`${pkg?.name} · LKR ${total.toLocaleString()}`} />
          <Row label="Event"     value={`${booking?.eventType} on ${booking?.eventDate}`} />
          <Row label="Venue"     value={booking?.venue} />
          <Row label="Guests"    value={booking?.guestCount} />
          <Row label="Booking #" value={`VIZ-${Date.now().toString().slice(-6)}`} />
        </div>

        <button
          onClick={() => navigate("/orders")}
          className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors"
        >
          View My Orders
        </button>
        <button
          onClick={() => navigate("/messages")}
          className="w-full mt-2 border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Message Vendor
        </button>
      </div>
    );
  }

  // ── If no state (direct URL access) ────────────────────────────
  if (!vendor || !pkg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-gray-500">
        <p className="font-semibold">No booking information found.</p>
        <button onClick={() => navigate("/search")} className="mt-2 text-primary text-sm hover:underline">Find a vendor</button>
      </div>
    );
  }

  // ── Main payment page ───────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment Summary</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

        {/* Left: payment method */}
        <div className="lg:col-span-3 space-y-5">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Payment Method</h2>
            <div className="space-y-2">
              {paymentMethods.map(({ id, label, icon: Icon }) => (
                <label
                  key={id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    method === id ? "border-primary bg-primary-50" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={id}
                    checked={method === id}
                    onChange={() => setMethod(id)}
                    className="accent-primary"
                  />
                  <Icon className={`w-5 h-5 ${method === id ? "text-primary" : "text-gray-400"}`} />
                  <span className={`text-sm font-medium ${method === id ? "text-primary" : "text-gray-700"}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card mock form */}
          {method === "card" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-medium text-gray-700 text-sm">Card Details</h3>
              <MockInput label="Cardholder Name" placeholder="As on card" />
              <MockInput label="Card Number" placeholder="•••• •••• •••• ••••" />
              <div className="grid grid-cols-2 gap-3">
                <MockInput label="Expiry" placeholder="MM / YY" />
                <MockInput label="CVV" placeholder="•••" />
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> This is a demo UI. No real payment is processed.
              </p>
            </div>
          )}

          {method === "mobile" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-medium text-gray-700 text-sm">Mobile Payment</h3>
              <MockInput label="Mobile Number" placeholder="+94 7X XXX XXXX" />
              <p className="text-xs text-gray-400">Demo: eZ Cash / mCash / FriMi simulation</p>
            </div>
          )}

          {method === "bank" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-medium text-gray-700 text-sm mb-3">Bank Transfer Details</h3>
              <div className="space-y-2 text-sm">
                <BankRow label="Account Name"   value="Vizhiyal Events (Pvt) Ltd" />
                <BankRow label="Bank"           value="Commercial Bank of Ceylon" />
                <BankRow label="Account No."    value="1234 5678 9012 (Demo)" />
                <BankRow label="Branch"         value="Colombo Fort" />
                <BankRow label="Reference"      value={`VIZ-${vendor.id}`} />
              </div>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20 space-y-4">
            <h2 className="font-semibold text-gray-800">Order Summary</h2>

            {/* Vendor */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <img
                src={vendor.profileImage}
                alt={vendor.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                onError={e => { e.target.style.display = "none"; }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{vendor.name}</p>
                <p className="text-xs text-gray-500">{pkg.name} Package</p>
              </div>
            </div>

            {/* Booking details */}
            <div className="space-y-1.5 text-sm">
              <Row label="Event"   value={booking?.eventType} />
              <Row label="Date"    value={booking?.eventDate} />
              <Row label="Guests"  value={booking?.guestCount} />
              <Row label="Venue"   value={booking?.venue} />
            </div>

            {/* Promo code */}
            <div className="border-t border-gray-100 pt-3">
              {!appliedPromo ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                      onKeyDown={e => e.key === "Enter" && promoInput.trim() && !promoLoading && applyPromo()}
                      placeholder="Enter code"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={applyPromo}
                      disabled={!promoInput.trim() || promoLoading}
                      className="px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                    >
                      {promoLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-accent-50 border border-accent/20 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Tag className="w-3.5 h-3.5 text-accent" />
                    <span className="font-mono font-bold text-accent">{appliedPromo.code}</span>
                    <span className="text-gray-500">applied</span>
                  </div>
                  <button onClick={() => { setAppliedPromo(null); setPromoInput(""); }} className="text-gray-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Package ({pkg.name})</span>
                <span>LKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Service fee (5%)</span>
                <span>LKR {serviceFee.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-accent font-medium">
                  <span>Promo discount</span>
                  <span>− LKR {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-primary">LKR {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 bg-accent-50 rounded-xl px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
              <p className="text-xs text-gray-600">Payment held in escrow until event is completed</p>
            </div>

            {bookingError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-center">{bookingError}</p>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium text-right max-w-[60%] truncate">{value ?? "—"}</span>
    </div>
  );
}

function BankRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  );
}

function MockInput({ label, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
