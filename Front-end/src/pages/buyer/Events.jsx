// Events — buyer's list of multi-vendor Event Bundles
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Users, Sparkles, Loader2, PartyPopper } from "lucide-react";
import { eventApi } from "../../services/eventApi";

const LKR = (n) => `LKR ${Number(n || 0).toLocaleString()}`;
const STATUS_STYLE = {
  planning:  "bg-blue-50 text-blue-600",
  booked:    "bg-green-50 text-green-600",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-500",
};

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventApi.getMy()
      .then(({ data }) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-sm text-gray-500">Multi-vendor bundles you've planned.</p>
        </div>
        <button onClick={() => navigate("/plan-event")}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-dark transition">
          <Sparkles className="w-4 h-4" /> Plan new event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <PartyPopper className="w-12 h-12 text-gray-200 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">No events yet</h3>
          <p className="text-sm text-gray-500 mb-4">Plan a whole event — venue, catering, photography and more — in one go.</p>
          <button onClick={() => navigate("/plan-event")}
            className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-dark transition">
            Plan my first event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <button key={ev.id} onClick={() => navigate(`/events/${ev.id}`)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <PartyPopper className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{ev.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[ev.status] || "bg-gray-100 text-gray-600"}`}>
                    {ev.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(ev.eventDate).toLocaleDateString("en-LK")}</span>
                  {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                  {ev.guestCount > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.guestCount}</span>}
                  <span>{ev.bookings?.length || 0} vendors</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">Budget</p>
                <p className="font-bold text-primary">{LKR(ev.totalBudget)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
