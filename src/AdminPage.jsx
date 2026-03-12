import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Lock,
  LayoutDashboard,
  Users,
  UserRound,
  BadgeDollarSign,
  TrendingUp,
  Store,
  Eye,
  Pencil,
  Trash2,
  Search,
  Bell,
  Settings,
  ArrowLeft,
  CreditCard,
  Wallet,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

const brand = {
  primary: "#263E8B",
  secondary: "#E3A437",
  accent: "#2CA36B",
};

const vendors = [
  {
    id: 1,
    company: "Amazing Wedding Planners",
    category: "Wedding",
    owner: "Nadeesha Perera",
    email: "amazingwedding@gmail.com",
    phone: "+94 71 222 3344",
    location: "Colombo",
    rating: 4.9,
    totalOrders: 148,
    totalIncome: "LKR 2,850,000",
    paidAmount: "LKR 2,500,000",
    pendingAmount: "LKR 350,000",
    status: "Active",
  },
  {
    id: 2,
    company: "Royal Event Makers",
    category: "Birthday",
    owner: "Kasun Fernando",
    email: "royalevents@gmail.com",
    phone: "+94 77 445 6789",
    location: "Kandy",
    rating: 4.7,
    totalOrders: 96,
    totalIncome: "LKR 1,650,000",
    paidAmount: "LKR 1,420,000",
    pendingAmount: "LKR 230,000",
    status: "Active",
  },
  {
    id: 3,
    company: "Glow Party Hub",
    category: "Party",
    owner: "Ayesha Silva",
    email: "glowparty@gmail.com",
    phone: "+94 75 123 9900",
    location: "Galle",
    rating: 4.8,
    totalOrders: 121,
    totalIncome: "LKR 2,100,000",
    paidAmount: "LKR 1,900,000",
    pendingAmount: "LKR 200,000",
    status: "Pending Review",
  },
];

const clients = [
  {
    id: 1,
    name: "Dilshan Raj",
    email: "dilshanraj@gmail.com",
    phone: "+94 70 555 1122",
    location: "Colombo",
    vendorNeeded: "Amazing Wedding Planners",
    serviceType: "Wedding Full Package",
    paymentStatus: "Partially Paid",
    paid: "LKR 120,000",
    pending: "LKR 30,000",
  },
  {
    id: 2,
    name: "Malsha Fernando",
    email: "malshafernando@gmail.com",
    phone: "+94 76 111 8888",
    location: "Jaffna",
    vendorNeeded: "Royal Event Makers",
    serviceType: "Birthday Gold Package",
    paymentStatus: "Paid",
    paid: "LKR 95,000",
    pending: "LKR 0",
  },
  {
    id: 3,
    name: "Ruvin Peris",
    email: "ruvinperis@gmail.com",
    phone: "+94 78 444 6677",
    location: "Negombo",
    vendorNeeded: "Glow Party Hub",
    serviceType: "Party Light & DJ Setup",
    paymentStatus: "Pending",
    paid: "LKR 40,000",
    pending: "LKR 60,000",
  },
];

