// EventPlanner — Smart Event Bundle Builder
// Two ways to build one multi-vendor event under a single budget:
//   • AI Bundle   — the AI Budget Concierge splits the budget across the
//                   chosen categories and recommends an in-budget,
//                   availability-aware vendor for each (ml-service /plan).
//   • Manual      — the customer browses real gigs per category and picks
//                   their own line-up, with live budget guidance.
// Either way the whole bundle books in one atomic checkout.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, MapPin, Star, ShieldCheck, Check, Wand2, Hand,
  CalendarDays, Users, Wallet, AlertCircle, Loader2, Search,
} from "lucide-react";
import { eventApi } from "../../services/eventApi";
import { gigApi } from "../../services/gigApi";
import { CATEGORIES } from "../../utils/categories";
import { resolveUrl } from "../../utils/uploadUrl";

const EVENT_TYPES = ["Wedding", "Birthday", "Corporate", "Engagement", "Anniversary", "Other"];
const LKR = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

// Budget-split priors (mirrors the ml-service) — used in MANUAL mode only, to
// show a suggested per-category budget as guidance while the buyer picks.
const CATEGORY_BUDGET_WEIGHTS = {
  "venue": 0.24, "catering": 0.24, "photography": 0.11, "videography": 0.09,
  "decoration": 0.09, "dj & music": 0.06, "sound system": 0.04, "lighting": 0.03,
  "makeup & beauty": 0.04, "cakes & sweets": 0.03, "floral design": 0.03,
  "event planning": 0.05, "mc & host": 0.02,
};
const DEFAULT_WEIGHT = 0.05;

// Normalise any gig (from gigApi.list) into the shared "option" shape so both
// modes feed the same selection + checkout logic.
function gigToOption(g, slotBudget) {
  return {
    vendor: {
      id: g.vendor?.id,
      businessName: g.vendor?.businessName || "Vendor",
      location: g.vendor?.location || "",
      isVerified: g.vendor?.isVerified || false,
      avgRating: g.vendor?.avgRating || 0,
      totalReviews: g.vendor?.totalReviews || 0,
      avatar: g.vendor?.user?.avatar || null,
    },
    gig: {
      id: g.id, title: g.title, category: g.category, images: g.images,
      basicPrice: g.basicPrice, standardPrice: g.standardPrice, premiumPrice: g.premiumPrice,
    },
    recommendation: null,                       // no AI score in manual mode
    withinBudget: g.basicPrice <= slotBudget,
    available: true,                            // validated again at checkout
  };
}

