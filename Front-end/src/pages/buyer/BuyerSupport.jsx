// BuyerSupport — buyer: submit a support ticket
import { useState } from "react";
import { Headphones, Send, CheckCircle, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Order Issue", "Billing", "Account", "Technical", "General"];

const FAQ = [
  { q: "How do I cancel an order?", a: "You can cancel a pending order from the Order Detail page. Confirmed orders require contacting the vendor first." },
  { q: "When will I get my refund?", a: "Refunds for cancelled orders are processed within 3–5 business days to your original payment method." },
  { q: "How do I raise a dispute?", a: "Go to your Order Detail page and tap 'Raise a Dispute'. Provide a clear description and our team will review within 24 hours." },
  { q: "Can I change my event date?", a: "Yes — message the vendor directly from the Order Detail page to request a reschedule. The vendor must agree to the new date." },
];

export default function BuyerSupport() {
  const navigate = useNavigate();
  const [form,      setForm]      = useState({ subject: "", category: "Order Issue", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq,   setOpenFaq]   = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ticket Submitted!</h1>
        <p className="text-gray-500 text-sm mb-6">
          We've received your support request. Our team will respond within <span className="font-semibold text-gray-700">24 hours</span>.
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left text-sm mb-6 space-y-2">
          <div className="flex justify-between"><span className="text-gray-400">Subject</span><span className="font-medium text-gray-700 max-w-[60%] text-right">{form.subject}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Category</span><span className="font-medium text-gray-700">{form.category}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Ticket #</span><span className="font-medium text-gray-700">ST-{Date.now().toString().slice(-5)}</span></div>
        </div>
        <button onClick={() => navigate("/orders")} className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors">
          Back to Orders
        </button>
        <button onClick={() => { setSubmitted(false); setForm({ subject: "", category: "Order Issue", message: "" }); }} className="w-full mt-2 border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50">
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contact Support</h1>
          <p className="text-sm text-gray-400">We typically respond within 24 hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

        {/* Left — form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-primary" /> New Support Request
            </h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Message</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe your issue in detail — include order numbers or any relevant information..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!form.subject.trim() || !form.message.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" /> Submit Request
            </button>
          </form>
        </div>

        {/* Right — FAQ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Frequently Asked</h3>
            <div className="space-y-2">
              {FAQ.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 flex items-center justify-between hover:bg-gray-50"
                  >
                    {item.q}
                    <span className="text-gray-400 flex-shrink-0 ml-2">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-3 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-50 border border-primary/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-primary mb-1">Response Time</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Our support team is available <span className="font-medium">Mon–Sat, 9 AM – 6 PM</span> (IST). We aim to respond to all tickets within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
