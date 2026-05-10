# Pulse · Recovery OS — PRD

## Vision
Mobile-first health-recovery companion (Whoop/Bevel inspired) that unifies data from Apple Watch and Xiaomi Mi Band 8 into one elite-feel dashboard: Recovery, Strain, Sleep, Stress + AI-powered coaching tips.

## Personas
- Athletes optimising performance
- Sleep & stress conscious users
- Health enthusiasts tracking HRV/RHR trends

## Core Features (MVP shipped)
1. **Onboarding** — 3 steps: device pairing (Apple Watch, Mi Band 8 multi-select), goal selection, summary.
2. **Auth** — JWT email/password (register/login). Tokens persisted in AsyncStorage.
3. **Dashboard (Hoje)** — Hero Recovery ring (0–100) with HRV/RHR/Respiratory rate; Strain card (0–21); Sleep card (score + duration); Stress card (0–100); Sleep stages bar (Deep/REM/Light/Awake).
4. **History/Trends** — 7/14/30-day line chart switchable across Recovery, Sleep, Strain, Stress; avg/max/min stats.
5. **AI Coach (Dicas)** — Generate personalised tips via Claude Sonnet 4.5 (Emergent LLM Key) by focus area (general, recovery, sleep, strain, stress). History of generated tips persisted in MongoDB.
6. **Profile** — User card, connected devices list with sync status, settings stubs, logout.

## Data Source
Mock metrics generator (deterministic per user/date) seeds 30 days on signup/login. Realistic ranges for sleep (5.8–8.6h), HRV (38–95ms), RHR (48–72bpm), Recovery (15–100), Strain (6.5–18.5), Stress (10–100). Ready to swap to real HealthKit / Mi Fitness APIs.

## Tech Stack
- **Frontend**: Expo SDK 54, expo-router, react-native-svg (rings), react-native-chart-kit (graphs), AsyncStorage.
- **Backend**: FastAPI, Motor (MongoDB), bcrypt, PyJWT, emergentintegrations (Claude Sonnet 4.5).
- **DB Collections**: `users`, `metrics`, `tips`.

## API Endpoints (/api prefix)
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/onboard`
- `GET /metrics/today`, `GET /metrics/history?days=7|14|30`, `GET /metrics/date/{date}`
- `POST /tips/generate`, `GET /tips/list`

## Smart Business Enhancement
**Pulse Pro upsell hook** baked into the AI Coach: free users get a few tips, premium unlocks unlimited focus-specific AI coaching and longer history retention — a natural recurring-revenue lane on top of the dashboard utility.

## Design
Dark Whoop-style. `#0A0A0A` background, neon accents: recovery green `#32D74B`, strain blue `#0A84FF`, sleep indigo `#5E5CE6`, stress orange `#FF9F0A` / red `#FF453A`. Bottom tab nav, 8pt grid, SVG rings, no emojis.

## Known Limits
- Device data is **MOCKED** (deterministic generator). Real HealthKit / Mi Fitness sync requires native build.
- Settings rows (Notificações, Privacidade, Unidades, Ajuda) are visual stubs.
