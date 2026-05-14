"""
Pulse Recovery OS — backend extensions (notifications, status, preferences,
device management, activity metrics: steps + km).

This file is mounted WITHOUT touching server.py. To activate, add to your
server.py near the bottom (after `app.include_router(api_router)`):

    from extensions import ext_router
    app.include_router(ext_router)

It re-implements its own auth dependency so it can stand alone.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import uuid
import random
import hashlib
import jwt as pyjwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"

_client = AsyncIOMotorClient(MONGO_URL)
_db = _client[DB_NAME]

ext_router = APIRouter(prefix="/api")

# ============ DEVICE CATALOG (massively expanded) ============
# Categories: smartwatch, fitness_band, smart_ring, smart_scale, chest_strap, cycling
DEVICE_CATALOG: List[dict] = [
    # ===== SMARTWATCHES =====
    {"id": "apple_watch_se", "brand": "Apple", "label": "Apple Watch SE", "sub": "1ª/2ª geração", "category": "smartwatch", "icon": "watch"},
    {"id": "apple_watch_series", "brand": "Apple", "label": "Apple Watch Series 6–10", "sub": "Series 6 a 10", "category": "smartwatch", "icon": "watch"},
    {"id": "apple_watch_ultra", "brand": "Apple", "label": "Apple Watch Ultra", "sub": "Ultra 1 / Ultra 2", "category": "smartwatch", "icon": "watch"},
    {"id": "apple_watch", "brand": "Apple", "label": "Apple Watch (legacy)", "sub": "Series 3-5", "category": "smartwatch", "icon": "watch"},

    {"id": "samsung_galaxy_watch", "brand": "Samsung", "label": "Galaxy Watch 4/5/6/7", "sub": "Wear OS", "category": "smartwatch", "icon": "watch"},
    {"id": "samsung_galaxy_watch_ultra", "brand": "Samsung", "label": "Galaxy Watch Ultra", "sub": "Top de gama", "category": "smartwatch", "icon": "watch"},

    {"id": "garmin_fenix", "brand": "Garmin", "label": "Garmin Fenix", "sub": "Fenix 6 / 7 / 8", "category": "smartwatch", "icon": "watch"},
    {"id": "garmin_forerunner", "brand": "Garmin", "label": "Garmin Forerunner", "sub": "55 / 165 / 265 / 965", "category": "smartwatch", "icon": "watch"},
    {"id": "garmin_venu", "brand": "Garmin", "label": "Garmin Venu", "sub": "Venu 2 / 3 / Sq", "category": "smartwatch", "icon": "watch"},
    {"id": "garmin_vivoactive", "brand": "Garmin", "label": "Garmin Vivoactive", "sub": "Vivoactive 4 / 5", "category": "smartwatch", "icon": "watch"},
    {"id": "garmin_epix", "brand": "Garmin", "label": "Garmin Epix / Enduro", "sub": "Pro / Sapphire", "category": "smartwatch", "icon": "watch"},

    {"id": "polar_vantage", "brand": "Polar", "label": "Polar Vantage", "sub": "V2 / V3", "category": "smartwatch", "icon": "watch"},
    {"id": "polar_grit", "brand": "Polar", "label": "Polar Grit X", "sub": "Grit X / Pro", "category": "smartwatch", "icon": "watch"},
    {"id": "polar_ignite", "brand": "Polar", "label": "Polar Ignite", "sub": "Ignite 2 / 3", "category": "smartwatch", "icon": "watch"},
    {"id": "polar_pacer", "brand": "Polar", "label": "Polar Pacer", "sub": "Pacer / Pro", "category": "smartwatch", "icon": "watch"},

    {"id": "huawei_watch_gt", "brand": "Huawei", "label": "Huawei Watch GT", "sub": "GT 3 / 4 / 5", "category": "smartwatch", "icon": "watch"},
    {"id": "huawei_watch_ultimate", "brand": "Huawei", "label": "Huawei Watch Ultimate", "sub": "Premium", "category": "smartwatch", "icon": "watch"},

    {"id": "fitbit_sense", "brand": "Fitbit", "label": "Fitbit Sense", "sub": "Sense / Sense 2", "category": "smartwatch", "icon": "watch"},
    {"id": "fitbit_versa", "brand": "Fitbit", "label": "Fitbit Versa", "sub": "Versa 3 / 4", "category": "smartwatch", "icon": "watch"},

    {"id": "amazfit_gtr", "brand": "Amazfit", "label": "Amazfit GTR", "sub": "GTR 4 / Mini", "category": "smartwatch", "icon": "watch"},
    {"id": "amazfit_gts", "brand": "Amazfit", "label": "Amazfit GTS", "sub": "GTS 4 / Mini", "category": "smartwatch", "icon": "watch"},
    {"id": "amazfit_tplus", "brand": "Amazfit", "label": "Amazfit T-Rex", "sub": "T-Rex Pro / Ultra", "category": "smartwatch", "icon": "watch"},

    {"id": "coros_pace", "brand": "Coros", "label": "Coros Pace", "sub": "Pace 2 / 3", "category": "smartwatch", "icon": "watch"},
    {"id": "coros_apex", "brand": "Coros", "label": "Coros Apex", "sub": "Apex 2 / Pro", "category": "smartwatch", "icon": "watch"},
    {"id": "coros_vertix", "brand": "Coros", "label": "Coros Vertix", "sub": "Vertix 2 / 2S", "category": "smartwatch", "icon": "watch"},

    {"id": "suunto_9_race", "brand": "Suunto", "label": "Suunto 9 / Race", "sub": "Race / Vertical / 9 Peak", "category": "smartwatch", "icon": "watch"},

    {"id": "google_pixel_watch", "brand": "Google", "label": "Pixel Watch", "sub": "Pixel Watch 2 / 3", "category": "smartwatch", "icon": "watch"},
    {"id": "oneplus_watch", "brand": "OnePlus", "label": "OnePlus Watch", "sub": "Watch 2 / 3", "category": "smartwatch", "icon": "watch"},
    {"id": "ticwatch", "brand": "Mobvoi", "label": "TicWatch", "sub": "Pro 5 / GTH", "category": "smartwatch", "icon": "watch"},
    {"id": "whoop_4", "brand": "Whoop", "label": "Whoop 4.0", "sub": "Sem ecrã (banda)", "category": "smartwatch", "icon": "pulse"},

    # ===== FITNESS BANDS =====
    {"id": "mi_band_7", "brand": "Xiaomi", "label": "Mi Smart Band 7", "sub": "Mi Band 7 / 7 Pro / NFC", "category": "fitness_band", "icon": "fitness"},
    {"id": "mi_band_8", "brand": "Xiaomi", "label": "Mi Smart Band 8", "sub": "Mi Band 8 / 8 Pro / Active", "category": "fitness_band", "icon": "fitness"},
    {"id": "mi_band_9", "brand": "Xiaomi", "label": "Mi Smart Band 9", "sub": "Mi Band 9 / 9 Pro / Active", "category": "fitness_band", "icon": "fitness"},
    {"id": "redmi_smart_band", "brand": "Xiaomi", "label": "Redmi Smart Band", "sub": "2 / Pro", "category": "fitness_band", "icon": "fitness"},

    {"id": "fitbit_charge", "brand": "Fitbit", "label": "Fitbit Charge", "sub": "Charge 5 / 6", "category": "fitness_band", "icon": "fitness"},
    {"id": "fitbit_inspire", "brand": "Fitbit", "label": "Fitbit Inspire", "sub": "Inspire 3", "category": "fitness_band", "icon": "fitness"},
    {"id": "fitbit_luxe", "brand": "Fitbit", "label": "Fitbit Luxe", "sub": "Luxe Special Edition", "category": "fitness_band", "icon": "fitness"},

    {"id": "huawei_band", "brand": "Huawei", "label": "Huawei Band", "sub": "Band 8 / 9 / 10", "category": "fitness_band", "icon": "fitness"},
    {"id": "honor_band", "brand": "Honor", "label": "Honor Band", "sub": "Band 6 / 7", "category": "fitness_band", "icon": "fitness"},

    {"id": "amazfit_band", "brand": "Amazfit", "label": "Amazfit Band", "sub": "Band 7 / Helio Strap", "category": "fitness_band", "icon": "fitness"},

    {"id": "samsung_galaxy_fit", "brand": "Samsung", "label": "Galaxy Fit", "sub": "Fit 3", "category": "fitness_band", "icon": "fitness"},

    # ===== SMART RINGS =====
    {"id": "oura_ring_gen3", "brand": "Oura", "label": "Oura Ring", "sub": "Gen 3 / Gen 4", "category": "smart_ring", "icon": "ellipse"},
    {"id": "ultrahuman_ring", "brand": "Ultrahuman", "label": "Ultrahuman Ring", "sub": "Ring Air", "category": "smart_ring", "icon": "ellipse"},
    {"id": "ringconn", "brand": "RingConn", "label": "RingConn", "sub": "Gen 1 / Gen 2", "category": "smart_ring", "icon": "ellipse"},
    {"id": "circular_ring", "brand": "Circular", "label": "Circular Ring", "sub": "Slim / Pro", "category": "smart_ring", "icon": "ellipse"},
    {"id": "samsung_galaxy_ring", "brand": "Samsung", "label": "Galaxy Ring", "sub": "First gen", "category": "smart_ring", "icon": "ellipse"},

    # ===== SMART SCALES =====
    {"id": "mi_scale_2", "brand": "Xiaomi", "label": "Mi Body Composition Scale", "sub": "Scale 2 / S400", "category": "smart_scale", "icon": "speedometer"},
    {"id": "withings_body_plus", "brand": "Withings", "label": "Withings Body+", "sub": "Body+ / Body Cardio / Smart", "category": "smart_scale", "icon": "speedometer"},
    {"id": "withings_body_scan", "brand": "Withings", "label": "Withings Body Scan", "sub": "Premium ECG/Vasc.", "category": "smart_scale", "icon": "speedometer"},
    {"id": "fitbit_aria", "brand": "Fitbit", "label": "Fitbit Aria", "sub": "Aria Air / 2", "category": "smart_scale", "icon": "speedometer"},
    {"id": "garmin_index", "brand": "Garmin", "label": "Garmin Index", "sub": "Index S2", "category": "smart_scale", "icon": "speedometer"},
    {"id": "renpho_scale", "brand": "Renpho", "label": "Renpho Smart Scale", "sub": "Elis 1 / Elis Solar", "category": "smart_scale", "icon": "speedometer"},
    {"id": "eufy_scale", "brand": "Eufy", "label": "Eufy Smart Scale", "sub": "P2 Pro / P3", "category": "smart_scale", "icon": "speedometer"},

    # ===== CHEST STRAPS / HR =====
    {"id": "polar_h10", "brand": "Polar", "label": "Polar H10", "sub": "Cinto cardíaco premium", "category": "chest_strap", "icon": "heart"},
    {"id": "polar_h9", "brand": "Polar", "label": "Polar H9", "sub": "Cinto cardíaco", "category": "chest_strap", "icon": "heart"},
    {"id": "polar_verity", "brand": "Polar", "label": "Polar Verity Sense", "sub": "Braço óptico", "category": "chest_strap", "icon": "heart"},
    {"id": "garmin_hrm", "brand": "Garmin", "label": "Garmin HRM-Pro", "sub": "HRM-Pro / Dual / Run", "category": "chest_strap", "icon": "heart"},
    {"id": "wahoo_tickr", "brand": "Wahoo", "label": "Wahoo TICKR", "sub": "TICKR X / Fit", "category": "chest_strap", "icon": "heart"},
    {"id": "coospo_h6", "brand": "Coospo", "label": "Coospo H6/H9", "sub": "Cinto cardíaco", "category": "chest_strap", "icon": "heart"},

    # ===== CYCLING (bonus) =====
    {"id": "garmin_edge", "brand": "Garmin", "label": "Garmin Edge", "sub": "Edge 540 / 840 / 1040", "category": "cycling", "icon": "bicycle"},
    {"id": "wahoo_elemnt", "brand": "Wahoo", "label": "Wahoo Elemnt", "sub": "Bolt / Roam / Rival", "category": "cycling", "icon": "bicycle"},
    {"id": "hammerhead_karoo", "brand": "Hammerhead", "label": "Hammerhead Karoo", "sub": "Karoo 2 / 3", "category": "cycling", "icon": "bicycle"},
]

SUPPORTED_DEVICES = [d["id"] for d in DEVICE_CATALOG]
SUPPORTED_STATUSES = ['ativo', 'doente', 'aleijado', 'ferias']
SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'fr']
SUPPORTED_UNITS = ['metric', 'imperial']


# ============ AUTH ============
async def _get_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload["sub"]
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    u = await _db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not u:
        raise HTTPException(status_code=401, detail="User not found")
    return u


def _seed(*args) -> int:
    h = hashlib.sha256("|".join(args).encode()).hexdigest()
    return int(h[:8], 16)


# ============ MODELS ============
class StatusReq(BaseModel):
    status: Literal['ativo', 'doente', 'aleijado', 'ferias']


class PreferencesReq(BaseModel):
    language: Optional[Literal['pt', 'en', 'es', 'fr']] = None
    units: Optional[Literal['metric', 'imperial']] = None
    notifications_enabled: Optional[bool] = None
    daily_recovery_reminder: Optional[bool] = None
    sleep_reminder: Optional[bool] = None
    workout_reminder: Optional[bool] = None


class DeviceReq(BaseModel):
    device: str


class NotifMarkReq(BaseModel):
    notification_id: Optional[str] = None
    mark_all: Optional[bool] = False


# ============ ACTIVITY (steps + km) ============
def _gen_activity(user_id: str, date_str: str) -> dict:
    rng = random.Random(_seed(user_id, "activity", date_str))
    steps = rng.randint(3800, 13500)
    # ~0.75m per step avg
    km = round((steps * 0.75) / 1000, 2)
    floors = rng.randint(3, 25)
    active_min = rng.randint(20, 95)
    calories = int(steps * 0.045) + rng.randint(120, 280)
    return {
        "date": date_str,
        "user_id": user_id,
        "steps": steps,
        "km": km,
        "floors": floors,
        "active_minutes": active_min,
        "calories": calories,
    }


async def _ensure_activity(user_id: str, days: int = 30):
    today = datetime.now(timezone.utc).date()
    existing = await _db.activity.find(
        {"user_id": user_id},
        {"_id": 0, "date": 1}
    ).to_list(length=days + 5)
    have = {a["date"] for a in existing}
    to_insert = []
    for i in range(days):
        d = today - timedelta(days=i)
        ds = d.strftime("%Y-%m-%d")
        if ds not in have:
            to_insert.append(_gen_activity(user_id, ds))
    if to_insert:
        await _db.activity.insert_many(to_insert)


@ext_router.get("/activity/today")
async def activity_today(user=Depends(_get_user)):
    await _ensure_activity(user["id"], days=30)
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    a = await _db.activity.find_one({"user_id": user["id"], "date": today}, {"_id": 0, "user_id": 0})
    return a or _gen_activity(user["id"], today)


@ext_router.get("/activity/history")
async def activity_history(days: int = 7, user=Depends(_get_user)):
    days = min(max(days, 1), 365)
    await _ensure_activity(user["id"], days=max(days, 30))
    cursor = _db.activity.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0}
    ).sort("date", -1).limit(days)
    items = await cursor.to_list(length=days)
    items.reverse()
    return {"items": items}


@ext_router.get("/activity/date/{date}")
async def activity_by_date(date: str, user=Depends(_get_user)):
    a = await _db.activity.find_one({"user_id": user["id"], "date": date}, {"_id": 0, "user_id": 0})
    if not a:
        a = _gen_activity(user["id"], date)
        await _db.activity.insert_one({**a, "user_id": user["id"]})
        a.pop("user_id", None)
    return a


# ============ STATUS ============
@ext_router.patch("/user/status")
async def set_status(req: StatusReq, user=Depends(_get_user)):
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    await _db.users.update_one(
        {"id": user["id"]},
        {"$set": {"current_status": req.status, "current_status_date": today}}
    )
    # Track history
    await _db.status_history.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "status": req.status,
        "date": today,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": req.status, "date": today}


@ext_router.get("/user/status")
async def get_status(user=Depends(_get_user)):
    return {
        "status": user.get("current_status", "ativo"),
        "date": user.get("current_status_date"),
    }


# ============ PREFERENCES ============
@ext_router.get("/user/preferences")
async def get_prefs(user=Depends(_get_user)):
    return {
        "language": user.get("language", "pt"),
        "units": user.get("units", "metric"),
        "notifications_enabled": user.get("notifications_enabled", True),
        "daily_recovery_reminder": user.get("daily_recovery_reminder", True),
        "sleep_reminder": user.get("sleep_reminder", True),
        "workout_reminder": user.get("workout_reminder", False),
    }


@ext_router.patch("/user/preferences")
async def patch_prefs(req: PreferencesReq, user=Depends(_get_user)):
    update = {k: v for k, v in req.dict().items() if v is not None}
    if update:
        await _db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await _db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return {
        "language": updated.get("language", "pt"),
        "units": updated.get("units", "metric"),
        "notifications_enabled": updated.get("notifications_enabled", True),
        "daily_recovery_reminder": updated.get("daily_recovery_reminder", True),
        "sleep_reminder": updated.get("sleep_reminder", True),
        "workout_reminder": updated.get("workout_reminder", False),
    }


# ============ DEVICES ============
@ext_router.get("/devices/catalog")
async def devices_catalog():
    """Return the full device catalog grouped by category for the UI."""
    by_cat: dict = {}
    for d in DEVICE_CATALOG:
        by_cat.setdefault(d["category"], []).append(d)
    return {
        "categories": [
            {"id": "smartwatch", "label_pt": "Relógios inteligentes", "label_en": "Smartwatches", "label_es": "Relojes inteligentes", "label_fr": "Montres connectées", "icon": "watch"},
            {"id": "fitness_band", "label_pt": "Pulseiras fitness", "label_en": "Fitness bands", "label_es": "Pulseras fitness", "label_fr": "Bracelets fitness", "icon": "fitness"},
            {"id": "smart_ring", "label_pt": "Anéis inteligentes", "label_en": "Smart rings", "label_es": "Anillos inteligentes", "label_fr": "Bagues connectées", "icon": "ellipse"},
            {"id": "smart_scale", "label_pt": "Balanças inteligentes", "label_en": "Smart scales", "label_es": "Básculas inteligentes", "label_fr": "Balances connectées", "icon": "speedometer"},
            {"id": "chest_strap", "label_pt": "Sensores cardíacos", "label_en": "HR sensors", "label_es": "Sensores cardíacos", "label_fr": "Capteurs cardio", "icon": "heart"},
            {"id": "cycling", "label_pt": "Ciclismo", "label_en": "Cycling", "label_es": "Ciclismo", "label_fr": "Cyclisme", "icon": "bicycle"},
        ],
        "devices": DEVICE_CATALOG,
        "by_category": by_cat,
    }


@ext_router.post("/user/devices/add")
async def add_device(req: DeviceReq, user=Depends(_get_user)):
    if req.device not in SUPPORTED_DEVICES:
        raise HTTPException(status_code=400, detail="Unsupported device")
    devices = user.get("devices", [])
    if req.device not in devices:
        devices.append(req.device)
    await _db.users.update_one({"id": user["id"]}, {"$set": {"devices": devices}})
    return {"devices": devices}


@ext_router.post("/user/devices/remove")
async def remove_device(req: DeviceReq, user=Depends(_get_user)):
    devices = [d for d in user.get("devices", []) if d != req.device]
    await _db.users.update_one({"id": user["id"]}, {"$set": {"devices": devices}})
    return {"devices": devices}


# ============ NUTRITION HISTORY (for sparklines) ============
@ext_router.get("/nutrition/history")
async def nutrition_history(days: int = 7, user=Depends(_get_user)):
    """Aggregate daily totals across last N days for sparkline display.
    Falls back to deterministic sample data when no food_logs exist so the UI
    always renders a meaningful trend.
    """
    days = min(max(days, 1), 30)
    today = datetime.now(timezone.utc).date()
    date_list = [(today - timedelta(days=i)) for i in range(days)]
    date_list.reverse()  # oldest first
    date_strs = [d.strftime("%Y-%m-%d") for d in date_list]

    cursor = _db.food_logs.find(
        {"user_id": user["id"], "date": {"$in": date_strs}},
        {"_id": 0, "date": 1, "totals": 1},
    )
    raw = await cursor.to_list(length=500)

    agg: dict = {ds: {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0} for ds in date_strs}
    for r in raw:
        ds = r.get("date")
        t = r.get("totals") or {}
        if ds in agg:
            for k in ("calories", "protein_g", "carbs_g", "fat_g"):
                agg[ds][k] += int(t.get(k, 0))

    # If user has no logs at all in the period → generate soft mock baseline so
    # sparklines are not flat zero-lines. Only when all days are empty.
    has_any = any(any(v.values()) for v in agg.values())
    if not has_any:
        rng = random.Random(_seed(user["id"], "nut_mock"))
        for i, ds in enumerate(date_strs):
            base = 1800 + rng.randint(-300, 400)
            agg[ds]["calories"] = base
            agg[ds]["protein_g"] = int(base * 0.22 / 4) + rng.randint(-8, 8)
            agg[ds]["carbs_g"] = int(base * 0.48 / 4) + rng.randint(-10, 10)
            agg[ds]["fat_g"] = int(base * 0.30 / 9) + rng.randint(-5, 5)

    series = {
        "calories": [agg[ds]["calories"] for ds in date_strs],
        "protein_g": [agg[ds]["protein_g"] for ds in date_strs],
        "carbs_g": [agg[ds]["carbs_g"] for ds in date_strs],
        "fat_g": [agg[ds]["fat_g"] for ds in date_strs],
        "dates": date_strs,
    }
    return series


# ============ NOTIFICATIONS ============
def _build_smart_notifs(user: dict) -> List[dict]:
    """Generate context-aware notifications based on user profile/state."""
    now = datetime.now(timezone.utc)
    items: List[dict] = []
    items.append({
        "id": f"welcome-{user['id']}",
        "type": "welcome",
        "title": "Bem-vindo ao Pulse",
        "body": "Configura as tuas preferências e dispositivos no perfil.",
        "icon": "sparkles",
        "color": "primary",
        "created_at": now.isoformat(),
        "read": False,
    })
    items.append({
        "id": f"sleep-{user['id']}-{now.strftime('%Y%m%d')}",
        "type": "sleep",
        "title": "Hora de dormir",
        "body": "Dormir antes das 23h melhora o teu Recovery em até 12%.",
        "icon": "moon",
        "color": "sleep",
        "created_at": (now - timedelta(hours=2)).isoformat(),
        "read": False,
    })
    items.append({
        "id": f"recovery-{user['id']}-{now.strftime('%Y%m%d')}",
        "type": "recovery",
        "title": "Recovery diário pronto",
        "body": "A tua pontuação de hoje está disponível no dashboard.",
        "icon": "pulse",
        "color": "recovery",
        "created_at": (now - timedelta(hours=8)).isoformat(),
        "read": False,
    })
    items.append({
        "id": f"strain-{user['id']}-{(now-timedelta(days=1)).strftime('%Y%m%d')}",
        "type": "strain",
        "title": "Bom treino ontem",
        "body": "Strain de 14.2 — bom estímulo. Recupera bem hoje.",
        "icon": "flame",
        "color": "strain",
        "created_at": (now - timedelta(days=1)).isoformat(),
        "read": True,
    })
    return items


@ext_router.get("/notifications")
async def list_notifications(user=Depends(_get_user)):
    cursor = _db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1).limit(50)
    persisted = await cursor.to_list(length=50)

    # Always include "smart" derived notifications (synthesised) merged
    smart = _build_smart_notifs(user)
    # Filter out smart ones already in persisted by id
    persisted_ids = {p["id"] for p in persisted}
    merged = persisted + [s for s in smart if s["id"] not in persisted_ids]
    # Apply read flags from a "read_ids" record
    read_doc = await _db.notif_reads.find_one({"user_id": user["id"]}, {"_id": 0})
    read_ids = set((read_doc or {}).get("ids", []))
    for n in merged:
        if n["id"] in read_ids:
            n["read"] = True
    # Sort by created_at desc
    merged.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    unread = sum(1 for n in merged if not n.get("read"))
    return {"items": merged, "unread": unread}


@ext_router.post("/notifications/read")
async def mark_read(req: NotifMarkReq, user=Depends(_get_user)):
    if req.mark_all:
        # Build full set of known ids: persisted + smart
        smart = _build_smart_notifs(user)
        persisted = await _db.notifications.find({"user_id": user["id"]}, {"_id": 0, "id": 1}).to_list(length=200)
        all_ids = list({s["id"] for s in smart} | {p["id"] for p in persisted})
        await _db.notif_reads.update_one(
            {"user_id": user["id"]},
            {"$set": {"user_id": user["id"], "ids": all_ids}},
            upsert=True,
        )
        return {"ok": True, "marked": len(all_ids)}
    if not req.notification_id:
        raise HTTPException(status_code=400, detail="notification_id required")
    await _db.notif_reads.update_one(
        {"user_id": user["id"]},
        {"$addToSet": {"ids": req.notification_id}, "$setOnInsert": {"user_id": user["id"]}},
        upsert=True,
    )
    return {"ok": True}
