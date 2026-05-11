# Pulse · Recovery OS — PRD (v1.1)

## Vision
Whoop/Bevel-inspired mobile health-recovery + nutrition companion in Portuguese (pt-PT). Unifies Apple Watch + Xiaomi Mi Band 7/8/9 data into a premium dashboard with AI coaching and Cal-AI-style food photo analysis.

## Personas
- Athletes optimising performance
- Sleep & stress conscious users
- Users tracking nutrition via photo (no manual entry)

## Core Features (v1.1)
1. **Onboarding 4 steps** — device pairing (Apple Watch + Mi Band 7/8/9 multi-select), health info (age, gender, height, weight), goal, summary.
2. **Auth** — JWT email/password + AsyncStorage persistence.
3. **Dashboard "Hoje"** (redesigned) — 3 horizontal rings (Strain/Recovery/Sleep), Coaching card (premium-aware), Stress & Energy (highest/lowest/avg + ring), Body Battery bar, Nutrition summary (kcal + macros), Biology bio rows (HRV, RHR, Resp, Sleep total).
4. **History/Trends** — 7D/14D/30D for free, up to 365D for premium; charts + avg/max/min for Recovery/Sono/Strain/Stress.
5. **Coach IA (Tips)** — Claude Sonnet 4.5 via Emergent LLM Key. Free: short tip. Premium: long multi-paragraph personalised tip. 6 focus areas including nutrition. Premium badge on premium tips.
6. **Nutrição (NEW)** — Cal-AI-style. Camera or gallery photo → Claude Sonnet 4.5 **vision** returns items + macros (calories/protein/carbs/fat) + summary in pt-PT. Daily totals vs 2200 kcal goal. Free: 3 photos/day. Premium: unlimited. Delete entries.
7. **Premium (NEW)** — 15-day trial (no card, single-use), promo code **HEALTHY** → lifetime premium. Premium screen lists features. Status pill in profile.
8. **Profile** — name + initials avatar, health data rows, devices with sync status, settings stubs, Premium row.

## Theme (v1.1)
Switched primary accent from green → **blue (#0A84FF)**. Multi-color rings preserved per metric: Strain `#FFB930` amber, Recovery `#B6F242` lime, Sleep `#7B8BFF` indigo, Stress orange/red. Premium uses gold `#FFD60A`. Backgrounds `#0A0A0A` / `#1A1A1A`.

## Tech Stack
- **Frontend**: Expo SDK 54, expo-router, react-native-svg, react-native-chart-kit, **expo-image-picker** (base64), AsyncStorage.
- **Backend**: FastAPI, Motor, bcrypt, PyJWT, **emergentintegrations** (Claude Sonnet 4.5 text + vision).
- **DB Collections**: `users`, `metrics`, `tips`, `food_logs`.

## API Endpoints (/api prefix)
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/onboard`, `PATCH /auth/profile`
- Metrics: `GET /metrics/today`, `GET /metrics/history?days=N`, `GET /metrics/date/{date}`
- Tips: `POST /tips/generate`, `GET /tips/list`
- Premium: `GET /premium/status`, `POST /premium/start-trial`, `POST /premium/redeem`
- **Nutrition**: `POST /nutrition/analyze` (image_base64), `GET /nutrition/today`, `DELETE /nutrition/{id}`

## Test Results
- **Backend pytest**: 39/39 PASSED (24 iter1 + 15 iter2). Claude Sonnet 4.5 vision validated with real pizza JPEG → returned items + 1850 kcal totals.
- **Frontend e2e**: onboarding 4 steps, dashboard 3-rings layout, nutrition camera/gallery → AI analysis → totals, premium trial + HEALTHY code, profile premium pill.

## Smart Business Hooks
- 15-day no-card trial removes friction → high activation.
- HEALTHY promo code → influencer/partner distribution channel for lifetime upgrades.
- 3 free photos/day forces upgrade decision after daily habit forms.

## Known Limits
- Device data is **MOCKED** (deterministic generator). HealthKit / Mi Fitness sync requires native build.
- Settings rows (Notificações, Privacidade, Unidades, Ajuda) are visual stubs.