function ActionButton({ children, onClick, type = "button", variant = "primary", className = "" }) {
  const styles =
    variant === "primary"
      ? { backgroundColor: brand.primary, color: "white" }
      : variant === "secondary"
      ? { backgroundColor: "white", color: "#0f172a", border: "1px solid #e2e8f0" }
      : variant === "gold"
      ? { backgroundColor: brand.secondary, color: "#111827" }
      : { backgroundColor: "#fee2e2", color: "#991b1b" };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-300 ${className}`}
      style={styles}
    >
      {children}
    </button>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: { bg: "#EEF2FF", color: brand.primary },
    gold: { bg: "#FFF5E8", color: "#A16207" },
    green: { bg: "#EAF8F1", color: brand.accent },
    slate: { bg: "#F1F5F9", color: "#475569" },
  };
  const t = tones[tone];
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{title}</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{note}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: t.bg }}>
          <Icon style={{ color: t.color }} />
        </div>
      </div>
    </motion.div>
  );
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(38,62,139,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(44,163,107,0.10),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.primary }}>
            Admin Access
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Login to the Vizhiyal admin panel.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">
            Monitor vendors, clients, income, revenue, and platform operations from one modern dashboard.
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ShieldCheck style={{ color: brand.primary }} />
            </div>
            <div>
              <div className="font-bold" style={{ color: brand.primary }}>Vizhiyal Admin</div>
              <div className="text-sm text-slate-400">Secure Login</div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                <Mail size={18} className="text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@vizhiyal.com" className="w-full outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                <Lock size={18} className="text-slate-400" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter password" className="w-full outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <ActionButton onClick={() => onLogin({ email, password })} className="w-full">
              Login to Admin Dashboard
            </ActionButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AdminSidebar({ section, setSection }) {
  const items = [
    ["dashboard", LayoutDashboard, "Dashboard"],
    ["vendors", Store, "Manage Vendors"],
    ["clients", Users, "Manage Clients"],
  ];

  return (
    <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Admin Menu</div>
      <div className="mt-5 space-y-3">
        {items.map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition"
            style={section === key ? { backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary } : { color: "#475569" }}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-[24px] p-5" style={{ backgroundColor: "rgba(44,163,107,0.10)" }}>
        <div className="text-sm font-bold" style={{ color: brand.accent }}>Quick Overview</div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between"><span>Vendors</span><strong>28</strong></div>
          <div className="flex items-center justify-between"><span>Clients</span><strong>146</strong></div>
          <div className="flex items-center justify-between"><span>Pending Reviews</span><strong>05</strong></div>
        </div>
      </div>
    </aside>
  );
}

function SimpleRevenueChart() {
  const data = [45, 58, 62, 70, 82, 76, 91];
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">Revenue Growth</div>
          <div className="text-sm text-slate-500">Monthly admin platform performance</div>
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>
          +18%
        </div>
      </div>
      <div className="mt-8 flex h-56 items-end justify-between gap-3">
        {data.map((value, index) => (
          <div key={labels[index]} className="flex flex-1 flex-col items-center justify-end gap-3">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${value * 1.6}px` }}
              transition={{ duration: 0.6, delay: index * 0.06 }}
              className="w-full rounded-t-2xl"
              style={{ background: index % 2 === 0 ? `linear-gradient(180deg, ${brand.primary}, #4F6EDB)` : `linear-gradient(180deg, ${brand.accent}, #5BC78F)` }}
            />
            <span className="text-xs font-medium text-slate-400">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboardHome() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Vendors" value="28" note="Registered service providers" icon={Store} tone="blue" />
        <MetricCard title="Total Clients" value="146" note="Active customer accounts" icon={Users} tone="green" />
        <MetricCard title="Total Income" value="LKR 8.9M" note="Platform wide income" icon={BadgeDollarSign} tone="gold" />
        <MetricCard title="Revenue" value="LKR 3.4M" note="Net admin revenue" icon={TrendingUp} tone="slate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SimpleRevenueChart />
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-bold text-slate-900">System Highlights</div>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><CheckCircle2 style={{ color: brand.accent }} /> 23 vendors are actively taking orders.</div>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><ClipboardList style={{ color: brand.secondary }} /> 17 new bookings this week.</div>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><CreditCard style={{ color: brand.primary }} /> 8 pending payment confirmations need review.</div>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><Bell style={{ color: brand.primary }} /> 5 vendor profiles require approval updates.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageVendors({ onOpenVendor }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">Manage Vendors</div>
          <div className="text-sm text-slate-500">Open, edit, or delete vendor profiles</div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input placeholder="Search vendors" className="outline-none" />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="pb-4 pr-4 font-semibold">Company</th>
              <th className="pb-4 pr-4 font-semibold">Category</th>
              <th className="pb-4 pr-4 font-semibold">Location</th>
              <th className="pb-4 pr-4 font-semibold">Status</th>
              <th className="pb-4 pr-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b border-slate-100">
                <td className="py-4 pr-4">
                  <div className="font-semibold text-slate-900">{vendor.company}</div>
                  <div className="text-slate-500">{vendor.owner}</div>
                </td>
                <td className="py-4 pr-4 text-slate-600">{vendor.category}</td>
                <td className="py-4 pr-4 text-slate-600">{vendor.location}</td>
                <td className="py-4 pr-4">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={vendor.status === "Active" ? { backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent } : { backgroundColor: "rgba(227,164,55,0.16)", color: "#8A5A00" }}>
                    {vendor.status}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton variant="secondary" onClick={() => onOpenVendor(vendor)} className="inline-flex items-center gap-2">
                      <Eye size={14} /> Open
                    </ActionButton>
                    <ActionButton variant="gold" className="inline-flex items-center gap-2">
                      <Pencil size={14} /> Edit
                    </ActionButton>
                    <ActionButton variant="danger" className="inline-flex items-center gap-2">
                      <Trash2 size={14} /> Delete
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorProfileAdmin({ vendor, onBack }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <ActionButton variant="secondary" onClick={onBack} className="inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Vendors
        </ActionButton>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Vendor Profile</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{vendor.company}</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div><strong>Owner:</strong> {vendor.owner}</div>
              <div><strong>Email:</strong> {vendor.email}</div>
              <div><strong>Phone:</strong> {vendor.phone}</div>
              <div><strong>Location:</strong> {vendor.location}</div>
              <div><strong>Category:</strong> {vendor.category}</div>
              <div><strong>Rating:</strong> {vendor.rating} / 5</div>
            </div>
          </div>
          <span className="rounded-full px-4 py-2 text-sm font-semibold" style={vendor.status === "Active" ? { backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent } : { backgroundColor: "rgba(227,164,55,0.16)", color: "#8A5A00" }}>
            {vendor.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Orders" value={String(vendor.totalOrders)} note="Orders handled" icon={ClipboardList} tone="blue" />
        <MetricCard title="Income" value={vendor.totalIncome} note="Gross vendor income" icon={Wallet} tone="green" />
        <MetricCard title="Paid Amount" value={vendor.paidAmount} note="Already settled" icon={CreditCard} tone="gold" />
        <MetricCard title="Pending Amount" value={vendor.pendingAmount} note="Waiting for payment" icon={BadgeDollarSign} tone="slate" />
      </div>
    </div>
  );
}

