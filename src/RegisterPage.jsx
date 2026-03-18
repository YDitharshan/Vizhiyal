import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import logo from "./assets/logo.png";

const brand = {
  primary: "#263E8B",
  secondary: "#E3A437",
  accent: "#2CA36B",
};

function ActionButton({ children, onClick, type = "button", variant = "primary", className = "" }) {
  const style =
    variant === "primary"
      ? { backgroundColor: brand.primary, color: "white" }
      : variant === "secondary"
      ? { backgroundColor: "white", color: "#0f172a", border: "1px solid #e2e8f0" }
      : { backgroundColor: brand.secondary, color: "#111827" };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full px-5 py-3 text-sm font-semibold transition duration-300 ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function InputField({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition focus:border-slate-300"
      />
    </div>
  );
}

function FileField({ label }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-slate-500 transition hover:bg-slate-50">
        <Upload size={18} />
        <span>Upload file</span>
        <input type="file" className="hidden" />
      </label>
    </div>
  );
}

function RegisterChoicePage({ onSelect }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(38,62,139,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(44,163,107,0.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex items-center gap-3">
          <img src={logo} alt="Vizhiyal logo" className="h-12 w-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" />
          <div>
            <div className="text-xl font-black" style={{ color: brand.primary }}>Vizhiyal</div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Register</div>
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.accent }}>
              Join the platform
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Choose how you want to use Vizhiyal.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">
              Register as a vendor to create your business on the platform, or register as a client to find the perfect services for your event.
            </p>
          </div>

          <div className="grid gap-6">
            <motion.div whileHover={{ y: -4 }} className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(38,62,139,0.08)" }}>
                <Building2 style={{ color: brand.primary }} />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-950">Are you vendor?</h2>
              <p className="mt-3 text-slate-500">Create your business in this platform and grow your event service reach.</p>
              <ActionButton onClick={() => onSelect("vendorForm")} className="mt-6 inline-flex items-center gap-2">
                I am Vendor
              </ActionButton>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(44,163,107,0.10)" }}>
                <UserRound style={{ color: brand.accent }} />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-950">Are you client?</h2>
              <p className="mt-3 text-slate-500">Find the perfect services for your event from this platform.</p>
              <ActionButton onClick={() => onSelect("clientForm")} className="mt-6 inline-flex items-center gap-2">
                I am Client
              </ActionButton>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VendorRequestPage({ onBack, onSubmit }) {
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    businessAddress: "",
    businessContact: "",
    ownerName: "",
    ownerAddress: "",
    ownerContact: "",
    ownerEmail: "",
    brNumber: "",
    notes: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ActionButton variant="secondary" onClick={onBack} className="inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </ActionButton>

        <div className="mt-6 rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(38,62,139,0.08)" }}>
              <Building2 style={{ color: brand.primary }} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Vendor Request</div>
              <h1 className="text-3xl font-black text-slate-950">Create vendor request page</h1>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <InputField label="Business name" placeholder="Enter business name" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Business type</label>
              <select value={form.businessType} onChange={(e) => update("businessType", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none">
                <option value="">Select type</option>
                <option>Photography</option>
                <option>Decoration</option>
                <option>Event Organization</option>
                <option>Catering</option>
                <option>Music & DJ</option>
              </select>
            </div>

            <InputField label="Business address" placeholder="Enter business address" value={form.businessAddress} onChange={(e) => update("businessAddress", e.target.value)} />
            <InputField label="Business contact number" placeholder="Enter business contact number" value={form.businessContact} onChange={(e) => update("businessContact", e.target.value)} />
            <InputField label="Owner name" placeholder="Enter owner name" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
            <InputField label="Owner address" placeholder="Enter owner address" value={form.ownerAddress} onChange={(e) => update("ownerAddress", e.target.value)} />
            <InputField label="Owner contact number" placeholder="Enter owner contact number" value={form.ownerContact} onChange={(e) => update("ownerContact", e.target.value)} />
            <InputField label="Owner email" placeholder="Enter owner email" value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} type="email" />
            <FileField label="Owner NIC PDF upload" />
            <InputField label="Owner company BR (If no BR, type N/A)" placeholder="Enter BR number or N/A" value={form.brNumber} onChange={(e) => update("brNumber", e.target.value)} />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Other basic details</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Additional business details" className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none" />
          </div>

          <ActionButton onClick={onSubmit} className="mt-8">
            Submit Request
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function VendorSuccessPage({ onBackToRegister }) {
  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(44,163,107,0.12)" }}>
          <CheckCircle2 size={40} style={{ color: brand.accent }} />
        </div>
        <h1 className="mt-6 text-3xl font-black text-slate-950">Your Business Details are submitted successfully.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          We will contact you soon for the verification. If any delay please contact us:
        </p>
        <div className="mt-6 space-y-3 text-base font-semibold text-slate-700">
          <div className="inline-flex items-center gap-2"><Mail size={18} /> vizhiyal@gmail.com</div>
          <div className="inline-flex items-center gap-2"><Phone size={18} /> 0111234567</div>
        </div>
        <ActionButton onClick={onBackToRegister} className="mt-8">
          Back to Register Page
        </ActionButton>
      </div>
    </section>
  );
}

