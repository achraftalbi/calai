
# CalAI — Global Requirements v1.1 (Hybrid Tracking)
**Owner:** CalAI • **Build by:** Replit • **Version:** 1.1  
**Stack:** React+TS, Tailwind+shadcn/ui, TanStack Query, Wouter, Vite, PWA; Node+Express; Drizzle ORM; Neon (Postgres); GCS; Gemini+Edamam.

---

## 0) What changed in v1.1
Adds a **Hybrid Activity Tracking** model:
- Keep the **Zero‑Setup Device Motion Tracker** (no Google Fit required) for instant walking/running while the app is open.
- Offer **optional connectors** for 24/7 background and watch sports:
  - **Strava** (now): runs, rides, swims from almost any wearable.
  - **Health Connect (Android)** (next when native wrapper ships) for phone/watch background steps & calories.
  - **Apple Health (iOS)**: later with native wrapper.
- Smart **prompts** to upsell the connect only when it helps (e.g., no steps for 24h, user logs a swim).

All previous MRV requirements remain unless superseded here.

---

## 1) Product Goal & Success
Turn CalAI into a daily **energy‑balance coach** by combining food scans with **Net Calories** and simple tracking that “just works,” while allowing power users to connect a tracker for more sports and background data.

**North‑star:** D1/D7 retention; ≥40% users opening Coach.  
**KPIs:**  
- ≥50% of active users try **Zero‑Setup Tracking**.  
- ≥25% connect **Strava** (or Health Connect when available).  
- ≥3 days/week with **Net calories** visible.

---

## 2) Scope (MRV + Hybrid)
### In
- **Coach Tab** with Eaten, Burned (BMR + Exercise), **Net**, Steps.
- **Zero‑Setup Device Motion Tracker** (PWA): foreground walking/running, auto‑log sessions ≥ 2 min, push alerts.
- **Strava Connect**: OAuth, 30‑day import, 15‑min refresh, de‑dupe with steps.
- **Manual workouts** and **Start Walk** session.
- **Smart prompts** to connect Strava/Health Connect based on behavior.
- **Performance budgets & push guardrails** (see Appendix).

### Later
- **Health Connect (Android)** via native wrapper (Capacitor) for 24/7 steps & watch data.
- **Apple Health / CoreMotion** via native wrapper.
- Heart‑rate zones, GPS routes.

---

## 3) Hybrid Architecture
- **Tier 1 — Device Motion (default)**: JS DeviceMotion (and/or Core Motion via wrapper later). Tracks steps & detects walking/running while CalAI is **open**. Low friction; labeled **Estimated**.
- **Tier 2 — Connectors (optional)**: Strava (now), Health Connect/Apple Health (later). Pulls background steps/workouts and watch sports (swim, ride). Labeled **Measured** and preferred in de‑duplication.
- **Fusion & De‑dup**: for overlapping windows, prefer **Measured** activity calories; avoid double counting step‑derived kcal when a workout exists.

---

## 4) UX Flows
### A) First‑time Coach (no source)
- Card: “**Count steps automatically while CalAI is open.**” → **Enable Motion** (permission prompt).
- Secondary: “Want always‑on & swims?” → **Connect Strava** / **Not now**.

### B) During use (smart prompts)
- If steps = 0 for 24h → banner: “Get automatic background steps” → Connect Strava.
- If user adds **swim** manually → modal: “Import swims automatically with Strava.”
- If tracker connected → hide prompts.

### C) Tracking session
- Badge “**Tracking**” when Device Motion active; “Paused” when tab hidden/locked.  
- Auto‑log session if **≥ 2 min** and **≥ N steps** (configurable; default N=150).  
- Push: “Walking detected (+~kcal)” at session start; “Session saved” on stop.

### D) Data provenance
- Exercise cards show **source chip**: Device, Strava, Health Connect, Manual.  
- Calories labeled **Estimated** (Device/Manual) vs **Measured** (Strava/Health).

---

## 5) Calculations
- **BMR (Mifflin–St Jeor)** — unchanged.  
- **Total Burn (day)** = **BMR + ActiveKcal**.  
- **Net** = **Eaten − Total Burn**.  
- **Steps→kcal** (device): `kcal ≈ steps × weight(kg) × 0.0005` (conservative).  
- **METs by pace** (device session): if speed is estimable, `kcal = MET × weight × duration(h)`; else use step formula.  
- Mark confidence: `estimated` vs `measured`.

---

