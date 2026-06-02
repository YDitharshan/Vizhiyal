// src/socket/socket.js
// Initialises Socket.io on the shared HTTP server.
//
// Events  Client → Server:
//   join_conversation(conversationId)          — subscribe to a room
//   leave_conversation(conversationId)         — unsubscribe from a room
//   send_message({ conversationId, content }, ack)  — persist + broadcast
//   typing({ conversationId })                 — broadcast typing hint
//   stop_typing({ conversationId })            — broadcast stop hint
//
// Events  Server → Client:
//   new_message(message)                       — full message object
//   user_typing({ userId })                    — other side started typing
//   user_stop_typing({ userId })               — other side stopped typing

import { Server }  from "socket.io";
import jwt         from "jsonwebtoken";
import prisma      from "../config/db.js";

export function initSocket(httpServer) {
  // Accept multiple CLIENT_URL values (comma-separated) or fall back to all localhost ports
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map(s => s.trim())
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

  const io = new Server(httpServer, {
    cors: {
      origin:      allowedOrigins,
      credentials: true,
    },
  });

  // ── Auth middleware ────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  // ── Connection handler ─────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`🔌  Socket connected   : ${socket.id}  (user: ${socket.userId})`);

    // ── join / leave ──────────────────────────────────────────
    socket.on("join_conversation",  (id) => socket.join(id));
    socket.on("leave_conversation", (id) => socket.leave(id));

    // ── send message ──────────────────────────────────────────
    socket.on("send_message", async ({ conversationId, content }, ack) => {
      const reply = (payload) => { if (typeof ack === "function") ack(payload); };

      if (!content?.trim()) return reply({ error: "Empty message" });

      try {
        // Verify the sender is a participant
        const conversation = await prisma.conversation.findFirst({
          where: {
            id:           conversationId,
            participants: { some: { id: socket.userId } },
          },
        });
        if (!conversation) return reply({ error: "Conversation not found" });

        // Persist in a transaction
        const [message] = await prisma.$transaction([
          prisma.message.create({
            data: {
              conversationId,
              senderId: socket.userId,
              content:  content.trim(),
            },
            include: {
              sender: { select: { id: true, name: true, avatar: true } },
            },
          }),
          prisma.conversation.update({
            where: { id: conversationId },
            data:  { lastMessage: content.trim(), lastAt: new Date() },
          }),
        ]);

        // Broadcast to everyone in the room (sender + other participant)
        io.to(conversationId).emit("new_message", message);
        reply({ success: true });
      } catch (err) {
        console.error("socket send_message error:", err);
        reply({ error: "Server error" });
      }
    });

    // ── typing hints ──────────────────────────────────────────
    socket.on("typing",      ({ conversationId }) =>
      socket.to(conversationId).emit("user_typing",      { userId: socket.userId }));
    socket.on("stop_typing", ({ conversationId }) =>
      socket.to(conversationId).emit("user_stop_typing", { userId: socket.userId }));

    socket.on("disconnect", () =>
      console.log(`🔌  Socket disconnected: ${socket.id}`));
  });

  return io;
}
