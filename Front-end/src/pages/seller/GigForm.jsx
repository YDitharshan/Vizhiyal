// GigForm.jsx — Create & Edit gig, connected to real API
// /seller/gigs/create  → mode="create"
// /seller/gigs/:id/edit → mode="edit", pre-filled from API

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, X, CheckCircle, Info, AlertCircle,
  Loader2, Upload, Trash2, Eye,
} from "lucide-react";
import { gigApi } from "../../services/gigApi";
import api from "../../lib/axios.js";
import { resolveUrl } from "../../utils/uploadUrl.js";
import { CATEGORIES } from "../../utils/categories.js";

// Package pricing/delivery/description (features are managed separately)
const EMPTY_PACKAGE = { price: "", deliveryDays: "", description: "" };

const EMPTY_FORM = {
  title:       "",
  category:    "",
  description: "",
  tags:        [],
  location:    "",
  packages: {
    basic:    { ...EMPTY_PACKAGE },
    standard: { ...EMPTY_PACKAGE },
    premium:  { ...EMPTY_PACKAGE },
  },
};

const EVENT_TAGS = [
  "Wedding", "Birthday", "Corporate", "Engagement",
  "Anniversary", "Graduation", "Baby Shower", "Religious",
];

const GIG_LIMIT = 4;

// ── Category-specific default includes ────────────────────────────────────────
// Pre-populated when the seller picks a category; all unchecked by default.
// The seller ticks which packages include each item.
const CATEGORY_DEFAULTS = {
  photography: [
    "Camera equipment", "Photo editing", "Digital delivery", "Online gallery",
    "Prints included", "Second photographer", "Drone photography", "Photo album/book",
    "Same-day preview", "Raw files delivery",
  ],
  videography: [
    "HD video recording", "4K resolution", "Drone footage", "Highlight reel",
    "Full ceremony video", "Same-day edit", "Color grading", "Music licensing",
  ],
  catering: [
    "Menu consultation", "Professional staff", "Setup & breakdown",
    "Vegetarian options", "Food tasting session", "Equipment rental",
    "Halal certified", "Custom menu design",
  ],
  decoration: [
    "Venue walkthrough", "Setup & removal", "Balloon decoration",
    "Floral arrangements", "Stage decoration", "Ambient lighting",
    "Photo booth setup", "Custom theme design",
  ],
  dj: [
    "Professional PA system", "Stage lighting", "MC services", "Song requests",
    "Wireless microphone", "Backup equipment", "Ceremony music", "Reception music",
  ],
  music: [
    "Professional PA system", "Stage lighting", "MC services", "Song requests",
    "Wireless microphone", "Backup equipment", "Ceremony music", "Reception music",
  ],
  makeup: [
    "Hair styling", "Airbrush foundation", "Touch-up kit", "Trial session",
    "False lashes", "Bridal makeup", "On-location service", "Skincare prep",
  ],
  venue: [
    "Private parking", "Catering kitchen", "Bridal/VIP suite", "Air conditioning",
    "Audio/visual system", "Tables & chairs", "Decoration permitted", "Security staff",
  ],
  planning: [
    "Vendor coordination", "Event timeline", "Budget management",
    "Day-of coordination", "RSVP management", "Guest seating plan",
    "Décor consultation", "Emergency support",
  ],
  transport: [
    "Air conditioning", "GPS tracking", "Professional driver", "Airport transfers",
    "Vehicle decoration", "Multiple stops", "On-time guarantee", "Backup vehicle",
  ],
};

function getCategoryDefaults(category) {
  if (!category) return [];
  const key = category.toLowerCase();
  for (const [k, defaults] of Object.entries(CATEGORY_DEFAULTS)) {
    if (key.includes(k)) return defaults;
  }
  return [];
}