## 6) Data Model (Drizzle / Postgres)
```ts
export const daily_metrics = pgTable('daily_metrics', {
  userId: uuid('user_id').notNull(),
  date: date('date').notNull(),
  intakeKcal: integer('intake_kcal').default(0),
  activeKcal: integer('active_kcal').default(0),
  bmrKcal: integer('bmr_kcal').default(0),
  steps: integer('steps').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.date] }) }));

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  source: varchar('source', { length: 24 }),    // device | strava | health_connect | apple_health | manual
  confidence: varchar('confidence', { length: 16 }), // estimated | measured
  type: varchar('type', { length: 24 }),        // walk | run | cycle | swim | strength | other
  start: timestamp('start'),
  end: timestamp('end'),
  steps: integer('steps'),
  calories: integer('calories'),
  meta: jsonb('meta'), // device details, strava ids, etc.
});

export const device_calibration = pgTable('device_calibration', {
  userId: uuid('user_id').notNull().primaryKey(),
  factor: numeric('factor').default('1.0'), // multiply step->kcal if user calibrates
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Derived rules**
- For overlapping windows on the same day: ignore device step‑kcal if a **measured** workout exists (Strava/Health).

---

## 7) APIs
```
GET  /coach/today
→ { date, intakeKcal, activeKcal, bmrKcal, steps, netKcal, sources, latestActivities[] }

POST /device/session
{ type: "walk"|"run", start, end, steps, calories, meta? } → { id }

POST /manual/activity
{ type, start, end, steps?, calories? } → { id }

POST /integrations/strava/oauth/callback
POST /integrations/strava/sync  // 30‑day import, then 15‑min refresh

POST /calibration
{ factor } → { ok: true }
```

Backend computes rollups and de‑dupe.

---

## 8) Strava Integration (now)
- Scope: `activity:read`
- Import: last **30 days**; then **15‑min** refresh job.
- Map to activities: run/ride/swim/… ; use Strava **calories** when present.
- De‑dupe rule: for overlapping time, prefer Strava calories; drop device step‑kcal in that window.
- Error handling: token refresh; rate limit backoff; reconnect CTA on 401.

---

## 9) Health Connect (Android, next with native wrapper)
- Purpose: background steps/calories and WearOS watch sessions.
- Permission: user one‑time Health Connect read consent.
- Data: steps, active energy, workouts (type, calories, duration).
- Sync: backfill 7 days; 15‑min refresh.
- UI: same source chips; same de‑dupe preference (measured wins).

---

## 10) Permissions & Privacy
- Device Motion: ask only when user taps **Enable Motion**.  
- Strava/Health Connect: explicit opt‑in (OAuth/OS dialog).  
- Tokens encrypted at rest; disconnect revokes tokens; optional delete imported data.  
- Copy: “Estimates only—not medical advice.”

---

## 11) Notifications
- Device session start/stop nudges; step milestones (5k/8k/10k); evening Net > +250 at 19:00.  
- Caps: ≤2/day steps + 1/day net; quiet hours 22:00–08:00.  
- Pause when app is hidden (device tracker).

---

## 12) Performance & Battery
- Keep existing budgets (Appendix A from v1.0).  
- Device tracking: throttle sensor reads; stop after N minutes idle; show **Tracking paused** when tab hidden.  
- Images & ML: unchanged (server‑side).

---

## 13) Acceptance (Hybrid)
- Zero‑Setup tracker works on Android Chrome and iOS Safari (permission flows OK).  
- Auto‑logs sessions ≥2 min; avoids false positives with step threshold.  
- Strava connect/backfill/refresh; de‑dup with device sessions.  
- Smart prompts appear only when helpful; disappear after connect.  
- Coach displays provenance (Device/Measured) and correct **Net** after de‑dup.  
- Push respects caps/quiet hours.

---

## 14) QA Matrix
- Devices: Moto G Power (Android 11), Galaxy A14 (Android 13), iPhone 12.  
- Scenarios:  
  - Device only (walks), Strava only (run/ride/swim), both (overlap), manual only.  
  - App foreground vs background (device tracker should pause).  
  - Low/high step volume; weight change midday; timezone/DST.  
  - Token refresh failures; rate limit.

---

## 15) Roadmap Hints
- Capacitor wrapper to unlock Health Connect & better iOS Motion.  
- Weekly summary (net & steps trends).  
- Calibrated stride length (optional).

---

## Appendix — Performance Acceptance Checklist (unchanged)
See Appendix A in v1.0 document; the same budgets and CI gates apply.
