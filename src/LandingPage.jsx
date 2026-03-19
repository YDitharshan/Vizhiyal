import { useNavigate } from "react-router-dom";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FolderKanban,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  PieChart,
  Search,
  Settings,
  Star,
  TrendingUp,
  Trophy,
  UserCircle2,
  Users,
  X,
  BadgePercent,
} from "lucide-react";
import logo from "./assets/logo.png";

const brand = {
  primary: "#263E8B",
  secondary: "#E3A437",
  accent: "#2CA36B",
};

const vendors = [
  {
    id: 1,
    company: "Amazing Wedding Planners",
    eventType: "Wedding",
    location: "Colombo",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    short:
      "Elegant wedding planning with décor, venue styling, guest coordination, and premium photography support.",
    experience: 8,
    projects: 120,
    employees: 24,
    success: 98,
  },
  {
    id: 2,
    company: "Royal Event Makers",
    eventType: "Birthday",
    location: "Kandy",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    short:
      "Creative birthday event team for kids, adults, themed parties, stage setup, and entertainment management.",
    experience: 6,
    projects: 90,
    employees: 16,
    success: 95,
  },
  {
    id: 3,
    company: "Glow Party Hub",
    eventType: "Party",
    location: "Galle",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    short:
      "High-energy event production for private parties, DJ nights, light shows, and full venue coordination.",
    experience: 7,
    projects: 110,
    employees: 20,
    success: 97,
  },
  {
    id: 4,
    company: "Dream Day Events",
    eventType: "Wedding",
    location: "Jaffna",
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
    short:
      "Luxury wedding experiences with modern floral themes, stage concepts, and guest hospitality planning.",
    experience: 9,
    projects: 140,
    employees: 28,
    success: 99,
  },
  {
    id: 5,
    company: "Silverline Celebrations",
    eventType: "Corporate",
    location: "Negombo",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    short:
      "Corporate events, product launches, conferences, stage management, and executive guest arrangements.",
    experience: 10,
    projects: 160,
    employees: 32,
    success: 99,
  },
  {
    id: 6,
    company: "Happy Moments Crew",
    eventType: "Birthday",
    location: "Batticaloa",
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
    short:
      "Family-focused birthday planning with balloon décor, activity corners, games, and dessert table design.",
    experience: 5,
    projects: 72,
    employees: 14,
    success: 93,
  },
];

const packageList = [
  {
    name: "Silver",
    price: "LKR 75,000",
    bg: "linear-gradient(135deg, #F1F5F9, #E2E8F0)",
    items: ["Basic décor", "Event coordination", "Photo coverage", "2 staff members"],
  },
  {
    name: "Gold",
    price: "LKR 150,000",
    bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
    items: ["Premium décor", "Photo & video", "Guest support", "4 staff members"],
  },
  {
    name: "Platinum",
    price: "LKR 280,000",
    bg: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
    items: ["Luxury full setup", "Cinematic coverage", "Stage & lighting", "Dedicated event manager"],
  },
];

function AppButton({ children, onClick, type = "button", variant = "primary", className = "" }) {
  const base = "rounded-full px-5 py-3 text-sm font-semibold transition duration-300";
  const style =
    variant === "primary"
      ? { backgroundColor: brand.primary, color: "white" }
      : variant === "gold"
      ? { backgroundColor: brand.secondary, color: "#111827" }
      : { backgroundColor: "white", color: "#0f172a", border: "1px solid #e2e8f0" };

  return (
    <button type={type} onClick={onClick} className={`${base} ${className}`} style={style}>
      {children}
    </button>
  );
}

function SectionTitle({ eyebrow, title, text, center = false }) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.accent }}>
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{title}</h2>
      {text ? <p className={`mt-4 max-w-2xl text-slate-500 ${center ? "mx-auto" : ""}`}>{text}</p> : null}
    </div>
  );
}

function Stars({ value }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((item) => (
        <Star key={item} size={14} className={item <= Math.round(value) ? "fill-current" : ""} style={{ color: brand.secondary }} />
      ))}
      <span className="ml-1 text-sm font-medium text-slate-600">{value}</span>
    </div>
  );
}

