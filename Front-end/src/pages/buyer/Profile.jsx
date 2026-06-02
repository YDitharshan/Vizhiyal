// Profile — personal details page (view + edit)
// Reads from AuthContext; saves via updateProfile (PATCH /api/auth/me)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, User, Mail, Phone, MapPin, FileText,
  Save, CheckCircle, Settings, Loader2, AlertCircle,
} from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { auth, updateProfile } = useAuth();

  const [draft,   setDraft]   = useState({ name: "", email: "", phone: "", location: "", bio: "" });
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  // Populate draft from auth whenever auth loads / changes
  useEffect(() => {
    if (auth) {
      setDraft({
        name:     auth.name     || "",
        email:    auth.email    || "",
        phone:    auth.phone    || "",
        location: auth.location || "",
        bio:      auth.bio      || "",
      });
    }
  }, [auth]);

  const joinedDate = auth?.createdAt
    ? new Date(auth.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const startEdit = () => {
    setDraft({
      name:     auth?.name     || "",
      email:    auth?.email    || "",
      phone:    auth?.phone    || "",
      location: auth?.location || "",
      bio:      auth?.bio      || "",
    });
    setSaved(false);
    setError("");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError("");
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        name:     draft.name.trim(),
        phone:    draft.phone.trim(),
        location: draft.location.trim(),
        bio:      draft.bio.trim(),
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setDraft(d => ({ ...d, [field]: e.target.value }));

  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {auth.name} &middot; {auth.email}
          </p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <Settings className="w-4 h-4" />
          Account Settings
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">

        {/* Avatar + meta */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-gray-100">
          <div className="relative flex-shrink-0">
            <UserAvatar src={auth.avatar} name={auth.name} size={96} className="border-4 border-gray-100" />
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow hover:bg-primary-dark transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-center sm:text-left flex-1">
            <p className="text-xl font-bold text-gray-900">{auth.name}</p>
            <p className="text-sm text-gray-400 mt-0.5">{auth.location || "Location not set"}</p>
            {joinedDate && <p className="text-xs text-gray-400 mt-1">Joined {joinedDate}</p>}
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="text-sm font-medium text-primary border border-primary/30 px-5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors flex-shrink-0"
            >
              Edit
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Fields */}
        <div className="mt-6 space-y-5">
          {editing ? (
            <>
              <EditField icon={User}   label="Full Name" value={draft.name}     onChange={set("name")} />
              <EditField icon={Mail}   label="Email"     value={draft.email}    onChange={set("email")} type="email"
                hint="Email changes require account verification — contact support." disabled />
              <EditField icon={Phone}  label="Phone"     value={draft.phone}    onChange={set("phone")} placeholder="+94 77 123 4567" />
              <EditField icon={MapPin} label="Location"  value={draft.location} onChange={set("location")} placeholder="e.g. Colombo, Sri Lanka" />
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <FileText className="w-3.5 h-3.5" /> Bio
                </label>
                <textarea
                  rows={3}
                  value={draft.bio}
                  onChange={set("bio")}
                  placeholder="Tell vendors a bit about yourself…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancel}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </>
          ) : (
            <>
              <ViewRow icon={Mail}     label="Email"    value={auth.email} />
              <ViewRow icon={Phone}    label="Phone"    value={auth.phone    || "—"} />
              <ViewRow icon={MapPin}   label="Location" value={auth.location || "—"} />
              {auth.bio && (
                <ViewRow icon={FileText} label="Bio" value={auth.bio} />
              )}
            </>
          )}
        </div>

        {saved && (
          <div className="mt-5 flex items-center gap-2 text-sm text-accent bg-green-50 px-4 py-2.5 rounded-xl">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Profile updated successfully.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ViewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

function EditField({ icon: Icon, label, value, onChange, type = "text", placeholder = "", hint = "", disabled = false }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
          disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""
        }`}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
