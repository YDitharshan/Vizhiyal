# Vendor Recommendation Engine — Implementation Plan

> Suggests the ideal vendor for a customer based on **nearest location**, **star rating**,
> **previous work**, and **price range**. Built for the Vizhiyal EMS (React + Node/Express +
> Prisma + PostgreSQL, Sri Lanka market).

## The approach in one sentence

Ship a **content-based ranking recommender** now (genuine ML via scikit-learn `StandardScaler`
+ `NearestNeighbors`, plus a transparent weighted-score layer — works with 50 vendors and zero
interaction history), instrumented to collect the booking/click data that lets us **upgrade to a
supervised learning-to-rank model** later, behind the *same* API, with no rewrite.

### Why not "just train a deep ML model on the 50 vendors"?

50 vendors is the **catalog**, not 50 training examples. A supervised recommender learns from
**labels** like *"customer A (budget X, in Colombo) booked vendor Y."* We don't have many of
those yet. A heavy model trained on 50 rows with no interaction history overfits and performs
worse than a good scoring formula. So the plan is **phased**: a solid content-based engine first,
a supervised model once real interaction data accrues.

### Why a separate Python microservice?

- Real ML ecosystem: scikit-learn, pandas, numpy, joblib.
- Retrain independently of the app; persist the model artifact.
- Slots into the existing `docker-compose.yml` as a 4th service.
- Clean upgrade path to Phase 2 (learning-to-rank) without touching app code.

```
Frontend ──▶ Node/Express  ──HTTP──▶  Python ml-service (FastAPI + scikit-learn)
(React)      /api/recommend           /recommend, /train, /health
                  │                         │
                  └────── Postgres ◀────────┘  (ml-service reads vendor features)
```

---

## The two constraints we solved

1. **"Nearest location" was not solvable as-is** — `VendorProfile.location` is free text (city
   name) with no coordinates. Fix: a static lookup table mapping the ~13 known Sri Lankan cities
   → lat/long, then **haversine** distance. No paid geocoding API.

2. **Limited training data** — addressed by the phased approach above.

---

## Phase 0 — Data prep

### 0.1 Schema additions (`prisma/schema.prisma`)
- `VendorProfile.latitude  Float?`  — derived from city via lookup table.
- `VendorProfile.longitude Float?`
- `VendorProfile.completedJobs Int @default(0)` — "previous work" signal (count of `Booking`
  with `status = completed`).
- `VendorProfile.priceMin Float?` / `priceMax Float?` — min/max across the vendor's gig packages,
  so price-fit is one cheap lookup.

### 0.2 City → coordinates lookup
- `ml-service/data/sl_cities.json` (also mirrored for the backend) with lat/long for the 13 cities.
- `latitude/longitude` populated on profile create/update in `vendor.controller.js`.

### 0.3 Scripts
- `prisma/backfill-recommender.mjs` — fills `completedJobs`, `priceMin/Max`, and `lat/long` for
  existing vendors.
- `prisma/export-vendors-csv.js` — exports the 50-vendor dataset to `ml-service/data/vendors.csv`
  with columns: `vendor_id, category, latitude, longitude, avg_rating, total_reviews,
  completed_jobs, price_min, price_max, is_verified`.

---

## Phase 1 — The recommender (ships now)

**Customer request input:**
```json
{ "category": "Photography", "latitude": 6.92, "longitude": 79.86,
  "budget": 50000, "top_n": 6,
  "weights": { "distance":0.3, "rating":0.3, "experience":0.2, "price":0.2 } }
```

**Algorithm (in `ml-service`):**
1. **Hard filter:** vendor `category` matches the request.
2. **Feature engineering → normalized 0–1 sub-scores per candidate:**
   - `distance_score` = haversine(customer, vendor), inverted & normalized (closer = higher).
   - `rating_score`   = `avg_rating / 5`.
   - `experience_score` = log-scaled `completed_jobs + total_reviews`, normalized (log avoids one
     veteran dominating).
   - `price_score` = how well `[priceMin, priceMax]` fits `budget` (1.0 inside budget, decaying
     outside).
3. **scikit-learn layer:** `StandardScaler` + `NearestNeighbors` over the feature matrix to find
   vendors closest to the customer's "ideal point," **plus** a weighted-sum score for ranking and
   explainability.
4. **Return top-N** with a per-vendor score breakdown so the UI can show *"4.8★ · 3 km away ·
   within budget."*

**Endpoints:** `POST /recommend`, `POST /train` (rebuilds scaler/index, persists via `joblib`),
`GET /health`.

---

## Phase 2 — Supervised upgrade (later, no rewrite)

1. **Collect labels now** — a `RecommendationLog` table logging impressions + click/booking
   outcome. This is the single most important step for "real ML later."
2. **At ~500–1000 labeled interactions** — train a learning-to-rank model (`LightGBM LGBMRanker`
   or logistic regression) on the same features + the new label "did the customer book this
   vendor." The `/recommend` contract is unchanged; k-NN remains the cold-start fallback.
3. Optional collaborative filtering once repeat buyers exist.

---

## Integration points

**Backend** — `recommend.controller.js` + route `GET /api/recommend/vendors`, mounted in
`server.js`; gathers request params, calls the ml-service, maps returned `vendor_id`s back to full
vendor objects via Prisma (same shape as `listVendors`). New env: `ML_SERVICE_URL`.

**Frontend** — `recommendApi.js` service; a **"Recommended for you"** rail on `Home.jsx` and in
the `Booking` flow, reusing the existing `VendorCard`/`GigCard`, with the score breakdown as small
badges.

**Docker** — `ml-service` block in `docker-compose.yml` (Python 3.11, port 8000,
`depends_on: postgres`), and `ML_SERVICE_URL=http://ml-service:8000` on the backend.

---

## Build order (milestones)

| # | Deliverable | Outcome |
|---|---|---|
| 1 | Schema migration + city lookup + backfill | Vendors have coords, completedJobs, price range |
| 2 | Export 50 vendors → CSV | Reproducible dataset |
| 3 | FastAPI skeleton + `/health` in docker-compose | 4th service runs |
| 4 | Feature engineering + scoring + k-NN + `/recommend` | Recommendations from curl |
| 5 | Node `/api/recommend/vendors` proxy | Backend serves recommendations |
| 6 | Home + Booking UI rails | Users see it |
| 7 | `RecommendationLog` table | Collecting labels for Phase 2 |

## Tech added
- `ml-service/`: `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `numpy`, `joblib`,
  `psycopg2-binary`.
- Backend: an HTTP client for the proxy call.
