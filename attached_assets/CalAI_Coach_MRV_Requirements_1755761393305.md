
# CalAI — Global Requirements (Coach + Energy Balance MRV)
**Owner:** You (CalAI)  •  **Build by:** Replit team  •  **Version:** 1.0 (hand‑off)  
**Stack (existing):** React + TypeScript, Tailwind + shadcn/ui, TanStack Query, Wouter, Vite, PWA; Node.js + Express; Drizzle ORM; Neon (Postgres); Google Cloud Storage; Gemini + Edamam; hosted on Replit.

---

## 1) Product Goal & Success
Turn CalAI from “calories in” into a daily **energy‑balance coach** by adding exercise/steps, **Net Calories**, and light nudges.

**North‑star:** D1/D7 retention; ≥40% users opening **Coach** tab.  
**Key KPIs:**
- ≥25% of active users connect an exercise data source (Fit/Strava/manual).
- ≥30% push notification opt‑in.
- Users view **Net Calories** ≥3 days/week.

---

## 2) Scope (MRV = Minimum *Remarkable* Version)
### In
- **Coach Tab**: Eaten, Burned (BMR + Exercise), **Net**, Steps.
- **Data sources**: Google Fit (steps + active calories), Strava (workouts), Manual entry.
- **Calculations**: BMR, Active calories, Step→kcal estimate, Net.
- **Notifications (Web Push)**: step milestones and evening net surplus.
- **Settings**: connect/disconnect sources; units; show Net in header; push opt‑in.

### Out (later)
- Apple HealthKit (needs native wrapper), heart‑rate zones, detailed plans, GPS routes.

---

## 3) User Stories & Acceptance
1. **View Energy** — As a user I see **Eaten / Burned / Net** for **today** on Coach tab.  
   **Accept:** Net = `Eaten − (BMR/day + ExerciseKcal)`. Colors — green (≤0), amber (0–200), red (>200).

2. **Connect Google Fit** — I connect Fit and see **steps + active calories** within 60s.  
   **Accept:** OAuth flow succeeds; today shows values; **7‑day backfill** populated.

3. **Connect Strava** — I connect Strava and see recent **workout calories**.  
   **Accept:** Last 30 days imported; duplicates avoided; workout kcal preferred over step‑derived for overlapping windows.

4. **Manual Add** — I can add **steps** or a **workout** when I don’t connect a source.  
   **Accept:** Quick form; kcal auto‑estimated when not provided.

5. **Push Nudges** — I receive push when hitting **5k/8k/10k steps** and when **Net > +250 kcal** at **19:00** local.  
   **Accept:** Quiet hours 22:00–08:00; frequency cap 2/day (steps) + 1/day (net).

6. **Control & Privacy** — I can disable notifications and disconnect sources.  
   **Accept:** Revokes tokens; option to delete imported data.

---

## 4) UX Summary (wireframe‑level)
### Coach (Today)
- **Meters/Rings**: Eaten, Burned (BMR + Exercise), **Net** (prominent).  
- **Cards**:  
  - **Steps** — steps, source chip (“Google Fit / Strava / Manual”), kcal.  
  - **Exercise** — sessions (icon, name, duration, kcal).  
  - **Top Drivers** — e.g., “Walking 42% of burn”, “Breakfast 38% of intake”.
- **Empty State**: “Connect Google Fit or Strava, or add manually.”
- **Header Option**: Setting to replace header progress bar with **Net**.

### Color logic
- Progress bar green ≤ 90% of goal; amber 90–100%; red > 100%.  
- Net label: green ≤ 0; amber 0–200; red > 200 kcal.

Accessibility: WCAG AA contrast; aria‑labels like `aria-label="Net calories: 120 over"`. Keyboard navigable.

---

## 5) Calculations
- **BMR (Mifflin–St Jeor)**  
  - Male: `10*kg + 6.25*cm − 5*age + 5`  
  - Female: `10*kg + 6.25*cm − 5*age − 161`
- **Total Burn (day)** = **BMR** + **ActiveKcal** (from Fit/Strava/manual).  
- **Net** = **Eaten − Total Burn**.
- **Steps→kcal** (fallback if no activeEnergy):  
  `walking_kcal ≈ steps × weight(kg) × 0.0005` (conservative).  
- Recompute today’s **BMR** when the user updates weight.

Units: support kg/lb and cm/ft‑in with instant conversions.

---

## 6) Data Model (Drizzle / Postgres)

