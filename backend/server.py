from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
import random
import math
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
JWT_ALG = "HS256"
JWT_EXP_DAYS = 30

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============ MODELS ============
class RegisterReq(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    devices: List[str] = []
    onboarded: bool = False
    created_at: str

class AuthResp(BaseModel):
    token: str
    user: UserOut

class OnboardReq(BaseModel):
    devices: List[str]  # e.g. ["apple_watch", "mi_band_8"]
    age: Optional[int] = None
    gender: Optional[str] = None
    goal: Optional[str] = None

class DayMetrics(BaseModel):
    date: str
    recovery: int
    strain: float
    sleep_score: int
    sleep_hours: float
    sleep_stages: dict
    stress: int
    hrv: int
    resting_hr: int
    respiratory_rate: float
    hr_zones: dict
    stress_timeline: List[int]

class TipReq(BaseModel):
    focus: Optional[str] = None  # recovery|sleep|strain|stress|general

class TipResp(BaseModel):
    tip: str
    title: str
    focus: str
    created_at: str


# ============ AUTH HELPERS ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def user_doc_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        email=u["email"],
        name=u["name"],
        devices=u.get("devices", []),
        onboarded=u.get("onboarded", False),
        created_at=u.get("created_at", ""),
    )


# ============ MOCK METRICS GENERATOR ============
def generate_day_metrics(user_id: str, date: datetime, seed_offset: int = 0) -> dict:
    """Generate realistic health metrics for a given day, deterministic per user+date."""
    seed = int(hashlib_seed(user_id, date.strftime("%Y-%m-%d"))) + seed_offset
    rng = random.Random(seed)

    # Sleep: 6-9 hours, with stages
    sleep_hours = round(rng.uniform(5.8, 8.6), 1)
    sleep_minutes = int(sleep_hours * 60)
    deep = int(sleep_minutes * rng.uniform(0.12, 0.22))
    rem = int(sleep_minutes * rng.uniform(0.18, 0.26))
    awake = int(sleep_minutes * rng.uniform(0.03, 0.08))
    light = sleep_minutes - deep - rem - awake
    sleep_score = min(100, max(40, int(50 + (sleep_hours - 6) * 12 + rng.randint(-8, 8))))

    # Recovery 0-100 influenced by sleep
    hrv = rng.randint(38, 95)
    resting_hr = rng.randint(48, 72)
    rr = round(rng.uniform(12.5, 17.5), 1)
    recovery = min(100, max(15, int(sleep_score * 0.5 + (hrv - 40) * 0.6 + rng.randint(-10, 10))))

    # Strain 0-21
    strain = round(rng.uniform(6.5, 18.5), 1)

    # Stress 0-100
    stress = min(100, max(10, int(60 - recovery * 0.4 + rng.randint(-15, 25))))

    # HR Zones (minutes)
    hr_zones = {
        "zone1": rng.randint(40, 120),
        "zone2": rng.randint(20, 80),
        "zone3": rng.randint(10, 50),
        "zone4": rng.randint(0, 25),
        "zone5": rng.randint(0, 10),
    }

    # Stress timeline 24 hourly points
    stress_timeline = []
    for h in range(24):
        base = stress
        if 0 <= h < 6:
            base = max(10, base - 30)
        elif 9 <= h < 18:
            base = min(100, base + rng.randint(-5, 15))
        else:
            base = max(15, base - 10)
        stress_timeline.append(max(0, min(100, base + rng.randint(-8, 8))))

    return {
        "date": date.strftime("%Y-%m-%d"),
        "user_id": user_id,
        "recovery": recovery,
        "strain": strain,
        "sleep_score": sleep_score,
        "sleep_hours": sleep_hours,
        "sleep_stages": {"deep": deep, "rem": rem, "light": light, "awake": awake},
        "stress": stress,
        "hrv": hrv,
        "resting_hr": resting_hr,
        "respiratory_rate": rr,
        "hr_zones": hr_zones,
        "stress_timeline": stress_timeline,
    }


def hashlib_seed(*args) -> int:
    import hashlib
    h = hashlib.sha256("|".join(args).encode()).hexdigest()
    return int(h[:8], 16)


async def ensure_metrics_for_user(user_id: str, days: int = 30):
    """Make sure we have metrics for last N days for this user."""
    today = datetime.now(timezone.utc).date()
    existing = await db.metrics.find(
        {"user_id": user_id},
        {"_id": 0, "date": 1}
    ).to_list(length=days + 5)
    existing_dates = {m["date"] for m in existing}

    to_insert = []
    for i in range(days):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        if d_str not in existing_dates:
            m = generate_day_metrics(user_id, datetime.combine(d, datetime.min.time()))
            to_insert.append(m)
    if to_insert:
        await db.metrics.insert_many(to_insert)


# ============ ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "Pulse Recovery API", "status": "ok"}


