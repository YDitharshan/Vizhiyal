"""Feature engineering for the vendor recommender.

Each customer/vendor pair is reduced to four interpretable sub-scores in [0, 1]:
    distance_score   — closer vendors score higher (haversine, inverted)
    rating_score     — avg_rating / 5
    experience_score — log-scaled (completed_jobs + total_reviews), normalised
    price_score      — how well the vendor's price band fits the customer budget

These four are what both the weighted-sum ranking and the scikit-learn
NearestNeighbors layer operate on, so the model stays explainable.
"""

from __future__ import annotations

import math
from typing import Optional

import numpy as np

EARTH_RADIUS_KM = 6371.0

# Distance beyond which a vendor is treated as "far" (distance_score -> ~0).
# Sri Lanka is ~430 km end to end, so 300 km is effectively the whole island.
MAX_DISTANCE_KM = 300.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in kilometres."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def distance_score(
    cust_lat: Optional[float],
    cust_lng: Optional[float],
    ven_lat: Optional[float],
    ven_lng: Optional[float],
) -> float:
    """1.0 = same place, decaying linearly to 0.0 at MAX_DISTANCE_KM.

    If either side lacks coordinates we return a neutral 0.5 so a vendor is
    neither rewarded nor punished for missing location data.
    """
    if None in (cust_lat, cust_lng, ven_lat, ven_lng):
        return 0.5
    km = haversine_km(cust_lat, cust_lng, ven_lat, ven_lng)
    return float(max(0.0, 1.0 - km / MAX_DISTANCE_KM))


def rating_score(avg_rating: Optional[float]) -> float:
    """avg_rating (0–5) mapped to 0–1."""
    if avg_rating is None:
        return 0.0
    return float(max(0.0, min(1.0, avg_rating / 5.0)))


def experience_score(
    completed_jobs: Optional[float],
    total_reviews: Optional[float],
    norm: float,
) -> float:
    """Log-scaled experience, normalised against the busiest vendor.

    Log scaling stops a single very experienced vendor from dominating the
    raw scale. `norm` is log1p(max experience across the catalogue) and is
    computed once at train time.
    """
    jobs = completed_jobs or 0
    reviews = total_reviews or 0
    raw = math.log1p(jobs + reviews)
    if norm <= 0:
        return 0.0
    return float(max(0.0, min(1.0, raw / norm)))


def price_score(
    budget: Optional[float],
    price_min: Optional[float],
    price_max: Optional[float],
) -> float:
    """How well the vendor's price band fits the customer's budget.

    • No budget given            -> neutral 1.0 (don't filter on price)
    • budget within [min, max]   -> 1.0 (perfect fit)
    • budget above the band      -> 1.0 (customer can afford it comfortably)
    • budget below the band      -> decays with how far under budget is
    """
    if budget is None or budget <= 0:
        return 1.0
    if price_min is None:
        return 0.5  # unknown pricing -> neutral-ish
    if budget >= price_min:
        return 1.0
    # Budget is below the vendor's entry price: score by the shortfall ratio.
    return float(max(0.0, budget / price_min))


def build_feature_row(
    request: dict,
    vendor: dict,
    experience_norm: float,
) -> np.ndarray:
    """Return the 4-dim feature vector for one (customer, vendor) pair."""
    return np.array(
        [
            distance_score(
                request.get("latitude"),
                request.get("longitude"),
                vendor.get("latitude"),
                vendor.get("longitude"),
            ),
            rating_score(vendor.get("avg_rating")),
            experience_score(
                vendor.get("completed_jobs"),
                vendor.get("total_reviews"),
                experience_norm,
            ),
            price_score(
                request.get("budget"),
                vendor.get("price_min"),
                vendor.get("price_max"),
            ),
        ],
        dtype=float,
    )


# Order of features in every vector — kept in one place so the API response
# and the model stay aligned.
FEATURE_NAMES = ("distance", "rating", "experience", "price")
