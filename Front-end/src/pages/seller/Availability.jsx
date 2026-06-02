// Availability — seller sets blocked / unavailable dates
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarX, Info } from "lucide-react";
import { vendorApi } from "../../services/vendorApi";

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/** "YYYY-MM-DD" from any date parts */
const toDateStr = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** "YYYY-MM" from a Date */
const toMonthStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Today as "YYYY-MM-DD" */
const todayStr = toDateStr(
  new Date().getFullYear(),
  new Date().getMonth(),
  new Date().getDate()
);

export default function Availability() {
  // First day of the visible month
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [blocked, setBlocked] = useState(new Set()); // Set<"YYYY-MM-DD">
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(new Set()); // dates being toggled
  const [error,   setError]   = useState("");

  // ── Fetch blocked dates for the visible month ────────────────
  const fetchBlocked = useCallback(async (monthDate) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await vendorApi.getMyAvailability(toMonthStr(monthDate));
      setBlocked(new Set(data.blockedDates || []));
    } catch {
      setError("Could not load availability. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlocked(month); }, [month, fetchBlocked]);

  // ── Toggle a date ────────────────────────────────────────────
  const toggle = async (dateStr) => {
    if (dateStr < todayStr)       return; // past — locked
    if (saving.has(dateStr))      return; // already in flight

    setSaving(s => new Set([...s, dateStr]));
    const wasBlocked = blocked.has(dateStr);

    try {
      if (wasBlocked) {
        await vendorApi.unblockDate(dateStr);
        setBlocked(b => { const n = new Set(b); n.delete(dateStr); return n; });
      } else {
        await vendorApi.blockDate(dateStr);
        setBlocked(b => new Set([...b, dateStr]));
      }
    } catch {
      setError("Failed to update. Please try again.");
    } finally {
      setSaving(s => { const n = new Set(s); n.delete(dateStr); return n; });
    }
  };

  // ── Calendar helpers ─────────────────────────────────────────
  const year       = month.getFullYear();
  const monthIdx   = month.getMonth();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startDay    = new Date(year, monthIdx, 1).getDay(); // 0=Sun

  // Pad leading empty cells + actual day numbers
  const cells = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () =>
    setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const monthKey    = toMonthStr(month);
  const blockedThis = [...blocked].filter(d => d.startsWith(monthKey)).sort();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Availability Calendar</h1>
        <p className="text-sm text-gray-500">
          Click any future date to block it. Buyers cannot book you on blocked dates.
        </p>
      </div>

      {/* Info tip */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-sm text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Blocked dates prevent new bookings. Existing confirmed bookings are not affected.
        </span>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="font-bold text-gray-800 text-lg leading-tight">
              {MONTHS[monthIdx]} {year}
            </h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {blockedThis.length === 0
                  ? "All dates available"
                  : `${blockedThis.length} date${blockedThis.length > 1 ? "s" : ""} blocked`}
              </p>
            )}
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;

              const dateStr   = toDateStr(year, monthIdx, day);
              const isPast    = dateStr < todayStr;
              const isBlocked = blocked.has(dateStr);
              const isSaving  = saving.has(dateStr);
              const isToday   = dateStr === todayStr;

              return (
                <button
                  key={day}
                  onClick={() => toggle(dateStr)}
                  disabled={isPast || isSaving}
                  title={isBlocked ? "Click to unblock" : isPast ? "Past date" : "Click to block"}
                  className={[
                    "relative aspect-square rounded-xl text-sm font-medium transition-all",
                    "flex items-center justify-center select-none",
                    isPast
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : isBlocked
                        ? "bg-red-100 text-red-600 hover:bg-red-200 border border-red-200"
                        : "text-gray-700 hover:bg-primary/10 hover:text-primary border border-transparent",
                    isToday && !isBlocked ? "ring-2 ring-primary ring-offset-1" : "",
                    isSaving ? "opacity-50" : "",
                  ].join(" ")}
                >
                  {isSaving
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : day
                  }
                  {isBlocked && !isSaving && (
                    <CalendarX className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 text-red-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center mt-3">{error}</p>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <LegendItem color="bg-white border-gray-200" label="Available" />
          <LegendItem color="bg-red-100 border-red-200" label="Blocked" />
          <LegendItem color="bg-gray-50 border-gray-100" label="Past (locked)" />
          <LegendItem color="bg-white border-primary border-2" label="Today" />
        </div>
      </div>

      {/* Blocked-this-month summary */}
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Blocked in {MONTHS[monthIdx]}
        </h3>
        {loading ? (
          <div className="h-6 bg-gray-100 rounded animate-pulse w-48" />
        ) : blockedThis.length === 0 ? (
          <p className="text-sm text-gray-400">No dates blocked this month.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blockedThis.map(d => {
              const day = parseInt(d.split("-")[2], 10);
              return (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-100 text-red-600 rounded-full text-xs font-medium"
                >
                  {MONTHS[monthIdx].slice(0, 3)} {day}
                  <button
                    onClick={() => toggle(d)}
                    className="ml-0.5 hover:text-red-800 leading-none"
                    title="Unblock"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-5 h-5 rounded-md border ${color}`} />
      <span>{label}</span>
    </div>
  );
}