@api_router.post("/auth/register", response_model=AuthResp)
async def register(req: RegisterReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "password": hash_password(req.password),
        "devices": [],
        "onboarded": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    await ensure_metrics_for_user(user_id, days=30)
    token = create_token(user_id)
    return AuthResp(token=token, user=user_doc_to_out(user_doc))


@api_router.post("/auth/login", response_model=AuthResp)
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    await ensure_metrics_for_user(user["id"], days=30)
    token = create_token(user["id"])
    return AuthResp(token=token, user=user_doc_to_out(user))


@api_router.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user_doc_to_out(user)


@api_router.post("/auth/onboard", response_model=UserOut)
async def onboard(req: OnboardReq, user=Depends(get_current_user)):
    update = {
        "devices": req.devices,
        "onboarded": True,
    }
    if req.age is not None:
        update["age"] = req.age
    if req.gender:
        update["gender"] = req.gender
    if req.goal:
        update["goal"] = req.goal
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return user_doc_to_out(updated)


@api_router.get("/metrics/today")
async def metrics_today(user=Depends(get_current_user)):
    await ensure_metrics_for_user(user["id"], days=30)
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    m = await db.metrics.find_one({"user_id": user["id"], "date": today}, {"_id": 0, "user_id": 0})
    return m


@api_router.get("/metrics/history")
async def metrics_history(days: int = 7, user=Depends(get_current_user)):
    await ensure_metrics_for_user(user["id"], days=max(days, 30))
    days = min(max(days, 1), 60)
    cursor = db.metrics.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0}
    ).sort("date", -1).limit(days)
    items = await cursor.to_list(length=days)
    items.reverse()  # chronological order
    return {"items": items}


@api_router.get("/metrics/date/{date}")
async def metrics_by_date(date: str, user=Depends(get_current_user)):
    m = await db.metrics.find_one({"user_id": user["id"], "date": date}, {"_id": 0, "user_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="No data for that date")
    return m


@api_router.post("/tips/generate", response_model=TipResp)
async def generate_tip(req: TipReq, user=Depends(get_current_user)):
    await ensure_metrics_for_user(user["id"], days=7)
    # Get today's metrics for context
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    m = await db.metrics.find_one({"user_id": user["id"], "date": today}, {"_id": 0, "user_id": 0})

    focus = req.focus or "general"
    if not m:
        m = generate_day_metrics(user["id"], datetime.now(timezone.utc))

    context = (
        f"User name: {user['name']}\n"
        f"Today's metrics:\n"
        f"- Recovery: {m['recovery']}/100\n"
        f"- Strain: {m['strain']}/21\n"
        f"- Sleep score: {m['sleep_score']}/100 ({m['sleep_hours']}h)\n"
        f"- Stress: {m['stress']}/100\n"
        f"- HRV: {m['hrv']} ms\n"
        f"- Resting HR: {m['resting_hr']} bpm\n"
        f"Focus area: {focus}"
    )

    system_msg = (
        "You are an elite recovery coach inspired by Whoop & Bevel. "
        "Give short, punchy, actionable health & performance tips in Portuguese (pt-PT). "
        "Always reply as JSON with keys: title (max 6 words), tip (2-3 sentences, max 60 words). "
        "Tone: confident, motivating, specific. No emojis. No markdown."
    )

    tip_text = ""
    tip_title = ""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"tips-{user['id']}-{focus}",
            system_message=system_msg,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        msg = UserMessage(text=f"{context}\n\nGenerate one personalized tip in JSON only.")
        response = await chat.send_message(msg)
        import json, re
        # Extract JSON
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            tip_title = data.get("title", "Dica de hoje")
            tip_text = data.get("tip", response)
        else:
            tip_title = "Dica de hoje"
            tip_text = response.strip()
    except Exception as e:
        logger.error(f"AI tip generation failed: {e}")
        # Fallback static tip
        fallbacks = {
            "recovery": ("Prioriza HRV", "A tua recuperação está em desenvolvimento. Faz 10 min de respiração 4-7-8 antes de dormir e evita cafeína depois das 14h para subires o HRV amanhã."),
            "sleep": ("Otimiza o sono", "Vai para a cama 30 minutos mais cedo hoje. Reduz luz azul 1h antes de dormir e mantém o quarto a 18-19°C para sono profundo de qualidade."),
            "strain": ("Equilibra o esforço", "O teu strain de hoje pede equilíbrio. Faz mobilidade leve ou caminhada, deixando treino intenso para um dia de melhor recuperação."),
            "stress": ("Reduz a tensão", "Faz 3 ciclos de respiração quadrada (4-4-4-4) agora. Hidrata-te bem e tira 2 micro-pausas de 5 min durante o dia."),
            "general": ("Mantém o ritmo", "Hidratação, 7-9h de sono e 20 min ao ar livre hoje. Pequenos hábitos consistentes constroem grandes resultados."),
        }
        tip_title, tip_text = fallbacks.get(focus, fallbacks["general"])

    tip_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": tip_title,
        "tip": tip_text,
        "focus": focus,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tips.insert_one(tip_doc)
    return TipResp(tip=tip_text, title=tip_title, focus=focus, created_at=tip_doc["created_at"])


@api_router.get("/tips/list")
async def list_tips(user=Depends(get_current_user)):
    cursor = db.tips.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1).limit(20)
    items = await cursor.to_list(length=20)
    return {"items": items}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
