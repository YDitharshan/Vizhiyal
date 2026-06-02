// sellerData.js — dummy data for seller-side pages

export const dummyGigs = [
  {
    id: "G001",
    title: "Professional Wedding Photography",
    category: "Photography",
    status: "active",
    rating: 4.9,
    reviewCount: 38,
    orders: 12,
    packages: {
      basic:    { name: "Basic",    price: 15000, deliveryDays: 3, features: ["4 hours coverage", "100 edited photos", "Online gallery"] },
      standard: { name: "Standard", price: 28000, deliveryDays: 5, features: ["8 hours coverage", "300 edited photos", "Online gallery", "Printed album"] },
      premium:  { name: "Premium",  price: 55000, deliveryDays: 7, features: ["Full day coverage", "500+ edited photos", "2 photographers", "Premium album", "Rush delivery"] },
    },
    tags: ["Wedding", "Portrait", "Outdoor"],
    location: "Colombo, Sri Lanka",
    deliveryDays: 5,
    description: "Capturing your most precious moments with a professional touch. I specialize in candid and traditional wedding photography with over 5 years of experience.",
    portfolio: [
      "https://picsum.photos/seed/gig1a/400/300",
      "https://picsum.photos/seed/gig1b/400/300",
      "https://picsum.photos/seed/gig1c/400/300",
    ],
    createdAt: "2025-11-10",
  },
  {
    id: "G002",
    title: "Cinematic Wedding Videography",
    category: "Videography",
    status: "active",
    rating: 4.8,
    reviewCount: 21,
    orders: 7,
    packages: {
      basic:    { name: "Basic",    price: 20000, deliveryDays: 7,  features: ["4 hours recording", "10-min highlight reel", "HD quality"] },
      standard: { name: "Standard", price: 40000, deliveryDays: 10, features: ["Full day recording", "30-min film", "4K quality", "Drone shots"] },
      premium:  { name: "Premium",  price: 75000, deliveryDays: 14, features: ["Full day + 2nd day", "Full film + highlights", "4K + Drone", "Same-day edit teaser"] },
    },
    tags: ["Wedding", "Cinematic", "Drone"],
    location: "Colombo, Sri Lanka",
    deliveryDays: 10,
    description: "Award-winning cinematic wedding films that tell your story beautifully. From drone shots to intimate close-ups, every frame is crafted with care.",
    portfolio: [
      "https://picsum.photos/seed/gig2a/400/300",
      "https://picsum.photos/seed/gig2b/400/300",
    ],
    createdAt: "2025-12-01",
  },
  {
    id: "G003",
    title: "Elegant Event Decoration",
    category: "Decoration",
    status: "paused",
    rating: 4.7,
    reviewCount: 15,
    orders: 5,
    packages: {
      basic:    { name: "Basic",    price: 12000, deliveryDays: 1, features: ["Table centerpieces", "Basic floral setup"] },
      standard: { name: "Standard", price: 25000, deliveryDays: 1, features: ["Full hall decoration", "Flower arch", "Lighting"] },
      premium:  { name: "Premium",  price: 50000, deliveryDays: 1, features: ["Luxury decoration", "Custom theme", "Floral arch", "Premium lighting", "Setup & teardown"] },
    },
    tags: ["Wedding", "Corporate", "Birthday"],
    location: "Kandy, Sri Lanka",
    deliveryDays: 1,
    description: "Transforming venues into dream settings. Specializing in floral, lighting, and thematic decorations for weddings and corporate events.",
    portfolio: [
      "https://picsum.photos/seed/gig3a/400/300",
      "https://picsum.photos/seed/gig3b/400/300",
      "https://picsum.photos/seed/gig3c/400/300",
    ],
    createdAt: "2026-01-15",
  },
];

export const sellerOrders = [
  { id: "SO-001", buyer: "Amara Silva",   buyerAvatar: "https://picsum.photos/seed/amara/40/40",   gig: "Professional Wedding Photography", package: "Standard", eventDate: "2026-05-12", amount: 28000, status: "confirmed",  createdAt: "2026-03-10" },
  { id: "SO-002", buyer: "Ravi Kumar",    buyerAvatar: "https://picsum.photos/seed/ravi/40/40",    gig: "Cinematic Wedding Videography",    package: "Premium",  eventDate: "2026-04-28", amount: 75000, status: "pending",    createdAt: "2026-03-15" },
  { id: "SO-003", buyer: "Priya Nair",    buyerAvatar: "https://picsum.photos/seed/priya/40/40",   gig: "Elegant Event Decoration",         package: "Basic",    eventDate: "2026-06-05", amount: 12000, status: "pending",    createdAt: "2026-03-18" },
  { id: "SO-004", buyer: "Janani Silva",  buyerAvatar: "https://picsum.photos/seed/janani/40/40",  gig: "Professional Wedding Photography", package: "Premium",  eventDate: "2026-04-15", amount: 55000, status: "completed",  createdAt: "2026-02-01" },
  { id: "SO-005", buyer: "Chamara W.",    buyerAvatar: "https://picsum.photos/seed/chamara/40/40", gig: "Cinematic Wedding Videography",    package: "Standard", eventDate: "2026-05-20", amount: 40000, status: "confirmed",  createdAt: "2026-03-05", hasDispute: true },
  { id: "SO-006", buyer: "Fathima Ali",  buyerAvatar: "https://picsum.photos/seed/fathima/40/40", gig: "Elegant Event Decoration",         package: "Standard", eventDate: "2026-03-30", amount: 25000, status: "cancelled",  createdAt: "2026-03-01" },
];

export const sellerConversations = [
  { id: "SC-1", buyer: "Amara Silva",  buyerAvatar: "https://picsum.photos/seed/amara/40/40",   lastMsg: "Can you do a site visit before the wedding?",    time: "10 min ago", unread: 2 },
  { id: "SC-2", buyer: "Ravi Kumar",   buyerAvatar: "https://picsum.photos/seed/ravi/40/40",    lastMsg: "I sent the deposit receipt, please confirm.",     time: "2h ago",     unread: 0 },
  { id: "SC-3", buyer: "Priya Nair",   buyerAvatar: "https://picsum.photos/seed/priya/40/40",   lastMsg: "What colors are available for the backdrop?",     time: "Yesterday",  unread: 1 },
  { id: "SC-4", buyer: "Janani Silva", buyerAvatar: "https://picsum.photos/seed/janani/40/40",  lastMsg: "Thank you! The photos came out beautifully.",     time: "3d ago",     unread: 0 },
];

export const CATEGORIES = [
  "Photography", "Videography", "Music & DJ", "Decoration",
  "Catering", "Venues", "Cakes & Pastry",
];

export const EVENT_TAGS = [
  "Wedding", "Birthday", "Corporate", "Engagement", "Prom",
  "Anniversary", "Baby Shower", "Religious", "Outdoor",
];
