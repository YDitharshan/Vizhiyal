"""Vendor recommender.

Phase 1 design (works with ~50 vendors and no interaction history):

  • /recommend  — ranks vendors for a customer request by a transparent
                  weighted sum of four interpretable sub-scores (distance,
                  rating, experience, price). The weights are sensible cold-
                  start defaults today and become *learned* in Phase 2 once we
                  have booking/click labels — the API contract stays identical.

  • /similar    — a genuine scikit-learn k-NN model (StandardScaler +
                  NearestNeighbors) fit on the catalogue's static attributes,
                  used for "vendors similar to this one." Persisted with joblib.

Keeping the ranking explainable (weighted sub-scores) while using sklearn where
it genuinely adds value (similarity / cold-start neighbours) is the right call
at this data size; a heavy learned ranker on 50 rows would overfit.
"""

from __future__ import annotations

import math
import os
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

from .features import FEATURE_NAMES, build_feature_row, haversine_km

DATA_PATH = os.environ.get("VENDORS_CSV", "data/vendors.csv")
MODEL_PATH = os.environ.get("MODEL_PATH", "models/recommender.joblib")

# Default cold-start weights (sum to 1.0). Phase 2 replaces these with weights
# learned from booking outcomes.
DEFAULT_WEIGHTS = {
    "distance": 0.30,
    "rating": 0.30,
    "experience": 0.20,
    "price": 0.20,
}

# Static (query-independent) attributes the k-NN "similar vendors" model uses.
SIMILARITY_FEATURES = ["avg_rating", "total_reviews", "completed_jobs",
                       "price_min", "price_max", "latitude", "longitude"]

# ── Budget-allocation priors (AI Budget Concierge) ────────────────
# Typical share of an event budget each service category commands. These are
# domain priors (Sri Lankan events market) used to split a total budget across
# the categories a buyer selects; they are renormalised over whatever subset of
# categories is actually requested. Phase 2 can learn these from real bundles.
CATEGORY_BUDGET_WEIGHTS = {
    "venue": 0.24,
    "catering": 0.24,
    "photography": 0.11,
    "videography": 0.09,
    "decoration": 0.09,
    "dj & music": 0.06,
    "sound system": 0.04,
    "lighting": 0.03,
    "makeup & beauty": 0.04,
    "cakes & sweets": 0.03,
    "floral design": 0.03,
    "event planning": 0.05,
    "mc & host": 0.02,
}
DEFAULT_CATEGORY_WEIGHT = 0.05  # unknown category → modest equal-ish slice


def _normalise_weights(weights: Optional[dict]) -> np.ndarray:
    """Return a length-4 weight vector aligned to FEATURE_NAMES, summing to 1."""
    w = dict(DEFAULT_WEIGHTS)
    if weights:
        for k, v in weights.items():
            if k in w and isinstance(v, (int, float)) and v >= 0:
                w[k] = float(v)
    vec = np.array([w[name] for name in FEATURE_NAMES], dtype=float)
    total = vec.sum()
    return vec / total if total > 0 else np.array([0.25, 0.25, 0.25, 0.25])


