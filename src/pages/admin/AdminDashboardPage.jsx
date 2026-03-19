import React from "react";
import { BadgeDollarSign, CheckCircle2, ClipboardList, CreditCard, Store, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdminHeader, MetricCard } from "../../ui-helpers";
import { brand } from "../../src-data";

function RevenueChart() {
  const data = [45, 58, 62, 70, 82, 76, 91];
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-lg font-bold text-slate-900">Revenue Growth</div>
      <div className="mt-8 flex h-56 items-end justify-between gap-3">
        {data.map((value, index) => <div key={labels[index]} className="flex flex-1 flex-col items-center justify-end gap-3"><div className="w-full rounded-t-2xl" style={{ height: `${value * 1.6}px`, background: index % 2 === 0 ? `linear-gradient(180deg, ${brand.primary}, #4F6EDB)` : `linear-gradient(180deg, ${brand.accent}, #5BC78F)` }} /><span className="text-xs font-medium text-slate-400">{labels[index]}</span></div>)}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <AdminHeader title="Admin Dashboard" subtitle="Logged in as admin@vizhiyal.com" onAlerts={() => navigate("/admin/verification")} />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Admin Menu</div>
            <div className="mt-5 space-y-3">
              <Link to="/admin" className="block rounded-2xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>Dashboard</Link>
              <Link to="/admin/manage-vendors" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Manage Vendors</Link>
              <Link to="/admin/manage-clients" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Manage Clients</Link>
              <Link to="/admin/verification" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Verification</Link>
            </div>
          </aside>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total Vendors" value="28" note="Registered service providers" icon={Store} tone="blue" />
              <MetricCard title="Total Clients" value="146" note="Active customer accounts" icon={Users} tone="green" />
              <MetricCard title="Total Income" value="LKR 8.9M" note="Platform wide income" icon={BadgeDollarSign} tone="gold" />
              <MetricCard title="Revenue" value="LKR 3.4M" note="Net admin revenue" icon={TrendingUp} tone="slate" />
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <RevenueChart />
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-bold text-slate-900">System Highlights</div>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><CheckCircle2 style={{ color: brand.accent }} /> 23 vendors are actively taking orders.</div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><ClipboardList style={{ color: brand.secondary }} /> 17 new bookings this week.</div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><CreditCard style={{ color: brand.primary }} /> 8 pending payment confirmations need review.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}