import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, Search } from "lucide-react";
import logo from "../assets/logo.png";
import { brand, vendors } from "../src-data";
import { ActionButton, Stars } from "../ui-helpers";

function VendorCard({ vendor }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <img src={vendor.image} alt={vendor.company} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">{vendor.category}</div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{vendor.company}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin size={15} />{vendor.location}</div>
          </div>
          <Stars value={vendor.rating} />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">{vendor.short}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}>{vendor.category}</span>
          <Link to={`/vendor/${vendor.id}`}><ActionButton className="inline-flex items-center gap-2">View <ArrowRight size={16} /></ActionButton></Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={logo} alt="Vizhiyal logo" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: brand.primary }}>Vizhiyal</div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Event Management</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/" className="text-sm font-semibold text-slate-900">Home</Link>
            <a href="#vendors" className="text-sm font-semibold text-slate-500 hover:text-slate-900">Vendors</a>
            <a href="#footer" className="text-sm font-semibold text-slate-500 hover:text-slate-900">Contacts</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login"><ActionButton variant="secondary">Login</ActionButton></Link>
            <ActionButton onClick={() => navigate("/register")}>Register</ActionButton>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at top left, rgba(38,62,139,0.10), transparent 30%), radial-gradient(circle at top right, rgba(227,164,55,0.16), transparent 26%), linear-gradient(180deg, #ffffff, #f8fbff)" }} />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            <span className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.3em]" style={{ backgroundColor: "rgba(44,163,107,0.12)", color: brand.accent }}>Modern Event Marketplace</span>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">Find the perfect vendor for your next celebration.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">Explore beautiful event vendors for weddings, birthdays, parties, and corporate moments with a premium, modern Sri Lankan experience.</p>
            <div className="mt-8 rounded-[30px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/60">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 outline-none"><option>Event Type</option><option>Wedding</option><option>Birthday</option><option>Party</option></select>
                <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 outline-none"><option>Location</option><option>Colombo</option><option>Kandy</option><option>Galle</option></select>
                <Link to="/#vendors"><ActionButton className="inline-flex min-h-[56px] items-center justify-center gap-2"><Search size={18} /> Search</ActionButton></Link>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70">
              <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80" alt="Hero" className="h-[520px] w-full rounded-[28px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="vendors" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.accent }}>Top Vendors</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Event Vendor Details</h2>
          <p className="mt-4 max-w-2xl text-slate-500">Discover premium vendors with company name, event type, location, ratings, and direct access to detailed profiles.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
        </div>
      </section>

      <footer id="footer" className="mt-10 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 text-center lg:flex-row lg:px-8 lg:text-left">
          <div>
            <div className="text-xl font-black" style={{ color: brand.primary }}>Vizhiyal - Event Management System</div>
            <div className="mt-2 text-sm text-slate-500">Modern event vendor marketplace UI</div>
          </div>
          <div className="text-sm font-semibold text-slate-600">Developed by Group 30</div>
        </div>
      </footer>
    </div>
  );
}