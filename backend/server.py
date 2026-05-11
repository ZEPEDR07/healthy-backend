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
import json
import re
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
PREMIUM_CODE = "HEALTHY"
TRIAL_DAYS = 15

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SUPPORTED_DEVICES = ['apple_watch', 'mi_band_7', 'mi_band_8', 'mi_band_9']


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
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    goal: Optional[str] = None
    premium_status: str = "free"  # free | trial | lifetime
    trial_end: Optional[str] = None
    premium_active: bool = False
    created_at: str

class AuthResp(BaseModel):
    token: str
    user: UserOut

class OnboardReq(BaseModel):
    devices: List[str]
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    goal: Optional[str] = None

class ProfileUpdateReq(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    goal: Optional[str] = None
    devices: Optional[List[str]] = None

class TipReq(BaseModel):
    focus: Optional[str] = None

class PremiumRedeemReq(BaseModel):
    code: str

class NutritionAnalyzeReq(BaseModel):
    image_base64: str
    note: Optional[str] = None


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


def is_premium_active(user: dict) -> bool:
    status = user.get("premium_status", "free")
    if status == "lifetime":
        return True
    if status == "trial":
        end = user.get("trial_end")
        if end:
            try:
                end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
                return datetime.now(timezone.utc) < end_dt
            except Exception:
                return False
    return False


def user_doc_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        email=u["email"],
        name=u["name"],
        devices=u.get("devices", []),
        onboarded=u.get("onboarded", False),
        age=u.get("age"),
        gender=u.get("gender"),
        height_cm=u.get("height_cm"),
        weight_kg=u.get("weight_kg"),
        goal=u.get("goal"),
        premium_status=u.get("premium_status", "free"),
        trial_end=u.get("trial_end"),
        premium_active=is_premium_active(u),
        created_at=u.get("created_at", ""),
    )


# ============ MOCK METRICS GENERATOR ============
def hashlib_seed(*args) -> int:
    import hashlib
    h = hashlib.sha256("|".join(args).encode()).hexdigest()
    return int(h[:8], 16)


def generate_day_metrics(user_id: str, date: datetime, seed_offset: int = 0) -> dict:
    seed = int(hashlib_seed(user_id, date.strftime("%Y-%m-%d"))) + seed_offset
    rng = random.Random(seed)

    sleep_hours = round(rng.uniform(5.8, 8.6), 1)
    sleep_minutes = int(sleep_hours * 60)
    deep = int(sleep_minutes * rng.uniform(0.12, 0.22))
    rem = int(sleep_minutes * rng.uniform(0.18, 0.26))
    awake = int(sleep_minutes * rng.uniform(0.03, 0.08))
    light = sleep_minutes - deep - rem - awake
    sleep_score = min(100, max(40, int(50 + (sleep_hours - 6) * 12 + rng.randint(-8, 8))))

    hrv = rng.randint(38, 95)
    resting_hr = rng.randint(48, 72)
    rr = round(rng.uniform(12.5, 17.5), 1)
    recovery = min(100, max(15, int(sleep_score * 0.5 + (hrv - 40) * 0.6 + rng.randint(-10, 10))))

    strain = round(rng.uniform(6.5, 18.5), 1)
    stress = min(100, max(10, int(60 - recovery * 0.4 + rng.randint(-15, 25))))
    body_battery = max(5, min(100, 100 - stress + rng.randint(-10, 10)))

    hr_zones = {
        "zone1": rng.randint(40, 120),
        "zone2": rng.randint(20, 80),
        "zone3": rng.randint(10, 50),
        "zone4": rng.randint(0, 25),
        "zone5": rng.randint(0, 10),
    }

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
        "body_battery": body_battery,
        "stress_highest": max(stress_timeline),
        "stress_lowest": min(stress_timeline),
        "stress_avg": int(sum(stress_timeline) / len(stress_timeline)),
        "hrv": hrv,
        "resting_hr": resting_hr,
        "respiratory_rate": rr,
        "hr_zones": hr_zones,
        "stress_timeline": stress_timeline,
    }


async def ensure_metrics_for_user(user_id: str, days: int = 30):
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
        "premium_status": "free",
        "trial_end": None,
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
    devices = [d for d in req.devices if d in SUPPORTED_DEVICES]
    update = {"devices": devices, "onboarded": True}
    for field in ("age", "gender", "height_cm", "weight_kg", "goal"):
        v = getattr(req, field, None)
        if v is not None:
            update[field] = v
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return user_doc_to_out(updated)


