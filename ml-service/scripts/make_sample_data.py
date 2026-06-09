"""Generate a synthetic vendors.csv for local testing of the recommender.

This mirrors the columns produced by Back-end/prisma/export-vendors-csv.js so
the service can be exercised before the real DB export exists.

    python scripts/make_sample_data.py
"""

import csv
import json
import os
import random

random.seed(42)

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CITIES = json.load(open(os.path.join(HERE, "data", "sl_cities.json")))
CATEGORIES = [
    "Photography", "Videography", "Decoration", "Catering", "Venue",
    "DJ & Music", "Makeup & Beauty", "Cakes & Sweets",
]
OUT = os.path.join(HERE, "data", "vendors.csv")

rows = []
for i in range(50):
    city = random.choice(list(CITIES.keys()))
    c = CITIES[city]
    # jitter coords a little so vendors in the same city aren't identical
    lat = round(c["lat"] + random.uniform(-0.05, 0.05), 4)
    lng = round(c["lng"] + random.uniform(-0.05, 0.05), 4)
    pmin = random.choice([5000, 8000, 12000, 20000, 30000])
    pmax = pmin + random.choice([10000, 25000, 50000, 80000])
    rows.append({
        "vendor_id": f"vendor-{i+1:02d}",
        "category": random.choice(CATEGORIES),
        "latitude": lat,
        "longitude": lng,
        "avg_rating": round(random.uniform(3.0, 5.0), 1),
        "total_reviews": random.randint(0, 120),
        "completed_jobs": random.randint(0, 80),
        "price_min": pmin,
        "price_max": pmax,
        "is_verified": random.choice([True, False]),
    })

header = list(rows[0].keys())
with open(OUT, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=header)
    w.writeheader()
    w.writerows(rows)

print(f"Wrote {len(rows)} vendors to {OUT}")
