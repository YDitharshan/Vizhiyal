"""Request/response models for the recommender API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Weights(BaseModel):
    distance: Optional[float] = Field(default=None, ge=0)
    rating: Optional[float] = Field(default=None, ge=0)
    experience: Optional[float] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, ge=0)


class RecommendRequest(BaseModel):
    category: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    budget: Optional[float] = Field(default=None, ge=0)
    top_n: int = Field(default=6, ge=1, le=50)
    weights: Optional[Weights] = None


class ScoreBreakdown(BaseModel):
    distance: float
    rating: float
    experience: float
    price: float


class VendorRecommendation(BaseModel):
    vendor_id: str
    category: Optional[str] = None
    match_score: float
    distance_km: Optional[float] = None
    scores: ScoreBreakdown
    avg_rating: Optional[float] = None
    completed_jobs: Optional[float] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None


class RecommendResponse(BaseModel):
    count: int
    results: list[VendorRecommendation]


class SimilarVendor(BaseModel):
    vendor_id: str
    category: Optional[str] = None
    similarity: float
    avg_rating: Optional[float] = None


# ── Event Bundle planner (AI Budget Concierge) ───────────────────
class PlanRequest(BaseModel):
    """A whole-event request: plan several categories under one budget."""

    categories: list[str] = Field(min_length=1)
    total_budget: float = Field(gt=0)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    guest_count: int = Field(default=0, ge=0)
    # How many candidate vendors to return per category slot.
    per_category: int = Field(default=3, ge=1, le=10)
    weights: Optional[Weights] = None


class CategoryAllocation(BaseModel):
    category: str
    budget: float                 # LKR allocated to this category slot
    budget_share: float           # fraction of total_budget (0–1)
    candidates: list[VendorRecommendation]


class PlanResponse(BaseModel):
    total_budget: float
    allocations: list[CategoryAllocation]


class TrainResponse(BaseModel):
    status: str
    vendors: int
    experience_norm: float
