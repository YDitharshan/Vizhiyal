// AdminSupport.jsx — Admin: support ticket list (local demo data)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Search, MessageSquare, ChevronRight } from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";

const TABS = ["all", "open", "in_progress", "resolved", "closed"];

const statusCfg = {
  open:        { label: "Open",        cls: "bg-blue-50 text-blue-600 border-blue-200" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  resolved:    { label: "Resolved",    cls: "bg-accent-50 text-accent border-accent/20" },
  closed:      { label: "Closed",      cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

const priorityCfg = {
  high:   { label: "High",   cls: "bg-red-50 text-red-500 border-red-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  low:    { label: "Low",    cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

// Demo support tickets — replace with real API calls when backend support module is ready
const demoTickets = [
  {
    id: "TKT001",
    subject: "Payment not reflected after booking",
    user: "Amara Perera",
    userEmail: "amara@example.com",
    userAvatar: "",
    category: "Billing",
    priority: "high",
    status: "open",
    createdAt: "2025-04-01",
    messages: [
      { from: "user",  text: "I made a payment 3 days ago and it still shows as pending.", time: "2025-04-01 10:23" },
    ],
  },
  {
    id: "TKT002",
    subject: "Vendor did not show up for event",
    user: "Nimal Jayasinghe",
    userEmail: "nimal@example.com",
    userAvatar: "",
    category: "Vendor Complaint",
    priority: "high",
    status: "in_progress",
    createdAt: "2025-04-02",
    messages: [
      { from: "user",  text: "The photographer I booked did not arrive at my wedding.", time: "2025-04-02 09:00" },
      { from: "admin", text: "We are investigating this matter urgently. We'll update you within 24 hours.", time: "2025-04-02 11:30" },
    ],
  },
  {
    id: "TKT003",
    subject: "Unable to leave a review",
    user: "Sanduni Fernando",
    userEmail: "sanduni@example.com",
    userAvatar: "",
    category: "Technical",
    priority: "low",
    status: "resolved",
    createdAt: "2025-03-28",
    messages: [
      { from: "user",  text: "The review button is greyed out after my event completed.", time: "2025-03-28 14:00" },
      { from: "admin", text: "This was a known bug. We've deployed a fix — please try again.", time: "2025-03-29 10:00" },
    ],
  },
  {
    id: "TKT004",
    subject: "How do I update my bank account for payouts?",
    user: "Kasun Wickrama",
    userEmail: "kasun@example.com",
    userAvatar: "",
    category: "Account",
    priority: "medium",
    status: "closed",
    createdAt: "2025-03-20",
    messages: [
      { from: "user",  text: "I need to change my bank account details for payouts.", time: "2025-03-20 08:00" },
      { from: "admin", text: "You can update your bank details in Profile → Payout Settings.", time: "2025-03-20 09:30" },
    ],
  },
];

export default function AdminSupport() {
  const navigate = useNavigate();
  const [tab,   setTab]   = useState("all");
  const [query, setQuery] = useState("");

  const filtered = demoTickets.filter(t => {
    const matchTab   = tab === "all" || t.status === tab;
    const q = query.toLowerCase();
    const matchQuery = !query.trim() ||
      t.user.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    return matchTab && matchQuery;
  });

  const openCount   = demoTickets.filter(t => t.status === "open").length;
  const inProgCount = demoTickets.filter(t => t.status === "in_progress").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {openCount} open · {inProgCount} in progress
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by user, subject..."
            className="px-3 py-2.5 text-sm focus:outline-none w-64"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(t => {
          const count = t === "all"
            ? demoTickets.length
            : demoTickets.filter(tk => tk.status === t).length;
          const label = t === "in_progress" ? "In Progress" : t.charAt(0).toUpperCase() + t.slice(1);
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Headphones className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => {
            const sCfg    = statusCfg[ticket.status];
            const pCfg    = priorityCfg[ticket.priority];
            const isUnread = ticket.status === "open";
            return (
              <div
                key={ticket.id}
                onClick={() => navigate(`/admin/support/${ticket.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar src={ticket.userAvatar} name={ticket.user} size={44} />
                  {isUnread && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ticket.subject}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${pCfg.cls}`}>
                      {pCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-xs text-gray-500">{ticket.user}</p>
                    <span className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {ticket.category}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sCfg.cls}`}>
                      {sCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}
                    </span>
                    <span>{ticket.createdAt}</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
