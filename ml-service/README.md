# Vizhiyal ML Service — Vendor Recommender

FastAPI + scikit-learn microservice that suggests the ideal vendor for a customer
based on **nearest location**, **star rating**, **previous work**, and **price range**.

See [`../ML_RECOMMENDER_PLAN.md`](../ML_RECOMMENDER_PLAN.md) for the full design.

## How it works (Phase 1)

`/recommend` ranks vendors by a transparent **weighted sum** of four interpretable
sub-scores (each 0–1):

| sub-score   | from                                   |
|-------------|----------------------------------------|
| distance    | haversine(customer, vendor), inverted  |
| rating      | `avg_rating / 5`                       |
| experience  | log-scaled `completed_jobs + total_reviews` |
| price       | how well the vendor's price band fits the budget |

`/similar/{vendor_id}` is a real scikit-learn k-NN model (`StandardScaler` +
`NearestNeighbors`) over static vendor attributes, persisted with `joblib`.

The weights are sensible cold-start defaults now and become **learned** in Phase 2
once booking/click labels exist — the API contract does not change.

## Endpoints

| Method | Path                | Purpose                                  |
|--------|---------------------|------------------------------------------|
| GET    | `/health`           | liveness + whether a model is loaded     |
| POST   | `/train`            | (re)load `data/vendors.csv`, fit & persist |
| POST   | `/recommend`        | ranked vendor recommendations            |
| GET    | `/similar/{id}`     | vendors similar to a given vendor        |

### Example

```bash
curl -s localhost:8000/recommend -H 'content-type: application/json' -d '{
  "category": "Photography",
  "latitude": 6.9271, "longitude": 79.8612,
  "budget": 40000, "top_n": 5
}' | jq
```

## Getting data

The model reads `data/vendors.csv`. Two ways to populate it:

1. **Real data (production):** from the Back-end folder run
   `node prisma/backfill-recommender.mjs && node prisma/export-vendors-csv.js`
   which writes `ml-service/data/vendors.csv`, then `POST /train`.
2. **Synthetic data (local demo):** `python scripts/make_sample_data.py`.

On startup the service loads a persisted model if present, otherwise trains from
`data/vendors.csv` if that exists. If neither exists, `/recommend` returns 503
until you `POST /train`.

## Run locally (without Docker)

```bash
python3.11 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python scripts/make_sample_data.py        # or export real data
uvicorn app.main:app --reload --port 8000
```

## Run with Docker

Defined as the `ml-service` in the root `docker-compose.yml`:

```bash
docker compose up ml-service
```
