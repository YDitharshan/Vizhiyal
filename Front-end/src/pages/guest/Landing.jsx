// GuestLanding — marketing homepage for non-logged-in visitors
// Fiverr-style: dark hero, categories, popular services, promo, how it works, footer

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronDown, Star, CheckCircle,
  Shield, Camera, Lock, Globe,
  // Category icons
  Sparkles, UtensilsCrossed, Building2, Music, Palette, Video, Cake,
  // Feature icons
  Trophy, Zap, BadgeCheck,
} from "lucide-react";
const categories = ["All","Photography","Decoration","Catering","Venue","Music & DJ","Makeup & Beauty","Videography","Cakes & Sweets"];

// ── Data ──────────────────────────────────────────────────────────────────────

const catMeta = [
  { name: "Photography",  icon: Camera,          color: "from-emerald-800 to-emerald-600", seed: "photo1"   },
  { name: "Decoration",   icon: Sparkles,        color: "from-purple-800  to-purple-600",  seed: "decor2"   },
  { name: "Catering",     icon: UtensilsCrossed, color: "from-orange-800  to-orange-600",  seed: "catering3"},
  { name: "Venue",        icon: Building2,       color: "from-sky-800     to-sky-600",     seed: "venue4"   },
  { name: "Music & DJ",   icon: Music,           color: "from-pink-800    to-pink-600",    seed: "music5"   },
  { name: "Makeup",       icon: Palette,         color: "from-rose-800    to-rose-600",    seed: "makeup6"  },
  { name: "Videography",  icon: Video,           color: "from-blue-800    to-blue-600",    seed: "video7"   },
  { name: "Cakes",        icon: Cake,            color: "from-amber-700   to-amber-500",   seed: "cake8"    },
];

const trustLogos = [
  "Events.lk", "WeddingWire", "Hitched.lk", "Cinnamon Hotels", "Hemas", "Keells"
];

const howItWorks = [
  { icon: Search,       step: "01", title: "Search Vendors",   desc: "Browse top-rated event vendors across Sri Lanka by category and location." },
  { icon: Star,         step: "02", title: "Compare Packages", desc: "Review Basic, Standard, and Premium packages side by side." },
  { icon: Camera,       step: "03", title: "Book & Confirm",   desc: "Fill in your event details and confirm your booking in minutes." },
  { icon: Shield,       step: "04", title: "Pay Securely",     desc: "Funds are held in escrow and released only after your event." },
];

const features = [
  { icon: Trophy,     title: "Top talent",        desc: "Access 100+ verified vendors across all event categories in Sri Lanka." },
  { icon: Zap,        title: "Simple & easy",      desc: "Enjoy a clean, intuitive booking experience from search to payment." },
  { icon: BadgeCheck, title: "Quality assured",    desc: "Every vendor is reviewed by real clients with star ratings." },
  { icon: Lock,       title: "Pay when satisfied", desc: "Escrow-style payment — you only pay when your event is complete." },
];

