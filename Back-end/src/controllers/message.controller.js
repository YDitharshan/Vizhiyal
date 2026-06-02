// controllers/message.controller.js
// getConversations · getOrCreateConversation · getMessages · sendMessage · markRead
import prisma from "../config/db.js";
import { createNotification } from "./notification.controller.js";

// ── @GET /api/messages  (get all conversations for user) ─────
export const getConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: req.user.id } },
      },
      orderBy: { lastAt: "desc" },
      include: {
        participants: { select: { id: true, name: true, avatar: true, role: true } },
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { content: true, sentAt: true, senderId: true, read: true },
        },
      },
    });

    // Attach unread count per conversation
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unread = await prisma.message.count({
          where: {
            conversationId: conv.id,
            read:           false,
            senderId:       { not: req.user.id }, // messages sent by the OTHER user
          },
        });
        return { ...conv, unread };
      })
    );

    return res.json({ success: true, conversations: withUnread });
  } catch (err) {
    console.error("getConversations error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/messages/conversations  (start or get existing) ─
export const getOrCreateConversation = async (req, res) => {
  const { participantId } = req.body;

  if (!participantId)
    return res.status(400).json({ success: false, message: "participantId is required" });
  if (participantId === req.user.id)
    return res.status(400).json({ success: false, message: "Cannot start a conversation with yourself" });

  try {
    const other = await prisma.user.findUnique({ where: { id: participantId } });
    if (!other)
      return res.status(404).json({ success: false, message: "User not found" });

    // Check if a conversation already exists between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: req.user.id } } },
          { participants: { some: { id: participantId } } },
        ],
      },
      include: {
        participants: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    if (existing)
      return res.json({ success: true, conversation: existing, created: false });

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: req.user.id }, { id: participantId }],
        },
      },
      include: {
        participants: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    return res.status(201).json({ success: true, conversation, created: true });
  } catch (err) {
    console.error("getOrCreateConversation error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/messages/conversations/:id  (get messages) ─────
export const getMessages = async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    // Ensure user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id:           req.params.id,
        participants: { some: { id: req.user.id } },
      },
    });

    if (!conversation)
      return res.status(404).json({ success: false, message: "Conversation not found" });

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where:   { conversationId: req.params.id },
        skip,
        take:    Number(limit),
        orderBy: { sentAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.message.count({ where: { conversationId: req.params.id } }),
    ]);

    return res.json({
      success: true,
      messages,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/messages/conversations/:id  (send message) ────
export const sendMessage = async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim())
    return res.status(400).json({ success: false, message: "Message content is required" });

  try {
    // Fetch conversation + participants so we know who to notify
    const conversation = await prisma.conversation.findFirst({
      where: {
        id:           req.params.id,
        participants: { some: { id: req.user.id } },
      },
      include: {
        participants: { select: { id: true, role: true } },
      },
    });

    if (!conversation)
      return res.status(404).json({ success: false, message: "Conversation not found" });

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: req.params.id,
          senderId:       req.user.id,
          content:        content.trim(),
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.conversation.update({
        where: { id: req.params.id },
        data:  { lastMessage: content.trim(), lastAt: new Date() },
      }),
    ]);

    // Notify every participant who did NOT send this message
    const senderName = req.user.name || "Someone";
    const preview    = content.trim().length > 100
      ? content.trim().slice(0, 100) + "…"
      : content.trim();

    for (const participant of conversation.participants) {
      if (participant.id === req.user.id) continue; // skip the sender

      const link = participant.role === "seller" ? "/seller/messages" : "/messages";
      // fire-and-forget — notifications are non-critical
      createNotification(participant.id, "MESSAGE", `New message from ${senderName}`, preview, link);
    }

    return res.status(201).json({ success: true, message });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/messages/conversations/:id/read  (mark read) ─
export const markRead = async (req, res) => {
  try {
    await prisma.message.updateMany({
      where: {
        conversationId: req.params.id,
        senderId:       { not: req.user.id },
        read:           false,
      },
      data: { read: true },
    });

    return res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    console.error("markRead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
