"""Build the recommender's vendors.csv from the real vendor spreadsheet.

Source: Vizhiyal_50_Realistic_Vendors.xlsx (the 50 sample vendors).
Output: data/vendors.csv — identical schema to Back-end/prisma/export-vendors-csv.js
        so the ml-service trains on it exactly as it would on the DB export.

The spreadsheet supplies the *real* signals:
    vendor_id   <- VendorID
    category    <- ServiceCategory
    latitude    } <- Location, via data/sl_cities.json (deterministic jitter so
    longitude   }    vendors in the same city aren't stacked on one point)
    avg_rating  <- Rating

The remaining columns the model needs aren't in the sheet, so we derive them
deterministically from YearsOfExperience + Rating (seeded per vendor_id, so the
output is reproducible):
    completed_jobs  ~ experience x throughput, nudged by rating
    total_reviews   ~ a fraction of completed jobs
    price_min/max   per-category LKR bands, scaled up by experience
    is_verified     established + well-rated vendors

Run from the ml-service folder (needs openpyxl: pip install openpyxl):
    python scripts/make_data_from_xlsx.py
"""

import csv
import json
import os
import random

import openpyxl

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(HERE, "..", "Vizhiyal_50_Realistic_Vendors.xlsx")
CITIES = json.load(open(os.path.join(HERE, "data", "sl_cities.json")))
OUT = os.path.join(HERE, "data", "vendors.csv")

# Per-category base price bands in LKR (entry-level packages). The vendor's
# band is this base scaled up a little by their years of experience.
PRICE_BANDS = {
    "Photography":    (25_000, 120_000),
    "Videography":    (40_000, 220_000),
    "Music & DJ":     (30_000, 160_000),
    "Decoration":     (35_000, 280_000),
    "Catering":       (60_000, 450_000),
    "Venues":         (120_000, 750_000),
    "Cakes & Pastry": (8_000, 55_000),
}
DEFAULT_BAND = (20_000, 150_000)

HEADER = [
    "vendor_id", "category", "latitude", "longitude", "avg_rating",
    "total_reviews", "completed_jobs", "price_min", "price_max", "is_verified",
]


def coords_for(location, rng):
    """City name -> jittered lat/lng, or (None, None) if unknown."""
    c = CITIES.get((location or "").strip().lower())
    if not c:
        return None, None
    lat = round(c["lat"] + rng.uniform(-0.04, 0.04), 4)
    lng = round(c["lng"] + rng.uniform(-0.04, 0.04), 4)
    return lat, lng


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.active
    raw = list(ws.iter_rows(values_only=True))
    header = [str(h).strip() for h in raw[0]]
    idx = {name: header.index(name) for name in header}

    rows = []
    for r in raw[1:]:
        if r[idx["VendorID"]] is None:
            continue
        vendor_id = str(r[idx["VendorID"]]).strip()
        category = str(r[idx["ServiceCategory"]]).strip()
        years = int(r[idx["YearsOfExperience"]] or 0)
        rating = float(r[idx["Rating"]] or 0)

        # Reproducible per-vendor randomness.
        rng = random.Random(vendor_id)

        lat, lng = coords_for(r[idx["Location"]], rng)

        # completed_jobs: ~6-12 jobs/year, nudged up by a strong rating.
        per_year = rng.uniform(6, 12) * (0.85 + (rating - 4.0) * 0.5)
        completed_jobs = max(0, int(round(years * per_year)))
        # total_reviews: most—but not all—completed jobs leave a review.
        total_reviews = max(0, int(round(completed_jobs * rng.uniform(0.55, 0.9))))

        base_min, base_max = PRICE_BANDS.get(category, DEFAULT_BAND)
        # Experience premium: up to ~+45% on the band by 14 yrs.
        premium = 1.0 + min(years, 14) / 14 * 0.45
        price_min = int(round(base_min * premium / 1000) * 1000)
        price_max = int(round(base_max * premium / 1000) * 1000)

        is_verified = (years >= 5 and rating >= 4.3) or rating >= 4.7

        rows.append({
            "vendor_id": vendor_id,
            "category": category,
            "latitude": lat if lat is not None else "",
            "longitude": lng if lng is not None else "",
            "avg_rating": rating,
            "total_reviews": total_reviews,
            "completed_jobs": completed_jobs,
            "price_min": price_min,
            "price_max": price_max,
            "is_verified": is_verified,
        })

    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} vendors to {OUT}")


if __name__ == "__main__":
    main()
