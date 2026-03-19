import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, Mail, Phone } from "lucide-react";
import { brand } from "../src-data";
import { ActionButton } from "../ui-helpers";

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

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

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (showSuccess) {
    return (
      <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(44,163,107,0.12)" }}
          >
            <CheckCircle2 size={40} style={{ color: brand.accent }} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-950">
            Your Business Details are submitted successfully.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            We will contact you soon for the verification. If any delay please
            contact us:
          </p>
          <div className="mt-6 space-y-3 text-base font-semibold text-slate-700">
            <div className="inline-flex items-center gap-2">
              <Mail size={18} /> vizhiyal@gmail.com
            </div>
            <div className="inline-flex items-center gap-2">
              <Phone size={18} /> 0111234567
            </div>
          </div>
          <ActionButton onClick={() => navigate("/register")} className="mt-8">
            Back to Register Page
          </ActionButton>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ActionButton
          variant="secondary"
          onClick={() => navigate("/register")}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </ActionButton>

        <div className="mt-6 rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "rgba(38,62,139,0.08)" }}
            >
              <Building2 style={{ color: brand.primary }} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Vendor Request
              </div>
              <h1 className="text-3xl font-black text-slate-950">
                Create vendor request page
              </h1>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Business name" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />

            <select className="rounded-2xl border border-slate-200 px-4 py-4" value={form.businessType} onChange={(e) => update("businessType", e.target.value)}>
              <option value="">Select business type</option>
              <option>Photography</option>
              <option>Decoration</option>
              <option>Event Organization</option>
            </select>

            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Business address" value={form.businessAddress} onChange={(e) => update("businessAddress", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Business contact number" value={form.businessContact} onChange={(e) => update("businessContact", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Owner name" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Owner address" value={form.ownerAddress} onChange={(e) => update("ownerAddress", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Owner contact number" value={form.ownerContact} onChange={(e) => update("ownerContact", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Owner email" value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} />

            <label className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-slate-500">
              Owner NIC PDF upload
              <input type="file" className="mt-2 block" />
            </label>

            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Owner company BR (if no BR type N/A)" value={form.brNumber} onChange={(e) => update("brNumber", e.target.value)} />
          </div>

          <textarea
            className="mt-5 min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-4"
            placeholder="Other basic details"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />

          <ActionButton onClick={() => setShowSuccess(true)} className="mt-8">
            Submit Request
          </ActionButton>
        </div>
      </div>
    </section>
  );
}