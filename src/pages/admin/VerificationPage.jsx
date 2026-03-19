import React, { useState } from "react";
import { BadgeCheck, Building2, Eye, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminHeader, ActionButton, BackButton } from "../../ui-helpers";
import { brand, newClients, newVendors } from "../../src-data";

function VerificationSidebar({ verifyTab, setVerifyTab }) {
  return (
    <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Verification Menu</div>
      <div className="mt-5 space-y-3">
        <button onClick={() => setVerifyTab("newVendor")} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold" style={verifyTab === "newVendor" ? { backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary } : { color: "#475569" }}><Building2 size={18} /> New Vendor</button>
        <button onClick={() => setVerifyTab("newClient")} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold" style={verifyTab === "newClient" ? { backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary } : { color: "#475569" }}><UserRound size={18} /> New Client</button>
      </div>
    </aside>
  );
}

export default function VerificationPage() {
  const [verifyTab, setVerifyTab] = useState("newVendor");
  const [selectedNewVendor, setSelectedNewVendor] = useState(null);
  const [selectedNewClient, setSelectedNewClient] = useState(null);

  const confirmVendor = (vendorId) => {
    alert(`Vendor ID ${vendorId} confirmed successfully.`);
    setSelectedNewVendor(null);
  };

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <AdminHeader title="Verification Page" subtitle="Logged in as admin@vizhiyal.com" onAlerts={() => {}} />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <VerificationSidebar verifyTab={verifyTab} setVerifyTab={(value) => { setSelectedNewVendor(null); setSelectedNewClient(null); setVerifyTab(value); }} />
          <div className="space-y-6">
            {!selectedNewVendor && !selectedNewClient && verifyTab === "newVendor" ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-bold text-slate-900">New Vendor Details</div>
                <div className="mt-6 space-y-4">
                  {newVendors.map((vendor) => <div key={vendor.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-4"><div><div className="text-lg font-semibold text-slate-900">{vendor.businessName}</div><div className="mt-1 text-sm text-slate-500">{vendor.ownerName} • {vendor.businessType}</div><div className="mt-2 text-sm text-slate-600">Submitted on {vendor.submittedDate}</div></div><ActionButton variant="secondary" onClick={() => setSelectedNewVendor(vendor)} className="inline-flex items-center gap-2"><Eye size={14} /> Open</ActionButton></div></div>)}
                </div>
              </div>
            ) : null}

            {!selectedNewVendor && !selectedNewClient && verifyTab === "newClient" ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-bold text-slate-900">New Client Details</div>
                <div className="mt-6 space-y-4">
                  {newClients.map((client) => <div key={client.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-4"><div><div className="text-lg font-semibold text-slate-900">{client.name}</div><div className="mt-1 text-sm text-slate-500">{client.email} • {client.phone}</div><div className="mt-2 text-sm text-slate-600">Registered on {client.submittedDate}</div></div><ActionButton variant="secondary" onClick={() => setSelectedNewClient(client)} className="inline-flex items-center gap-2"><Eye size={14} /> Open</ActionButton></div></div>)}
                </div>
              </div>
            ) : null}

            {selectedNewVendor ? (
              <div className="space-y-6">
                <BackButton label="Back to New Vendors" onClick={() => setSelectedNewVendor(null)} />
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Vendor Verification</div>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">{selectedNewVendor.businessName}</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
                    <div><strong>Business Type:</strong> {selectedNewVendor.businessType}</div>
                    <div><strong>Business Contact:</strong> {selectedNewVendor.businessContact}</div>
                    <div><strong>Business Address:</strong> {selectedNewVendor.businessAddress}</div>
                    <div><strong>Owner Name:</strong> {selectedNewVendor.ownerName}</div>
                    <div><strong>Owner Address:</strong> {selectedNewVendor.ownerAddress}</div>
                    <div><strong>Owner Contact:</strong> {selectedNewVendor.ownerContact}</div>
                    <div><strong>Owner Email:</strong> {selectedNewVendor.ownerEmail}</div>
                    <div><strong>Owner NIC:</strong> {selectedNewVendor.ownerNIC}</div>
                    <div><strong>Company BR:</strong> {selectedNewVendor.ownerBR}</div>
                    <div><strong>Submitted Date:</strong> {selectedNewVendor.submittedDate}</div>
                    <div className="md:col-span-2"><strong>Other Details:</strong> {selectedNewVendor.notes}</div>
                  </div>
                  <ActionButton variant="success" onClick={() => confirmVendor(selectedNewVendor.id)} className="mt-8 inline-flex items-center gap-2"><BadgeCheck size={16} /> Confirm Vendor</ActionButton>
                </div>
              </div>
            ) : null}

            {selectedNewClient ? (
              <div className="space-y-6">
                <BackButton label="Back to New Clients" onClick={() => setSelectedNewClient(null)} />
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Client Verification</div>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">{selectedNewClient.name}</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
                    <div><strong>Email:</strong> {selectedNewClient.email}</div>
                    <div><strong>Phone:</strong> {selectedNewClient.phone}</div>
                    <div><strong>Address:</strong> {selectedNewClient.address}</div>
                    <div><strong>Event Type:</strong> {selectedNewClient.eventType}</div>
                    <div><strong>NIC File:</strong> {selectedNewClient.nicFile}</div>
                    <div><strong>Submitted Date:</strong> {selectedNewClient.submittedDate}</div>
                    <div className="md:col-span-2"><strong>Other Details:</strong> {selectedNewClient.notes}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-6"><Link to="/admin"><ActionButton variant="secondary">Back to Admin Dashboard</ActionButton></Link></div>
      </div>
    </section>
  );
}