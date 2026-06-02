// AdminSupportDetail.jsx — Admin: support ticket detail + reply (local demo data)
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, XCircle, Headphones, User } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import UserAvatar from "../../components/common/UserAvatar";

const statusCfg = {
  open:        { label: "Open",        cls: "bg-blue-50 text-blue-600 border-blue-200" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  resolved:    { label: "Resolved",    cls: "bg-accent-50 text-accent border-accent/20" },
  closed:      { label: "Closed",      cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

const priorityCfg = {
  high:   { label: "High",   cls: "text-red-500 bg-red-50 border-red-200" },
  medium: { label: "Medium", cls: "text-amber-600 bg-amber-50 border-amber-200" },
  low:    { label: "Low",    cls: "text-gray-500 bg-gray-100 border-gray-200" },
};

// Demo support tickets — same data as AdminSupport
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

function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function AdminSupportDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const ticket   = demoTickets.find(t => t.id === id);

  const [messages,       setMessages]       = useState(ticket?.messages ?? []);
  const [replyText,      setReplyText]      = useState("");
  const [status,         setStatus]         = useState(ticket?.status ?? "open");
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [confirmClose,   setConfirmClose]   = useState(false);

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">Ticket not found</p>
          <button onClick={() => navigate("/admin/support")} className="mt-3 text-sm text-primary hover:underline">
            Back to Support
          </button>
        </div>
      </div>
    );
  }

  function sendReply() {
    if (!replyText.trim()) return;
    setMessages(prev => [...prev, { from: "admin", text: replyText.trim(), time: nowStr() }]);
    setReplyText("");
    if (status === "open") setStatus("in_progress");
  }

  const sCfg = statusCfg[status] || statusCfg.open;
  const pCfg = priorityCfg[ticket.priority] || priorityCfg.medium;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/support")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 truncate">{ticket.subject}</h1>
          <p className="text-xs text-gray-400">Ticket {ticket.id} · {ticket.createdAt}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — thread */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-primary" /> Conversation
            </h3>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {messages.map((msg, i) => {
                const isAdmin = msg.from === "admin";
                return (
                  <div key={i} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                      isAdmin ? "bg-primary" : "bg-gray-200"
                    }`}>
                      {isAdmin ? "A" : <User className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className={`max-w-[75%] ${isAdmin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isAdmin
                          ? "bg-primary text-white rounded-tr-sm"
                          : "bg-gray-100 text-gray-700 rounded-tl-sm"
                      }`}>
                        {msg.text}
                      </div>
                      <p className={`text-xs text-gray-400 ${isAdmin ? "text-right" : ""}`}>{msg.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {status !== "resolved" && status !== "closed" && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim()}
                    className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Reply
                  </button>
                </div>
              </div>
            )}

            {(status === "resolved" || status === "closed") && (
              <div className="pt-4 border-t border-gray-100 text-center text-sm text-gray-400">
                This ticket is {status}. No further replies can be sent.
              </div>
            )}
          </div>
        </div>

        {/* Right — info + actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 space-y-4">

            <div className="flex items-center gap-3">
              <UserAvatar src={ticket.userAvatar} name={ticket.user} size={40} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{ticket.user}</p>
                <p className="text-xs text-gray-400">{ticket.userEmail}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Category</span>
                <span className="font-medium text-gray-700">{ticket.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Priority</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pCfg.cls}`}>{pCfg.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sCfg.cls}`}>{sCfg.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Created</span>
                <span className="font-medium text-gray-700">{ticket.createdAt}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              {status === "open" && (
                <button
                  onClick={() => setStatus("in_progress")}
                  className="w-full bg-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-amber-600 transition-colors"
                >
                  Mark In Progress
                </button>
              )}
              {(status === "open" || status === "in_progress") && (
                <>
                  <button
                    onClick={() => setConfirmResolve(true)}
                    className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve Ticket
                  </button>
                  <button
                    onClick={() => setConfirmClose(true)}
                    className="w-full border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Close Ticket
                  </button>
                </>
              )}
              {(status === "resolved" || status === "closed") && (
                <div className={`text-center py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                  status === "resolved" ? "bg-accent-50 text-accent" : "bg-gray-100 text-gray-500"
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  {status === "resolved" ? "Ticket Resolved" : "Ticket Closed"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResolve}
        title="Resolve this ticket?"
        description="Mark this support ticket as resolved. The user will be notified that their issue has been handled."
        confirmLabel="Resolve"
        onConfirm={() => { setStatus("resolved"); setConfirmResolve(false); }}
        onCancel={() => setConfirmResolve(false)}
      />
      <ConfirmDialog
        open={confirmClose}
        title="Close this ticket?"
        description="Close this ticket without marking it as resolved. Use this for spam or duplicate tickets."
        confirmLabel="Close Ticket"
        onConfirm={() => { setStatus("closed"); setConfirmClose(false); }}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}
