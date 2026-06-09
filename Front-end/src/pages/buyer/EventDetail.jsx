// EventDetail — one multi-vendor Event Bundle and its bundled bookings
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CalendarDays, MapPin, Users, Wallet, ArrowLeft, ShieldCheck,
  Loader2, ChevronRight,
} from "lucide-react";
import { eventApi } from "../../services/eventApi";
import { resolveUrl } from "../../utils/uploadUrl";

const LKR = (n) => `LKR ${Number(n || 0).toLocaleString()}`;
const BOOKING_STATUS = {
  pending:            "bg-amber-50 text-amber-600",
  confirmed:          "bg-blue-50 text-blue-600",
  in_progress:        "bg-indigo-50 text-indigo-600",
  pending_completion: "bg-purple-50 text-purple-600",
  completed:          "bg-green-50 text-green-600",
  cancelled:          "bg-red-50 text-red-500",
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventApi.getById(id)
      .then(({ data }) => setEvent(data.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  if (!event)
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">Event not found.</div>;

  const booked = event.bookings || [];
  const total = booked.reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate("/events")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> All events
      </button>

      {/* ── Header card ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-sm text-gray-500 capitalize">{event.eventType} event</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 capitalize">{event.status}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Stat icon={CalendarDays} label="Date" value={new Date(event.eventDate).toLocaleDateString("en-LK")} />
          <Stat icon={MapPin} label="Location" value={event.location || "—"} />
          <Stat icon={Users} label="Guests" value={event.guestCount || "—"} />
          <Stat icon={Wallet} label="Budget" value={LKR(event.totalBudget)} />
        </div>
      </div>

      {/* ── Bundled vendors ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-gray-800">Booked vendors ({booked.length})</h2>
        <span className="text-sm text-gray-500">Total {LKR(total)}</span>
      </div>

      <div className="space-y-2">
        {booked.map((b) => {
          const cover = resolveUrl(b.gig?.images?.[0]);
          return (
            <button key={b.id} onClick={() => navigate(`/orders/${b.id}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/60 to-secondary/60 flex-shrink-0">
                {cover && <img src={cover} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{b.gig?.category}</span>
                <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{b.gig?.title}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{b.gig?.vendor?.businessName}</span>
                  {b.gig?.vendor?.isVerified && <ShieldCheck className="w-3 h-3 text-accent" />}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-800 text-sm">{LKR(b.totalAmount)}</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${BOOKING_STATUS[b.status] || "bg-gray-100 text-gray-600"}`}>
                  {b.status.replace("_", " ")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Each vendor confirms their own booking. Track progress on each order above.
      </p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-[11px] text-gray-400 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}
