// BecomeSeller.jsx — Seller application form
// Accessible at /become-seller
// Buyer fills this form → submits → sellerStatus = "pending"
// If rejected, form is pre-filled with existing sellerApplication data

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Music, UtensilsCrossed, Building2, Video, Palette, Cake,
  MapPin, Phone, FileText, ChevronRight, AlertCircle, CheckCircle,
  Upload, X, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { id: "photography",  label: "Photography",    icon: Camera          },
  { id: "videography",  label: "Videography",    icon: Video           },
  { id: "music",        label: "Music & DJ",     icon: Music           },
  { id: "decoration",  label: "Decoration",     icon: Palette         },
  { id: "catering",    label: "Catering",       icon: UtensilsCrossed },
  { id: "venues",      label: "Venues",         icon: Building2       },
  { id: "cakes",       label: "Cakes & Pastry", icon: Cake            },
];

export default function BecomeSeller() {
  const navigate   = useNavigate();
  const { auth, becomeSellerApply } = useAuth();

  const isReapply  = auth?.sellerStatus === "rejected";
  const prefill    = auth?.sellerApplication || {};

  const [form, setForm] = useState({
    businessName:  prefill.businessName  || "",
    categories:    prefill.categories    || [],
    location:      prefill.location      || "",
    phone:         prefill.phone         || "",
    bio:           prefill.bio           || "",
    experience:    prefill.experience    || "",
    portfolioNote: prefill.portfolioNote || "",
  });
  const [errors,    setErrors]    = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function toggleCat(id) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter(c => c !== id)
        : [...f.categories, id],
    }));
    setErrors(e => ({ ...e, categories: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.businessName.trim())   e.businessName  = "Business name is required";
    if (form.categories.length === 0) e.categories   = "Select at least one category";
    if (!form.location.trim())        e.location      = "Location is required";
    if (!form.phone.trim())           e.phone         = "Phone number is required";
    if (!form.bio.trim())             e.bio           = "Tell buyers about yourself";
    if (form.bio.trim().length < 50)  e.bio           = "Bio must be at least 50 characters";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await becomeSellerApply({
        businessName: form.businessName,
        categories:   form.categories,
        location:     form.location,
        phone:        form.phone,
        bio:          form.bio,
      });
      setSubmitted(true);
    } catch {
      setErrors({ submit: "Failed to submit application. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your seller application is under review. Our admin team will verify your details
            and notify you within 2–3 business days.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {isReapply ? "Edit & Reapply" : "Become a Seller"}
            </h1>
            <p className="text-xs text-gray-400">
              {isReapply
                ? "Update your details based on admin feedback and resubmit"
                : "Set up your seller profile to start offering services on Vizhiyal"}
            </p>
          </div>
        </div>
      </div>

      {/* Rejection notice */}
      {isReapply && auth?.sellerRejectionReason && (
        <div className="max-w-3xl mx-auto px-4 pt-5">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason from Admin</p>
              <p className="text-sm text-red-600">{auth.sellerRejectionReason}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Business Name */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Business Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business / Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={e => set("businessName", e.target.value)}
                placeholder="e.g. Lens & Light Photography"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.businessName ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                  placeholder="e.g. Colombo, Sri Lanka"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    errors.location ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    errors.phone ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Services You Offer <span className="text-red-500">*</span></h2>
          <p className="text-xs text-gray-400 mb-4">Select all categories that apply. You can create individual gigs for each.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const selected = form.categories.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCat(id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${
                    selected
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-gray-200 hover:border-gray-300 text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
          {errors.categories && <p className="text-xs text-red-500 mt-2">{errors.categories}</p>}
        </div>

        {/* Bio & Experience */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">About You</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                Bio / Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={e => set("bio", e.target.value)}
                placeholder="Tell buyers about your experience, style, and what makes your services special. Minimum 50 characters."
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${
                  errors.bio ? "border-red-400" : "border-gray-200"
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.bio
                  ? <p className="text-xs text-red-500">{errors.bio}</p>
                  : <span />}
                <p className="text-xs text-gray-400">{form.bio.length} / 500</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Years of Experience
              </label>
              <select
                value={form.experience}
                onChange={e => set("experience", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select...</option>
                <option value="0-1">Less than 1 year</option>
                <option value="1-3">1 – 3 years</option>
                <option value="3-5">3 – 5 years</option>
                <option value="5-10">5 – 10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Portfolio Note */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Portfolio</h2>
          <p className="text-xs text-gray-400 mb-4">
            Describe your past work or add links to showcase your portfolio. You can upload actual images after your account is approved.
          </p>
          <textarea
            rows={3}
            value={form.portfolioNote}
            onChange={e => set("portfolioNote", e.target.value)}
            placeholder="e.g. I have photographed 50+ weddings across Sri Lanka. My work has been featured in..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {errors.submit && (
            <p className="text-sm text-red-500 text-center">{errors.submit}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : isReapply ? "Resubmit Application" : "Submit Application"}
            {!submitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
