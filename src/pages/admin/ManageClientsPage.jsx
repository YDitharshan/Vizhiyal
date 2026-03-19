import React from "react";
import { Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdminHeader, ActionButton } from "../../ui-helpers";
import { brand, clients } from "../../src-data";

export default function ManageClientsPage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <AdminHeader title="Manage Clients" subtitle="Logged in as admin@vizhiyal.com" onAlerts={() => navigate("/admin/verification")} />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Admin Menu</div>
            <div className="mt-5 space-y-3">
              <Link to="/admin" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Dashboard</Link>
              <Link to="/admin/manage-vendors" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Manage Vendors</Link>
              <Link to="/admin/manage-clients" className="block rounded-2xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>Manage Clients</Link>
              <Link to="/admin/verification" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Verification</Link>
            </div>
          </aside>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <div className="text-lg font-bold text-slate-900">Manage Clients</div>
              <div className="text-sm text-slate-500">View clients, needed vendor services, and payment details</div>
            </div>
            <div className="mt-6 space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">{client.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{client.email} • {client.phone}</div>
                      <div className="mt-2 text-sm text-slate-600">Needs <strong>{client.vendorNeeded}</strong> for <strong>{client.serviceType}</strong></div>
                      <div className="mt-2 text-sm text-slate-600">Paid: {client.paid} • Pending: {client.pending}</div>
                    </div>
                    <ActionButton variant="secondary" className="inline-flex items-center gap-2"><Eye size={14} /> Open</ActionButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}