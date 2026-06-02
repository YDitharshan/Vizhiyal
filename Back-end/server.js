// server.js — Vizhiyal API entry point
import { createServer }  from "http";
import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";
import path    from "path";
import { fileURLToPath } from "url";
import { initSocket } from "./src/socket/socket.js";
import authRoutes         from "./src/routes/auth.routes.js";
import vendorRoutes       from "./src/routes/vendor.routes.js";
import gigRoutes          from "./src/routes/gig.routes.js";
import bookingRoutes      from "./src/routes/booking.routes.js";
import reviewRoutes       from "./src/routes/review.routes.js";
import messageRoutes      from "./src/routes/message.routes.js";
import disputeRoutes      from "./src/routes/dispute.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import payoutRoutes       from "./src/routes/payout.routes.js";
import promoRoutes        from "./src/routes/promoCode.routes.js";
import uploadRoutes       from "./src/routes/upload.routes.js";
import adminRoutes        from "./src/routes/admin.routes.js";
import offerRoutes        from "./src/routes/offer.routes.js";
import { errorHandler, notFound } from "./src/middleware/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(s => s.trim())
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Static: serve uploaded images ─────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/vendors",       vendorRoutes);
app.use("/api/gigs",          gigRoutes);
app.use("/api/bookings",      bookingRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/disputes",      disputeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payouts",       payoutRoutes);
app.use("/api/promos",        promoRoutes);
app.use("/api/upload",        uploadRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/offers",        offerRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error handlers ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── HTTP server + Socket.io ───────────────────────────────────
const httpServer = createServer(app);
initSocket(httpServer);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀  Vizhiyal API running on http://localhost:${PORT}`);
});
