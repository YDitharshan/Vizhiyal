# 🎉 Vizhiyal EMS

**A Gig-First Event Services Marketplace for Sri Lanka**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js) ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Available Commands](#-available-commands)
- [API Overview](#-api-overview)
- [Database Schema](#️-database-schema)
- [Troubleshooting](#-troubleshooting)
- [Team](#-team)
- [License](#-license)

---

## 🌟 Overview

**Vizhiyal EMS** is a full-stack event services marketplace where buyers discover and book independent event service providers across Sri Lanka. The platform is built around a **gig-first model** — every listing is an independent gig (not a vendor profile), each with its own pricing, photos, rating, and reviews — similar to how Fiverr works, but tailored for the Sri Lankan events industry.

### What Problem Does It Solve?

- **For Buyers:** Finding reliable, reviewed event vendors (photographers, DJs, caterers, decorators, etc.) in one place instead of searching across social media
- **For Sellers:** A professional platform to list services, manage bookings, receive payments, and build a reputation through verified reviews
- **For Admins:** Full oversight of the platform — users, bookings, disputes, payouts, and announcements

### Who Is It For?

| Role                  | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| **Buyers**            | Anyone planning a wedding, birthday, corporate event, or any occasion                    |
| **Sellers / Vendors** | Event service providers — photographers, DJs, caterers, decorators, venues, and more     |
| **Admins**            | Platform administrators who manage users, resolve disputes, and maintain platform health |

---

## ✨ Features

### For Buyers

- 🔍 **Browse Gigs** — Search and filter gigs by category, location, price, rating, and verified status
- ❤️ **Wishlist** — Save favourite gigs (per-gig, not per-vendor)
- 📅 **Book Services** — Request bookings with event date, type, package selection, and notes
- 💬 **In-App Chat** — Message vendors directly before booking
- 🌟 **Reviews** — Leave a star rating and comment after a completed booking
- ⚠️ **Disputes** — Raise disputes for unresolved booking issues
- 🎟️ **Promo Codes** — Apply discount codes at checkout

### For Sellers / Vendors

- 🛠️ **Gig Management** — Create multiple gigs, each with basic / standard / premium packages
- 📋 **Seller Profile** — Business info, tagline, languages, portfolio, work experience, skills, certifications, and profile strength score
- 📬 **Booking Management** — Confirm, progress, and complete bookings; submit completion evidence
- 💰 **Payout Requests** — Request earnings withdrawal with bank details
- 🗓️ **Availability Calendar** — Block out unavailable dates
- 💡 **Custom Offers** — Send tailored offers to buyers inside a conversation

### For Admins

- 👥 **User Management** — View, activate, deactivate, and manage user roles
- 🔖 **Seller Verification** — Approve or reject seller applications
- 📝 **Review Moderation** — Flag and remove inappropriate reviews
- ⚖️ **Dispute Resolution** — Review and resolve buyer–seller disputes
- 💸 **Payout Processing** — Approve or reject vendor payout requests
- 📢 **Announcements** — Broadcast messages to all users, buyers, or sellers
- 🎟️ **Promo Code Management** — Create and manage discount codes
- 📊 **Platform Analytics** — Dashboard with key metrics

---

## 🛠️ Tech Stack

### Frontend

| Technology       | Purpose                             |
| ---------------- | ----------------------------------- |
| React 19 + Vite  | UI library with fast HMR dev server |
| React Router v7  | Client-side routing                 |
| TailwindCSS      | Utility-first styling               |
| Lucide React     | Icon library                        |
| Axios            | HTTP client for API calls           |
| Socket.io Client | Real-time chat                      |

### Backend

| Technology           | Purpose                             |
| -------------------- | ----------------------------------- |
| Node.js + Express.js | REST API server                     |
| Prisma ORM           | Database access & schema management |
| PostgreSQL 16        | Relational database                 |
| JWT (jsonwebtoken)   | Authentication tokens               |
| bcryptjs             | Password hashing                    |
| Multer               | File / image uploads                |
| Express Validator    | Request validation                  |
| Socket.io            | Real-time messaging                 |

### DevOps

| Technology              | Purpose                                 |
| ----------------------- | --------------------------------------- |
| Docker + Docker Compose | Containerisation & orchestration        |
| Nodemon                 | Auto-restart backend during development |

---

## 📋 Prerequisites

Make sure you have the following installed before you begin:

- **Docker Desktop** — [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** — Latest version

> That's it. Node.js and PostgreSQL do **not** need to be installed locally — Docker handles everything.

---

## 🚀 Quick Start

Get the full application running in minutes:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/vizhiyal.git
cd vizhiyal

# 2. Set up environment variables
cp Back-end/.env.example Back-end/.env
# Edit Back-end/.env with your values (see Environment Variables section)

# 3. Start all services (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 4. Run the database migration (first time only)
docker-compose exec backend npx prisma db push

# 5. Seed the database with initial data (optional)
docker-compose exec backend npm run seed

# 6. Open the app
# Frontend  →  http://localhost:5173
# Backend   →  http://localhost:5000/api
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `Back-end/` directory (copy from `.env.example`):

```env
# Database
DATABASE_URL="postgresql://vizhiyal:your-password@host.docker.internal:5432/vizhiyal"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# App
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

The frontend reads one variable — create `Front-end/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

> ⚠️ **Never commit `.env` files to version control.** Both are already listed in `.gitignore`.

| Variable         | Description                                      | Example                               |
| ---------------- | ------------------------------------------------ | ------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                     | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET`     | Secret key for signing JWT tokens (min 32 chars) | `a-long-random-secret`                |
| `JWT_EXPIRES_IN` | Token expiry duration                            | `7d`                                  |
| `CLIENT_URL`     | Frontend origin (for CORS)                       | `http://localhost:5173`               |
| `VITE_API_URL`   | Backend API base URL (frontend only)             | `http://localhost:5000/api`           |

---

## 📁 Project Structure

```
Vizhiyal/
├── Back-end/
│   ├── src/
│   │   ├── controllers/        # Route handler logic
│   │   │   ├── auth.controller.js
│   │   │   ├── vendor.controller.js
│   │   │   ├── gig.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── review.controller.js
│   │   │   ├── dispute.controller.js
│   │   │   ├── message.controller.js
│   │   │   └── admin.controller.js
│   │   ├── routes/             # Express route definitions
│   │   ├── middleware/         # Auth guard, upload, validation
│   │   ├── config/             # Prisma client, env config
│   │   └── services/           # Business logic helpers
│   ├── prisma/
│   │   ├── schema.prisma       # Full database schema
│   │   └── seed.js             # Database seed script
│   ├── public/
│   │   └── uploads/            # Uploaded images (persisted via Docker volume)
│   ├── server.js               # Express app entry point
│   ├── Dockerfile
│   └── package.json
│
├── Front-end/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── buyer/          # Home, Search, VendorDetail, Wishlist, Orders, etc.
│   │   │   ├── seller/         # Dashboard, Gigs, Bookings, SellerProfile, etc.
│   │   │   └── admin/          # Admin dashboard and management pages
│   │   ├── components/
│   │   │   ├── common/         # GigCard, UserAvatar, StarRating, etc.
│   │   │   └── layout/         # Navbar, Sidebar, Footer
│   │   ├── hooks/              # useWishlist, useRecentlyViewed, useAuth, etc.
│   │   ├── services/           # API clients (vendorApi, gigApi, bookingApi, etc.)
│   │   ├── context/            # AuthContext
│   │   └── utils/              # adapters.js, uploadUrl.js, categories.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # All three services defined here
└── README.md
```

---

## 📜 Available Commands

All commands are run from the **project root** directory:

| Command                                          | Description                                             |
| ------------------------------------------------ | ------------------------------------------------------- |
| `docker-compose up -d`                           | Start all services in the background                    |
| `docker-compose down`                            | Stop all services                                       |
| `docker-compose up -d --build`                   | Rebuild images and start (use after dependency changes) |
| `docker-compose restart backend`                 | Restart only the backend                                |
| `docker-compose logs -f backend`                 | Stream backend logs live                                |
| `docker-compose logs -f frontend`                | Stream frontend logs live                               |
| `docker-compose exec backend npx prisma db push` | Sync schema changes to the database                     |
| `docker-compose exec backend npm run db:studio`  | Open Prisma Studio (visual DB browser)                  |
| `docker-compose exec backend npm run seed`       | Seed the database with initial data                     |

> **Live reload is built in.** Edits to `Back-end/src/` restart the server via Nodemon. Edits to `Front-end/src/` update instantly via Vite HMR — no rebuild needed.

---

## 📚 API Overview

**Base URL:** `http://localhost:5000/api`

**Authentication:** All protected routes require a `Bearer` token in the `Authorization` header.

| Group         | Prefix           | Description                       |
| ------------- | ---------------- | --------------------------------- |
| Auth          | `/auth`          | Register, login, token refresh    |
| Vendors       | `/vendors`       | Vendor profiles, listing, search  |
| Gigs          | `/gigs`          | Gig CRUD, search, filters         |
| Bookings      | `/bookings`      | Create, manage, complete bookings |
| Reviews       | `/reviews`       | Submit and view per-gig reviews   |
| Disputes      | `/disputes`      | Raise and manage disputes         |
| Messages      | `/messages`      | Conversations and chat            |
| Offers        | `/offers`        | Custom seller offers to buyers    |
| Payouts       | `/payouts`       | Vendor payout requests            |
| Notifications | `/notifications` | User notifications                |
| Admin         | `/admin`         | Admin-only platform management    |
| Upload        | `/upload`        | Image upload endpoint             |

---

## 🗄️ Database Schema

Key models and their relationships:

```
User
 ├── VendorProfile (one-to-one, sellers only)
 │    └── Gig[] (one vendor → many gigs)
 │         ├── Booking[] (one gig → many bookings)
 │         │    ├── Review (one booking → one review)
 │         │    └── Dispute (one booking → one dispute)
 │         └── Offer[]
 └── Booking[] (as buyer)

VendorProfile
 ├── avgRating, totalReviews      (vendor-level aggregate)
 ├── tagline, languages, skills, certifications
 ├── portfolioItems, workExperience  (JSON fields)
 └── VendorAvailability[]

Gig
 ├── avgRating, totalReviews      (per-gig aggregate, independent from vendor)
 ├── basicPrice / standardPrice / premiumPrice
 └── images[]

Review
 ├── linked to Booking (one-to-one)
 ├── linked to VendorProfile  (updates vendor avgRating)
 └── linked to Gig            (updates gig avgRating independently)
```

The full schema is at [`Back-end/prisma/schema.prisma`](./Back-end/prisma/schema.prisma).

---

## 🔧 Troubleshooting

**Containers won't start**

```bash
docker-compose down
docker-compose up -d --build
```

**Frontend changes not showing**
Ensure the frontend volume mount is present in `docker-compose.yml`:

```yaml
volumes:
  - ./Front-end/src:/app/src
```

**Backend changes not reflecting**
The `Back-end/src/` directory is volume-mounted — Nodemon restarts automatically. If it still doesn't update:

```bash
docker-compose restart backend
```

**Database connection error**

```bash
# Check all containers are healthy
docker-compose ps

# View backend logs for the exact error
docker-compose logs backend
```

**Schema changes not applying**
After editing `prisma/schema.prisma`, copy the file into the container and push:

```bash
docker cp Back-end/prisma/schema.prisma vizhiyal-backend-1:/app/prisma/schema.prisma
docker-compose exec backend npx prisma db push
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

**Port already in use (Windows)**

```bash
netstat -ano | findstr :5000
taskkill /PID <pid> /F
```

---
