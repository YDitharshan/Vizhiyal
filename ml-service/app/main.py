"""FastAPI entry point for the Vizhiyal vendor recommender."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .recommender import recommender
from .schemas import (
    PlanRequest,
    PlanResponse,
    RecommendRequest,
    RecommendResponse,
    SimilarVendor,
    TrainResponse,
)

app = FastAPI(title="Vizhiyal Recommender", version="1.0.0")


@app.on_event("startup")
def _startup() -> None:
    # Load a persisted model, or train from data/vendors.csv if present.
    recommender.load()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_ready": recommender.ready,
        "vendors": len(recommender.vendors),
    }


@app.post("/train", response_model=TrainResponse)
def train() -> TrainResponse:
    try:
        info = recommender.train()
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    return TrainResponse(status="trained", **info)


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest) -> RecommendResponse:
    if not recommender.ready:
        raise HTTPException(status_code=503, detail="Model not trained. POST /train first.")
    results = recommender.recommend(
        category=req.category,
        latitude=req.latitude,
        longitude=req.longitude,
        budget=req.budget,
        top_n=req.top_n,
        weights=req.weights.model_dump(exclude_none=True) if req.weights else None,
    )
    return RecommendResponse(count=len(results), results=results)


@app.post("/plan", response_model=PlanResponse)
def plan(req: PlanRequest) -> PlanResponse:
    """AI Budget Concierge: split a total budget across categories and
    recommend in-budget vendors for each — the engine behind Event Bundles."""
    if not recommender.ready:
        raise HTTPException(status_code=503, detail="Model not trained. POST /train first.")
    allocations = recommender.plan(
        categories=req.categories,
        total_budget=req.total_budget,
        latitude=req.latitude,
        longitude=req.longitude,
        per_category=req.per_category,
        weights=req.weights.model_dump(exclude_none=True) if req.weights else None,
    )
    return PlanResponse(total_budget=req.total_budget, allocations=allocations)


@app.get("/similar/{vendor_id}", response_model=list[SimilarVendor])
def similar(vendor_id: str, top_n: int = 5) -> list[SimilarVendor]:
    if not recommender.ready:
        raise HTTPException(status_code=503, detail="Model not trained. POST /train first.")
    return recommender.similar(vendor_id, top_n=top_n)