@api_router.patch("/auth/profile", response_model=UserOut)
async def update_profile(req: ProfileUpdateReq, user=Depends(get_current_user)):
    update = {}
    for field in ("name", "age", "gender", "height_cm", "weight_kg", "goal"):
        v = getattr(req, field, None)
        if v is not None:
            update[field] = v
    if req.devices is not None:
        update["devices"] = [d for d in req.devices if d in SUPPORTED_DEVICES]
    if update:
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
    premium = is_premium_active(user)
    max_days = 365 if premium else 30
    days = min(max(days, 1), max_days)
    await ensure_metrics_for_user(user["id"], days=max(days, 30))
    cursor = db.metrics.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0}
    ).sort("date", -1).limit(days)
    items = await cursor.to_list(length=days)
    items.reverse()
    return {"items": items, "premium": premium}


# ============ PREMIUM ============
@api_router.get("/premium/status")
async def premium_status(user=Depends(get_current_user)):
    return {
        "status": user.get("premium_status", "free"),
        "trial_end": user.get("trial_end"),
        "active": is_premium_active(user),
    }


@api_router.post("/premium/start-trial", response_model=UserOut)
async def start_trial(user=Depends(get_current_user)):
    if user.get("premium_status") == "lifetime":
        raise HTTPException(status_code=400, detail="Já tens premium vitalício")
    if user.get("trial_used"):
        raise HTTPException(status_code=400, detail="Já usaste o teu trial")
    end = (datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS)).isoformat()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"premium_status": "trial", "trial_end": end, "trial_used": True}}
    )
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return user_doc_to_out(updated)


@api_router.post("/premium/redeem", response_model=UserOut)
async def redeem_code(req: PremiumRedeemReq, user=Depends(get_current_user)):
    if req.code.strip().upper() != PREMIUM_CODE:
        raise HTTPException(status_code=400, detail="Código inválido")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"premium_status": "lifetime", "trial_end": None, "redeemed_code": req.code.strip().upper()}}
    )
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return user_doc_to_out(updated)


# ============ TIPS ============
@api_router.post("/tips/generate")
async def generate_tip(req: TipReq, user=Depends(get_current_user)):
    await ensure_metrics_for_user(user["id"], days=7)
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    m = await db.metrics.find_one({"user_id": user["id"], "date": today}, {"_id": 0, "user_id": 0})
    if not m:
        m = generate_day_metrics(user["id"], datetime.now(timezone.utc))

    focus = req.focus or "general"
    premium = is_premium_active(user)

    if not premium:
        # Free tier: short static-style tip
        fallbacks = {
            "recovery": ("Recovery base", "Hidrata-te bem e tenta dormir 30 min mais cedo."),
            "sleep": ("Sono básico", "Sem ecrãs 30 min antes de dormir."),
            "strain": ("Strain controlado", "Alterna treino intenso com mobilidade."),
            "stress": ("Stress simples", "3 respirações profundas, agora."),
            "nutrition": ("Alimentação base", "Inclui proteína em cada refeição."),
            "general": ("Geral", "Hidrata, dorme, move-te. Repete."),
        }
        title, tip = fallbacks.get(focus, fallbacks["general"])
        doc = {
            "id": str(uuid.uuid4()), "user_id": user["id"], "title": title, "tip": tip,
            "focus": focus, "premium": False, "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.tips.insert_one(doc)
        return {"tip": tip, "title": title, "focus": focus, "premium": False, "created_at": doc["created_at"]}

    # Premium tier: rich Claude-powered multi-step coaching
    profile_ctx = ""
    if user.get("age"): profile_ctx += f"Idade: {user['age']}. "
    if user.get("gender"): profile_ctx += f"Género: {user['gender']}. "
    if user.get("height_cm"): profile_ctx += f"Altura: {user['height_cm']}cm. "
    if user.get("weight_kg"): profile_ctx += f"Peso: {user['weight_kg']}kg. "
    if user.get("goal"): profile_ctx += f"Objetivo: {user['goal']}. "

    context = (
        f"Utilizador: {user['name']}. {profile_ctx}\n"
        f"Métricas de hoje:\n"
        f"- Recovery: {m['recovery']}/100\n"
        f"- Strain: {m['strain']}/21\n"
        f"- Sleep: {m['sleep_score']}/100 ({m['sleep_hours']}h)\n"
        f"- Stress: {m['stress']}/100\n"
        f"- HRV: {m['hrv']} ms | RHR: {m['resting_hr']} bpm\n"
        f"Foco: {focus}"
    )

    system_msg = (
        "És um coach de recuperação de elite (estilo Whoop + Bevel), personalizado em pt-PT. "
        "Dá uma dica PREMIUM detalhada e multi-passo, em JSON: "
        "{ \"title\": \"<6 palavras>\", \"tip\": \"<2-3 parágrafos curtos, accionáveis, máx 120 palavras>\" }. "
        "Tom: confiante, específico, motivador. Sem emojis. Sem markdown."
    )

    tip_text = ""
    tip_title = ""
    try:
        import anthropic as _anthropic
        _client = _anthropic.AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
        _resp = await _client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=system_msg,
            messages=[{"role": "user", "content": f"{context}\n\nGera uma dica premium em JSON."}],
        )
        response = _resp.content[0].text
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            tip_title = data.get("title", "Dica Premium")
            tip_text = data.get("tip", response)
        else:
            tip_title = "Dica Premium"
            tip_text = response.strip()
    except Exception as e:
        logger.error(f"Premium tip AI failed: {e}")
        tip_title = "Plano de Recovery"
        tip_text = "Hoje prioriza hidratação (35ml/kg), sono +30min e respiração 4-7-8 antes de dormir."

    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "title": tip_title, "tip": tip_text,
        "focus": focus, "premium": True, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tips.insert_one(doc)
    return {"tip": tip_text, "title": tip_title, "focus": focus, "premium": True, "created_at": doc["created_at"]}