function ManageClients({ onOpenClient }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="text-lg font-bold text-slate-900">Manage Clients</div>
        <div className="text-sm text-slate-500">View clients, needed vendor services, and payment details</div>
      </div>

      <div className="mt-6 space-y-4">
        {clients.map((client) => (
          <motion.div key={client.id} whileHover={{ y: -2 }} className="rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">{client.name}</div>
                <div className="mt-1 text-sm text-slate-500">{client.email} • {client.phone}</div>
                <div className="mt-2 text-sm text-slate-600">
                  Needs <strong>{client.vendorNeeded}</strong> for <strong>{client.serviceType}</strong>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full px-3 py-2 text-xs font-semibold" style={client.paymentStatus === "Paid" ? { backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent } : client.paymentStatus === "Pending" ? { backgroundColor: "rgba(254,226,226,1)", color: "#991b1b" } : { backgroundColor: "rgba(227,164,55,0.16)", color: "#8A5A00" }}>
                  {client.paymentStatus}
                </span>
                <ActionButton variant="secondary" onClick={() => onOpenClient(client)} className="inline-flex items-center gap-2">
                  <Eye size={14} /> Open
                </ActionButton>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ClientProfileAdmin({ client, onBack }) {
  return (
    <div className="space-y-6">
      <ActionButton variant="secondary" onClick={onBack} className="inline-flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Clients
      </ActionButton>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Client Details</div>
        <h2 className="mt-2 text-3xl font-black text-slate-950">{client.name}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
          <div><strong>Email:</strong> {client.email}</div>
          <div><strong>Phone:</strong> {client.phone}</div>
          <div><strong>Location:</strong> {client.location}</div>
          <div><strong>Vendor Needed:</strong> {client.vendorNeeded}</div>
          <div><strong>Service Type:</strong> {client.serviceType}</div>
          <div><strong>Payment Status:</strong> {client.paymentStatus}</div>
          <div><strong>Paid Amount:</strong> {client.paid}</div>
          <div><strong>Pending Amount:</strong> {client.pending}</div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardPage({ adminUser }) {
  const [section, setSection] = useState("dashboard");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const pageTitle = useMemo(() => {
    if (selectedVendor) return "Vendor Profile";
    if (selectedClient) return "Client Profile";
    if (section === "vendors") return "Manage Vendors";
    if (section === "clients") return "Manage Clients";
    return "Admin Dashboard";
  }, [section, selectedVendor, selectedClient]);

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">Admin Panel</div>
            <div className="text-2xl font-black text-slate-950">{pageTitle}</div>
            <div className="mt-1 text-sm text-slate-500">Logged in as {adminUser?.email || "admin@vizhiyal.com"}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Bell size={16} /> Alerts
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Settings size={16} /> Settings
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <AdminSidebar section={section} setSection={(value) => { setSelectedVendor(null); setSelectedClient(null); setSection(value); }} />
          <div className="space-y-6">
            {!selectedVendor && !selectedClient && section === "dashboard" ? <AdminDashboardHome /> : null}
            {!selectedVendor && !selectedClient && section === "vendors" ? <ManageVendors onOpenVendor={(vendor) => setSelectedVendor(vendor)} /> : null}
            {!selectedVendor && !selectedClient && section === "clients" ? <ManageClients onOpenClient={(client) => setSelectedClient(client)} /> : null}
            {selectedVendor ? <VendorProfileAdmin vendor={selectedVendor} onBack={() => setSelectedVendor(null)} /> : null}
            {selectedClient ? <ClientProfileAdmin client={selectedClient} onBack={() => setSelectedClient(null)} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function VizhiyalAdminPages() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const handleLogin = (user) => {
    setAdminUser(user);
    setLoggedIn(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <AnimatePresence mode="wait">
        <motion.div key={loggedIn ? "dashboard" : "login"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          {loggedIn ? <AdminDashboardPage adminUser={adminUser} /> : <AdminLogin onLogin={handleLogin} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