function VendorCard({ vendor, onView }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <img src={vendor.image} alt={vendor.company} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
          {vendor.eventType}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{vendor.company}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={15} />
              {vendor.location}
            </div>
          </div>
          <Stars value={vendor.rating} />
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{vendor.short}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>
            {vendor.eventType} Vendor
          </span>
          <AppButton onClick={() => onView(vendor)} className="inline-flex items-center gap-2">
            View <ArrowRight size={16} />
          </AppButton>
        </div>
      </div>
    </motion.div>
  );
}

function Header({ page, setPage, onRegister, onLogin }) {
  const [open, setOpen] = useState(false);
  const nav = [
    { label: "Home", key: "home" },
    { label: "Vendors", key: "allVendors" },
    { label: "Contacts", key: "footer" },
  ];

  const handleNav = (key) => {
    setOpen(false);
    if (key === "footer") {
      document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setPage(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <button onClick={() => handleNav("home")} className="flex items-center gap-3 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src={logo} alt="Vizhiyal logo" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: brand.primary }}>Vizhiyal</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Event Management</div>
          </div>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <button key={item.key} onClick={() => handleNav(item.key)} className={`text-sm font-semibold ${page === item.key ? "text-slate-950" : "text-slate-500 hover:text-slate-900"}`}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
              <AppButton variant="secondary" onClick={onLogin}>
                Login
              </AppButton>
              <AppButton onClick={onRegister}>
                Register
              </AppButton>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-200 bg-white px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {nav.map((item) => (
                <button key={item.key} onClick={() => handleNav(item.key)} className="rounded-2xl bg-slate-50 px-4 py-3 text-left font-medium text-slate-700">
                  {item.label}
                </button>
              ))}
              <AppButton variant="secondary" onClick={() => { setOpen(false); setPage("login"); }}>Login</AppButton>
              <AppButton onClick={() => { setOpen(false); setPage("login"); }}>Register</AppButton>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function Hero({ filters, setFilters, onSearch }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at top left, rgba(38,62,139,0.10), transparent 30%), radial-gradient(circle at top right, rgba(227,164,55,0.16), transparent 26%), linear-gradient(180deg, #ffffff, #f8fbff)" }} />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.3em]" style={{ backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent }}>
              Modern Event Marketplace
            </span>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              Find the perfect vendor for your next celebration.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
              Explore beautiful event vendors for weddings, birthdays, parties, and corporate moments with a premium, modern Sri Lankan experience.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-8 rounded-[30px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/60">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 outline-none">
                <option value="">Event Type</option>
                <option>Wedding</option>
                <option>Birthday</option>
                <option>Party</option>
                <option>Corporate</option>
              </select>
              <select value={filters.location} onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 outline-none">
                <option value="">Location</option>
                <option>Colombo</option>
                <option>Kandy</option>
                <option>Galle</option>
                <option>Jaffna</option>
                <option>Negombo</option>
                <option>Batticaloa</option>
              </select>
              <AppButton onClick={onSearch} className="inline-flex min-h-[56px] items-center justify-center gap-2">
                <Search size={18} /> Search
              </AppButton>
            </div>
          </motion.div>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "Wedding Décor",
              "Birthday Planners",
              "Party Stages",
              "Corporate Setups",
            ].map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative z-10">
          <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70">
            <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80" alt="Hero" className="h-[520px] w-full rounded-[28px] object-cover" />
            <div className="absolute left-8 top-8 rounded-3xl bg-white/90 px-5 py-4 shadow-lg backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Trusted Vendors</p>
              <p className="mt-2 text-3xl font-black" style={{ color: brand.primary }}>150+</p>
            </div>
            <div className="absolute bottom-8 right-8 rounded-3xl px-5 py-4 text-white shadow-lg" style={{ backgroundColor: brand.accent }}>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/80">Bookings</p>
              <p className="mt-2 text-xl font-bold">Fast & Easy</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LandingPage({ vendors, onOpenVendor, onSearch, filters, setFilters, setPage }) {
  return (
    <>
      <Hero filters={filters} setFilters={setFilters} onSearch={onSearch} />

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <SectionTitle eyebrow="Top Vendors" title="Event Vendor Details" text="Discover premium vendors with company name, event type, location, ratings, and direct access to detailed profiles." />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vendors.slice(0, 6).map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onView={onOpenVendor} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <AppButton onClick={() => setPage("allVendors")} className="inline-flex items-center gap-2">
            View All Vendors <ArrowRight size={16} />
          </AppButton>
        </div>
      </section>
    </>
  );
}

function AllVendorsPage({ filteredVendors, onOpenVendor }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <SectionTitle eyebrow="Vendor Marketplace" title="All Vendor Details Page" text="Browse all vendor profiles with a polished card layout and direct access to detailed package information." />
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} onView={onOpenVendor} />
        ))}
      </div>
      {filteredVendors.length === 0 ? <div className="mt-10 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No vendors found for the selected filters.</div> : null}
    </section>
  );
}

function VendorDetailsPage({ vendor }) {
  if (!vendor) return null;

  const stats = [
    { label: "Year of Experience", value: `${vendor.experience}+`, icon: CalendarDays },
    { label: "Projects Completed", value: `${vendor.projects}+`, icon: Trophy },
    { label: "Total Employee", value: `${vendor.employees}`, icon: Users },
    { label: "Success Rating", value: `${vendor.success}%`, icon: BadgePercent },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <img src={vendor.image} alt={vendor.company} className="h-full min-h-[420px] w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.secondary }}>Vendor Profile</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{vendor.company}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2"><MapPin size={16} /> {vendor.location}</span>
            <span className="rounded-full px-3 py-1 font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>{vendor.eventType}</span>
            <Stars value={vendor.rating} />
          </div>
          <p className="mt-6 text-base leading-8 text-slate-600">
            {vendor.short} Our vendor team delivers stylish concepts, careful planning, and professional execution for memorable events across Sri Lanka.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {stats.map((item, index) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(44,163,107,0.10)" }}>
                  <item.icon style={{ color: brand.accent }} />
                </div>
                <div className="mt-4 text-3xl font-black text-slate-900">{item.value}</div>
                <div className="mt-1 text-sm text-slate-500">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <SectionTitle eyebrow="Package Details" title="Choose the best package for your event" text="Three pricing tiers with sample features and Sri Lankan prices for demo purposes." center />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {packageList.map((item, index) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
              <div className="p-6" style={{ background: item.bg }}>
                <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-600">{item.name} Package</div>
                <div className="mt-3 text-4xl font-black text-slate-900">{item.price}</div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {item.items.map((row) => (
                    <div key={row} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 size={18} style={{ color: brand.accent }} className="mt-0.5 shrink-0" />
                      <span>{row}</span>
                    </div>
                  ))}
                </div>
                <AppButton className="mt-8 inline-flex w-full items-center justify-center gap-2">
                  Contact Vendor <Phone size={16} />
                </AppButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoginPage({ onLogin }) {
  const [role, setRole] = useState("Vendor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="relative overflow-hidden px-5 py-16 lg:px-8">
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at top left, rgba(38,62,139,0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(44,163,107,0.12), transparent 28%), linear-gradient(180deg, #ffffff, #f8fbff)" }} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.primary }}>Welcome Back</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Login to continue to your dashboard.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">
            Sign in as a Vendor or Client. Vendor goes to the vendor dashboard. Client goes to a temporary placeholder dashboard.
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Vizhiyal logo" className="h-12 w-12 rounded-2xl border border-slate-200 p-1" />
            <div>
              <div className="font-bold" style={{ color: brand.primary }}>Vizhiyal</div>
              <div className="text-sm text-slate-400">Login Page</div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                <Mail size={18} className="text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter email" className="w-full outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                <Lock size={18} className="text-slate-400" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter password" className="w-full outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">Login as</label>
              <div className="grid grid-cols-2 gap-3">
                {["Vendor", "Client"].map((item) => (
                  <button key={item} onClick={() => setRole(item)} className="rounded-2xl border px-4 py-4 text-sm font-bold transition" style={role === item ? { backgroundColor: brand.primary, borderColor: brand.primary, color: "white" } : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#334155" }}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <AppButton onClick={() => onLogin({ email, role, password })} className="w-full">
              Login
            </AppButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone = "blue" }) {
  const toneMap = {
    blue: { bg: "#EEF2FF", color: brand.primary },
    gold: { bg: "#FFF5E8", color: "#A16207" },
    green: { bg: "#EAF8F1", color: brand.accent },
    slate: { bg: "#F1F5F9", color: "#475569" },
  };
  const selected = toneMap[tone];
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{title}</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{note}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: selected.bg }}>
          <Icon style={{ color: selected.color }} />
        </div>
      </div>
    </motion.div>
  );
}

function SimpleBarChart() {
  const data = [55, 72, 68, 84, 77, 92, 88];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">Weekly Performance</div>
          <div className="text-sm text-slate-500">Project engagement showcase</div>
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>
          +14%
        </div>
      </div>
      <div className="mt-8 flex h-56 items-end justify-between gap-3">
        {data.map((value, index) => (
          <div key={labels[index]} className="flex flex-1 flex-col items-center justify-end gap-3">
            <motion.div initial={{ height: 0 }} animate={{ height: `${value * 1.6}px` }} transition={{ duration: 0.6, delay: index * 0.06 }} className="w-full rounded-t-2xl" style={{ background: index % 2 === 0 ? `linear-gradient(180deg, ${brand.primary}, #4F6EDB)` : `linear-gradient(180deg, ${brand.accent}, #5BC78F)` }} />
            <span className="text-xs font-medium text-slate-400">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimplePieShowcase() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">Success Ratio</div>
          <div className="text-sm text-slate-500">Delivery quality overview</div>
        </div>
        <PieChart style={{ color: brand.secondary }} />
      </div>
      <div className="mt-6 flex items-center gap-8">
        <div className="relative h-40 w-40 rounded-full" style={{ background: `conic-gradient(${brand.accent} 0deg 306deg, ${brand.secondary} 306deg 338deg, #E2E8F0 338deg 360deg)` }}>
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center">
            <div>
              <div className="text-3xl font-black text-slate-950">85%</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Success</div>
            </div>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.accent }} /> Completed</div>
          <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.secondary }} /> Ongoing</div>
          <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-slate-200" /> Pending</div>
        </div>
      </div>
    </div>
  );
}

function VendorDashboard({ user, setPage }) {
  const messages = [
    {
      name: "Nadeesha Perera",
      tag: "Wedding Client",
      time: "10:30 AM",
      text: "Can we finalize the Gold package with floral entrance décor and photography add-on?",
      unread: true,
    },
    {
      name: "Kasun Fernando",
      tag: "Birthday Client",
      time: "Yesterday",
      text: "Please send the updated quotation for the kids birthday setup in Kandy.",
      unread: false,
    },
    {
      name: "Ayesha Silva",
      tag: "Corporate Client",
      time: "Mon",
      text: "We need stage branding, sound system, and a registration desk for our company launch.",
      unread: false,
    },
  ];

  const projects = [
    { title: "Royal Wedding Setup", status: "Completed", amount: "LKR 180,000", tone: "green" },
    { title: "Colombo Birthday Theme", status: "Ongoing", amount: "LKR 95,000", tone: "gold" },
    { title: "Corporate Summit Décor", status: "Completed", amount: "LKR 240,000", tone: "blue" },
    { title: "Engagement Party Design", status: "Ongoing", amount: "LKR 120,000", tone: "slate" },
  ];

  return (
    <section className="bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
              <UserCircle2 size={34} style={{ color: brand.primary }} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">Vendor Dashboard</div>
              <div className="text-2xl font-black text-slate-950">{user?.role || "Vendor"} Account</div>
              <div className="mt-1 text-sm text-slate-500">{user?.email || "vendor@vizhiyal.com"} • Amazing Wedding Planners</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Bell size={16} /> 4 Alerts
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Settings size={16} /> Settings
            </button>
            <AppButton onClick={() => setPage("home")}>Back to Site</AppButton>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Menu</div>
            <div className="mt-5 space-y-3">
              {[
                [LayoutDashboard, "Main Dashboard", true],
                [FolderKanban, "Projects", false],
                [MessageSquare, "Messages", false],
                [DollarSign, "Earnings", false],
                [Briefcase, "Services", false],
              ].map(([Icon, label, active]) => (
                <button key={label} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition" style={active ? { backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary } : { color: "#475569" }}>
                  <Icon size={18} /> {label}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] p-5" style={{ backgroundColor: "rgba(44,163,107,0.10)" }}>
              <div className="text-sm font-bold" style={{ color: brand.accent }}>Quick Summary</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>Completed</span><strong>148</strong></div>
                <div className="flex items-center justify-between"><span>Ongoing</span><strong>12</strong></div>
                <div className="flex items-center justify-between"><span>Unread Messages</span><strong>09</strong></div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Completed Project" value="148" note="Finished successfully" icon={Trophy} tone="green" />
              <MetricCard title="Ongoing Project" value="12" note="Currently active" icon={Clock3} tone="gold" />
              <MetricCard title="Total Earning" value="LKR 2.8M" note="This financial period" icon={DollarSign} tone="blue" />
              <MetricCard title="Success Ratio" value="85%" note="Client satisfaction" icon={TrendingUp} tone="slate" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <SimpleBarChart />
              <SimplePieShowcase />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-slate-900">Recent Projects</div>
                    <div className="text-sm text-slate-500">Completed and ongoing works</div>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(227,164,55,0.16)", color: "#8A5A00" }}>
                    Updated today
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {projects.map((project) => (
                    <div key={project.title} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <div className="font-semibold text-slate-900">{project.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{project.amount}</div>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={project.tone === "green" ? { backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent } : project.tone === "gold" ? { backgroundColor: "rgba(227,164,55,0.16)", color: "#8A5A00" } : project.tone === "blue" ? { backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary } : { backgroundColor: "#F1F5F9", color: "#475569" }}>
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-slate-900">Client Messages</div>
                    <div className="text-sm text-slate-500">Full messages from clients</div>
                  </div>
                  <MessageSquare style={{ color: brand.primary }} />
                </div>
                <div className="mt-6 space-y-4">
                  {messages.map((message) => (
                    <motion.div key={message.name} whileHover={{ x: 4 }} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{message.name}</span>
                            {message.unread ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brand.accent }} /> : null}
                          </div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{message.tag}</div>
                        </div>
                        <div className="text-xs text-slate-400">{message.time}</div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{message.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPlaceholder({ user }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[34px] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
        <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.accent }}>Dashboard Placeholder</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Welcome, {user?.role || "User"}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-500">
          Logged in as <span className="font-semibold text-slate-700">{user?.email || "demo@vizhiyal.com"}</span>. This page is a temporary placeholder. Your real dashboard can be built next in the same UI style.
        </p>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="footer" className="mt-10 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 text-center lg:flex-row lg:px-8 lg:text-left">
        <div>
          <div className="text-xl font-black" style={{ color: brand.primary }}>Vizhiyal - Event Management System</div>
          <div className="mt-2 text-sm text-slate-500">Modern event vendor marketplace UI</div>
        </div>
        <div className="text-sm font-semibold text-slate-600">Developed by Group 30</div>
      </div>
    </footer>
  );
}

export default function VizhiyalEventManagementUI() {
  const navigate = useNavigate();
  const [page, setPage] = useState("home");
  const [selectedVendor, setSelectedVendor] = useState(vendors[0]);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({ type: "", location: "" });

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchType = filters.type ? vendor.eventType === filters.type : true;
      const matchLocation = filters.location ? vendor.location === filters.location : true;
      return matchType && matchLocation;
    });
  }, [filters]);

  const openVendor = (vendor) => {
    setSelectedVendor(vendor);
    setPage("vendorDetails");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const searchVendors = () => {
    setPage("allVendors");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = (loginUser) => {
    setUser(loginUser);
    const normalizedRole = String(loginUser?.role || "").trim().toLowerCase();
    setPage(normalizedRole === "vendor" ? "vendorDashboard" : "dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header
        page={page}
        setPage={setPage}
        onRegister={() => navigate("/register")}
        onLogin={() => setPage("login")}
      />
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
          {page === "home" ? <LandingPage vendors={vendors} onOpenVendor={openVendor} onSearch={searchVendors} filters={filters} setFilters={setFilters} setPage={setPage} /> : null}
          {page === "allVendors" ? <AllVendorsPage filteredVendors={filteredVendors} onOpenVendor={openVendor} /> : null}
          {page === "vendorDetails" ? <VendorDetailsPage vendor={selectedVendor} /> : null}
          {page === "login" ? <LoginPage onLogin={handleLogin} /> : null}
          {page === "vendorDashboard" ? <VendorDashboard user={user} setPage={setPage} /> : null}
          {page === "dashboard" ? <DashboardPlaceholder user={user} /> : null}
        </motion.div>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