export default function EventPlanner() {
  const navigate = useNavigate();

  // ── Brief ───────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "", eventType: "Wedding", eventDate: "",
    location: "", guestCount: "", totalBudget: "",
  });
  const [categories, setCategories] = useState(["Venue", "Catering", "Photography", "Decoration"]);
  const [mode, setMode] = useState("ai"); // "ai" | "manual"

  // ── AI plan state ───────────────────────────────────────────
  const [planning, setPlanning] = useState(false);
  const [allocations, setAllocations] = useState(null);
  const [planSource, setPlanSource] = useState("ml");

  // ── Manual state ────────────────────────────────────────────
  const [manualReady, setManualReady] = useState(false);
  const [manualByCat, setManualByCat] = useState({}); // category → { loading, gigs }

  // ── Shared selection / checkout ─────────────────────────────
  const [selected, setSelected] = useState({}); // category → option | null
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCategory = (c) =>
    setCategories((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setSelected({});
    setAllocations(null);
    setManualReady(false);
  };

  // Suggested per-category budget (manual mode guidance).
  const slotBudget = (category) => {
    const total = Number(form.totalBudget) || 0;
    const raw = categories.map((c) => CATEGORY_BUDGET_WEIGHTS[c.toLowerCase()] ?? DEFAULT_WEIGHT);
    const denom = raw.reduce((a, b) => a + b, 0) || 1;
    const w = CATEGORY_BUDGET_WEIGHTS[category.toLowerCase()] ?? DEFAULT_WEIGHT;
    return Math.round((total * w) / denom);
  };

  const validateBrief = () => {
    if (categories.length === 0) { setError("Pick at least one service category."); return false; }
    if (!form.totalBudget || Number(form.totalBudget) <= 0) { setError("Enter a total budget."); return false; }
    return true;
  };

  // ── AI: generate the plan ───────────────────────────────────
  const handleGenerate = async () => {
    setError("");
    if (!validateBrief()) return;
    setPlanning(true);
    setAllocations(null);
    try {
      const { data } = await eventApi.plan({
        categories,
        totalBudget: Number(form.totalBudget),
        location: form.location,
        eventDate: form.eventDate || undefined,
        eventType: form.eventType,
        guestCount: Number(form.guestCount) || 0,
        perCategory: 3,
      });
      setAllocations(data.allocations || []);
      setPlanSource(data.source || "ml");
      // Auto-select the top bookable option per category.
      const pick = {};
      for (const a of data.allocations || []) {
        pick[a.category] = a.options.find((o) => o.available) || a.options[0] || null;
      }
      setSelected(pick);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate a plan. Try again.");
    } finally {
      setPlanning(false);
    }
  };

  // ── Manual: load real gigs per category to browse ───────────
  const handleManualBuild = () => {
    setError("");
    if (!validateBrief()) return;
    setManualReady(true);
    setSelected({});
    const city = form.location?.trim();
    categories.forEach(async (cat) => {
      setManualByCat((m) => ({ ...m, [cat]: { loading: true, gigs: [] } }));
      try {
        // Prefer vendors in the buyer's city, but never show an empty list when
        // vendors exist elsewhere — fall back to all vendors in the category.
        let gigs = [];
        if (city) {
          const { data } = await gigApi.list({ category: cat, location: city, sortBy: "rating", limit: 12 });
          gigs = data.gigs || [];
        }
        if (gigs.length === 0) {
          const { data } = await gigApi.list({ category: cat, sortBy: "rating", limit: 12 });
          gigs = data.gigs || [];
        }
        setManualByCat((m) => ({ ...m, [cat]: { loading: false, gigs } }));
      } catch {
        setManualByCat((m) => ({ ...m, [cat]: { loading: false, gigs: [] } }));
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mode === "ai" ? handleGenerate() : handleManualBuild();
  };

  // ── Selection helpers (shared) ──────────────────────────────
  const choose = (category, option) =>
    setSelected((s) => ({ ...s, [category]: s[category]?.gig.id === option.gig.id ? null : option }));

  const chosen = Object.values(selected).filter(Boolean);
  const selectedTotal = chosen.reduce((sum, o) => sum + (o.gig.basicPrice || 0), 0);
  const overBudget = form.totalBudget && selectedTotal > Number(form.totalBudget);

  // ── Book the whole bundle ───────────────────────────────────
  const handleBook = async () => {
    setError("");
    if (chosen.length === 0) return setError("Select at least one vendor to book.");
    if (!form.eventDate) return setError("Choose an event date before booking.");
    if (!form.title.trim()) return setError("Give your event a name (e.g. \"Our Wedding\").");

    setBooking(true);
    try {
      const planSnapshot = mode === "ai"
        ? (allocations || []).map((a) => ({ category: a.category, budget: a.budget }))
        : categories.map((c) => ({ category: c, budget: slotBudget(c) }));

      const { data } = await eventApi.create({
        title: form.title,
        eventType: form.eventType,
        eventDate: new Date(form.eventDate).toISOString(),
        location: form.location,
        guestCount: Number(form.guestCount) || 0,
        totalBudget: Number(form.totalBudget) || 0,
        items: chosen.map((o) => ({ gigId: o.gig.id, packageType: "basic" })),
        plan: planSnapshot,
      });
      navigate(`/events/${data.event.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. A vendor may have just become unavailable.");
    } finally {
      setBooking(false);
    }
  };

  const hasResults = (mode === "ai" && allocations) || (mode === "manual" && manualReady);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan My Event</h1>
          <p className="text-sm text-gray-500">
            Book your whole vendor line-up — venue, catering, photography & more — under one budget.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6 mt-6">
        {/* ── Left: the brief ──────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit lg:sticky lg:top-20 space-y-4"
        >
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
            <ModeButton active={mode === "ai"} onClick={() => switchMode("ai")} icon={Sparkles} label="AI Bundle" />
            <ModeButton active={mode === "manual"} onClick={() => switchMode("manual")} icon={Hand} label="Build myself" />
          </div>

          <Field label="Event name">
            <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)}
              placeholder="Our Wedding" className={inputCls} />
          </Field>

          <Field label="Event type">
            <select value={form.eventType} onChange={(e) => setField("eventType", e.target.value)} className={inputCls}>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" icon={CalendarDays}>
              <input type="date" value={form.eventDate} min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setField("eventDate", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Guests" icon={Users}>
              <input type="number" min="0" value={form.guestCount}
                onChange={(e) => setField("guestCount", e.target.value)} placeholder="200" className={inputCls} />
            </Field>
          </div>

          <Field label="City / location" icon={MapPin}>
            <input type="text" value={form.location} onChange={(e) => setField("location", e.target.value)}
              placeholder="Colombo" className={inputCls} />
          </Field>

          <Field label="Total budget (LKR)" icon={Wallet}>
            <input type="number" min="0" value={form.totalBudget}
              onChange={(e) => setField("totalBudget", e.target.value)} placeholder="600000"
              className={inputCls} required />
          </Field>

          <Field label={`Services needed (${categories.length})`}>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const on = categories.includes(c);
                return (
                  <button type="button" key={c} onClick={() => toggleCategory(c)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      on ? "bg-primary text-white border-primary"
                         : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                    }`}>
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>

          <button type="submit" disabled={planning}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60">
            {planning ? <Loader2 className="w-4 h-4 animate-spin" />
              : mode === "ai" ? <Sparkles className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
            {planning ? "Building your plan…" : mode === "ai" ? "Generate AI bundle" : "Start building"}
          </button>

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
            </p>
          )}
        </form>

        {/* ── Right: the plan ──────────────────────────────────── */}
        <div>
          {!hasResults && !planning && <EmptyState mode={mode} />}

          {planning && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p className="text-sm">Allocating your budget and matching vendors…</p>
            </div>
          )}

          {/* AI mode results */}
          {mode === "ai" && allocations && (
            <>
              {planSource === "fallback" && (
                <p className="mb-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Smart matching is offline — showing top-rated vendors per category instead.
                </p>
              )}
              <div className="space-y-5">
                {allocations.map((a) => (
                  <CategoryBlock key={a.category} category={a.category} budget={a.budget} options={a.options}
                    selectedId={selected[a.category]?.gig.id} onChoose={(opt) => choose(a.category, opt)} />
                ))}
              </div>
            </>
          )}

          {/* Manual mode results */}
          {mode === "manual" && manualReady && (
            <>
              <p className="mb-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                Pick one vendor per service. The figures are <b>suggested</b> budget splits — you're free to go over or under in any category.
              </p>
              <div className="space-y-5">
                {categories.map((cat) => {
                  const entry = manualByCat[cat] || { loading: true, gigs: [] };
                  const slot = slotBudget(cat);
                  const options = entry.gigs.map((g) => gigToOption(g, slot));
                  return (
                    <CategoryBlock key={cat} category={cat} budget={slot} options={options}
                      loading={entry.loading} searchable
                      selectedId={selected[cat]?.gig.id} onChoose={(opt) => choose(cat, opt)} />
                  );
                })}
              </div>
            </>
          )}

          {/* ── Sticky checkout summary (shared) ──────────────── */}
          {hasResults && !planning && (
            <div className="sticky bottom-4 mt-6 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs text-gray-500">{chosen.length} of {categories.length} services selected</p>
                <p className={`text-lg font-bold ${overBudget ? "text-red-600" : "text-gray-900"}`}>
                  {LKR(selectedTotal)}
                  <span className="text-sm font-normal text-gray-400"> / {LKR(form.totalBudget)}</span>
                </p>
                {overBudget && <p className="text-xs text-red-500">Over budget — deselect a service or swap for a cheaper option.</p>}
              </div>
              <button onClick={handleBook} disabled={booking || chosen.length === 0}
                className="flex items-center gap-2 bg-secondary text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50">
                {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Book bundle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mode toggle button ─────────────────────────────────────────
function ModeButton({ active, onClick, icon: Icon, label }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

// ── Category block: budget slot + vendor options ───────────────
function CategoryBlock({ category, budget, options, loading = false, searchable = false, selectedId, onChoose }) {
  const [q, setQ] = useState("");
  const filtered = searchable && q.trim()
    ? options.filter((o) =>
        o.vendor.businessName.toLowerCase().includes(q.toLowerCase()) ||
        o.gig.title.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 border-b border-gray-100 gap-3">
        <h3 className="font-semibold text-gray-800">{category}</h3>
        <div className="flex items-center gap-3">
          {searchable && options.length > 0 && (
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…"
                className="pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 w-32" />
            </div>
          )}
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {searchable ? "Suggested" : "Budget slot"}: <b className="text-primary">{LKR(budget)}</b>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400">
          {options.length === 0 ? "No vendors found for this category yet." : "No vendors match your filter."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
          {filtered.map((o) => (
            <OptionCard key={o.gig.id} option={o} selected={selectedId === o.gig.id} onClick={() => onChoose(o)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionCard({ option, selected, onClick }) {
  const { vendor, gig, recommendation, withinBudget, available } = option;
  const cover = resolveUrl(gig.images?.[0]);
  return (
    <button onClick={onClick} disabled={!available}
      className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
        selected ? "border-secondary ring-2 ring-secondary/20"
        : available ? "border-gray-100 hover:border-primary/40"
        : "border-gray-100 opacity-60 cursor-not-allowed"
      }`}>
      <div className="relative h-24 bg-gradient-to-br from-primary/70 to-secondary/70">
        {cover && <img src={cover} alt={gig.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
        {selected && (
          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
        {recommendation?.matchScore != null && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-white/90 text-primary px-1.5 py-0.5 rounded-full">
            {Math.round(recommendation.matchScore)}% match
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 mb-0.5">
          <p className="text-sm font-semibold text-gray-800 truncate">{vendor.businessName}</p>
          {vendor.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 truncate">{gig.title}</p>
        <p className="flex items-center gap-0.5 text-[11px] text-gray-400 truncate mb-1.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />{vendor.location || "Sri Lanka"}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-600">
            <Star className="w-3 h-3 text-secondary fill-secondary" />
            {(vendor.avgRating || 0).toFixed(1)}
            {recommendation?.distanceKm != null && <span className="text-gray-400">· {recommendation.distanceKm}km</span>}
          </span>
          <span className="font-bold text-primary">{LKR(gig.basicPrice)}</span>
        </div>
        <div className="flex gap-1 mt-2">
          {!available && <Tag color="red">Unavailable on date</Tag>}
          {available && withinBudget && <Tag color="green">In budget</Tag>}
          {available && !withinBudget && <Tag color="amber">Over slot</Tag>}
        </div>
      </div>
    </button>
  );
}

function Tag({ children, color }) {
  const map = {
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red:   "bg-red-50 text-red-500",
  };
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${map[color]}`}>{children}</span>;
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />} {label}
      </span>
      {children}
    </label>
  );
}

function EmptyState({ mode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-2xl border border-dashed border-gray-200">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        {mode === "ai" ? <Sparkles className="w-7 h-7 text-primary" /> : <Hand className="w-7 h-7 text-primary" />}
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">
        {mode === "ai" ? "Let the AI build your bundle" : "Build your bundle by hand"}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        {mode === "ai"
          ? "Set your budget and the services you need, then hit Generate. We'll split the budget across categories and match an available, in-budget vendor for each."
          : "Set your budget and services, then hit Start building. Browse real vendors in each category and pick your own line-up — with a suggested budget for each."}
      </p>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
