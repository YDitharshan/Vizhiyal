// SellerMessages.jsx — Seller chat with buyers (real-time via Socket.io)
// Left: conversation list from API  Right: live chat + full offer panel

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, DollarSign, Paperclip, FileText,
  X, ArrowLeft, Search, Package, Calendar, Clock,
  CheckCircle, AlertCircle, Loader2, ChevronDown, RotateCcw,
} from "lucide-react";
import { messageApi } from "../../services/messageApi";
import { offerApi    } from "../../services/offerApi";
import { gigApi      } from "../../services/gigApi";
import { uploadApi   } from "../../services/uploadApi";
import { useSocket   } from "../../context/SocketContext";
import { useAuth     } from "../../context/AuthContext";
import { resolveUrl  } from "../../utils/uploadUrl";
import UserAvatar from "../../components/common/UserAvatar";

// ── Helpers ───────────────────────────────────────────────────────────────────
function previewContent(content = "") {
  if (content.startsWith("[IMAGE]"))          return "📷 Photo";
  if (content.startsWith("[FILE:"))           return "📎 " + (content.match(/^\[FILE:([^\]]+)\]/) ?? [])[1];
  if (content.startsWith("[REQUEST]"))        return "📋 Order Request";
  if (content.startsWith("[OFFER_SENT]"))     return "💰 Custom Offer";
  if (content.startsWith("[OFFER_ACCEPTED]")) return "✅ Offer Accepted";
  if (content.startsWith("[OFFER_REJECTED]")) return "❌ Offer Declined";
  if (content.startsWith("[OFFER_WITHDRAWN]")) return "↩ Offer Withdrawn";
  return content;
}