const tagPills = ["Wedding", "Birthday", "Corporate", "Engagement", "Anniversary"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuestLanding() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
    navigate(`/search${params}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Guest Navbar ──────────────────────────────────────────── */}
      <nav className="absolute top-0 left-0 right-0 z-30 px-6 sm:px-10 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="text-white text-2xl font-bold tracking-tight select-none"
        >
          vizhiyal<span className="text-secondary">.</span>
        </button>

        {/* Right links */}
        <div className="flex items-center gap-2 sm:gap-4 text-white text-sm font-medium">
          <button className="hidden md:flex items-center gap-1 hover:text-secondary transition-colors">
            Explore <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="hidden md:block hover:text-secondary transition-colors">
            How it Works
          </button>
          <button
            onClick={() => navigate("/login")}
            className="hover:text-secondary transition-colors px-2"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/register")}
            className="border border-white text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            Join
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative h-[540px] sm:h-[580px] flex items-center overflow-hidden">
        <img
          src="https://picsum.photos/seed/eventhero2/1400/580"
          alt="Event"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

        <div className="relative z-10 w-full max-w-2xl ml-8 sm:ml-16 lg:ml-24 px-4">
          <h1 className="text-white text-4xl sm:text-5xl font-bold leading-tight mb-3">
            Your event,<br />
            <span className="text-secondary">perfectly planned.</span>
          </h1>
          <p className="text-gray-300 text-base mb-6">
            Find and book top event vendors across Sri Lanka
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex bg-white rounded-lg overflow-hidden shadow-2xl w-full max-w-xl"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "Wedding photography" or "Catering Colombo"'
              className="flex-1 px-4 py-3.5 text-sm text-gray-700 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 px-5 flex items-center gap-2 text-white text-sm font-medium transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Tag pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-gray-400 text-xs self-center">Popular:</span>
            {tagPills.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/search?search=${encodeURIComponent(tag)}`)}
                className="text-white text-xs border border-white/40 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted by ────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-5 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <p className="text-xs text-gray-400 font-medium whitespace-nowrap">Trusted by</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-10 items-center">
            {trustLogos.map((logo) => (
              <span key={logo} className="text-gray-300 font-bold text-sm sm:text-base tracking-wide">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category icon grid ─────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-5">
          {catMeta.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => navigate(`/search?category=${encodeURIComponent(name)}`)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center group-hover:border-primary group-hover:bg-primary-50 transition-all">
                <Icon className="w-7 h-7 text-gray-500 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-gray-500 text-center leading-tight group-hover:text-primary transition-colors">
                {name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Popular Services ─────────────────────────────────────── */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">Popular services</h2>
        <div className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar">
          {catMeta.map(({ name, icon: Icon, color, seed }) => (
            <button
              key={name}
              onClick={() => navigate(`/search?category=${encodeURIComponent(name)}`)}
              className={`relative flex-shrink-0 w-44 h-36 rounded-2xl overflow-hidden bg-gradient-to-br ${color} group`}
            >
              <img
                src={`https://picsum.photos/seed/${seed}/300/200`}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <Icon className="w-7 h-7 text-white/90" />
                <span className="text-white font-bold text-sm">{name}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Promo Banner ──────────────────────────────────────────── */}
      <section className="py-6 px-4 max-w-6xl mx-auto">
        <div className="relative bg-gradient-to-r from-primary-dark via-primary to-primary-light rounded-2xl p-8 overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Text */}
          <div className="relative z-10 flex-1">
            <span className="text-secondary text-xs font-bold uppercase tracking-widest mb-2 block">
              Vizhiyal Pro
            </span>
            <h3 className="text-white text-2xl font-bold mb-3 leading-snug">
              Let experts find the right<br />vendor for you
            </h3>
            <ul className="space-y-1.5 mb-5">
              {[
                "Work with vendors who are vetted & verified",
                "Get curated recommendations based on your event",
                "100% money-back guarantee",
              ].map((pt) => (
                <li key={pt} className="text-white/80 text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                  {pt}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/home")}
              className="bg-white text-primary text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
            >
              Discover vendors
            </button>
          </div>

          {/* Image */}
          <div className="hidden md:block relative z-10 flex-shrink-0">
            <img
              src="https://picsum.photos/seed/promo42/300/200"
              alt="Promo"
              className="rounded-xl w-64 h-44 object-cover opacity-80"
            />
          </div>

          {/* Decorative circles */}
          <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -right-4 bottom-0 w-32 h-32 bg-white/5 rounded-full" />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-14 px-4 max-w-6xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-800">How Vizhiyal works</h2>
          <p className="text-gray-400 text-sm mt-1">Plan your perfect event in just a few steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorks.map(({ icon: Icon, step, title, desc }, i) => (
            <div key={title} className="relative">
              {/* Connector line */}
              {i < 3 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-full h-px border-t-2 border-dashed border-gray-150 z-0" />
              )}
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mb-4 relative">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {step.slice(1)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Make it happen ──────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
            Make it happen with Vizhiyal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate("/register")}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
            >
              Join Now
            </button>
          </div>
        </div>
      </section>

      {/* ── Guides / highlights ─────────────────────────────────── */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Guides to help you plan</h2>
          <button className="text-sm text-primary font-medium hover:underline">See more</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { seed: "guide1", title: "Start planning your dream wedding",      sub: "Wedding planning guide" },
            { seed: "guide2", title: "Corporate event ideas that impress",      sub: "Corporate events"       },
            { seed: "guide3", title: "Birthday party themes on any budget",     sub: "Birthday planning"      },
          ].map((g) => (
            <button
              key={g.seed}
              onClick={() => navigate("/search")}
              className="relative rounded-2xl overflow-hidden h-44 group text-left"
            >
              <img
                src={`https://picsum.photos/seed/${g.seed}/400/220`}
                alt={g.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-xs text-secondary font-semibold mb-0.5">{g.sub}</p>
                <p className="text-white text-sm font-semibold leading-snug">{g.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-primary-dark text-center">
        <h2 className="text-white text-3xl sm:text-4xl font-bold mb-3">
          Freelance services at your{" "}
          <span className="text-secondary">fingertips</span>
        </h2>
        <p className="text-white/60 text-sm mb-8">
          Book top-rated vendors for any occasion, right here in Sri Lanka.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="bg-secondary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-secondary-dark transition-colors shadow-xl text-sm"
        >
          Join Vizhiyal
        </button>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <p className="text-white text-xl font-bold mb-2">
              vizhiyal<span className="text-secondary">.</span>
            </p>
            <p className="text-xs leading-relaxed text-gray-500">
              Sri Lanka's event vendor marketplace.<br />
              Group 30 · OUSL.<br />
              Supervised by Dr. H.M.M. Caldera.
            </p>
          </div>

          {[
            { title: "Categories", links: ["Photography", "Catering", "Decoration", "Venue", "Music & DJ"] },
            { title: "For Clients", links: ["How it Works", "Customer Stories", "Quality Guide", "Browse by Skill"] },
            { title: "For Vendors", links: ["Become a Vendor", "Vendor Community", "Forum", "Events"] },
            { title: "Company",    links: ["About Us", "Contact", "Privacy Policy", "Terms of Service"] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-white text-sm font-semibold mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">© Vizhiyal International Ltd. 2026</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> English</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
