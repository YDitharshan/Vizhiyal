// PlatformSettings.jsx — SuperAdmin: commission rate, feature flags, email templates
import { useState } from "react";
import { Settings, Save, CheckCircle, Percent, Mail, ToggleLeft, ToggleRight } from "lucide-react";

const INITIAL_FLAGS = [
  { key: "registrations",  label: "New User Registrations",      desc: "Allow new buyers to register on the platform.",              enabled: true  },
  { key: "applications",   label: "Seller Applications",         desc: "Allow buyers to apply to become sellers.",                   enabled: true  },
  { key: "reviews",        label: "Buyer Reviews & Ratings",     desc: "Allow buyers to leave reviews on completed orders.",         enabled: true  },
  { key: "maintenance",    label: "Maintenance Mode",            desc: "Take the platform offline for maintenance. Blocks all users.",enabled: false },
  { key: "gig_creation",   label: "Gig Creation",                desc: "Allow approved sellers to create new gigs.",                 enabled: true  },
  { key: "messaging",      label: "In-App Messaging",            desc: "Enable the buyer–seller chat system.",                       enabled: true  },
];

const EMAIL_TEMPLATES = [
  { key: "welcome",        label: "Welcome Email",               desc: "Sent to new users after registration."     },
  { key: "seller_approve", label: "Seller Approval",             desc: "Sent when a seller application is approved."},
  { key: "seller_reject",  label: "Seller Rejection",            desc: "Sent when a seller application is rejected."},
  { key: "order_confirm",  label: "Order Confirmation",          desc: "Sent to buyer when an order is confirmed."  },
  { key: "order_complete", label: "Order Completed",             desc: "Sent when an order is marked complete."     },
];

export default function PlatformSettings() {
  const [commission,  setCommission]  = useState("10");
  const [flags,       setFlags]       = useState(INITIAL_FLAGS);
  const [saved,       setSaved]       = useState(false);
  const [activeTab,   setActiveTab]   = useState("general");

  function toggleFlag(key) {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const maintenanceOn = flags.find(f => f.key === "maintenance")?.enabled;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Platform Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure platform-wide behaviour</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ${
            saved
              ? "bg-accent-50 text-accent border border-accent/30"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Maintenance banner */}
      {maintenanceOn && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <p className="text-sm font-semibold text-red-600">
            Maintenance Mode is ON — the platform is currently offline for users.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {["general", "flags", "email"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              activeTab === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "general" ? "General" : t === "flags" ? "Feature Flags" : "Email Templates"}
          </button>
        ))}
      </div>

      {/* General tab */}
      {activeTab === "general" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" /> Commission Rate
          </h2>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Platform Commission (%)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-40">
                <input
                  type="number"
                  min="0" max="50" step="0.5"
                  value={commission}
                  onChange={e => { setCommission(e.target.value); setSaved(false); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              <p className="text-sm text-gray-500">
                Vizhiyal takes <span className="font-semibold text-gray-800">{commission}%</span> of every transaction.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Current rate: <strong>{commission}%</strong>. Changing this affects all future orders.
            </p>
          </div>
        </div>
      )}

      {/* Feature flags tab */}
      {activeTab === "flags" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {flags.map(flag => (
            <div key={flag.key} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{flag.label}</p>
                  {flag.key === "maintenance" && flag.enabled && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{flag.desc}</p>
              </div>
              <button
                onClick={() => toggleFlag(flag.key)}
                className={`flex-shrink-0 transition-colors ${
                  flag.enabled ? "text-accent" : "text-gray-300"
                }`}
              >
                {flag.enabled
                  ? <ToggleRight className="w-8 h-8" />
                  : <ToggleLeft  className="w-8 h-8" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Email templates tab */}
      {activeTab === "email" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          <div className="px-5 py-3 bg-gray-50">
            <p className="text-xs text-gray-500">
              Email templates require backend integration to edit. Shown here for reference.
            </p>
          </div>
          {EMAIL_TEMPLATES.map(tpl => (
            <div key={tpl.key} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{tpl.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tpl.desc}</p>
              </div>
              <button className="text-xs text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                Preview
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
