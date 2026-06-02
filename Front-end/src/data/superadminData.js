// superadminData.js — dummy data for super admin pages

export const adminAccounts = [
  {
    id: "ADM-001",
    name: "Saman Kumara",
    email: "saman@vizhiyal.com",
    avatar: "https://picsum.photos/seed/saman/80/80",
    role: "admin",
    status: "active",
    lastLogin: "2026-03-22",
    createdAt: "2025-08-10",
  },
  {
    id: "ADM-002",
    name: "Dilini Fernando",
    email: "dilini@vizhiyal.com",
    avatar: "https://picsum.photos/seed/dilini/80/80",
    role: "admin",
    status: "active",
    lastLogin: "2026-03-21",
    createdAt: "2025-09-05",
  },
  {
    id: "ADM-003",
    name: "Tharindu Silva",
    email: "tharindu@vizhiyal.com",
    avatar: "https://picsum.photos/seed/tharindu/80/80",
    role: "admin",
    status: "suspended",
    lastLogin: "2026-03-10",
    createdAt: "2025-10-20",
  },
  {
    id: "ADM-004",
    name: "Nadeeka Perera",
    email: "nadeeka@vizhiyal.com",
    avatar: "https://picsum.photos/seed/nadeeka/80/80",
    role: "superadmin",
    status: "active",
    lastLogin: "2026-03-22",
    createdAt: "2025-07-01",
  },
];