class Recommender:
    def __init__(self) -> None:
        self.vendors: list[dict] = []
        self.experience_norm: float = 1.0
        self.scaler: Optional[StandardScaler] = None
        self.knn: Optional[NearestNeighbors] = None
        self._sim_ids: list[str] = []  # vendor_id order behind the knn matrix

    # ── Training / loading ────────────────────────────────────────
    def train(self, csv_path: str = DATA_PATH) -> dict:
        """Load the vendor catalogue and (re)fit the similarity model."""
        df = pd.read_csv(csv_path)
        if df.empty:
            raise ValueError(f"{csv_path} contains no vendors")

        self.vendors = df.to_dict(orient="records")

        # Global experience normaliser: log1p of the busiest vendor's volume.
        exp_raw = [
            math.log1p((v.get("completed_jobs") or 0) + (v.get("total_reviews") or 0))
            for v in self.vendors
        ]
        self.experience_norm = max(exp_raw) if exp_raw else 1.0
        if self.experience_norm <= 0:
            self.experience_norm = 1.0

        # k-NN similarity model on static attributes (fill missing with 0).
        feat = df.reindex(columns=SIMILARITY_FEATURES).fillna(0.0).to_numpy(dtype=float)
        self._sim_ids = [str(v["vendor_id"]) for v in self.vendors]
        self.scaler = StandardScaler().fit(feat)
        scaled = self.scaler.transform(feat)
        n_neighbors = min(6, len(self.vendors))
        self.knn = NearestNeighbors(n_neighbors=n_neighbors, metric="euclidean").fit(scaled)

        self.persist()
        return {"vendors": len(self.vendors), "experience_norm": self.experience_norm}

    def persist(self) -> None:
        os.makedirs(os.path.dirname(MODEL_PATH) or ".", exist_ok=True)
        joblib.dump(
            {
                "vendors": self.vendors,
                "experience_norm": self.experience_norm,
                "scaler": self.scaler,
                "knn": self.knn,
                "sim_ids": self._sim_ids,
            },
            MODEL_PATH,
        )

    def load(self) -> bool:
        """Load a persisted model; fall back to training from CSV if absent."""
        if os.path.exists(MODEL_PATH):
            blob = joblib.load(MODEL_PATH)
            self.vendors = blob["vendors"]
            self.experience_norm = blob["experience_norm"]
            self.scaler = blob.get("scaler")
            self.knn = blob.get("knn")
            self._sim_ids = blob.get("sim_ids", [])
            return True
        if os.path.exists(DATA_PATH):
            self.train()
            return True
        return False

    @property
    def ready(self) -> bool:
        return bool(self.vendors)

    # ── Recommendation ────────────────────────────────────────────
    def recommend(
        self,
        category: Optional[str],
        latitude: Optional[float],
        longitude: Optional[float],
        budget: Optional[float],
        top_n: int = 6,
        weights: Optional[dict] = None,
    ) -> list[dict]:
        if not self.ready:
            return []

        w = _normalise_weights(weights)
        request = {"latitude": latitude, "longitude": longitude, "budget": budget}

        # Hard filter on category (case-insensitive). No category -> all vendors.
        cands = self.vendors
        if category:
            cat = category.strip().lower()
            cands = [v for v in self.vendors if str(v.get("category", "")).lower() == cat]

        results = []
        for v in cands:
            row = build_feature_row(request, v, self.experience_norm)  # 4 sub-scores
            weighted = float(np.dot(row, w))                            # 0..1
            breakdown = {name: round(float(s), 4) for name, s in zip(FEATURE_NAMES, row)}

            km = None
            if None not in (latitude, longitude, v.get("latitude"), v.get("longitude")):
                km = round(haversine_km(latitude, longitude, v["latitude"], v["longitude"]), 1)

            results.append(
                {
                    "vendor_id": str(v["vendor_id"]),
                    "category": v.get("category"),
                    "match_score": round(weighted * 100, 1),  # 0–100 for the UI
                    "distance_km": km,
                    "scores": breakdown,
                    "avg_rating": v.get("avg_rating"),
                    "completed_jobs": v.get("completed_jobs"),
                    "price_min": v.get("price_min"),
                    "price_max": v.get("price_max"),
                }
            )

        results.sort(key=lambda r: r["match_score"], reverse=True)
        return results[: max(1, top_n)]

    # ── Event bundle planner (AI Budget Concierge) ────────────────
    def plan(
        self,
        categories: list[str],
        total_budget: float,
        latitude: Optional[float],
        longitude: Optional[float],
        per_category: int = 3,
        weights: Optional[dict] = None,
    ) -> list[dict]:
        """Split `total_budget` across `categories` and recommend per slot.

        Returns one allocation per category: the LKR sub-budget assigned to it
        plus the top candidate vendors for that sub-budget — so the buyer gets
        a complete, in-budget, availability-aware event line-up in one call.
        """
        if not self.ready:
            return []

        # De-duplicate while preserving the buyer's order.
        seen: set[str] = set()
        cats: list[str] = []
        for c in categories:
            key = c.strip().lower()
            if key and key not in seen:
                seen.add(key)
                cats.append(c.strip())

        # Renormalise the budget priors over just the requested categories.
        raw = [CATEGORY_BUDGET_WEIGHTS.get(c.lower(), DEFAULT_CATEGORY_WEIGHT) for c in cats]
        denom = sum(raw) or 1.0
        shares = [w / denom for w in raw]

        allocations = []
        for cat, share in zip(cats, shares):
            slot_budget = round(total_budget * share, 2)
            candidates = self.recommend(
                category=cat,
                latitude=latitude,
                longitude=longitude,
                budget=slot_budget,
                top_n=per_category,
                weights=weights,
            )
            allocations.append(
                {
                    "category": cat,
                    "budget": slot_budget,
                    "budget_share": round(share, 4),
                    "candidates": candidates,
                }
            )
        return allocations

    # ── Similar vendors (sklearn k-NN) ────────────────────────────
    def similar(self, vendor_id: str, top_n: int = 5) -> list[dict]:
        """Vendors most similar to `vendor_id` on static attributes."""
        if not (self.knn and self.scaler) or vendor_id not in self._sim_ids:
            return []
        idx = self._sim_ids.index(vendor_id)
        df = pd.DataFrame(self.vendors)
        feat = df.reindex(columns=SIMILARITY_FEATURES).fillna(0.0).to_numpy(dtype=float)
        scaled = self.scaler.transform(feat[idx : idx + 1])
        k = min(top_n + 1, len(self._sim_ids))
        dist, nbrs = self.knn.kneighbors(scaled, n_neighbors=k)

        out = []
        for d, j in zip(dist[0], nbrs[0]):
            if self._sim_ids[j] == vendor_id:
                continue  # skip self
            v = self.vendors[j]
            out.append(
                {
                    "vendor_id": str(v["vendor_id"]),
                    "category": v.get("category"),
                    "similarity": round(1.0 / (1.0 + float(d)), 4),  # 0..1, higher = closer
                    "avg_rating": v.get("avg_rating"),
                }
            )
        return out[:top_n]


# Module-level singleton used by the FastAPI app.
recommender = Recommender()