```ts
// daily rollup (PK: userId + date)
export const daily_metrics = pgTable('daily_metrics', {
  userId: uuid('user_id').notNull(),
  date: date('date').notNull(),
  intakeKcal: integer('intake_kcal').default(0),   // from food scanner
  activeKcal: integer('active_kcal').default(0),   // from Fit/Strava/manual
  bmrKcal: integer('bmr_kcal').default(0),
  steps: integer('steps').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.date] }) }));

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  source: varchar('source', { length: 32 }),    // google_fit | strava | manual
  type: varchar('type', { length: 32 }),        // walk | run | cycle | strength | ...
  start: timestamp('start'),
  end: timestamp('end'),
  steps: integer('steps'),
  calories: integer('calories'),
  meta: jsonb('meta'),
});

export const provider_tokens = pgTable('provider_tokens', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  provider: varchar('provider', { length: 32 }), // google_fit | strava
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  scope: text('scope'),
});

export const push_subscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

Derived `netKcal` is computed in service or via a DB view.

---

## 7) Integrations
### Google Fit
- OAuth scopes: `https://www.googleapis.com/auth/fitness.activity.read`
- Pull: **Steps** (aggregate), **Active Energy (kcal)**, **Sessions**.  
- Backfill **7 days**; poll **every 15 min**; manual “Refresh” button.

### Strava
- OAuth scopes: `activity:read`  
- Pull recent activities (30 days). Prefer activity `calories` to step‑derived kcal for overlap.

### Manual entry
- Quick forms: **Add steps** or **Add workout** (type, duration, kcal).

Dedup: avoid double counting between steps and workout windows (prefer workout kcal).

---

## 8) Time & Localisation Rules
- Day boundary: **00:00–24:00 local user timezone**.  
- All rollups/time math in **user’s TZ** (handle DST).

---

## 9) Notifications (Web Push)
- **Triggers:**  
  - Steps: fire at **5k**, **8k**, **10k** (once per day per milestone).  
  - Evening Net: at **19:00** local if `Net > +250`.  
- **Caps & Quiet hours:** max **2/day** step nudges + **1/day** net; quiet hours **22:00–08:00**.  
- **Copy examples:**  
  - “🎯 8,000 steps — ~230 kcal burned. Nice!”  
  - “Heads‑up: Net **+320 kcal**. A 20‑min walk ≈ 80–120 kcal.”
- UX: ask permission only after user enables Coach/steps.

Implementation: Service Worker registered by PWA; server uses VAPID to send pushes.

---

## 10) API (REST)
```
GET  /coach/today
→ { date, intakeKcal, activeKcal, bmrKcal, steps, netKcal, sources: ["google_fit"] }

POST /integrations/fit/oauth/callback
POST /integrations/strava/oauth/callback

POST /manual/activity
{ type, start, end, steps?, calories? }  → { id }

POST /manual/steps
{ date, steps } → { ok: true }

POST /push/subscribe
{ endpoint, p256dh, auth } → { ok: true }

POST /integrations/disconnect
{ provider, deleteData?: boolean } → { ok: true }
```

Response times: API p95 < **300 ms**.

---

## 11) Settings & Profile
- Required: **sex, age, height, weight, units**.  
- Changing weight **recomputes BMR** for the day.  
- Toggles: show Net in header; push notifications on/off; connect/disconnect providers.

---

## 12) Offline, Empty & Error States
- PWA caches last day’s metrics; shows “Sync when online.”  
- Empty Coach shows connectors + manual add.  
- Token refresh failure → surface “Reconnect” CTA.

---

## 13) Privacy, Security & Deletion
- Encrypt OAuth tokens at rest.  
- **Disconnect**: revoke token; option to delete imported data.  
- Account deletion removes all data within **30 days**.  
- Medical disclaimer: “Estimates only—not medical advice.”

---

## 14) Observability
- Logs & alerts: token refresh failures, sync job failures, duplicate suppression, push send errors.  
- Dashboards for: sync success rate (target **>99%/24h**), push sends, API latency.

---

## 15) Analytics (events)
`coach_view`, `fit_connected`, `strava_connected`, `manual_activity_added`, `push_opt_in`, `push_sent`, `step_milestone_hit`, `net_over_threshold`.

---

## 16) Delivery Plan (Sprints)
**S1 — Data & Manual**
- Tables/migrations; BMR service; manual add endpoints; daily rollup.

**S2 — Integrations**
- Google Fit + Strava OAuth; 7‑day backfill; 15‑min poll; dedup.

**S3 — Coach UI**
- Rings/cards; empty/offline; Settings toggles; header Net option.

**S4 — Push**
- Service Worker + VAPID; subscribe API; milestone + evening net triggers.

