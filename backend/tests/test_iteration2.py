"""
Pulse Recovery API – Iteration 2 pytest suite
New endpoints: onboard (health info), premium (start-trial/redeem/status),
nutrition (analyze/today/delete), profile PATCH, free-tier limits.
"""
import os
import time
import uuid
import base64
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


def _email():
    return f"test+i2-{int(time.time())}-{uuid.uuid4().hex[:6]}@pulse.app"


def _register(s, email=None, name="Iter2"):
    email = email or _email()
    r = s.post(f"{API}/auth/register",
               json={"email": email, "password": "Pass123!", "name": name},
               timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"], r.json()["user"], email


def _h(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# Fetched once per session – a real food JPEG
@pytest.fixture(scope="session")
def food_b64():
    url = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=70"
    r = requests.get(url, timeout=30)
    assert r.status_code == 200 and r.headers.get("content-type", "").startswith("image/")
    return base64.b64encode(r.content).decode()


# ============ ONBOARD WITH HEALTH ============
class TestOnboardHealth:
    def test_onboard_with_mi_band_and_health_info(self, s):
        token, _, _ = _register(s)
        r = s.post(f"{API}/auth/onboard", headers=_h(token), json={
            "devices": ["mi_band_7", "mi_band_8", "mi_band_9", "apple_watch", "garbage"],
            "age": 30, "gender": "male", "height_cm": 178,
            "weight_kg": 75.5, "goal": "performance"
        }, timeout=20)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["onboarded"] is True
        assert set(u["devices"]) == {"mi_band_7", "mi_band_8", "mi_band_9", "apple_watch"}
        assert u["age"] == 30
        assert u["gender"] == "male"
        assert u["height_cm"] == 178
        assert u["weight_kg"] == 75.5
        assert u["goal"] == "performance"


# ============ PROFILE PATCH ============
class TestProfilePatch:
    def test_patch_profile_updates_fields(self, s):
        token, _, _ = _register(s)
        s.post(f"{API}/auth/onboard", headers=_h(token), json={
            "devices": ["apple_watch"], "age": 25, "gender": "male",
            "height_cm": 180, "weight_kg": 80, "goal": "performance"
        }, timeout=15)

        r = s.patch(f"{API}/auth/profile", headers=_h(token), json={
            "name": "Updated", "age": 31, "weight_kg": 78.2,
            "goal": "sleep", "devices": ["mi_band_9"]
        }, timeout=15)
        assert r.status_code == 200
        u = r.json()
        assert u["name"] == "Updated"
        assert u["age"] == 31
        assert u["weight_kg"] == 78.2
        assert u["goal"] == "sleep"
        assert u["devices"] == ["mi_band_9"]

        me = s.get(f"{API}/auth/me", headers=_h(token), timeout=15).json()
        assert me["name"] == "Updated"
        assert me["devices"] == ["mi_band_9"]


# ============ PREMIUM ============
class TestPremium:
    def test_premium_status_default_free(self, s):
        token, _, _ = _register(s)
        r = s.get(f"{API}/premium/status", headers=_h(token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "free"
        assert body["active"] is False

    def test_start_trial_then_block_second_call(self, s):
        token, _, _ = _register(s)
        r1 = s.post(f"{API}/premium/start-trial", headers=_h(token), timeout=15)
        assert r1.status_code == 200, r1.text
        u = r1.json()
        assert u["premium_status"] == "trial"
        assert u["premium_active"] is True
        assert u["trial_end"] is not None

        # Verify ~15 days
        from datetime import datetime, timezone, timedelta
        end = datetime.fromisoformat(u["trial_end"].replace("Z", "+00:00"))
        diff = end - datetime.now(timezone.utc)
        assert 14 <= diff.days <= 15, f"trial diff days = {diff.days}"

        # Second call must 400
        r2 = s.post(f"{API}/premium/start-trial", headers=_h(token), timeout=15)
        assert r2.status_code == 400
        assert "trial" in r2.json()["detail"].lower()

    def test_redeem_healthy_case_insensitive(self, s):
        token, _, _ = _register(s)
        r = s.post(f"{API}/premium/redeem", headers=_h(token),
                   json={"code": "healthy"}, timeout=15)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["premium_status"] == "lifetime"
        assert u["premium_active"] is True

        # status reflects it
        st = s.get(f"{API}/premium/status", headers=_h(token), timeout=15).json()
        assert st["status"] == "lifetime"
        assert st["active"] is True

    def test_redeem_invalid_code_400(self, s):
        token, _, _ = _register(s)
        r = s.post(f"{API}/premium/redeem", headers=_h(token),
                   json={"code": "WRONG"}, timeout=15)
        assert r.status_code == 400


# ============ METRICS today new fields ============
class TestMetricsNewFields:
    def test_today_has_body_battery_and_stress_stats(self, s):
        token, _, _ = _register(s)
        r = s.get(f"{API}/metrics/today", headers=_h(token), timeout=20)
        assert r.status_code == 200
        m = r.json()
        for k in ("body_battery", "stress_highest", "stress_lowest", "stress_avg"):
            assert k in m, f"missing {k}"
        assert 0 <= m["body_battery"] <= 100
        assert m["stress_lowest"] <= m["stress_avg"] <= m["stress_highest"]

    def test_history_free_capped_30(self, s):
        token, _, _ = _register(s)
        r = s.get(f"{API}/metrics/history?days=120", headers=_h(token), timeout=25)
        assert r.status_code == 200
        body = r.json()
        assert body["premium"] is False
        assert len(body["items"]) == 30

    def test_history_premium_allows_more(self, s):
        token, _, _ = _register(s)
        s.post(f"{API}/premium/redeem", headers=_h(token),
               json={"code": "HEALTHY"}, timeout=15)
        r = s.get(f"{API}/metrics/history?days=60", headers=_h(token), timeout=25)
        assert r.status_code == 200
        body = r.json()
        assert body["premium"] is True
        assert len(body["items"]) == 60


# ============ TIPS free vs premium ============
class TestTipsFreeVsPremium:
    def test_free_tip_short_premium_false(self, s):
        token, _, _ = _register(s)
        r = s.post(f"{API}/tips/generate", headers=_h(token),
                   json={"focus": "recovery"}, timeout=60)
        assert r.status_code == 200
        body = r.json()
        assert body["premium"] is False
        assert isinstance(body["tip"], str) and len(body["tip"]) > 0

    def test_premium_tip_long_and_premium_true(self, s):
        token, _, _ = _register(s)
        s.post(f"{API}/premium/redeem", headers=_h(token),
               json={"code": "HEALTHY"}, timeout=15)
        r = s.post(f"{API}/tips/generate", headers=_h(token),
                   json={"focus": "recovery"}, timeout=120)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["premium"] is True
        assert len(body["tip"]) > 40  # premium tip should be longer


# ============ NUTRITION ============
class TestNutrition:
    def test_analyze_returns_macros(self, s, food_b64):
        token, _, _ = _register(s)
        # Make user premium to avoid 3/day limit
        s.post(f"{API}/premium/redeem", headers=_h(token),
               json={"code": "HEALTHY"}, timeout=15)

        r = s.post(f"{API}/nutrition/analyze", headers=_h(token),
                   json={"image_base64": food_b64}, timeout=120)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "id" in body
        assert "items" in body and isinstance(body["items"], list)
        assert "totals" in body
        for k in ("calories", "protein_g", "carbs_g", "fat_g"):
            assert k in body["totals"]
        assert "summary" in body
        assert "_id" not in body
        # image_base64 returned
        assert "image_base64" in body and len(body["image_base64"]) > 0

    def test_today_aggregates(self, s, food_b64):
        token, _, _ = _register(s)
        s.post(f"{API}/premium/redeem", headers=_h(token),
               json={"code": "HEALTHY"}, timeout=15)
        r1 = s.post(f"{API}/nutrition/analyze", headers=_h(token),
                    json={"image_base64": food_b64}, timeout=120)
        assert r1.status_code == 200
        cal = r1.json()["totals"]["calories"]

        r = s.get(f"{API}/nutrition/today", headers=_h(token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert len(body["items"]) >= 1
        assert body["totals"]["calories"] >= cal

    def test_delete_food(self, s, food_b64):
        token, _, _ = _register(s)
        s.post(f"{API}/premium/redeem", headers=_h(token),
               json={"code": "HEALTHY"}, timeout=15)
        r1 = s.post(f"{API}/nutrition/analyze", headers=_h(token),
                    json={"image_base64": food_b64}, timeout=120)
        food_id = r1.json()["id"]

        r2 = s.delete(f"{API}/nutrition/{food_id}", headers=_h(token), timeout=15)
        assert r2.status_code == 200

        r3 = s.delete(f"{API}/nutrition/{food_id}", headers=_h(token), timeout=15)
        assert r3.status_code == 404

    def test_free_tier_4th_returns_402(self, s, food_b64):
        """Free user: 3 analyses ok, 4th 402."""
        token, _, _ = _register(s)
        # Free tier by default
        for i in range(3):
            r = s.post(f"{API}/nutrition/analyze", headers=_h(token),
                       json={"image_base64": food_b64}, timeout=120)
            assert r.status_code == 200, f"call {i+1} failed: {r.text}"
        r4 = s.post(f"{API}/nutrition/analyze", headers=_h(token),
                    json={"image_base64": food_b64}, timeout=30)
        assert r4.status_code == 402
        assert "limite" in r4.json()["detail"].lower() or "3" in r4.json()["detail"]