// ── Time formatter ────────────────────────────────────────────────────────────
function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (days < 7)  return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Offer Panel Component ─────────────────────────────────────────────────────
function OfferPanel({ conversationId, myGigs, onSent, onClose }) {
  const [gigId,        setGigId]        = useState("");
  const [amount,       setAmount]       = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [deliverables, setDeliverables] = useState("");
  const [timeline,     setTimeline]     = useState("");
  const [note,         setNote]         = useState("");
  const [eventDate,    setEventDate]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState("");

  const handleSubmit = async () => {
    if (!gigId)   return setFormError("Please select a gig for this offer.");
    if (!amount)  return setFormError("Please enter an offer amount.");
    setFormError("");
    setSaving(true);
    try {
      const { data } = await offerApi.create({
        conversationId,
        gigId,
        amount:       Number(amount),
        deliveryDays: Number(deliveryDays) || 7,
        deliverables,
        timeline,
        note,
        eventDate:    eventDate || undefined,
      });
      onSent(data.offer);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to send offer. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 flex-shrink-0 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-primary" /> New Offer
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {formError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{formError}
        </p>
      )}

      {/* Gig selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Assign Gig <span className="text-red-400">*</span>
        </label>
        {myGigs.length === 0 ? (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You have no active gigs. Create a gig first before sending an offer.
          </p>
        ) : (
          <div className="relative">
            <select
              value={gigId}
              onChange={e => setGigId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none bg-white pr-8"
            >
              <option value="">Select gig…</option>
              {myGigs.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Amount + Delivery days */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Amount (LKR) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 45000"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            <Clock className="w-3 h-3 inline mr-1" />Delivery Days
          </label>
          <input
            type="number"
            min="1"
            value={deliveryDays}
            onChange={e => setDeliveryDays(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Event date */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <Calendar className="w-3 h-3 inline mr-1" />Event Date (optional)
        </label>
        <input
          type="date"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Deliverables */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <Package className="w-3 h-3 inline mr-1" />Deliverables
        </label>
        <textarea
          rows={2}
          value={deliverables}
          onChange={e => setDeliverables(e.target.value)}
          placeholder="e.g. 200 edited photos, 1 highlight reel, full RAW backup…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <Clock className="w-3 h-3 inline mr-1" />Timeline / Schedule
        </label>
        <textarea
          rows={2}
          value={timeline}
          onChange={e => setTimeline(e.target.value)}
          placeholder="e.g. 8 AM – 10 PM coverage, editing within 3 weeks…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Any additional message to the buyer…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || myGigs.length === 0}
          className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send Offer
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Seller Offer Card (in message list) ───────────────────────────────────────
function SellerOfferCard({ offer, onWithdraw }) {
  const [withdrawing, setWithdrawing] = useState(false);

  const statusColors = {
    pending:   "bg-amber-50  border-amber-200  text-amber-700",
    accepted:  "bg-green-50  border-green-200  text-green-700",
    rejected:  "bg-red-50    border-red-200    text-red-600",
    withdrawn: "bg-gray-50   border-gray-200   text-gray-500",
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Withdraw this offer? The buyer will no longer be able to accept it.")) return;
    setWithdrawing(true);
    try {
      await offerApi.withdraw(offer.id);
      onWithdraw(offer.id);
    } catch {
      // non-fatal
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className={`max-w-sm rounded-2xl border p-4 shadow-sm ${statusColors[offer.status] || statusColors.pending}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <DollarSign className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-wide">Offer Sent</span>
        <span className={`ml-auto text-xs font-semibold capitalize`}>{offer.status}</span>
      </div>

      {offer.gig?.title && (
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">
          <Package className="w-3 h-3" />{offer.gig.title}
        </p>
      )}

      <p className="text-2xl font-bold text-gray-800 mb-2">
        LKR {Number(offer.amount).toLocaleString()}
      </p>

      <div className="space-y-1 text-xs text-gray-600">
        {offer.deliverables && <p><span className="font-medium">Deliverables:</span> {offer.deliverables}</p>}
        {offer.timeline      && <p><span className="font-medium">Timeline:</span> {offer.timeline}</p>}
        {offer.eventDate     && <p><span className="font-medium">Event Date:</span> {new Date(offer.eventDate).toLocaleDateString("en-LK")}</p>}
        <p><span className="font-medium">Delivery:</span> {offer.deliveryDays} day{offer.deliveryDays !== 1 ? "s" : ""}</p>
        {offer.note && <p className="italic opacity-80">{offer.note}</p>}
      </div>

      {offer.status === "pending" && (
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
        >
          <RotateCcw className="w-3 h-3" />
          {withdrawing ? "Withdrawing…" : "Withdraw Offer"}
        </button>
      )}

      {offer.status === "accepted" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-700">
          <CheckCircle className="w-3.5 h-3.5" /> Buyer accepted this offer
        </div>
      )}

      <p className="text-xs opacity-50 mt-2">{fmtTime(offer.createdAt)}</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SellerMessages() {
  const { auth }   = useAuth();
  const { socket } = useSocket();

  // ── State ─────────────────────────────────────────────────────
  const [conversations,   setConversations]   = useState([]);
  const [activeConvId,    setActiveConvId]    = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [offers,          setOffers]          = useState([]);
  const [myGigs,          setMyGigs]          = useState([]);
  const [input,           setInput]           = useState("");
  const [search,          setSearch]          = useState("");
  const [loadingConvos,   setLoadingConvos]   = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [otherTyping,     setOtherTyping]     = useState(false);
  const [attachedFile,    setAttachedFile]    = useState(null);   // { file, name, type, preview }
  const [uploading,       setUploading]       = useState(false);
  const [offerMode,       setOfferMode]       = useState(false);

  const bottomRef      = useRef(null);
  const fileInputRef   = useRef(null);
  const typingTimerRef = useRef(null);
  const prevConvRef    = useRef(null);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const otherUser  = activeConv?.participants?.find(p => p.id !== auth?.id) ?? null;

  // ── Load seller's gigs (for offer panel) ─────────────────────
  useEffect(() => {
    gigApi.getMy()
      .then(({ data }) => {
        const gigs = (data.gigs || data || []).filter(g => g.status === "active");
        setMyGigs(gigs);
      })
      .catch(() => {});
  }, []);

  // ── Load conversations ────────────────────────────────────────
  useEffect(() => {
    messageApi.getConversations()
      .then(({ data }) => {
        const convs = data.conversations ?? [];
        setConversations(convs);
        if (convs.length > 0) setActiveConvId(convs[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingConvos(false));
  }, []);

  // ── Load messages + offers + join socket room ─────────────────
  useEffect(() => {
    if (!activeConvId) return;

    if (prevConvRef.current && socket) {
      socket.emit("leave_conversation", prevConvRef.current);
    }
    prevConvRef.current = activeConvId;

    setLoadingMessages(true);
    setMessages([]);
    setOffers([]);
    setOtherTyping(false);
    setOfferMode(false);

    messageApi.getMessages(activeConvId, { limit: 50 })
      .then(({ data }) => setMessages(data.messages ?? []))
      .catch(console.error)
      .finally(() => setLoadingMessages(false));

    // Load offers for this conversation
    offerApi.getByConversation(activeConvId)
      .then(({ data }) => setOffers(data.offers ?? []))
      .catch(() => {});

    messageApi.markRead(activeConvId).catch(() => {});

    if (socket) socket.emit("join_conversation", activeConvId);

    setConversations(prev =>
      prev.map(c => c.id === activeConvId ? { ...c, unread: 0 } : c)
    );
  }, [activeConvId, socket]);

  // ── Socket events ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      if (msg.conversationId === prevConvRef.current) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setOtherTyping(false);
        // If buyer triggered an offer refresh signal, reload offers
        if (msg.content?.startsWith("[OFFER_ACCEPTED]") || msg.content?.startsWith("[OFFER_REJECTED]")) {
          offerApi.getByConversation(prevConvRef.current)
            .then(({ data }) => setOffers(data.offers ?? []))
            .catch(() => {});
        }
      }
      setConversations(prev =>
        prev.map(c =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.content,
                lastAt:      msg.sentAt,
                unread:      c.id === activeConvId ? 0 : (c.unread ?? 0) + (msg.senderId !== auth?.id ? 1 : 0),
              }
            : c
        ).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
      );
    };

    socket.on("new_message",      onNewMessage);
    socket.on("user_typing",      () => setOtherTyping(true));
    socket.on("user_stop_typing", () => setOtherTyping(false));

    return () => {
      socket.off("new_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [socket, activeConvId, auth?.id]);

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherTyping]);

  // ── Send message ──────────────────────────────────────────────
  const sendText = useCallback((text) => {
    if (!text?.trim() || !socket || !activeConvId) return;
    clearTimeout(typingTimerRef.current);
    socket.emit("stop_typing", { conversationId: activeConvId });
    socket.emit("send_message", { conversationId: activeConvId, content: text.trim() });
    setInput("");
    setAttachedFile(null);
  }, [socket, activeConvId]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || !activeConvId || !socket || uploading) return;

    // ── File attached — upload first, then send ───────────────────
    if (attachedFile) {
      setUploading(true);
      try {
        const { data } = await uploadApi.uploadMessageFile(attachedFile.file);
        const content = data.isImage
          ? `[IMAGE]${data.url}`
          : `[FILE:${data.name}]${data.url}`;
        socket.emit("send_message", { conversationId: activeConvId, content });
        if (input.trim()) {
          socket.emit("send_message", { conversationId: activeConvId, content: input.trim() });
        }
      } catch {
        alert("Failed to upload file. Please try again.");
      } finally {
        setUploading(false);
        setAttachedFile(null);
        setInput("");
      }
      return;
    }

    // ── Text only ─────────────────────────────────────────────────
    sendText(input);
  };

  // ── Offer sent handler ────────────────────────────────────────
  const handleOfferSent = (offer) => {
    setOffers(prev => [offer, ...prev]);
    setOfferMode(false);
    // Notify buyer via chat message
    sendText(`[OFFER_SENT] I've sent you a custom offer for LKR ${Number(offer.amount).toLocaleString()}. Please review it in the chat.`);
  };

  // ── Offer withdrawn handler ───────────────────────────────────
  const handleOfferWithdrawn = (offerId) => {
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: "withdrawn" } : o));
    sendText("[OFFER_WITHDRAWN] I've withdrawn the offer.");
  };

  // ── Typing indicator ──────────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket || !activeConvId) return;
    socket.emit("typing", { conversationId: activeConvId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: activeConvId });
    }, 2000);
  };

  // ── File attachment ───────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    // Store File object alongside metadata so we can upload it on send
    setAttachedFile({ file, name: file.name, size: file.size, type: file.type, preview });
    e.target.value = "";
  };

  // ── Filter conversations ──────────────────────────────────────
  const filteredConvos = conversations.filter(c => {
    const other = c.participants?.find(p => p.id !== auth?.id);
    return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  // Partition offers by status for easy rendering
  const pendingOffer = offers.find(o => o.status === "pending");

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)]">

      {/* ── Conversation list ──────────────────────────────────── */}
      <div className={`${activeConvId ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-72 flex-shrink-0 border-r border-gray-100 bg-white`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search buyers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-transparent focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos && (
            <p className="p-6 text-center text-sm text-gray-400">Loading…</p>
          )}
          {!loadingConvos && filteredConvos.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-400">No conversations yet</p>
          )}
          {filteredConvos.map(c => {
            const other   = c.participants?.find(p => p.id !== auth?.id);
            const lastMsg = previewContent(c.messages?.[0]?.content ?? c.lastMessage ?? "");
            const lastAt  = c.messages?.[0]?.sentAt  ?? c.lastAt;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b border-gray-50 text-left transition-colors ${
                  activeConvId === c.id ? "bg-primary-50 border-l-2 border-l-primary" : "hover:bg-gray-50"
                }`}
              >
                <UserAvatar src={other?.avatar} name={other?.name ?? "Buyer"} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-800 truncate">{other?.name ?? "Buyer"}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{fmtTime(lastAt)}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg}</p>
                </div>
                {(c.unread ?? 0) > 0 && (
                  <span className="w-4 h-4 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {c.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat panel ─────────────────────────────────────────── */}
      <div className={`${activeConvId ? "flex" : "hidden sm:flex"} flex-1 flex-col bg-gray-50 min-w-0`}>

        {activeConvId && activeConv ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <button className="sm:hidden text-gray-500 hover:text-primary" onClick={() => setActiveConvId(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UserAvatar src={otherUser?.avatar} name={otherUser?.name ?? "Buyer"} size={32} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{otherUser?.name ?? "Buyer"}</p>
                <p className="text-xs text-gray-400">
                  {otherTyping ? <span className="text-primary animate-pulse">typing…</span> : "Buyer"}
                </p>
              </div>
              {pendingOffer && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                  Offer pending
                </span>
              )}
            </div>

            {/* Offer compose panel */}
            {offerMode && (
              <OfferPanel
                conversationId={activeConvId}
                myGigs={myGigs}
                onSent={handleOfferSent}
                onClose={() => setOfferMode(false)}
              />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMessages && (
                <p className="text-center text-sm text-gray-400 py-8">Loading messages…</p>
              )}

              {!loadingMessages && (() => {
                // Merge messages + offers into one timeline sorted by send time
                const timeline = [
                  ...messages.map(m => ({ _kind: "msg",   _t: new Date(m.sentAt    || 0), data: m })),
                  ...offers.map(o   => ({ _kind: "offer", _t: new Date(o.createdAt || 0), data: o })),
                ].sort((a, b) => a._t - b._t);

                return timeline.map(item => {
                  // ── Offer card ─────────────────────────────────
                  if (item._kind === "offer") {
                    return (
                      <div key={`offer-${item.data.id}`} className="flex justify-end">
                        <SellerOfferCard
                          offer={item.data}
                          onWithdraw={handleOfferWithdrawn}
                        />
                      </div>
                    );
                  }

                  // ── Message ────────────────────────────────────
                  const msg   = item.data;
                  const isMe  = msg.senderId === auth?.id;
                  const isReq = msg.content?.startsWith("[REQUEST]");

                  // Order request card
                  if (isReq) {
                    const lines = msg.content.replace(/^\[REQUEST\]\s*/, "").split("\n").filter(Boolean);
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-sm bg-white border border-primary/20 rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-2">
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold text-primary">Order Request</span>
                          </div>
                          {lines.map((l, i) => <p key={i} className="text-xs text-gray-600">{l}</p>)}
                          <p className="text-xs text-gray-400 mt-2">{fmtTime(msg.sentAt)}</p>
                        </div>
                      </div>
                    );
                  }

                  // Hide internal offer signal messages
                  if (msg.content?.startsWith("[OFFER_SENT]") ||
                      msg.content?.startsWith("[OFFER_WITHDRAWN]") ||
                      msg.content?.startsWith("[OFFER_ACCEPTED]") ||
                      msg.content?.startsWith("[OFFER_REJECTED]")) {
                    return null;
                  }

                  // Normal message
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-sm flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {msg.content?.startsWith("[IMAGE]") ? (
                          <a href={resolveUrl(msg.content.slice(7))} target="_blank" rel="noopener noreferrer">
                            <img
                              src={resolveUrl(msg.content.slice(7))}
                              alt="Shared image"
                              className="max-w-[240px] max-h-[200px] rounded-2xl object-cover shadow-sm"
                            />
                          </a>
                        ) : msg.content?.startsWith("[FILE:") ? (
                          (() => {
                            const m    = msg.content.match(/^\[FILE:([^\]]+)\](.+)$/);
                            const name = m?.[1] ?? "File";
                            const url  = resolveUrl(m?.[2] ?? "");
                            return (
                              <a
                                href={url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border no-underline ${
                                  isMe
                                    ? "bg-primary/10 border-primary/20 text-primary"
                                    : "bg-white border-gray-200 text-gray-700"
                                }`}
                              >
                                <FileText className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium truncate max-w-[160px]">{name}</span>
                              </a>
                            );
                          })()
                        ) : msg.content ? (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm"
                          }`}>
                            {msg.content}
                          </div>
                        ) : null}
                        <p className="text-xs text-gray-400 mt-1 px-1">{fmtTime(msg.sentAt)}</p>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Typing bubble */}
              {otherTyping && !loadingMessages && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-bl-sm">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="bg-white border-t border-gray-100 flex-shrink-0">
              {attachedFile && (
                <div className="px-4 pt-2 flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-primary-50 border border-primary/20 rounded-lg px-3 py-1.5 max-w-xs">
                    {attachedFile.preview
                      ? <img src={attachedFile.preview} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      : <FileText className="w-4 h-4 text-primary flex-shrink-0" />}
                    <p className="text-xs text-primary font-medium truncate">{attachedFile.name}</p>
                    {uploading
                      ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0 ml-1" />
                      : <button onClick={() => setAttachedFile(null)} className="ml-1 text-primary/60 hover:text-primary flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>}
                  </div>
                  {uploading && <span className="text-xs text-gray-400">Uploading…</span>}
                </div>
              )}
              <div className="px-4 py-3 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-primary transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOfferMode(q => !q)}
                  title={offerMode ? "Cancel offer" : "Send a custom offer"}
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors ${
                    offerMode
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-primary"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFile) || uploading}
                  className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  {uploading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center text-center text-gray-400">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1">Your buyer conversations appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
