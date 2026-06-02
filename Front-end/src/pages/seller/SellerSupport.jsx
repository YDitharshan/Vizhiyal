// SellerSupport — seller contact support form with FAQ accordion
import { useState } from "react";
import { Headphones, CheckCircle, ChevronDown, ChevronUp, Clock, MessageSquare } from "lucide-react";

const CATEGORIES = [
  "Payout Issue",
  "Order Dispute",
  "Account Verification",
  "Gig Rejection",
  "Technical Problem",
  "General Enquiry",
];

const FAQS = [
  {
    q: "When will my payout be processed?",
    a: "Payouts are processed within 2–3 business days after you submit a request. Make sure your bank details are correct.",
  },
  {
    q: "My gig was rejected — what should I do?",
    a: "Review the rejection reason sent to your notifications. Update your gig to meet our quality standards and resubmit for review.",
  },
  {
    q: "How do I respond to a buyer dispute?",
    a: "Navigate to the disputed order and use the Message Buyer button to communicate. Our admin team will review both sides and make a decision.",
  },
  {
    q: "How is platform commission calculated?",
    a: "Vizhiyal charges a 15% commission on each completed order. Your payout is the order amount minus this commission.",
  },
];

export default function SellerSupport() {
  const [category, setCategory]   = useState("");
  const [subject,  setSubject]    = useState("");
  const [message,  setMessage]    = useState("");
  const [errors,   setErrors]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [ticketNo,  setTicketNo]  = useState("");
  const [openFaq,   setOpenFaq]   = useState(null);

  function validate() {
    const e = {};
    if (!category)        e.category = "Select a category.";
    if (!subject.trim())  e.subject  = "Enter a subject.";
    if (!message.trim())  e.message  = "Describe your issue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setTicketNo(`VIZ-S${Date.now().toString().slice(-5)}`);
    setSubmitted(true);
  }

  // ── Success screen ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ticket Submitted!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your support ticket <span className="font-semibold text-gray-700">{ticketNo}</span> has been created.
          Our team will respond within <span className="font-semibold">24 hours</span>.
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left text-sm space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Category</span>
            <span className="text-gray-700 font-medium">{category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Subject</span>
            <span className="text-gray-700 font-medium truncate max-w-[60%]">{subject}</span>
          </div>
        </div>
        <button
          onClick={() => { setSubmitted(false); setCategory(""); setSubject(""); setMessage(""); }}
          className="w-full border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Submit Another Ticket
        </button>
      </div>
    );
  }

  // ── Main support page ────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Seller Support</h1>
        <p className="text-sm text-gray-400 mt-0.5">Get help with your account, payouts, gigs, or orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

        {/* Left: contact form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Headphones className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-800">Contact Support</h2>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setErrors(v => ({ ...v, category: "" })); }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.category ? "border-red-400" : "border-gray-200"}`}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => { setSubject(e.target.value); setErrors(v => ({ ...v, subject: "" })); }}
                placeholder="Brief description of your issue"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.subject ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
              <textarea
                rows={5}
                value={message}
                onChange={e => { setMessage(e.target.value); setErrors(v => ({ ...v, message: "" })); }}
                placeholder="Explain your issue in detail. Include order IDs or gig names if relevant."
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${errors.message ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Submit Ticket
            </button>
          </div>
        </div>

        {/* Right: FAQ + response info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Response time card */}
          <div className="bg-primary text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 opacity-80" />
              <h3 className="font-semibold">Response Times</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between opacity-90">
                <span>Payout Issues</span>
                <span className="font-semibold">Within 4 hours</span>
              </div>
              <div className="flex justify-between opacity-90">
                <span>Disputes</span>
                <span className="font-semibold">Within 12 hours</span>
              </div>
              <div className="flex justify-between opacity-90">
                <span>General</span>
                <span className="font-semibold">Within 24 hours</span>
              </div>
            </div>
          </div>

          {/* FAQ accordion */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Seller FAQ</h3>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex-1 pr-2">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    }
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-3 text-xs text-gray-500 leading-relaxed border-t border-gray-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