// ── Feature matrix row type: { label, basic, standard, premium, isDefault } ──
// Build the matrix from an existing gig's three feature arrays (edit mode)
function buildMatrixFromGig(g) {
  const basic    = (Array.isArray(g.basicFeatures)    ? g.basicFeatures    : []).filter(Boolean);
  const standard = (Array.isArray(g.standardFeatures) ? g.standardFeatures : []).filter(Boolean);
  const premium  = (Array.isArray(g.premiumFeatures)  ? g.premiumFeatures  : []).filter(Boolean);

  const defaults    = getCategoryDefaults(g.category || "");
  const defaultsSet = new Set(defaults.map(d => d.toLowerCase()));

  // Defaults first (in order), preserving existing checks
  const defaultRows = defaults.map((label) => ({
    label,
    basic:     basic.some((f) => f.toLowerCase() === label.toLowerCase()),
    standard:  standard.some((f) => f.toLowerCase() === label.toLowerCase()),
    premium:   premium.some((f) => f.toLowerCase() === label.toLowerCase()),
    isDefault: true,
  }));

  // Custom features (in any package but not in the defaults list)
  const allLabels = [...new Set([...basic, ...standard, ...premium])];
  const customRows = allLabels
    .filter((l) => !defaultsSet.has(l.toLowerCase()))
    .map((label) => ({
      label,
      basic:     basic.some((f) => f.toLowerCase() === label.toLowerCase()),
      standard:  standard.some((f) => f.toLowerCase() === label.toLowerCase()),
      premium:   premium.some((f) => f.toLowerCase() === label.toLowerCase()),
      isDefault: false,
    }));

  return [...defaultRows, ...customRows];
}

function pkgFromGig(g, tier) {
  return {
    price:        String(g[`${tier}Price`] || ""),
    deliveryDays: String(g.responseTime    || ""),
    description:  g[`${tier}Desc`]        || "",
  };
}

