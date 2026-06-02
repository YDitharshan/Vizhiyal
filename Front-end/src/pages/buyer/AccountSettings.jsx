// AccountSettings — 3-card landing + Personal Info and Security sub-sections
// Notifications section: waiting for design input

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCog, ShieldCheck, Bell, ChevronLeft,
  Eye, EyeOff, CheckCircle, AlertTriangle,
  Smartphone, HelpCircle, Monitor, Info,
} from "lucide-react";

// Masked email helper
function maskEmail(email) {
  const [user, domain] = email.split("@");
  const masked = user.slice(0, 2) + "*".repeat(Math.max(user.length - 2, 4));
  return `${masked}@${domain}`;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AccountSettings() {
  const navigate = useNavigate();
  const [section, setSection] = useState(null); // null | "personal" | "security"

  if (section === "personal")      return <PersonalInfo onBack={() => setSection(null)} />;
  if (section === "security")      return <AccountSecurity onBack={() => setSection(null)} />;
  if (section === "notifications") return <NotificationSettings onBack={() => setSection(null)} />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Navaam Chandran &middot; navaam@email.com
        </p>
      </div>

      {/* Link back to profile */}
      <button
        onClick={() => navigate("/profile")}
        className="text-sm text-primary hover:underline mb-8 block"
      >
        Go to profile
      </button>

      {/* 3-card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <SettingCard
          icon={UserCog}
          title="Personal information"
          desc="Update your name, email address, and account status."
          onClick={() => setSection("personal")}
        />

        <SettingCard
          icon={ShieldCheck}
          title="Account security"
          desc="Update your password and manage additional security settings."
          onClick={() => setSection("security")}
        />

        <SettingCard
          icon={Bell}
          title="Notifications"
          desc="Select the notifications you want and how you'd like to receive them."
          onClick={() => setSection("notifications")}
        />

      </div>
    </div>
  );
}

// ── Card component ────────────────────────────────────────────────────────────
function SettingCard({ icon: Icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left border border-gray-200 bg-white rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
    >
      <Icon className="w-6 h-6 mb-3 text-gray-700" />
      <p className="font-semibold text-sm mb-1 text-gray-900">{title}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </button>
  );
}

// ── Personal Information sub-section ─────────────────────────────────────────
function PersonalInfo({ onBack }) {
  const [info, setInfo] = useState({ name: "Navaam Chandran", email: "navaam@email.com" });
  const [editField, setEditField] = useState(null); // "name" | "email" | null
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");

  const startEdit = (field) => { setEditField(field); setDraft(info[field]); setSaved(""); };
  const cancelEdit = () => setEditField(null);
  const saveEdit = () => {
    if (!draft.trim()) return;
    setInfo(i => ({ ...i, [editField]: draft }));
    setEditField(null);
    setSaved(editField);
    setTimeout(() => setSaved(""), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Account settings
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Personal information</h1>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">

        {/* Full name row */}
        <InfoEditRow
          label="Full name"
          value={info.name}
          saved={saved === "name"}
          isEditing={editField === "name"}
          draft={draft}
          onDraftChange={setDraft}
          onEdit={() => startEdit("name")}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />

        {/* Email row */}
        <InfoEditRow
          label="Email address"
          value={maskEmail(info.email)}
          saved={saved === "email"}
          isEditing={editField === "email"}
          draft={draft}
          onDraftChange={setDraft}
          onEdit={() => startEdit("email")}
          onSave={saveEdit}
          onCancel={cancelEdit}
          inputType="email"
          hint="For security, your email is partially masked."
        />

        {/* Deactivate */}
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-gray-800">Deactivate account</p>
            <p className="text-xs text-gray-400 mt-0.5">Temporarily disable your Vizhiyal account</p>
          </div>
          <button className="text-sm text-red-500 font-medium hover:underline">
            Deactivate
          </button>
        </div>

      </div>
    </div>
  );
}

function InfoEditRow({ label, value, saved, isEditing, draft, onDraftChange, onEdit, onSave, onCancel, inputType = "text", hint }) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {!isEditing && (
            <p className="text-sm text-gray-500 mt-0.5">{value}</p>
          )}
          {hint && !isEditing && (
            <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
          )}
        </div>
        {!isEditing && (
          <button onClick={onEdit} className="text-sm text-primary font-medium hover:underline flex-shrink-0">
            Edit
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mt-3 space-y-2">
          <input
            type={inputType}
            value={draft}
            onChange={e => onDraftChange(e.target.value)}
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="text-gray-500 text-xs font-medium px-4 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-accent">
          <CheckCircle className="w-3.5 h-3.5" /> Saved successfully.
        </div>
      )}
    </div>
  );
}