export const auditLogs = [
  { id: "AL-001", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Approved seller application",    target: "Nimal Perera",    type: "seller", time: "10 min ago"  },
  { id: "AL-002", admin: "Dilini Fernando", adminAvatar: "https://picsum.photos/seed/dilini/40/40",  action: "Suspended user account",         target: "Fathima Ali",    type: "user",   time: "2h ago"      },
  { id: "AL-003", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Cancelled order",                target: "BK006",          type: "order",  time: "3h ago"      },
  { id: "AL-004", admin: "Dilini Fernando", adminAvatar: "https://picsum.photos/seed/dilini/40/40",  action: "Rejected seller application",    target: "Rajeev S.",      type: "seller", time: "Yesterday"   },
  { id: "AL-005", admin: "Tharindu Silva",  adminAvatar: "https://picsum.photos/seed/tharindu/40/40",action: "Suspended gig",                  target: "Elegant Decor",  type: "gig",    time: "2d ago"      },
  { id: "AL-006", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Reinstated user account",        target: "Ravi Kumar",     type: "user",   time: "3d ago"      },
  { id: "AL-007", admin: "Nadeeka Perera",  adminAvatar: "https://picsum.photos/seed/nadeeka/40/40", action: "Created admin account",          target: "Saman Kumara",   type: "system", time: "4d ago"      },
  { id: "AL-008", admin: "Nadeeka Perera",  adminAvatar: "https://picsum.photos/seed/nadeeka/40/40", action: "Changed commission rate to 10%", target: "Platform",       type: "system", time: "1w ago"      },
  { id: "AL-009", admin: "Dilini Fernando", adminAvatar: "https://picsum.photos/seed/dilini/40/40",  action: "Confirmed order",                target: "BK002",          type: "order",  time: "1w ago"      },
  { id: "AL-010", admin: "Tharindu Silva",  adminAvatar: "https://picsum.photos/seed/tharindu/40/40",action: "Restored gig",                   target: "Beat Masters DJ",type: "gig",    time: "2w ago"      },
];

export const platformStats = {
  totalUsers:            1240,
  totalVendors:          87,
  totalOrders:           543,
  totalRevenue:          4820000,
  activeGigs:            312,
  pendingApplications:   2,
};

export const systemMetrics = [
  { label: "API Response Time", value: "142ms",  status: "good",    note: "avg over last 24h"     },
  { label: "Error Rate",        value: "0.3%",   status: "good",    note: "last 24 hours"          },
  { label: "Active Sessions",   value: "84",     status: "good",    note: "current live users"     },
  { label: "DB Connections",    value: "12 / 50",status: "good",    note: "pool utilisation 24%"   },
  { label: "Storage Used",      value: "34 GB",  status: "warning", note: "68% of 50 GB limit"     },
  { label: "CDN Cache Hit",     value: "91%",    status: "good",    note: "last 7 days"            },
];

// ─── Announcements ──────────────────────────────────────────────────────────
export const announcements = [
  {
    id: "ANN-001",
    title: "Platform Maintenance Scheduled",
    body: "Vizhiyal will undergo scheduled maintenance on March 25, 2026 from 2:00 AM to 4:00 AM (IST). All services will be temporarily unavailable during this window.",
    target: "all",
    priority: "high",
    status: "active",
    createdBy: "Nadeeka Perera",
    createdAt: "2026-03-22",
    expiresAt: "2026-03-25",
  },
  {
    id: "ANN-002",
    title: "New Seller Payout Schedule",
    body: "Starting April 1, 2026, payouts will be processed every Monday. All pending payouts will be settled by March 31.",
    target: "sellers",
    priority: "medium",
    status: "active",
    createdBy: "Nadeeka Perera",
    createdAt: "2026-03-20",
    expiresAt: "2026-04-05",
  },
  {
    id: "ANN-003",
    title: "Welcome to Vizhiyal!",
    body: "Vizhiyal is now live! Book top-rated photographers, decorators, caterers and more for your upcoming events across Sri Lanka.",
    target: "all",
    priority: "low",
    status: "inactive",
    createdBy: "Nadeeka Perera",
    createdAt: "2025-07-01",
    expiresAt: "2025-12-31",
  },
];

// ─── Promo Codes ────────────────────────────────────────────────────────────
export const promoCodes = [
  {
    id: "PRO-001",
    code: "VIZHIYAL10",
    description: "10% off for all new buyers on first booking",
    discountType: "percent",
    discountValue: 10,
    minOrder: 10000,
    usageLimit: 100,
    usedCount: 47,
    status: "active",
    expiresAt: "2026-06-30",
    createdAt: "2026-01-01",
  },
  {
    id: "PRO-002",
    code: "WEDDING500",
    description: "LKR 500 off on wedding photography bookings",
    discountType: "flat",
    discountValue: 500,
    minOrder: 25000,
    usageLimit: 50,
    usedCount: 50,
    status: "expired",
    expiresAt: "2026-03-15",
    createdAt: "2026-02-01",
  },
  {
    id: "PRO-003",
    code: "SPRING2026",
    description: "15% discount on all bookings for April events",
    discountType: "percent",
    discountValue: 15,
    minOrder: 15000,
    usageLimit: 200,
    usedCount: 0,
    status: "active",
    expiresAt: "2026-04-30",
    createdAt: "2026-03-22",
  },
  {
    id: "PRO-004",
    code: "DECO20",
    description: "20% off on decoration services",
    discountType: "percent",
    discountValue: 20,
    minOrder: 20000,
    usageLimit: 30,
    usedCount: 12,
    status: "inactive",
    expiresAt: "2026-05-31",
    createdAt: "2026-03-10",
  },
];

// ─── Backup History ─────────────────────────────────────────────────────────
export const backupHistory = [
  { id: "BK-001", type: "full",        status: "success", size: "1.2 GB",  initiatedBy: "System (auto)",  createdAt: "2026-03-22 02:00" },
  { id: "BK-002", type: "full",        status: "success", size: "1.18 GB", initiatedBy: "System (auto)",  createdAt: "2026-03-21 02:00" },
  { id: "BK-003", type: "incremental", status: "success", size: "48 MB",   initiatedBy: "Nadeeka Perera", createdAt: "2026-03-20 14:30" },
  { id: "BK-004", type: "full",        status: "failed",  size: "—",       initiatedBy: "System (auto)",  createdAt: "2026-03-20 02:00" },
  { id: "BK-005", type: "full",        status: "success", size: "1.15 GB", initiatedBy: "System (auto)",  createdAt: "2026-03-19 02:00" },
];

// ─── Admin Activity Feed ────────────────────────────────────────────────────
export const adminActivity = [
  { id: "ACT-001", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Approved seller application", target: "Nimal Perera",        type: "seller", time: "2026-03-22 10:15" },
  { id: "ACT-002", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "https://picsum.photos/seed/dilini/40/40",  action: "Suspended user account",      target: "Fathima Ali",         type: "user",   time: "2026-03-22 09:30" },
  { id: "ACT-003", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Resolved dispute D-003",      target: "BK006 Dispute",       type: "order",  time: "2026-03-21 16:45" },
  { id: "ACT-004", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "https://picsum.photos/seed/dilini/40/40",  action: "Rejected seller application", target: "Rajeev S.",           type: "seller", time: "2026-03-21 14:00" },
  { id: "ACT-005", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Removed flagged review",      target: "Elegant Event Decor", type: "gig",    time: "2026-03-21 11:20" },
  { id: "ACT-006", adminId: "ADM-003", admin: "Tharindu Silva",  adminAvatar: "https://picsum.photos/seed/tharindu/40/40",action: "Suspended gig",               target: "Elegant Event Decor", type: "gig",    time: "2026-03-20 15:10" },
  { id: "ACT-007", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "https://picsum.photos/seed/dilini/40/40",  action: "Confirmed order",             target: "BK003",               type: "order",  time: "2026-03-20 10:05" },
  { id: "ACT-008", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Processed payout PO-002",     target: "Lens & Light Studio", type: "system", time: "2026-03-19 16:00" },
  { id: "ACT-009", adminId: "ADM-002", admin: "Dilini Fernando", adminAvatar: "https://picsum.photos/seed/dilini/40/40",  action: "Closed support ticket",       target: "Priya Nair",          type: "user",   time: "2026-03-19 11:30" },
  { id: "ACT-010", adminId: "ADM-001", admin: "Saman Kumara",    adminAvatar: "https://picsum.photos/seed/saman/40/40",   action: "Approved seller application", target: "Pradeep Fernando",    type: "seller", time: "2026-03-18 09:15" },
];

// ─── Revenue Analytics ──────────────────────────────────────────────────────
export const revenueData = {
  summary: {
    totalGross:      601000,
    totalCommission: 90150,
    totalPayouts:    510850,
    avgOrderValue:   9540,
    topMonth:        "March 2026",
    growth:          "+33.6%",
  },
  monthly: [
    { month: "Oct 2025", gross: 48000,  commission: 7200,  payouts: 40800,  orders: 8  },
    { month: "Nov 2025", gross: 72000,  commission: 10800, payouts: 61200,  orders: 12 },
    { month: "Dec 2025", gross: 135000, commission: 20250, payouts: 114750, orders: 17 },
    { month: "Jan 2026", gross: 89000,  commission: 13350, payouts: 75650,  orders: 13 },
    { month: "Feb 2026", gross: 110000, commission: 16500, payouts: 93500,  orders: 15 },
    { month: "Mar 2026", gross: 147000, commission: 22050, payouts: 124950, orders: 21 },
  ],
  byCategory: [
    { category: "Photography", gross: 68000, commission: 10200, orders: 2 },
    { category: "Videography", gross: 40000, commission: 6000,  orders: 1 },
    { category: "Catering",    gross: 65000, commission: 9750,  orders: 1 },
    { category: "Decoration",  gross: 50000, commission: 7500,  orders: 1 },
    { category: "Music & DJ",  gross: 18000, commission: 2700,  orders: 1 },
  ],
};

// ─── Role Permissions ────────────────────────────────────────────────────────
export const rolePermissions = [
  { feature: "View Dashboard",              category: "General",    admin: true,  superadmin: true  },
  { feature: "View Analytics",              category: "General",    admin: true,  superadmin: true  },
  { feature: "Manage Seller Applications",  category: "Marketplace",admin: true,  superadmin: true  },
  { feature: "Suspend / Reinstate Vendors", category: "Marketplace",admin: true,  superadmin: true  },
  { feature: "Manage Users",                category: "Marketplace",admin: true,  superadmin: true  },
  { feature: "Manage Orders",               category: "Marketplace",admin: true,  superadmin: true  },
  { feature: "Manage Gigs",                 category: "Marketplace",admin: true,  superadmin: true  },
  { feature: "Handle Disputes",             category: "Management", admin: true,  superadmin: true  },
  { feature: "Moderate Reviews",            category: "Management", admin: true,  superadmin: true  },
  { feature: "Process Payouts",             category: "Management", admin: true,  superadmin: true  },
  { feature: "Manage Support Tickets",      category: "Management", admin: true,  superadmin: true  },
  { feature: "Set Featured Gigs",           category: "Management", admin: true,  superadmin: true  },
  { feature: "Manage Admin Accounts",       category: "Platform",   admin: false, superadmin: true  },
  { feature: "Set Role Permissions",        category: "Platform",   admin: false, superadmin: true  },
  { feature: "Platform Settings",           category: "Platform",   admin: false, superadmin: true  },
  { feature: "Post Announcements",          category: "Platform",   admin: false, superadmin: true  },
  { feature: "Manage Promo Codes",          category: "Platform",   admin: false, superadmin: true  },
  { feature: "Revenue Analytics",           category: "Platform",   admin: false, superadmin: true  },
  { feature: "Backup & Recovery",           category: "Platform",   admin: false, superadmin: true  },
  { feature: "View Full Audit Logs",        category: "Platform",   admin: false, superadmin: true  },
  { feature: "System Health Monitor",       category: "Platform",   admin: false, superadmin: true  },
  { feature: "Delete Admin Accounts",       category: "Platform",   admin: false, superadmin: true  },
];
