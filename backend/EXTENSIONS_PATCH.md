# Patch to apply to your server.py — Pulse v1.2

## 1. Add these 2 lines near the bottom of /app/backend/server.py
Look for the line:
```python
app.include_router(api_router)
```

Add immediately AFTER it:
```python
from extensions import ext_router
app.include_router(ext_router)
```

That's it. server.py stays otherwise unchanged.

## 2. New endpoints (all under /api/)
- `GET /api/activity/today` — steps, km, floors, active_minutes, calories
- `GET /api/activity/history?days=N`
- `GET /api/activity/date/{YYYY-MM-DD}`
- `GET /api/user/status` / `PATCH /api/user/status` (body: `{status: ativo|doente|aleijado|ferias}`)
- `GET /api/user/preferences` / `PATCH /api/user/preferences` (language, units, notifications flags)
- `POST /api/user/devices/add` / `POST /api/user/devices/remove` (body: `{device}`)
- `GET /api/notifications` / `POST /api/notifications/read` (body: `{notification_id}` or `{mark_all: true}`)

## 3. New MongoDB collections (auto-created)
- `activity` — daily steps/km log
- `status_history` — user status change log
- `notifications` — persisted notifications (optional, smart ones also synthesised)
- `notif_reads` — per-user list of read notification IDs

## 4. server.py UNCHANGED
The extension re-implements its own JWT auth and DB client to avoid circular imports. No changes needed to your existing code.