**Hardening**
- QA matrix; a11y; perf; monitoring/alerts.

---

## 17) Definition of Done (Gate)
- Net math correct across edges (TZ, DST, weight change).  
- Fit/Strava connect, refresh, backfill, **dedup ok**.  
- Manual activity updates Net within **5s**.  
- Push respects quiet hours & caps; unsubscribe works.  
- Empty/offline states implemented.  
- Privacy links + token revoke + delete path.  
- Monitoring in place; a11y (WCAG AA) passes.  
- QA scenarios: no source / Fit / Strava / both; low/high steps; net <0 / ~0 / >200.

---

## Appendix A — Performance Acceptance Checklist (Ship Gate)
**Goal:** Add Coach features without making CalAI feel heavy. These are **hard gates** for release.

### A. Budgets (must meet in CI and on real mid‑range Android)
- **Initial route (home/paywall) bundle:** ≤ **250 KB** gzipped (JS+CSS).  
- **Total JS across app:** ≤ **600 KB** gzipped (after code‑split).  
- **Runtime web vitals on Moto G / Galaxy A-series over 4G:** LCP **< 2.5 s**, INP **< 200 ms**, CLS **< 0.1**.  
- **Memory at rest:** < **120 MB**.  
- **API responses:** < **100 KB** per call (paginate, compress).  
- **Images:** upload side ≤ **1280 px** longest side, WebP/AVIF preferred, quality ≈ **0.75**.

### B. Implementation requirements
- **Code splitting:** lazy‑load Coach tab and integrations UIs (React.lazy + Vite).  
- **Caching:** App shell via service worker (cache‑first); data via **stale‑while‑revalidate** with TanStack Query (`staleTime ≥ 60s` for Coach metrics).  
- **Camera lifecycle:** stop all tracks immediately after capture (`stream.getTracks().forEach(t => t.stop())`).  
- **Image pipeline:** client‑side resize before upload; server stores compressed; avoid base64 in JSON.  
- **No client‑side ML loops:** all food recognition server‑side (Gemini/backup).  
- **Integrations:** poll at most **every 15 min**; backfill **7 days** once; dedupe sessions vs step kcal.  
- **Push:** quiet hours **22:00–08:00**; caps: **≤2/day** (steps) + **1/day** (net).  
- **Dependencies:** keep shadcn components in use only; avoid huge icon packs; prefer inline **SVG**.

### C. Testing matrix (pre‑ship)
- **Devices:** Moto G Power (Android 11), Galaxy A14 (Android 13), iPhone 12 (Safari for PWA), low‑RAM Android emulator.  
- **Networks:** 4G (Good 1.6 Mbps down / 750 Kbps up), 3G Slow (400/400 Kbps).  
- **Flows:** cold start; first camera snap; Coach load with/without integrations; offline mode; push opt‑in; quiet hours.  
- **Edge cases:** very large day log (20+ items); weight change midday; timezone/DST change; token refresh failure.

### D. CI gates & tooling
- **Bundle size check:** fail CI when budgets exceeded. Add `rollup‑plugin‑visualizer` to inspect heavy modules.  
- **Lighthouse CI:** must pass budgets on “home” and “coach” routes under “4G Slow + Moto G” preset.  
- **Web Vitals reporting:** send LCP/INP/CLS to backend; alert when LCP p75 > **2.8 s** or INP p75 > **250 ms**.

**Example Lighthouse CI config (`.lighthouserc.json`):**
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173/", "http://localhost:5173/coach"],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "formFactor": "mobile",
        "screenEmulation": {"mobile": true},
        "throttlingMethod": "devtools",
        "throttling": {"rttMs": 150, "throughputKbps": 1600, "cpuSlowdownMultiplier": 4}
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.9}],
        "unused-javascript": ["error", {"maxLength": 262144}],        // 256 KB
        "total-byte-weight": ["error", {"maxNumericValue": 250000}],  // ≈250 KB
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "interactive": ["warn", {"maxNumericValue": 3500}]
      }
    }
  }
}
```

### E. Monitoring after deploy
- **Dashboards:** bundle size over time, LCP/INP/CLS p75, API latency p95, error rate, push send success.  
- **Alerts:** token refresh failures, sync job retries > 3, web vitals regressions, JS error rate > 1% of sessions.

### F. Accessibility checklist
- Contrast AA on rings/cards; focus outlines visible.  
- Labels for meters (e.g., `aria-label="Net calories: 120 over"`).  
- All interactive UI keyboard reachable (Tab/Shift‑Tab).

---
