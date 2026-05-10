"""
Pulse Recovery API – pytest suite
Covers: auth (register/login/me), onboard, metrics today/history, tips generate/list, security.
"""
import os
import time
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@pulse.app"
DEMO_PASSWORD = "demo123"
NEW_EMAIL = f"test+{int(time.time())}-{uuid.uuid4().hex[:6]}@pulse.app"
NEW_PASSWORD = "TestPass123!"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def new_user_auth(session):
    """Register a fresh user and return (token, user)."""
    r = session.post(f"{API}/auth/register", json={
        "email": NEW_EMAIL, "password": NEW_PASSWORD, "name": "Test User"
    }, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"], data["user"]


@pytest.fixture(scope="session")
def demo_auth(session):
    r = session.post(f"{API}/auth/login", json={
        "email": DEMO_EMAIL, "password": DEMO_PASSWORD
    }, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.status_code} {r.text}"
    data = r.json()
    return data["token"], data["user"]


# ============ ROOT ============
def test_root(session):
    r = session.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ============ AUTH ============
class TestAuth:
    def test_register_creates_user_and_token(self, new_user_auth):
        token, user = new_user_auth
        assert isinstance(token, str) and len(token) > 20
        assert user["email"] == NEW_EMAIL.lower()
        assert user["name"] == "Test User"
        assert user["onboarded"] is False
        assert user["devices"] == []
        assert "id" in user and user["id"]

    def test_register_duplicate_rejected(self, session, new_user_auth):
        r = session.post(f"{API}/auth/register", json={
            "email": NEW_EMAIL, "password": NEW_PASSWORD, "name": "Dup"
        }, timeout=15)
        assert r.status_code == 400

    def test_login_success(self, session, new_user_auth):
        r = session.post(f"{API}/auth/login", json={
            "email": NEW_EMAIL, "password": NEW_PASSWORD
        }, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["user"]["email"] == NEW_EMAIL.lower()

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={
            "email": NEW_EMAIL, "password": "wrong-pass"
        }, timeout=15)
        assert r.status_code == 401

    def test_me_with_token(self, session, new_user_auth):
        token, _ = new_user_auth
        r = session.get(f"{API}/auth/me",
                        headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == NEW_EMAIL.lower()

    def test_me_without_token_401(self, session):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_bad_token_401(self, session):
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": "Bearer notavalidtoken"}, timeout=15)
        assert r.status_code == 401


# ============ ONBOARD ============
class TestOnboard:
    def test_onboard_sets_devices_and_flag(self, session, new_user_auth):
        token, _ = new_user_auth
        r = session.post(f"{API}/auth/onboard",
                         headers={"Authorization": f"Bearer {token}"},
                         json={"devices": ["apple_watch", "mi_band_8"], "goal": "performance"},
                         timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["onboarded"] is True
        assert set(body["devices"]) == {"apple_watch", "mi_band_8"}

        # verify via GET /auth/me
        me = session.get(f"{API}/auth/me",
                         headers={"Authorization": f"Bearer {token}"}, timeout=15).json()
        assert me["onboarded"] is True
        assert set(me["devices"]) == {"apple_watch", "mi_band_8"}

    def test_onboard_requires_auth(self, session):
        r = requests.post(f"{API}/auth/onboard", json={"devices": []}, timeout=15)
        assert r.status_code == 401


# ============ METRICS ============
class TestMetrics:
    def test_metrics_today_has_full_payload(self, session, new_user_auth):
        token, _ = new_user_auth
        r = session.get(f"{API}/metrics/today",
                        headers={"Authorization": f"Bearer {token}"}, timeout=20)
        assert r.status_code == 200
        m = r.json()
        required = ["date", "recovery", "strain", "sleep_score", "sleep_hours",
                    "sleep_stages", "stress", "hrv", "resting_hr", "respiratory_rate",
                    "hr_zones", "stress_timeline"]
        for k in required:
            assert k in m, f"missing key: {k}"
        # value sanity
        assert 0 <= m["recovery"] <= 100
        assert 0 <= m["strain"] <= 21
        assert 0 <= m["sleep_score"] <= 100
        assert 0 <= m["stress"] <= 100
        for s in ("deep", "rem", "light", "awake"):
            assert s in m["sleep_stages"]
        for z in ("zone1", "zone2", "zone3", "zone4", "zone5"):
            assert z in m["hr_zones"]
        assert isinstance(m["stress_timeline"], list) and len(m["stress_timeline"]) == 24

    def test_metrics_today_requires_auth(self, session):
        r = requests.get(f"{API}/metrics/today", timeout=15)
        assert r.status_code == 401

    @pytest.mark.parametrize("days", [7, 14, 30])
    def test_metrics_history_ranges(self, session, new_user_auth, days):
        token, _ = new_user_auth
        r = session.get(f"{API}/metrics/history?days={days}",
                        headers={"Authorization": f"Bearer {token}"}, timeout=25)
        assert r.status_code == 200
        items = r.json()["items"]
        assert isinstance(items, list)
        assert len(items) == days, f"expected {days} items got {len(items)}"
        # chronological ascending
        dates = [it["date"] for it in items]
        assert dates == sorted(dates), "history not chronological"


# ============ TIPS ============
class TestTips:
    @pytest.mark.parametrize("focus", ["general", "recovery", "sleep", "strain", "stress"])
    def test_generate_tip_each_focus(self, session, new_user_auth, focus):
        token, _ = new_user_auth
        r = session.post(f"{API}/tips/generate",
                         headers={"Authorization": f"Bearer {token}"},
                         json={"focus": focus}, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["focus"] == focus
        assert isinstance(body["title"], str) and len(body["title"]) > 0
        assert isinstance(body["tip"], str) and len(body["tip"]) > 0

    def test_list_tips_after_generation(self, session, new_user_auth):
        token, _ = new_user_auth
        r = session.get(f"{API}/tips/list",
                        headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        assert isinstance(items, list) and len(items) >= 1
        # ordered desc by created_at
        created = [it["created_at"] for it in items]
        assert created == sorted(created, reverse=True), "tips not desc by created_at"

    def test_tips_endpoints_require_auth(self):
        r1 = requests.post(f"{API}/tips/generate", json={"focus": "general"}, timeout=15)
        r2 = requests.get(f"{API}/tips/list", timeout=15)
        assert r1.status_code == 401
        assert r2.status_code == 401


# ============ DEMO USER ============
class TestDemoAccount:
    def test_demo_login_works(self, demo_auth):
        token, user = demo_auth
        assert user["email"] == DEMO_EMAIL
        assert isinstance(token, str) and len(token) > 20

    def test_demo_metrics_today(self, session, demo_auth):
        token, _ = demo_auth
        r = session.get(f"{API}/metrics/today",
                        headers={"Authorization": f"Bearer {token}"}, timeout=20)
        assert r.status_code == 200
        assert "recovery" in r.json()
