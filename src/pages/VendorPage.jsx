import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgePercent, CalendarDays, MapPin, Phone, Trophy, Users } from "lucide-react";
import { vendors, vendorPackages, brand } from "../src-data";
import { ActionButton, BackButton, Stars, MetricCard } from "../ui-helpers";

export default function VendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vendor = vendors.find((item) => String(item.id) === String(id)) || vendors[0];

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <BackButton label="Back to Home" onClick={() => navigate("/")} />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <img src={vendor.image} alt={vendor.company} className="h-full min-h-[420px] w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.secondary }}>Vendor Profile</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{vendor.company}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><MapPin size={16} /> {vendor.location}</span>
              <span className="rounded-full px-3 py-1 font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>{vendor.category}</span>
              <Stars value={vendor.rating} />
            </div>
            <p className="mt-6 text-base leading-8 text-slate-600">{vendor.short} Our vendor team delivers stylish concepts, careful planning, and professional execution for memorable events across Sri Lanka.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <MetricCard title="Year of Experience" value={`${vendor.experience}+`} note="Industry experience" icon={CalendarDays} tone="green" />
              <MetricCard title="Projects Completed" value={`${vendor.projects}+`} note="Completed projects" icon={Trophy} tone="blue" />
              <MetricCard title="Total Employee" value={`${vendor.employees}`} note="Team size" icon={Users} tone="gold" />
              <MetricCard title="Success Rating" value={`${vendor.success}%`} note="Client satisfaction" icon={BadgePercent} tone="slate" />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.accent }}>Package Details</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Choose the best package for your event</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {vendorPackages.map((item, index) => (
              <div key={item.name} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                <div className="p-6" style={{ background: index === 0 ? "linear-gradient(135deg,#F1F5F9,#E2E8F0)" : index === 1 ? "linear-gradient(135deg,#FEF3C7,#FDE68A)" : "linear-gradient(135deg,#DBEAFE,#BFDBFE)" }}>
                  <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-600">{item.name} Package</div>
                  <div className="mt-3 text-4xl font-black text-slate-900">{item.price}</div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-sm text-slate-600">
                    {item.items.map((row) => <div key={row}>{row}</div>)}
                  </div>
                  <ActionButton className="mt-8 inline-flex w-full items-center justify-center gap-2">Contact Vendor <Phone size={16} /></ActionButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}