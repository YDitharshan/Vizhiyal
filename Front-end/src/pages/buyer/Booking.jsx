// Booking — event details form before payment
// Receives selected package via router state from ChoosePackage

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, MapPin, Users, FileText, ChevronLeft, CheckCircle, Loader2 } from "lucide-react";
import { vendorApi } from "../../services/vendorApi";
import { adaptVendor } from "../../utils/adapters";

const eventTypes = ["Wedding", "Birthday Party", "Corporate Event", "Engagement", "Anniversary", "Graduation", "Other"];

export default function Booking() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const routerState = useLocation().state || {};
  const pkg         = routerState.package ?? null;

  const [vendor,       setVendor]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [blockedDates, setBlockedDates] = useState(new Set()); // "YYYY-MM-DD"

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    eventType:  "",
    eventDate:  "",
    guestCount: "",
    venue:      "",
    notes:      "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    vendorApi.getById(id)
      .then(res => {
        const v = res.data?.vendor ?? res.data;
        setVendor(adaptVendor(v));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Pre-fetch blocked dates for the next 3 months so we can validate instantly
  useEffect(() => {
    if (!id) return;
    const months = [0, 1, 2].map(offset => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    Promise.allSettled(months.map(m => vendorApi.getAvailability(id, m)))
      .then(results => {
        const all = new Set();
        results.forEach(r => {
          if (r.status === "fulfilled")
            (r.value?.data?.blockedDates || []).forEach(d => all.add(d));
        });
        setBlockedDates(all);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-gray-500">
        <p className="font-semibold">Vendor not found</p>
        <button onClick={() => navigate("/search")} className="mt-2 text-primary text-sm hover:underline">Back to search</button>
      </div>
    );
  }

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.eventType)  errs.eventType  = "Please select an event type";
    if (!form.eventDate)  errs.eventDate  = "Please pick a date";
    else if (form.eventDate < today) errs.eventDate = "Date cannot be in the past";
    else if (blockedDates.has(form.eventDate)) errs.eventDate = "Vendor is unavailable on this date";
    if (!form.guestCount || Number(form.guestCount) < 1) errs.guestCount = "Enter a valid guest count";
    if (!form.venue.trim()) errs.venue = "Please enter the venue";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    navigate("/payment", { state: { vendor, package: pkg, booking: form } });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Book Vendor</h1>
      <p className="text-sm text-gray-500 mb-6">{vendor.name} · {pkg?.name ?? ""} Package</p>

      {/* Order summary card */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center gap-4 mb-6">
        <img
          src={vendor.profileImage}
          alt={vendor.name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          onError={e => { e.target.style.display = "none"; }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{vendor.name}</p>
          {pkg && (
            <p className="text-sm text-gray-500">{pkg.name} Package · <span className="text-primary font-bold">LKR {pkg.price?.toLocaleString()}</span></p>
          )}
        </div>
        <button
          onClick={() => navigate(`/vendor/${id}/package`)}
          className="text-xs text-primary font-medium hover:underline flex-shrink-0"
        >
          Change
        </button>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Event type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Event Type <span className="text-red-400">*</span>
          </label>
          <select
            value={form.eventType}
            onChange={set("eventType")}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.eventType ? "border-red-400" : "border-gray-200"}`}
          >
            <option value="">Select event type</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.eventType && <p className="text-xs text-red-400 mt-1">{errors.eventType}</p>}
        </div>

        {/* Date + Guest count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <CalendarDays className="w-4 h-4 inline mr-1 text-gray-400" />
              Event Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              min={today}
              value={form.eventDate}
              onChange={set("eventDate")}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.eventDate || blockedDates.has(form.eventDate)
                  ? "border-red-400"
                  : "border-gray-200"
              }`}
            />
            {errors.eventDate && <p className="text-xs text-red-400 mt-1">{errors.eventDate}</p>}
            {!errors.eventDate && form.eventDate && form.eventDate >= today && (
              blockedDates.has(form.eventDate)
                ? <p className="text-xs text-red-400 mt-1 flex items-center gap-1">✗ Vendor unavailable on this date</p>
                : <p className="text-xs text-green-600 mt-1 flex items-center gap-1">✓ Vendor is available on this date</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Users className="w-4 h-4 inline mr-1 text-gray-400" />
              Guest Count <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 150"
              value={form.guestCount}
              onChange={set("guestCount")}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.guestCount ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.guestCount && <p className="text-xs text-red-400 mt-1">{errors.guestCount}</p>}
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
            Venue / Location <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Hotel Galadari, Colombo"
            value={form.venue}
            onChange={set("venue")}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.venue ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.venue && <p className="text-xs text-red-400 mt-1">{errors.venue}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1 text-gray-400" />
            Additional Notes <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Any special requirements, theme preferences, dietary restrictions..."
            value={form.notes}
            onChange={set("notes")}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Features included */}
        {pkg?.features?.length > 0 && (
          <div className="bg-accent-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-accent mb-2">Included in {pkg.name}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {pkg.features.map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors"
        >
          Proceed to Payment Summary →
        </button>
      </form>
    </div>
  );
}