@api_router.get("/tips/list")
async def list_tips(user=Depends(get_current_user)):
    cursor = db.tips.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1).limit(50)
    items = await cursor.to_list(length=50)
    return {"items": items}


# ============ NUTRITION ============
@api_router.post("/nutrition/analyze")
async def analyze_food(req: NutritionAnalyzeReq, user=Depends(get_current_user)):
    premium = is_premium_active(user)
    # Free tier: limit to 3 analyses per day
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    if not premium:
        count = await db.food_logs.count_documents({
            "user_id": user["id"],
            "date": today,
        })
        if count >= 3:
            raise HTTPException(
                status_code=402,
                detail="Limite diário grátis atingido (3 fotos). Faz upgrade para Premium."
            )

    # Strip optional data URI prefix
    b64 = req.image_base64
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[1] if "," in b64 else b64

    items: list = []
    totals = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0}
    summary = ""

    try:
        import anthropic as _anthropic
        _client = _anthropic.AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
        _system = (
            "Es um nutricionista IA que analisa fotos de comida e devolve macros em pt-PT. "
            "Responde APENAS em JSON puro com a estrutura: "
            '{"items":[{"name":"<nome>","calories":<int>,"protein_g":<int>,'
            '"carbs_g":<int>,"fat_g":<int>}],'
            '"totals":{"calories":<int>,"protein_g":<int>,"carbs_g":<int>,"fat_g":<int>},'
            '"summary":"<frase curta>"}. '
            "Estima porcoes a olho. Se nao identificares comida, devolve items vazio e summary "
            "'Nao foi detectada comida'."
        )
        _prompt = "Analisa esta refeição e devolve macros estimados em JSON."
        if req.note:
            _prompt += f" Nota do utilizador: {req.note}"
        _resp = await _client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=_system,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": _prompt},
                ],
            }],
        )
        response = _resp.content[0].text
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            items = data.get("items", []) or []
            totals_in = data.get("totals") or {}
            if items and not totals_in:
                totals_in = {
                    "calories": sum(int(i.get("calories", 0)) for i in items),
                    "protein_g": sum(int(i.get("protein_g", 0)) for i in items),
                    "carbs_g": sum(int(i.get("carbs_g", 0)) for i in items),
                    "fat_g": sum(int(i.get("fat_g", 0)) for i in items),
                }
            totals = {
                "calories": int(totals_in.get("calories", 0)),
                "protein_g": int(totals_in.get("protein_g", 0)),
                "carbs_g": int(totals_in.get("carbs_g", 0)),
                "fat_g": int(totals_in.get("fat_g", 0)),
            }
            summary = data.get("summary", "")
        else:
            summary = "Não foi possível interpretar a imagem"
    except Exception as e:
        logger.error(f"Nutrition AI failed: {e}")
        raise HTTPException(status_code=500, detail="Falha na análise da imagem")

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "date": today,
        "image_base64": b64[:200000],  # cap to avoid huge docs
        "items": items,
        "totals": totals,
        "summary": summary,
        "note": req.note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.food_logs.insert_one(doc)
    out = {k: v for k, v in doc.items() if k not in ("user_id", "_id")}
    return out


@api_router.get("/nutrition/today")
async def nutrition_today(user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
    cursor = db.food_logs.find(
        {"user_id": user["id"], "date": today},
        {"_id": 0, "user_id": 0}
    ).sort("created_at", -1)
    items = await cursor.to_list(length=50)
    totals = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0}
    for it in items:
        t = it.get("totals", {})
        for k in totals:
            totals[k] += int(t.get(k, 0))
    return {"items": items, "totals": totals, "date": today}


@api_router.delete("/nutrition/{food_id}")
async def delete_food(food_id: str, user=Depends(get_current_user)):
    res = await db.food_logs.delete_one({"id": food_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Não encontrado")
    return {"ok": True}


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
