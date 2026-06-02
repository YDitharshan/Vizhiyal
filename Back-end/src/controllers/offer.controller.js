// controllers/offer.controller.js
// createOffer · getOffersByConversation · withdrawOffer · acceptOffer · rejectOffer
import prisma from "../config/db.js";

const COMMISSION_RATE = 0.15;

// ── @POST /api/offers  (seller only) ─────────────────────────
export const createOffer = async (req, res) => {
  const {
    conversationId, gigId, amount, deliveryDays,
    deliverables, timeline, note, eventDate,
  } = req.body;

  if (!conversationId || !gigId || !amount)
    return res.status(400).json({ success: false, message: "conversationId, gigId and amount are required" });

  try {
    // Resolve seller's vendor profile
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    // Verify the gig belongs to this seller
    const gig = await prisma.gig.findFirst({
      where: { id: gigId, vendorId: profile.id },
    });
    if (!gig)
      return res.status(403).json({ success: false, message: "Gig not found or does not belong to you" });

    // Get the conversation and identify the buyer
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true } } },
    });
    if (!conversation)
      return res.status(404).json({ success: false, message: "Conversation not found" });

    const buyer = conversation.participants.find(p => p.id !== req.user.id);
    if (!buyer)
      return res.status(400).json({ success: false, message: "Could not identify buyer in this conversation" });

    const offer = await prisma.offer.create({
      data: {
        conversationId,
        sellerId:     profile.id,
        buyerId:      buyer.id,
        gigId,
        amount:       Number(amount),
        deliveryDays: Number(deliveryDays) || 7,
        deliverables: deliverables || "",
        timeline:     timeline     || "",
        note:         note         || "",
        eventDate:    eventDate ? new Date(eventDate) : null,
      },
      include: {
        gig:    { select: { title: true, category: true, images: true } },
        seller: { select: { businessName: true } },
      },
    });

    return res.status(201).json({ success: true, offer });
  } catch (err) {
    console.error("createOffer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/offers/conversation/:convId  (buyer or seller) ──
export const getOffersByConversation = async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where:   { conversationId: req.params.convId },
      include: {
        gig:    { select: { title: true, category: true, images: true } },
        seller: { select: { businessName: true, isVerified: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, offers });
  } catch (err) {
    console.error("getOffersByConversation error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/offers/:id/withdraw  (seller only) ────────────
export const withdrawOffer = async (req, res) => {
  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile)
      return res.status(404).json({ success: false, message: "Vendor profile not found" });

    const offer = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!offer)
      return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.sellerId !== profile.id)
      return res.status(403).json({ success: false, message: "Not authorised" });
    if (offer.status !== "pending")
      return res.status(400).json({ success: false, message: "Only a pending offer can be withdrawn" });

    const updated = await prisma.offer.update({
      where: { id: req.params.id },
      data:  { status: "withdrawn" },
    });

    return res.json({ success: true, offer: updated });
  } catch (err) {
    console.error("withdrawOffer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/offers/:id/accept  (buyer only) ───────────────
// Accepts the offer and creates a Booking in one transaction.
export const acceptOffer = async (req, res) => {
  try {
    const offer = await prisma.offer.findUnique({
      where:   { id: req.params.id },
      include: { gig: true, seller: true },
    });
    if (!offer)
      return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.buyerId !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorised" });
    if (offer.status !== "pending")
      return res.status(400).json({ success: false, message: "This offer is no longer available" });

    // Derive event date: use offer's eventDate or now + deliveryDays
    const eventDate = offer.eventDate
      || new Date(Date.now() + offer.deliveryDays * 86_400_000);

    const commission = +(offer.amount * COMMISSION_RATE).toFixed(2);

    // Accept offer + create booking atomically
    const { booking } = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          buyerId:     req.user.id,
          gigId:       offer.gigId,
          vendorId:    offer.sellerId,
          packageType: "basic",           // offer-based — no traditional package
          eventDate,
          totalAmount: offer.amount,
          commission,
          notes:       offer.note,
        },
      });

      await tx.offer.update({
        where: { id: offer.id },
        data:  { status: "accepted", bookingId: newBooking.id },
      });

      return { booking: newBooking };
    });

    // Re-fetch offer with full include for response
    const updatedOffer = await prisma.offer.findUnique({
      where:   { id: offer.id },
      include: {
        gig:    { select: { title: true, category: true, images: true } },
        seller: { select: { businessName: true } },
      },
    });

    return res.json({ success: true, offer: updatedOffer, booking });
  } catch (err) {
    console.error("acceptOffer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PATCH /api/offers/:id/reject  (buyer only) ───────────────
export const rejectOffer = async (req, res) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!offer)
      return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.buyerId !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorised" });
    if (offer.status !== "pending")
      return res.status(400).json({ success: false, message: "This offer is no longer available" });

    const updated = await prisma.offer.update({
      where: { id: req.params.id },
      data:  { status: "rejected" },
    });

    return res.json({ success: true, offer: updated });
  } catch (err) {
    console.error("rejectOffer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