function ClientCreatePage({ onBack, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    eventType: "",
    notes: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ActionButton variant="secondary" onClick={onBack} className="inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </ActionButton>

        <div className="mt-6 rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(44,163,107,0.10)" }}>
              <UserRound style={{ color: brand.accent }} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Client Registration</div>
              <h1 className="text-3xl font-black text-slate-950">Create client page</h1>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <InputField label="Name" placeholder="Enter full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            <InputField label="Email" placeholder="Enter email" value={form.email} onChange={(e) => update("email", e.target.value)} type="email" />
            <InputField label="Address" placeholder="Enter address" value={form.address} onChange={(e) => update("address", e.target.value)} />
            <InputField label="Phone number" placeholder="Enter phone number" value={form.phone} onChange={(e) => update("phone", e.target.value)} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Event type</label>
              <select value={form.eventType} onChange={(e) => update("eventType", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none">
                <option value="">Select event type</option>
                <option>Wedding</option>
                <option>Birthday</option>
                <option>Party</option>
                <option>Corporate</option>
              </select>
            </div>

            <FileField label="Upload NIC" />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Other details</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Add extra details about your event needs" className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none" />
          </div>

          <ActionButton onClick={onSubmit} className="mt-8">
            Create as Client
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function ClientDashboardPlaceholder() {
  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[34px] border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(44,163,107,0.10)" }}>
          <ShieldCheck style={{ color: brand.accent }} />
        </div>
        <h1 className="mt-6 text-4xl font-black text-slate-950">Client dashboard ready</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Client account created successfully. From here, the client can find vendors and continue their activities in the platform.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-5">
            <MapPin className="mb-3" style={{ color: brand.primary }} />
            <div className="font-bold text-slate-900">Find vendors</div>
            <div className="mt-2 text-sm text-slate-500">Browse event services by category and location.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <FileText className="mb-3" style={{ color: brand.secondary }} />
            <div className="font-bold text-slate-900">Book packages</div>
            <div className="mt-2 text-sm text-slate-500">Select a package and request service easily.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <Phone className="mb-3" style={{ color: brand.accent }} />
            <div className="font-bold text-slate-900">Contact vendors</div>
            <div className="mt-2 text-sm text-slate-500">Message vendors and manage event activities.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function VizhiyalRegisterPages() {
  const [page, setPage] = useState("choice");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {page === "choice" ? <RegisterChoicePage onSelect={setPage} /> : null}
          {page === "vendorForm" ? <VendorRequestPage onBack={() => setPage("choice")} onSubmit={() => setPage("vendorSuccess")} /> : null}
          {page === "vendorSuccess" ? <VendorSuccessPage onBackToRegister={() => setPage("choice")} /> : null}
          {page === "clientForm" ? <ClientCreatePage onBack={() => setPage("choice")} onSubmit={() => setPage("clientDashboard")} /> : null}
          {page === "clientDashboard" ? <ClientDashboardPlaceholder /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
