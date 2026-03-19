import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdminHeader, ActionButton, SearchBox } from "../../ui-helpers";
import { brand, vendors } from "../../src-data";

export default function ManageVendorsPage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <AdminHeader title="Manage Vendors" subtitle="Logged in as admin@vizhiyal.com" onAlerts={() => navigate("/admin/verification")} />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Admin Menu</div>
            <div className="mt-5 space-y-3">
              <Link to="/admin" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Dashboard</Link>
              <Link to="/admin/manage-vendors" className="block rounded-2xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>Manage Vendors</Link>
              <Link to="/admin/manage-clients" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Manage Clients</Link>
              <Link to="/admin/verification" className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600">Verification</Link>
            </div>
          </aside>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-bold text-slate-900">Manage Vendors</div>
                <div className="text-sm text-slate-500">Open, edit, or delete vendor profiles</div>
              </div>
              <SearchBox placeholder="Search vendors" />
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 text-slate-400"><th className="pb-4 pr-4 font-semibold">Company</th><th className="pb-4 pr-4 font-semibold">Category</th><th className="pb-4 pr-4 font-semibold">Location</th><th className="pb-4 pr-4 font-semibold">Status</th><th className="pb-4 pr-4 font-semibold">Actions</th></tr></thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-slate-100">
                      <td className="py-4 pr-4"><div className="font-semibold text-slate-900">{vendor.company}</div><div className="text-slate-500">{vendor.owner}</div></td>
                      <td className="py-4 pr-4 text-slate-600">{vendor.category}</td>
                      <td className="py-4 pr-4 text-slate-600">{vendor.location}</td>
                      <td className="py-4 pr-4"><span className="rounded-full px-3 py-1 text-xs font-semibold" style={vendor.status === "Active" ? { backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent } : { backgroundColor: "rgba(227,164,55,0.16)", color: "#8A5A00" }}>{vendor.status}</span></td>
                      <td className="py-4 pr-4"><div className="flex flex-wrap gap-2"><Link to={`/vendor/${vendor.id}`}><ActionButton variant="secondary" className="inline-flex items-center gap-2"><Eye size={14} /> Open</ActionButton></Link><ActionButton variant="gold" className="inline-flex items-center gap-2"><Pencil size={14} /> Edit</ActionButton><ActionButton variant="danger" className="inline-flex items-center gap-2"><Trash2 size={14} /> Delete</ActionButton></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}