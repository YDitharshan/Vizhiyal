// SellerProfile.jsx — full seller profile with tagline, languages, portfolio,
// work experience, skills, certifications & profile-strength score
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle, MapPin, Phone, FileText, Camera, Star, Award,
  Loader2, AlertCircle, Plus, Trash2, ChevronDown, Globe,
  Briefcase, BookOpen, Image as ImageIcon, X, Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { vendorApi } from "../../services/vendorApi";
import { uploadApi } from "../../services/uploadApi";
import { resolveUrl } from "../../utils/uploadUrl";
import UserAvatar from "../../components/common/UserAvatar";
import { CATEGORIES } from "../../utils/categories.js";

// ── Constants ─────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  "English", "Sinhala", "Tamil", "Hindi", "Malay",
  "Arabic", "French", "German", "Mandarin", "Japanese",
];

const SKILL_SUGGESTIONS = {
  "Photography":    ["Portrait Photography", "Wedding Photography", "Event Photography", "Photo Editing", "Lightroom", "Adobe Photoshop", "Drone Photography", "Videography"],
  "Music & DJ":     ["DJ Mixing", "Sound Engineering", "MC / Host", "Live Music", "Wedding DJ", "Event DJ", "Karaoke Setup", "Beat Production"],
  "Catering":       ["Event Catering", "Menu Planning", "Food Safety", "Buffet Service", "Wedding Catering", "Corporate Catering", "Desserts & Cakes"],
  "Decoration":     ["Event Decoration", "Floral Design", "Balloon Art", "Stage Setup", "Table Styling", "Wedding Decoration", "Lighting Design"],
  "Venue":          ["Venue Management", "Event Coordination", "Seating Arrangement", "AV Setup", "Crowd Management"],
  "Entertainment":  ["MC / Hosting", "Stand-up Comedy", "Magic Shows", "Dance Performance", "Live Band", "Puppet Show"],
  "Transport":      ["Event Logistics", "VIP Transport", "Fleet Management", "Route Planning"],
  "default":        ["Event Planning", "Customer Service", "Time Management", "Communication", "Teamwork", "Budget Management"],
};

const SKILL_LEVELS = ["Beginner", "Intermediate", "Pro"];

// ── Profile strength ──────────────────────────────────────────
// 15-point scoring: each field that is filled adds to the score
function computeStrength(form, hasAvatar) {
  let score = 0;
  if (form.businessName?.trim())            score += 1; // 1
  if (form.tagline?.trim())                 score += 1; // 2
  if (form.description?.trim())             score += 1; // 3
  if (form.location?.trim())                score += 1; // 4
  if (form.phone?.trim())                   score += 1; // 5
  if (form.category)                        score += 1; // 6
  if (form.languages?.length > 0)           score += 1; // 7
  if (form.portfolioItems?.length > 0)      score += 2; // 9
  if (form.workExperience?.length > 0)      score += 2; // 11
  if (form.skills?.length > 0)             score += 2; // 13
  if (form.certifications?.length > 0)      score += 1; // 14
  if (hasAvatar)                            score += 1; // 15
  return { score, total: 15 };
}

// ── Tiny helpers ──────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2);

function emptyExp()  { return { id: uid(), title: "", company: "", from: "", to: "", description: "" }; }
function emptyCert() { return { id: uid(), name: "", issuedBy: "", year: "" }; }
function emptyPort() { return { id: uid(), category: "", images: [], description: "" }; }

// ── Section card wrapper ──────────────────────────────────────
function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

