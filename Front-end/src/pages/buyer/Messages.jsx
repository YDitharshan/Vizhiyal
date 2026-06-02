// Messages — two-panel chat UI (buyer side)
// Left: conversation list from API. Right: live chat via Socket.io.
// Navigating here from VendorDetail with { state: { vendorUserId, requestMessage } }
// auto-opens / creates that conversation and sends the request message.

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Send, Search, ArrowLeft, Phone, Video, MoreVertical,
  CheckCircle, Paperclip, FileText, X, MessageSquare,
  DollarSign, Package, Clock, Calendar, ShoppingBag,
  Loader2, AlertCircle,
} from "lucide-react";
import { messageApi } from "../../services/messageApi";
import { offerApi    } from "../../services/offerApi";
import { uploadApi   } from "../../services/uploadApi";
import { useSocket   } from "../../context/SocketContext";
import { useAuth     } from "../../context/AuthContext";
import { resolveUrl  } from "../../utils/uploadUrl";
import UserAvatar from "../../components/common/UserAvatar";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Returns a short human-readable preview of any message content
function previewContent(content = "") {
  if (content.startsWith("[IMAGE]"))         return "📷 Photo";
  if (content.startsWith("[FILE:"))          return "📎 " + (content.match(/^\[FILE:([^\]]+)\]/) ?? [])[1];
  if (content.startsWith("[REQUEST]"))       return "📋 Order Request";
  if (content.startsWith("[OFFER_SENT]"))    return "💰 Custom Offer";
  if (content.startsWith("[OFFER_ACCEPTED]")) return "✅ Offer Accepted";
  if (content.startsWith("[OFFER_REJECTED]")) return "❌ Offer Declined";
  if (content.startsWith("[OFFER_WITHDRAWN]")) return "↩ Offer Withdrawn";
  return content;
}

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (days < 7)   return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Buyer Offer Card ──────────────────────────────────────────────────────────
function BuyerOfferCard({ offer, onAccept, onReject }) {
  const [accepting,  setAccepting]  = useState(false);
  const [rejecting,  setRejecting]  = useState(false);
  const [localOffer, setLocalOffer] = useState(offer);

  useEffect(() => { setLocalOffer(offer); }, [offer]);

  const handleAccept = async () => {
    if (!window.confirm("Accept this offer? A booking will be created and you will proceed to payment.")) return;
    setAccepting(true);
    try {
      const { data } = await offerApi.accept(localOffer.id);
      setLocalOffer(data.offer);
      onAccept(data.offer, data.booking);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to accept offer. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Decline this offer?")) return;
    setRejecting(true);
    try {
      const { data } = await offerApi.reject(localOffer.id);
      setLocalOffer(data.offer);
      onReject(data.offer);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to decline offer.");
    } finally {
      setRejecting(false);
    }
  };

  const isPending   = localOffer.status === "pending";
  const isAccepted  = localOffer.status === "accepted";
  const isRejected  = localOffer.status === "rejected";
  const isWithdrawn = localOffer.status === "withdrawn";

  return (
    <div className={`max-w-sm rounded-2xl border shadow-sm p-4 ${
      isAccepted  ? "bg-green-50 border-green-200" :
      isRejected  ? "bg-red-50   border-red-200"   :
      isWithdrawn ? "bg-gray-50  border-gray-200"  :
                    "bg-primary-50 border-primary/20"
    }`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <DollarSign className={`w-3.5 h-3.5 ${isAccepted ? "text-green-600" : isRejected || isWithdrawn ? "text-gray-400" : "text-primary"}`} />
        <span className={`text-xs font-bold uppercase tracking-wide ${
          isAccepted ? "text-green-700" : isRejected || isWithdrawn ? "text-gray-500" : "text-primary"
        }`}>
          {isAccepted ? "Offer Accepted ✓" : isRejected ? "Offer Declined" : isWithdrawn ? "Offer Withdrawn" : "Custom Offer"}
        </span>
      </div>

      {/* Gig */}
      {localOffer.gig?.title && (
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
          <Package className="w-3 h-3 flex-shrink-0" />{localOffer.gig.title}
        </p>
      )}

      {/* Amount */}
      <p className={`text-2xl font-bold mb-3 ${isAccepted ? "text-green-700" : isWithdrawn || isRejected ? "text-gray-500" : "text-gray-800"}`}>
        LKR {Number(localOffer.amount).toLocaleString()}
      </p>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-gray-600 mb-3">
        {localOffer.deliverables && (
          <div className="flex gap-1.5">
            <Package className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-medium">Deliverables:</span> {localOffer.deliverables}</span>
          </div>
        )}
        {localOffer.timeline && (
          <div className="flex gap-1.5">
            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-medium">Timeline:</span> {localOffer.timeline}</span>
          </div>
        )}
        {localOffer.eventDate && (
          <div className="flex gap-1.5">
            <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-medium">Event Date:</span> {new Date(localOffer.eventDate).toLocaleDateString("en-LK")}</span>
          </div>
        )}
        <div className="flex gap-1.5">
          <Clock className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
          <span><span className="font-medium">Delivery:</span> {localOffer.deliveryDays} day{localOffer.deliveryDays !== 1 ? "s" : ""}</span>
        </div>
        {localOffer.note && (
          <p className="italic text-gray-500">{localOffer.note}</p>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={accepting || rejecting}
            className="flex-1 bg-primary text-white text-xs font-semibold py-2 rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {accepting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Accept & Pay
          </button>
          <button
            onClick={handleReject}
            disabled={accepting || rejecting}
            className="flex-1 border border-gray-200 text-gray-600 text-xs font-medium py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {rejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Decline
          </button>
        </div>
      )}

      {/* Post-acceptance CTA */}
      {isAccepted && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Booking created — payment pending
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">{fmtTime(localOffer.createdAt)}</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Messages() {
  const navigate    = useNavigate();
  const { auth }    = useAuth();
  const { socket }  = useSocket();
  const routerState = useLocation().state || {};

  // If coming from VendorDetail, these are set
  const initVendorUserId   = routerState.vendorUserId   ?? null;
  const initRequestMessage = routerState.requestMessage ?? null;

  // ── State ─────────────────────────────────────────────────────
  const [conversations,   setConversations]   = useState([]);
  const [activeConvId,    setActiveConvId]    = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [offers,          setOffers]          = useState([]);
  const [acceptedBooking, setAcceptedBooking] = useState(null);   // set after offer accept
  const [input,           setInput]           = useState("");
  const [search,          setSearch]          = useState("");
  const [loadingConvos,   setLoadingConvos]   = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [otherTyping,     setOtherTyping]     = useState(false);
  const [attachedFile,    setAttachedFile]    = useState(null);   // { file: File, name, type, preview }
  const [sending,         setSending]         = useState(false);
  const [uploading,       setUploading]       = useState(false);

  const bottomRef        = useRef(null);
  const fileInputRef     = useRef(null);
  const typingTimerRef   = useRef(null);
  const prevConvRef      = useRef(null);
  const initDoneRef      = useRef(false);
  const socketRef        = useRef(socket);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  const pendingMsgRef    = useRef(null);

  // ── The "other" participant in the active conversation ────────
  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const otherUser  = activeConv?.participants?.find(p => p.id !== auth?.id) ?? null;

  // Pending offer for this conversation (most recent)
  const pendingOffer = offers.find(o => o.status === "pending") ?? null;

  // ── Load conversations on mount ───────────────────────────────
  useEffect(() => {
    messageApi.getConversations()
      .then(({ data }) => setConversations(data.conversations ?? []))
      .catch(console.error)
      .finally(() => setLoadingConvos(false));
  }, []);

  // ── Handle navigation from VendorDetail ──────────────────────
  useEffect(() => {
    if (!initVendorUserId || initDoneRef.current || loadingConvos) return;
    initDoneRef.current = true;

    const go = async () => {
      try {
        const { data } = await messageApi.startConversation(initVendorUserId);
        const conv = data.conversation;
        setConversations(prev =>
          prev.find(c => c.id === conv.id) ? prev : [conv, ...prev]
        );
        setActiveConvId(conv.id);
        if (initRequestMessage) {
          pendingMsgRef.current = { convId: conv.id, text: initRequestMessage };
        }
      } catch (err) {
        console.error("startConversation error:", err);
      }
    };
    go();
  }, [loadingConvos, initVendorUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load messages + offers when conversation changes ─────────
  useEffect(() => {
    if (!activeConvId) return;

    if (prevConvRef.current && socket) {
      socket.emit("leave_conversation", prevConvRef.current);
    }
    prevConvRef.current = activeConvId;

    setLoadingMessages(true);
    setMessages([]);
    setOffers([]);
    setAcceptedBooking(null);
    setOtherTyping(false);

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

  // ── Flush pending initial message ─────────────────────────────
  useEffect(() => {
    if (!socket || !activeConvId || !pendingMsgRef.current) return;
    const { convId, text } = pendingMsgRef.current;
    if (convId !== activeConvId) return;
    pendingMsgRef.current = null;
    const t = setTimeout(() => {
      socket.emit("send_message", { conversationId: convId, content: text.trim() });
    }, 150);
    return () => clearTimeout(t);
  }, [socket, activeConvId]);

  // ── Socket events ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      if (msg.conversationId === activeConvId || prevConvRef.current === msg.conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setOtherTyping(false);

        // Re-fetch offers when seller sends/withdraws an offer
        if (msg.content?.startsWith("[OFFER_SENT]") ||
            msg.content?.startsWith("[OFFER_WITHDRAWN]")) {
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

    const onTyping     = () => setOtherTyping(true);
    const onStopTyping = () => setOtherTyping(false);

    socket.on("new_message",      onNewMessage);
    socket.on("user_typing",      onTyping);
    socket.on("user_stop_typing", onStopTyping);

    return () => {
      socket.off("new_message",      onNewMessage);
      socket.off("user_typing",      onTyping);
      socket.off("user_stop_typing", onStopTyping);
    };
  }, [socket, activeConvId, auth?.id]);

  // ── Scroll to bottom on new messages ─────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherTyping, offers.length]);

  // ── Send helpers ──────────────────────────────────────────────
  const sendText = useCallback((convId, text) => {
    const s = socketRef.current;
    if (!text?.trim() || !s) return;
    s.emit("send_message", { conversationId: convId, content: text.trim() });
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || !activeConvId || !socket || sending || uploading) return;

    clearTimeout(typingTimerRef.current);
    socket.emit("stop_typing", { conversationId: activeConvId });

    // ── If a file is attached, upload it first then send ──────────
    if (attachedFile) {
      setUploading(true);
      try {
        const { data } = await uploadApi.uploadMessageFile(attachedFile.file);
        const content = data.isImage
          ? `[IMAGE]${data.url}`
          : `[FILE:${data.name}]${data.url}`;
        socket.emit("send_message", { conversationId: activeConvId, content });
        // If there was also text, send it as a separate message
        if (text) {
          socket.emit("send_message", { conversationId: activeConvId, content: text });
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

    // ── Text-only message ─────────────────────────────────────────
    setSending(true);
    socket.emit(
      "send_message",
      { conversationId: activeConvId, content: text },
      () => setSending(false)
    );
    setInput("");
  };

  // ── Offer accepted ────────────────────────────────────────────
  const handleOfferAccepted = (updatedOffer, booking) => {
    setOffers(prev => prev.map(o => o.id === updatedOffer.id ? updatedOffer : o));
    setAcceptedBooking(booking);
    // Notify seller via socket
    if (socket && activeConvId) {
      socket.emit("send_message", {
        conversationId: activeConvId,
        content: "[OFFER_ACCEPTED] I've accepted the offer and the booking has been created.",
      });
    }
  };

  // ── Offer rejected ────────────────────────────────────────────
  const handleOfferRejected = (updatedOffer) => {
    setOffers(prev => prev.map(o => o.id === updatedOffer.id ? updatedOffer : o));
    if (socket && activeConvId) {
      socket.emit("send_message", {
        conversationId: activeConvId,
        content: "[OFFER_REJECTED] I've declined the offer.",
      });
    }
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
    // Store the actual File object alongside metadata so we can upload it on send
    setAttachedFile({ file, name: file.name, size: file.size, type: file.type, preview });
    e.target.value = "";
  };

  // ── Filter conversation list ──────────────────────────────────
  const filteredConvos = conversations.filter(c => {
    const other = c.participants?.find(p => p.id !== auth?.id);
    return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Messages</h1>

      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
        style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}
      >
        {/* ── Conversation list ───────────────────────────────── */}
        <aside className={`${activeConvId ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-72 border-r border-gray-100 flex-shrink-0`}>
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-transparent focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingConvos && (
              <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
            )}
            {!loadingConvos && filteredConvos.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">No conversations yet</div>
            )}
            {filteredConvos.map(c => {
              const other   = c.participants?.find(p => p.id !== auth?.id);
              const lastMsg = previewContent(c.messages?.[0]?.content ?? c.lastMessage ?? "");
              const lastAt  = c.messages?.[0]?.sentAt  ?? c.lastAt;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    activeConvId === c.id ? "bg-primary-50" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <UserAvatar src={other?.avatar} name={other?.name ?? "Vendor"} size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${activeConvId === c.id ? "text-primary" : "text-gray-800"}`}>
                        {other?.name ?? "Unknown"}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{fmtTime(lastAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{lastMsg}</p>
                  </div>
                  {(c.unread ?? 0) > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Chat area ───────────────────────────────────────── */}
        {activeConvId && activeConv ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
              <button className="sm:hidden text-gray-500 hover:text-primary" onClick={() => setActiveConvId(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UserAvatar src={otherUser?.avatar} name={otherUser?.name ?? "Vendor"} size={36} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{otherUser?.name ?? "Vendor"}</p>
                <p className="text-xs text-gray-400">
                  {otherTyping ? <span className="text-primary animate-pulse">typing…</span> : "Seller"}
                </p>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                {pendingOffer && (
                  <span className="text-xs bg-primary-50 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium mr-1">
                    New Offer
                  </span>
                )}
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Call (coming soon)">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Video (coming soon)">
                  <Video className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="View profile"
                  onClick={() => otherUser && navigate(`/vendor/${otherUser.id}`)}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Accepted offer banner ─────────────────────────── */}
            {acceptedBooking && (
              <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">Offer Accepted!</p>
                  <p className="text-xs text-green-700">Your booking has been created successfully.</p>
                </div>
                <button
                  onClick={() => navigate("/orders")}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  View Order
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
                  // ── Offer card (buyer view) ─────────────────────
                  if (item._kind === "offer") {
                    return (
                      <div key={`offer-${item.data.id}`} className="flex justify-start">
                        <div className="ml-9">
                          <BuyerOfferCard
                            offer={item.data}
                            onAccept={handleOfferAccepted}
                            onReject={handleOfferRejected}
                          />
                        </div>
                      </div>
                    );
                  }

                  // ── Message ─────────────────────────────────────
                  const msg      = item.data;
                  const isMe     = msg.senderId === auth?.id;
                  const isReqMsg = msg.content?.startsWith("[REQUEST]");

                  // Hide internal offer signal messages
                  if (msg.content?.startsWith("[OFFER_SENT]")      ||
                      msg.content?.startsWith("[OFFER_WITHDRAWN]")  ||
                      msg.content?.startsWith("[OFFER_ACCEPTED]")   ||
                      msg.content?.startsWith("[OFFER_REJECTED]")) {
                    return null;
                  }

                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <UserAvatar src={otherUser?.avatar} name={otherUser?.name ?? msg.sender?.name ?? "Vendor"} size={28} className="mr-2 flex-shrink-0 self-end" />
                      )}
                      <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {isReqMsg && (
                          <span className="text-xs bg-primary-50 text-primary border border-primary-100 px-2 py-0.5 rounded-full mb-1 font-medium">
                            Order Request
                          </span>
                        )}
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
                        ) : (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            isMe
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm"
                          }`}>
                            {isReqMsg
                              ? msg.content.replace(/^\[REQUEST\]\s*/, "")
                              : msg.content}
                          </div>
                        )}
                        <span className="text-xs text-gray-400 mt-1 px-1">{fmtTime(msg.sentAt)}</span>
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
                      <span
                        key={d}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-gray-100 bg-white flex-shrink-0">
              {attachedFile && (
                <div className="px-3 pt-2 flex items-center gap-2">
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
              <div className="p-3 flex items-end gap-2">
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
                <textarea
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ maxHeight: "100px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFile) || sending || uploading}
                  className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary-dark transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  {uploading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-center text-gray-400">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1">Choose someone from the left to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