// ── Account Security sub-section ──────────────────────────────────────────────
function AccountSecurity({ onBack }) {
  const [pw, setPw]       = useState({ new: "", confirm: "" });
  const [show, setShow]   = useState({ new: false, confirm: false });
  const [pwMsg, setPwMsg] = useState({ text: "", ok: false });
  const [twoFA, setTwoFA] = useState(false);

  const savePassword = () => {
    if (pw.new.length < 8) {
      setPwMsg({ text: "Password must be at least 8 characters. Combine upper and lowercase letters and numbers.", ok: false });
      return;
    }
    if (pw.new !== pw.confirm) {
      setPwMsg({ text: "Passwords do not match.", ok: false });
      return;
    }
    setPwMsg({ text: "Password updated successfully.", ok: true });
    setPw({ new: "", confirm: "" });
    setTimeout(() => setPwMsg({ text: "", ok: false }), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Account settings
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account security</h1>

      <div className="space-y-px bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">

        {/* Set password */}
        <section className="px-6 py-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Set Password</p>

          <div className="space-y-4 max-w-sm">
            {[
              { key: "new",     label: "New Password",     placeholder: "" },
              { key: "confirm", label: "Confirm Password", placeholder: "" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={show[key] ? "text" : "password"}
                    placeholder={placeholder}
                    value={pw[key]}
                    onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400">8 characters or longer. Combine upper and lowercase letters and numbers.</p>

            {pwMsg.text && (
              <div className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-lg ${pwMsg.ok ? "bg-green-50 text-accent" : "bg-red-50 text-red-500"}`}>
                {pwMsg.ok
                  ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                {pwMsg.text}
              </div>
            )}

            <button
              onClick={savePassword}
              className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Save Changes
            </button>
          </div>
        </section>

        {/* Phone verification */}
        <section className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Verification</p>
            <p className="text-sm text-gray-500">Your phone is not verified. Click Verify Now to complete phone verification.</p>
          </div>
          <button className="flex-shrink-0 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Verify Now
          </button>
        </section>

        {/* Security question */}
        <section className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Security Question</p>
            <p className="text-sm text-gray-500">Add an extra layer of protection for account recovery and password changes.</p>
          </div>
          <button className="flex-shrink-0 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Set
          </button>
        </section>

        {/* Two-factor authentication */}
        <section className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Two Factor Authentication</p>
              </div>
              <p className="text-sm text-gray-500">
                To help keep your account secure, we'll ask you to submit a code when signing in from a new device. We'll send the code via email or SMS.
              </p>
            </div>
            {/* Toggle */}
            <button
              onClick={() => setTwoFA(v => !v)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors mt-0.5 ${twoFA ? "bg-primary" : "bg-gray-200"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${twoFA ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </section>

        {/* Connected devices */}
        <section className="px-6 py-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Connected Devices</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium flex items-center gap-2">
                  Windows PC
                  <span className="text-xs font-semibold text-accent bg-green-50 px-2 py-0.5 rounded-full">This device</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Last activity just now &middot; Colombo, Sri Lanka</p>
              </div>
            </div>
            <button className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium">
              Sign Out
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Notification Settings sub-section ────────────────────────────────────────
const NOTIF_ITEMS = [
  { key: "inbox",     label: "Inbox messages",  info: false },
  { key: "orders",    label: "Order messages",  info: false },
  { key: "updates",   label: "Order updates",   info: false },
  { key: "reminders", label: "Event reminders", info: false },
  { key: "promos",    label: "Promotions",      info: false },
  { key: "other",     label: "Other",           info: true  },
];

function NotificationSettings({ onBack }) {
  const [prefs, setPrefs] = useState(
    Object.fromEntries(NOTIF_ITEMS.map(i => [i.key, true]))
  );
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Account settings
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        Select the notifications you want and how you'd like to receive them.
        When necessary, we'll send essential account and order notifications.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Column header */}
        <div className="flex items-center justify-end px-6 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700 w-12 text-center">Email</span>
        </div>

        {NOTIF_ITEMS.map(({ key, label, info }) => (
          <div key={key} className="flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-800">{label}</span>
              {info && <Info className="w-3.5 h-3.5 text-gray-400" />}
            </div>
            <button
              onClick={() => toggle(key)}
              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                prefs[key] ? "bg-gray-900 border-gray-900" : "border-gray-300 bg-white"
              }`}
            >
              {prefs[key] && <CheckCircle className="w-3 h-3 text-white" />}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          onClick={save}
          className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Save Preferences
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-accent">
            <CheckCircle className="w-4 h-4" /> Saved.
          </span>
        )}
      </div>
    </div>
  );
}