// ═══════════════════════════════════════════════════════════════
export default function SellerProfile() {
  const { auth, updateProfile } = useAuth();

  const [form, setForm] = useState({
    businessName:   "",
    tagline:        "",
    description:    "",
    location:       "",
    phone:          "",
    category:       "",
    languages:      [],
    portfolioItems: [],   // [{ id, category, images:[], description }]
    workExperience: [],   // [{ id, title, company, from, to, description }]
    skills:         [],   // [{ id, name, level }]
    certifications: [],   // [{ id, name, issuedBy, year }]
  });

  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState("");
  const [skillInput,    setSkillInput]    = useState("");
  const [skillLevel,    setSkillLevel]    = useState("Intermediate");
  const [uploadingPfId, setUploadingPfId] = useState(null); // portfolio item id being uploaded

  // ── Load existing profile ───────────────────────────────────
  useEffect(() => {
    vendorApi.getMyProfile()
      .then(({ data }) => {
        const v = data.vendor || data.profile || data;
        setVendorProfile(v);
        setForm({
          businessName:   v.businessName           || auth?.name     || "",
          tagline:        v.tagline                || "",
          description:    v.description            || "",
          phone:          v.user?.phone            || auth?.phone    || "",
          location:       v.location               || v.user?.location || auth?.location || "",
          category:       v.category               || "",
          languages:      Array.isArray(v.languages)      ? v.languages      : [],
          portfolioItems: Array.isArray(v.portfolioItems) ? v.portfolioItems : [],
          workExperience: Array.isArray(v.workExperience) ? v.workExperience : [],
          skills:         Array.isArray(v.skills)         ? v.skills         : [],
          certifications: Array.isArray(v.certifications) ? v.certifications : [],
        });
      })
      .catch(() => {
        setForm(f => ({
          ...f,
          businessName: auth?.name     || "",
          description:  auth?.bio      || "",
          phone:        auth?.phone    || "",
          location:     auth?.location || "",
        }));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
    setError("");
  }

  // ── Save ────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!form.businessName?.trim()) {
      setError("Business name is required.");
      return;
    }
    if (!form.category) {
      setError("Please select a primary category.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        businessName:   form.businessName,
        tagline:        form.tagline,
        description:    form.description,
        location:       form.location,
        phone:          form.phone,
        category:       form.category,
        languages:      form.languages,
        portfolioItems: form.portfolioItems,
        workExperience: form.workExperience,
        skills:         form.skills,
        certifications: form.certifications,
      };

      if (vendorProfile) {
        const { data } = await vendorApi.updateProfile(payload);
        setVendorProfile(data.vendor || vendorProfile);
      } else {
        const { data } = await vendorApi.createProfile(payload);
        setVendorProfile(data.vendor || true);
      }

      if (form.businessName && form.businessName !== auth?.name) {
        await updateProfile({ name: form.businessName });
      }
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Languages ───────────────────────────────────────────────
  function toggleLanguage(lang) {
    const cur = form.languages;
    setField("languages", cur.includes(lang)
      ? cur.filter(l => l !== lang)
      : [...cur, lang]);
  }

  // ── Portfolio ───────────────────────────────────────────────
  function addPortfolioItem() {
    setField("portfolioItems", [...form.portfolioItems, emptyPort()]);
  }
  function removePortfolioItem(id) {
    setField("portfolioItems", form.portfolioItems.filter(p => p.id !== id));
  }
  function updatePortfolioItem(id, key, val) {
    setField("portfolioItems", form.portfolioItems.map(p => p.id === id ? { ...p, [key]: val } : p));
    setSaved(false);
  }

  const portfolioInputRef = useRef({});

  async function handlePortfolioImageUpload(id, files) {
    if (!files?.length) return;
    setUploadingPfId(id);
    try {
      const urls = await Promise.all(
        Array.from(files).map(f => uploadApi.uploadImage(f).then(r => r.data?.url || r.data?.imageUrl || r.data))
      );
      setField("portfolioItems", form.portfolioItems.map(p =>
        p.id === id ? { ...p, images: [...(p.images || []), ...urls.filter(Boolean)] } : p
      ));
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploadingPfId(null);
    }
  }

  function removePortfolioImage(itemId, imgIdx) {
    setField("portfolioItems", form.portfolioItems.map(p =>
      p.id === itemId ? { ...p, images: p.images.filter((_, i) => i !== imgIdx) } : p
    ));
  }

  // ── Work Experience ─────────────────────────────────────────
  function addExp() {
    setField("workExperience", [...form.workExperience, emptyExp()]);
  }
  function removeExp(id) {
    setField("workExperience", form.workExperience.filter(e => e.id !== id));
  }
  function updateExp(id, key, val) {
    setField("workExperience", form.workExperience.map(e => e.id === id ? { ...e, [key]: val } : e));
  }

  // ── Skills ──────────────────────────────────────────────────
  const skillSuggestions = [
    ...(SKILL_SUGGESTIONS[form.category] || []),
    ...SKILL_SUGGESTIONS.default,
  ].filter(s => !form.skills.some(sk => sk.name.toLowerCase() === s.toLowerCase()));

  function addSkill(name) {
    const n = (name || skillInput).trim();
    if (!n) return;
    if (form.skills.some(s => s.name.toLowerCase() === n.toLowerCase())) return;
    setField("skills", [...form.skills, { id: uid(), name: n, level: skillLevel }]);
    setSkillInput("");
  }
  function removeSkill(id) {
    setField("skills", form.skills.filter(s => s.id !== id));
  }
  function updateSkillLevel(id, level) {
    setField("skills", form.skills.map(s => s.id === id ? { ...s, level } : s));
  }

  // ── Certifications ──────────────────────────────────────────
  function addCert() {
    setField("certifications", [...form.certifications, emptyCert()]);
  }
  function removeCert(id) {
    setField("certifications", form.certifications.filter(c => c.id !== id));
  }
  function updateCert(id, key, val) {
    setField("certifications", form.certifications.map(c => c.id === id ? { ...c, [key]: val } : c));
  }

  // ── Strength ────────────────────────────────────────────────
  const { score, total } = computeStrength(form, !!auth?.avatar);
  const strengthPct = Math.round((score / total) * 100);
  const strengthColor =
    strengthPct >= 80 ? "bg-green-500" :
    strengthPct >= 50 ? "bg-yellow-400" :
    "bg-red-400";
  const strengthLabel =
    strengthPct >= 80 ? "Great profile!" :
    strengthPct >= 50 ? "Getting there!" :
    "Needs work";

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seller Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">This is how buyers see you on Vizhiyal</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-accent text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Saved
          </div>
        )}
      </div>

      {/* ── Profile Strength ── */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Profile Strength</p>
            <p className="text-xs text-gray-500 mt-0.5">
              A strong profile helps you stand out and attract better opportunities
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className="text-2xl font-bold text-primary">{score}</span>
            <span className="text-gray-400 font-medium">/{total}</span>
            <p className="text-xs text-gray-500 mt-0.5">{strengthLabel}</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
          <div
            className={`${strengthColor} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${strengthPct}%` }}
          />
        </div>
      </div>

      {/* Avatar + stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-5">
        <div className="relative flex-shrink-0">
          <UserAvatar src={auth?.avatar} name={auth?.name} size={80} className="rounded-2xl" />
          <button
            type="button"
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-primary-dark transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800 text-lg">{form.businessName || auth?.name}</p>
          {form.tagline && (
            <p className="text-sm text-primary italic mt-0.5">{form.tagline}</p>
          )}
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {form.location || "Location not set"}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
              {(vendorProfile?.avgRating || 0).toFixed(1)} ({vendorProfile?.totalReviews || 0} reviews)
            </span>
            {vendorProfile?.isVerified && (
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-primary" /> Verified Seller
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Business Information ── */}
        <Card title="Business Information" icon={Briefcase}>

          <Field label="Business / Brand Name *">
            <input
              type="text"
              value={form.businessName}
              onChange={e => setField("businessName", e.target.value)}
              placeholder="e.g. Silva Photography Studio"
              className={inputCls}
            />
          </Field>

          <Field label="Tagline">
            <input
              type="text"
              value={form.tagline}
              onChange={e => setField("tagline", e.target.value)}
              placeholder="One sentence about what you do, e.g. 'Capturing your most precious moments'"
              maxLength={120}
              className={inputCls}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{form.tagline.length}/120</p>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={<><MapPin className="w-3.5 h-3.5 inline mr-1" />Location</>}>
              <input
                type="text"
                value={form.location}
                onChange={e => setField("location", e.target.value)}
                placeholder="e.g. Colombo, Sri Lanka"
                className={inputCls}
              />
            </Field>
            <Field label={<><Phone className="w-3.5 h-3.5 inline mr-1" />Phone</>}>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setField("phone", e.target.value)}
                placeholder="+94 77 123 4567"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Primary Category *">
            <select
              value={form.category}
              onChange={e => setField("category", e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </Card>

        {/* ── About / Bio ── */}
        <Card title="About / Bio" icon={FileText}>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setField("description", e.target.value)}
            placeholder="Tell buyers about your experience, style, and what makes your services special…"
            className={`${inputCls} resize-none`}
            maxLength={500}
          />
          <p className="text-xs text-gray-400 text-right -mt-2">{form.description.length}/500</p>
        </Card>

        {/* ── Languages ── */}
        <Card title="Languages" icon={Globe}>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(lang => {
              const active = form.languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
          {form.languages.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {form.languages.join(", ")}
            </p>
          )}
        </Card>

        {/* ── Portfolio ── */}
        <Card title="Portfolio" icon={ImageIcon}>
          <p className="text-sm text-gray-500 -mt-2">
            Add category-wise photo collections to showcase your work.
          </p>

          <div className="space-y-4">
            {form.portfolioItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                {/* Category row */}
                <div className="flex items-center gap-3">
                  <select
                    value={item.category}
                    onChange={e => updatePortfolioItem(item.id, "category", e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(item.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Image grid */}
                {item.images?.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {item.images.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={resolveUrl(url)}
                          alt={`portfolio-${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePortfolioImage(item.id, idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full items-center justify-center hidden group-hover:flex transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={el => (portfolioInputRef.current[item.id] = el)}
                    className="hidden"
                    onChange={e => handlePortfolioImageUpload(item.id, e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => portfolioInputRef.current[item.id]?.click()}
                    disabled={uploadingPfId === item.id}
                    className="flex items-center gap-2 text-sm text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    {uploadingPfId === item.id
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                      : <><Upload className="w-4 h-4" /> Add Photos</>
                    }
                  </button>
                </div>

                {/* Optional description */}
                <input
                  type="text"
                  value={item.description}
                  onChange={e => updatePortfolioItem(item.id, "description", e.target.value)}
                  placeholder="Brief note about this collection (optional)"
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPortfolioItem}
            className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Portfolio Category
          </button>
        </Card>

        {/* ── Work Experience ── */}
        <Card title="Work Experience" icon={Briefcase}>
          <div className="space-y-4">
            {form.workExperience.map((exp, idx) => (
              <div key={exp.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Experience #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeExp(exp.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={exp.title}
                    onChange={e => updateExp(exp.id, "title", e.target.value)}
                    placeholder="Job Title (e.g. Lead Photographer)"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={e => updateExp(exp.id, "company", e.target.value)}
                    placeholder="Company / Client"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={exp.from}
                    onChange={e => updateExp(exp.id, "from", e.target.value)}
                    placeholder="From (e.g. 2019)"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={exp.to}
                    onChange={e => updateExp(exp.id, "to", e.target.value)}
                    placeholder="To (e.g. 2023 or Present)"
                    className={inputCls}
                  />
                </div>
                <textarea
                  rows={2}
                  value={exp.description}
                  onChange={e => updateExp(exp.id, "description", e.target.value)}
                  placeholder="Brief description (optional)"
                  className={`${inputCls} resize-none`}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addExp}
            className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Work Experience
          </button>
        </Card>

        {/* ── Skills & Expertise ── */}
        <Card title="Skills & Expertise" icon={Award}>

          {/* Added skills */}
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map(skill => (
                <div
                  key={skill.id}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full pl-3 pr-1 py-1"
                >
                  <span className="text-sm font-medium">{skill.name}</span>
                  <select
                    value={skill.level}
                    onChange={e => updateSkillLevel(skill.id, e.target.value)}
                    className="text-xs bg-primary/20 rounded-full px-1.5 py-0.5 border-none focus:outline-none cursor-pointer"
                  >
                    {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="w-5 h-5 flex items-center justify-center hover:bg-primary/20 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add skill */}
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter…"
              className={`${inputCls} flex-1`}
              list="skill-suggestions"
            />
            <datalist id="skill-suggestions">
              {skillSuggestions.map(s => <option key={s} value={s} />)}
            </datalist>
            <select
              value={skillLevel}
              onChange={e => setSkillLevel(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button
              type="button"
              onClick={() => addSkill()}
              className="flex items-center gap-1 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Quick-add suggestions */}
          {skillSuggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Suggestions for {form.category || "your category"}:</p>
              <div className="flex flex-wrap gap-1.5">
                {skillSuggestions.slice(0, 8).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="px-2.5 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ── Certifications ── */}
        <Card title="Certifications" icon={BookOpen}>
          <div className="space-y-3">
            {form.certifications.map((cert, idx) => (
              <div key={cert.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Certificate #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCert(cert.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={cert.name}
                  onChange={e => updateCert(cert.id, "name", e.target.value)}
                  placeholder="Certification name (e.g. Professional Photography Certificate)"
                  className={inputCls}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={cert.issuedBy}
                    onChange={e => updateCert(cert.id, "issuedBy", e.target.value)}
                    placeholder="Issued by (e.g. NIFS Sri Lanka)"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={cert.year}
                    onChange={e => updateCert(cert.id, "year", e.target.value)}
                    placeholder="Year (e.g. 2022)"
                    className={inputCls}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCert}
            className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Certification
          </button>
        </Card>

        {/* ── Save ── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {vendorProfile ? "Save Profile" : "Create Seller Profile"}
        </button>

      </form>
    </div>
  );
}
