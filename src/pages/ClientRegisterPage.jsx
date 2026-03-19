import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import { brand } from "../src-data";
import { ActionButton } from "../ui-helpers";

export default function ClientRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
  });

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
              style={{ backgroundColor: "rgba(44,163,107,0.10)" }}
            >
              <UserRound style={{ color: brand.accent }} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Client Registration
              </div>
              <h1 className="text-3xl font-black text-slate-950">
                Create client page
              </h1>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Address" value={form.address} onChange={(e) => update("address", e.target.value)} />
            <input className="rounded-2xl border border-slate-200 px-4 py-4" placeholder="Phone number" value={form.phone} onChange={(e) => update("phone", e.target.value)} />

            <label className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-slate-500 md:col-span-2">
              Upload NIC
              <input type="file" className="mt-2 block" />
            </label>
          </div>

          <textarea
            className="mt-5 min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-4"
            placeholder="Other details"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />

          <ActionButton onClick={() => navigate("/client-dashboard")} className="mt-8">
            Create as Client
          </ActionButton>
        </div>
      </div>
    </section>
  );
}