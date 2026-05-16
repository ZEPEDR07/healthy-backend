#!/usr/bin/env python3
"""
Adds /api/metrics/sync endpoint to server.py
Run from the healthy-backend root: python patch_metrics_sync.py
"""

ENDPOINT_CODE = '''

# ============ METRICS SYNC (Health Connect / HealthKit) ============
class MetricsSyncReq(BaseModel):
    date: str
    steps: Optional[int] = 0
    km: Optional[float] = 0
    active_minutes: Optional[int] = 0
    calories: Optional[int] = 0
    resting_hr: Optional[int] = 0
    hrv: Optional[int] = 0
    sleep_hours: Optional[float] = 0
    sleep_score: Optional[int] = 0
    respiratory_rate: Optional[float] = 0
    stress: Optional[int] = 0
    recovery: Optional[int] = 0
    strain: Optional[float] = 0
    body_battery: Optional[int] = 0

@api_router.post("/metrics/sync")
async def sync_metrics(req: MetricsSyncReq, user=Depends(get_current_user)):
    """Receive real health data from Health Connect or HealthKit and store/update."""
    data = req.dict()
    data["user_id"] = user["id"]
    data["source"] = "health_connect"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Derived fields to fill gaps
    if data.get("sleep_hours") and not data.get("sleep_score"):
        data["sleep_score"] = min(100, int((data["sleep_hours"] / 8) * 100))

    # Keep existing simulation fields that are not provided
    existing = await db.metrics.find_one({"user_id": user["id"], "date": req.date}, {"_id": 0})
    if existing:
        # Merge: real data overrides simulated
        merged = {**existing, **{k: v for k, v in data.items() if v}}
        await db.metrics.replace_one({"user_id": user["id"], "date": req.date}, merged)
    else:
        # Fill missing fields with defaults
        defaults = {
            "stress_highest": data.get("stress", 30),
            "stress_lowest": max(0, data.get("stress", 30) - 20),
            "stress_avg": data.get("stress", 30),
            "sleep_stages": {"deep": 0, "rem": 0, "light": 0, "awake": 0},
            "hr_zones": [0, 0, 0, 0, 0],
            "stress_timeline": [data.get("stress", 30)] * 24,
        }
        await db.metrics.insert_one({**defaults, **data})

    return {"ok": True, "date": req.date}

@api_router.get("/metrics/sync/status")
async def sync_status(user=Depends(get_current_user)):
    """Check if user has real synced data."""
    count = await db.metrics.count_documents({"user_id": user["id"], "source": "health_connect"})
    return {"has_real_data": count > 0, "synced_days": count}
'''

INSERT_BEFORE = 'app.include_router(api_router)'

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

if '/metrics/sync' in content:
    print('✅ Endpoint already exists')
else:
    content = content.replace(INSERT_BEFORE, ENDPOINT_CODE + '\n' + INSERT_BEFORE)
    with open('backend/server.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('✅ metrics/sync endpoint added')