export default function GigForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [form,          setForm]          = useState(EMPTY_FORM);
  const [featureMatrix, setFeatureMatrix] = useState([]); // shared across all packages
  const [customInput,   setCustomInput]   = useState(""); // new custom feature text
  const [images,        setImages]        = useState([]);
  const [uploading,     setUploading]     = useState(false);
  const [uploadErr,     setUploadErr]     = useState("");
  const fileRef                           = useRef(null);
  const [gigCount,      setGigCount]      = useState(0);
  const [noProfile,     setNoProfile]     = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [savedVendorId, setSavedVendorId] = useState(null);
  const [savedGigId,    setSavedGigId]    = useState(null);
  const [errors,        setErrors]        = useState({});
  const [apiError,      setApiError]      = useState("");
  const [activeTab,     setActiveTab]     = useState("basic");

  // Track last processed category to handle change-driven default merging
  const prevCategoryRef = useRef(null);
  // Flag: true once edit data has been loaded (suppresses initial category effect)
  const editLoadedRef   = useRef(false);

  // ── Load existing gig (edit) or gig count (create) ──────────────────────
  useEffect(() => {
    if (isEdit) {
      gigApi.getById(id)
        .then(({ data }) => {
          const g = data.gig || data;
          setForm({
            title:       g.title       || "",
            category:    g.category    || "",
            description: g.description || "",
            tags:        Array.isArray(g.tags) ? g.tags : [],
            location:    g.location    || "",
            packages: {
              basic:    pkgFromGig(g, "basic"),
              standard: pkgFromGig(g, "standard"),
              premium:  pkgFromGig(g, "premium"),
            },
          });
          setFeatureMatrix(buildMatrixFromGig(g));
          prevCategoryRef.current = g.category || "";
          editLoadedRef.current   = true;
          if (Array.isArray(g.images)) setImages(g.images);
        })
        .catch(() => setApiError("Failed to load gig data."))
        .finally(() => setLoading(false));
    } else {
      gigApi.getMy()
        .then(({ data }) => {
          setGigCount((data.gigs || data || []).length);
        })
        .catch((err) => {
          if (err?.response?.status === 404) setNoProfile(true);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // ── Merge category defaults into feature matrix when category changes ────
  useEffect(() => {
    if (!form.category) return;
    // In edit mode, skip the very first firing (matrix already built from gig)
    if (isEdit && !editLoadedRef.current) return;
    // Also skip if category hasn't actually changed
    if (form.category === prevCategoryRef.current) return;
    prevCategoryRef.current = form.category;

    const defaults    = getCategoryDefaults(form.category);
    const defaultsSet = new Set(defaults.map((d) => d.toLowerCase()));

    setFeatureMatrix((prev) => {
      // Rebuild defaults section in order, preserving existing check state
      const defaultRows = defaults.map((label) => {
        const existing = prev.find((r) => r.label.toLowerCase() === label.toLowerCase());
        return existing
          ? { ...existing, label, isDefault: true }
          : { label, basic: false, standard: false, premium: false, isDefault: true };
      });
      // Keep custom rows that aren't in the new defaults list
      const customRows = prev.filter(
        (r) => !r.isDefault && !defaultsSet.has(r.label.toLowerCase()),
      );
      return [...defaultRows, ...customRows];
    });
  }, [form.category, isEdit]);

  const atLimit = !isEdit && gigCount >= GIG_LIMIT;

  // ── Generic form field setter ─────────────────────────────────────────────
  function setField(path, value) {
    setForm((prev) => {
      const next  = { ...prev };
      const parts = path.split(".");
      let   cur   = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
    setErrors((e) => ({ ...e, [path.split(".")[0]]: undefined }));
    setApiError("");
  }

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  // ── Feature matrix helpers ────────────────────────────────────────────────
  function toggleFeature(label, tier) {
    setFeatureMatrix((prev) =>
      prev.map((r) => (r.label === label ? { ...r, [tier]: !r[tier] } : r)),
    );
  }

  function addCustomFeature() {
    const label = customInput.trim();
    if (!label) return;
    if (featureMatrix.some((r) => r.label.toLowerCase() === label.toLowerCase())) {
      setCustomInput("");
      return; // already in list
    }
    setFeatureMatrix((prev) => [
      ...prev,
      { label, basic: false, standard: false, premium: false, isDefault: false },
    ]);
    setCustomInput("");
  }

  function removeFeatureRow(label) {
    setFeatureMatrix((prev) => prev.filter((r) => r.label !== label));
  }

  // ── Image upload ───────────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 8) {
      setUploadErr("Maximum 8 images allowed.");
      return;
    }
    setUploading(true);
    setUploadErr("");
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const { data } = await api.post("/upload", fd, {
            headers: { "Content-Type": undefined },
          });
          return data.url;
        }),
      );
      setImages((prev) => [...prev, ...urls]);
    } catch {
      setUploadErr("Upload failed. Check file size (max 5 MB) and type.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.title.trim())                  e.title       = "Title is required";
    if (!form.category)                      e.category    = "Select a category";
    if (!form.description.trim())            e.description = "Description is required";
    if (form.description.trim().length < 80) e.description = "Description must be at least 80 characters";
    if (!form.location.trim())               e.location    = "Location is required";
    ["basic", "standard", "premium"].forEach((tier) => {
      const pkg = form.packages[tier];
      if (!pkg.price        || isNaN(Number(pkg.price)))        e[`${tier}_price`]    = "Enter a valid price";
      if (!pkg.deliveryDays || isNaN(Number(pkg.deliveryDays))) e[`${tier}_delivery`] = "Enter delivery days";
    });
    return e;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      title:               form.title.trim(),
      category:            form.category,
      description:         form.description.trim(),
      tags:                form.tags,
      location:            form.location.trim(),
      responseTime:        Number(form.packages.basic.deliveryDays) || 7,

      basicPrice:          Number(form.packages.basic.price),
      basicDescription:    form.packages.basic.description.trim(),
      basicFeatures:       featureMatrix.filter((r) => r.basic).map((r) => r.label),

      standardPrice:       Number(form.packages.standard.price),
      standardDescription: form.packages.standard.description.trim(),
      standardFeatures:    featureMatrix.filter((r) => r.standard).map((r) => r.label),

      premiumPrice:        Number(form.packages.premium.price),
      premiumDescription:  form.packages.premium.description.trim(),
      premiumFeatures:     featureMatrix.filter((r) => r.premium).map((r) => r.label),

      images,
    };

    setSubmitting(true);
    setApiError("");
    try {
      if (isEdit) {
        const { data } = await gigApi.update(id, payload);
        setSavedVendorId(data.gig?.vendorId || null);
        setSavedGigId(id); // edit mode: gig id comes from URL params
      } else {
        const { data } = await gigApi.create(payload);
        setSavedVendorId(data.gig?.vendorId || null);
        setSavedGigId(data.gig?.id || null); // create mode: gig id comes from API response
      }
      setSubmitted(true);
    } catch (err) {
      setApiError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Guard screens ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (noProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Set up your Vendor Profile first</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
          Before you can create gigs, you need to complete your vendor profile with your
          business name and service category.
        </p>
        <button
          onClick={() => navigate("/seller/profile")}
          className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
        >
          Go to Profile →
        </button>
      </div>
    );
  }

  if (atLimit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-secondary-50 flex items-center justify-center mb-4">
          <Info className="w-7 h-7 text-secondary" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Gig limit reached</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
          You can have a maximum of {GIG_LIMIT} gigs. Delete an existing gig to create a new one.
        </p>
        <button
          onClick={() => navigate("/seller/gigs")}
          className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
        >
          Back to My Gigs
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {isEdit ? "Gig Updated!" : "Gig Created!"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isEdit
              ? "Your gig has been updated and is now live."
              : "Your new gig is live and visible to buyers."}
          </p>
          <div className="flex flex-col gap-3">
            {savedVendorId && (
              <button
                onClick={() => navigate(`/vendor/${savedVendorId}?preview=true${savedGigId ? `&gigId=${savedGigId}` : ""}`)}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-white font-semibold py-2.5 rounded-xl hover:bg-secondary-dark transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview as Buyer
              </button>
            )}
            <button
              onClick={() => navigate("/seller/gigs")}
              className="w-full border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back to My Gigs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TIERS     = ["basic", "standard", "premium"];
  const tierLabel = { basic: "Basic", standard: "Standard", premium: "Premium" };

  // Separate default rows from custom rows for rendering
  const defaultRows = featureMatrix.filter((r) => r.isDefault);
  const customRows  = featureMatrix.filter((r) => !r.isDefault);

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/seller/gigs")}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {isEdit ? "Edit Gig" : "Create New Gig"}
          </h1>
          <p className="text-xs text-gray-400">
            Fill in the details to {isEdit ? "update" : "publish"} your service
          </p>
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Service Details ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Service Details</h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gig Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. I will provide professional wedding photography"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.title ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Category + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.category ? "border-red-400" : "border-gray-200"}`}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="e.g. Colombo, Sri Lanka"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.location ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe your service in detail — what you offer, your experience, and what makes you stand out. Minimum 80 characters."
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${errors.description ? "border-red-400" : "border-gray-200"}`}
            />
            <div className="flex justify-between mt-1">
              {errors.description
                ? <p className="text-xs text-red-500">{errors.description}</p>
                : <span />}
              <p className="text-xs text-gray-400">{form.description.length} / 1000</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Tags</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.tags.includes(tag)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Packages ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Packages</h2>
          <p className="text-xs text-gray-400 mb-4">
            Set pricing for each tier, then tick which features each package includes below.
          </p>

          {/* Tier tabs */}
          <div className="flex gap-2 mb-5">
            {TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setActiveTab(tier)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                  activeTab === tier
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tierLabel[tier]}
              </button>
            ))}
          </div>

          {/* Per-tier: price, delivery, description */}
          {TIERS.map((tier) => (
            <div key={tier} className={activeTab === tier ? "block" : "hidden"}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Price (LKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.packages[tier].price}
                    onChange={(e) => setField(`packages.${tier}.price`, e.target.value)}
                    placeholder="e.g. 15000"
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors[`${tier}_price`] ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors[`${tier}_price`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`${tier}_price`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Delivery (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.packages[tier].deliveryDays}
                    onChange={(e) => setField(`packages.${tier}.deliveryDays`, e.target.value)}
                    placeholder="e.g. 5"
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors[`${tier}_delivery`] ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors[`${tier}_delivery`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`${tier}_delivery`]}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Package Description
                </label>
                <input
                  type="text"
                  value={form.packages[tier].description}
                  onChange={(e) => setField(`packages.${tier}.description`, e.target.value)}
                  placeholder="Brief description of this package…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          ))}

          {/* ── Feature Matrix (shared across all packages) ─────────────── */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700">What's included</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Tick which packages include each item
              </p>
            </div>

            {featureMatrix.length === 0 && (
              <p className="text-xs text-gray-400 italic py-3 text-center">
                {form.category
                  ? "No defaults for this category — add custom features below."
                  : "Select a category above to load suggested includes, or add your own below."}
              </p>
            )}

            {featureMatrix.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  {/* Column headers */}
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-3">
                        Feature
                      </th>
                      {TIERS.map((tier) => (
                        <th
                          key={tier}
                          className="text-center text-xs font-semibold text-gray-500 py-2 px-3 min-w-[70px] capitalize"
                        >
                          {tierLabel[tier]}
                        </th>
                      ))}
                      <th className="w-7" />
                    </tr>
                  </thead>

                  <tbody>
                    {/* ── Category default rows ── */}
                    {defaultRows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-t border-gray-50 hover:bg-gray-50/60 group transition-colors"
                      >
                        <td className="py-2.5 pr-3 text-xs text-gray-700">{row.label}</td>
                        {TIERS.map((tier) => (
                          <td key={tier} className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={row[tier]}
                              onChange={() => toggleFeature(row.label, tier)}
                              className="w-4 h-4 cursor-pointer accent-primary rounded"
                            />
                          </td>
                        ))}
                        <td className="py-2.5">
                          <button
                            type="button"
                            onClick={() => removeFeatureRow(row.label)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* ── Custom rows separator + rows ── */}
                    {customRows.length > 0 && (
                      <>
                        {defaultRows.length > 0 && (
                          <tr>
                            <td
                              colSpan={TIERS.length + 2}
                              className="pt-4 pb-1.5"
                            >
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                Custom features
                              </span>
                            </td>
                          </tr>
                        )}
                        {customRows.map((row) => (
                          <tr
                            key={row.label}
                            className="border-t border-gray-50 hover:bg-primary-50/30 group transition-colors"
                          >
                            <td className="py-2.5 pr-3 text-xs text-gray-700 font-medium">
                              {row.label}
                            </td>
                            {TIERS.map((tier) => (
                              <td key={tier} className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={row[tier]}
                                  onChange={() => toggleFeature(row.label, tier)}
                                  className="w-4 h-4 cursor-pointer accent-primary rounded"
                                />
                              </td>
                            ))}
                            <td className="py-2.5">
                              <button
                                type="button"
                                onClick={() => removeFeatureRow(row.label)}
                                className="p-0.5 text-gray-300 hover:text-red-400 transition-colors"
                                title="Remove"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add custom feature input */}
            <div className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addCustomFeature(); }
                }}
                placeholder="Type a custom feature and press Add…"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addCustomFeature}
                disabled={!customInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ── Portfolio Images ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800">Portfolio Images</h2>
            <span className="text-xs text-gray-400">{images.length} / 8</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Upload up to 8 images showcasing your best work (JPEG, PNG, WebP · max 5 MB each).
          </p>

          {/* Thumbnail grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group"
                >
                  <img
                    src={resolveUrl(url) || url}
                    alt={`Portfolio ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.opacity = "0.3"; }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 8 && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
              >
                {uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Upload className="w-4 h-4" /> Choose Images</>}
              </button>
            </>
          )}

          {uploadErr && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {uploadErr}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            First image will be used as the cover photo for your gig.
          </p>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/seller/gigs")}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Publish Gig"}
          </button>
        </div>
      </form>
    </div>
  );
}
