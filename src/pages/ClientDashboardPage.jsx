import React from "react";
import { Link } from "react-router-dom";
import { FileText, MapPin, Phone, ShieldCheck } from "lucide-react";
import { brand } from "../src-data";
import { ActionButton } from "../ui-helpers";

export default function ClientDashboardPage() {
  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[34px] border border-slate-200 bg-white p-10 shadow-sm">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "rgba(44,163,107,0.10)" }}
        >
          <ShieldCheck style={{ color: brand.accent }} />
        </div>
        <h1 className="mt-6 text-4xl font-black text-slate-950">
          Client dashboard ready
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Client account created successfully. From here, the client can find
          vendors and continue their activities in the platform.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-5">
            <MapPin className="mb-3" style={{ color: brand.primary }} />
            <div className="font-bold text-slate-900">Find vendors</div>
            <div className="mt-2 text-sm text-slate-500">
              Browse event services by category and location.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <FileText className="mb-3" style={{ color: brand.secondary }} />
            <div className="font-bold text-slate-900">Book packages</div>
            <div className="mt-2 text-sm text-slate-500">
              Select a package and request service easily.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <Phone className="mb-3" style={{ color: brand.accent }} />
            <div className="font-bold text-slate-900">Contact vendors</div>
            <div className="mt-2 text-sm text-slate-500">
              Message vendors and manage event activities.
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link to="/">
            <ActionButton>Go to Landing Page</ActionButton>
          </Link>
        </div>
      </div>
    </section>
  );
}