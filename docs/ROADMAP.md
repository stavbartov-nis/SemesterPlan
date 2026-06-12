# SemesterPlan — Roadmap

> Synthesized 2026-06-11 from a product-manager review, a UX audit, and a QA audit
> of the codebase. North star: **a plan the builder would trust for her own
> Econ+Business registration, demoed live in under 5 minutes without a visible bug.**
>
> Explicitly out of scope (do not build): auth/accounts, multi-university,
> cron/scheduled scraping, server-side solver, English UI toggle, GPA simulation.

---

## Phase 0 — Done (2026-06-11)

- ✅ Scraper semester mapping fixed (group-level period: 1=A, 2=B, 3=Summer, 4=Annual);
  offerings split per semester — 100 offerings (A=49, B=45, Annual=5, Summer=1).
- ✅ Official Hebrew course names from the Shnaton API; hallucinated translation map removed.
- ✅ Semester picker (א'/ב') in the anchors step; engine/calendar/analysis filter offerings
  by `targetSemester` via `getOfferingsForSemester()` (Annual courses appear in both).
- ✅ External prerequisite ids filtered out of the catalog (133 refs to courses outside the
  Econ/BizAdmin catalog made 42/92 courses permanently unsuggestable).
- ✅ Persist migration chaining fixed (v0/v1 states now pass through the v2→v3 reset).
- ✅ Dead code and debris deleted: legacy `Planner`/`BundleSuggestions`/`roadmap/`/`layout/`
  components, debug HTML files, `app.js`, `mock-planner.js`, `styles.css`, puppeteer dep.
- ✅ Test suite repaired (stale `econ-2026` track id) — 11/11 passing, tsc clean, build green.

---

## Phase 1 — Correct & Demoable (the demo fails without these)

### 1.1 Real degree-track requirements (manual one-time entry) ⭐ top leverage
Current track baskets are approximated from `statusCourseCode` with arbitrary 50%/30%
credit fractions (`src/data/huji-mock-catalog.ts`). Enter the official combined-track
requirements (mandatory lists + real min-credit numbers per basket) by hand — one track,
one time, verified against the actual degree sheet.
**Effort:** M. **Done when:** per-basket remaining-credits matches the faculty
requirements page for a known transcript; no fraction constants left in code.

### 1.2 Engine picks lecture + paired exercise ⭐ top leverage
`findBestGroup` (`src/engine/generator.ts`) selects ONE group per course — schedules with
a lecture but no tirgul (or tirgul-only: 13 lecture-less offerings exist, e.g. `57130`)
cannot be registered. The pairing data is already captured (`MeetingGroup.code`, "1-01").
**Effort:** M. **Done when:** every generated bundle contains one lecture group plus one
exercise group with a matching code prefix, both conflict-checked and rendered.

### 1.3 Prerequisite OR-groups
Scraper flattens OR→AND (`flattenPrereqs`), overstating prereqs → false "missing
prerequisite" warnings train the user to ignore real ones. Model as `string[][]`
(AND of OR-groups).
**Effort:** S–M. **Done when:** a course requiring "A or B" shows no warning with only B
completed; AND cases still warn.

### 1.4 "No valid plan" diagnostic state
Generator always returns 3 bundles; over-constrained input yields hollow cards with
"3 תוכניות מוכנות" and no explanation. Detect weak output and say *which* constraint
starved it, with a jump back to the constraints step.
**Effort:** S. **Done when:** one allowed day produces a specific actionable Hebrew
message, never an empty-looking success state.

### 1.5 QA hardening (from audit)
- Anchors with empty `selectedGroupIds` are invisible to conflict checks — bundles can
  schedule on top of an anchor's only meeting times. Auto-assign or warn.
- Tests to add (one each): lecture+exercise group selection; migration v2→v3 and v0→v3;
  `getOfferingsForSemester` (Annual in both, Summer in neither, no dupes);
  `setTargetSemester` wipe semantics; back-to-back slot boundary (14:00/14:00 ≠ conflict).
- Two zero-credit courses (`55117`, `55005`) and 6 courses with no offering — decide:
  hide or badge.
**Effort:** S–M. **Done when:** the five tests exist and pass.

---

## Phase 2 — Demo Wow

### 2.1 Finish the payoff screen (UX verdict: single biggest perceived-quality win)
The whole wizard funnels into StepGenerate, which today shows **English** bundle names
and rationales inside the Hebrew UI. Translate the three name/rationale pairs
(המסלול המהיר / מערכת מרוכזת / בלי בקרים מוקדמים). **Effort:** S.

### 2.2 Calendar readability
- Per-course colors (stable palette by courseId) + legend; type shown via border style
  (solid=הרצאה, dashed=תרגיל). Today everything is type-colored — a wall of blue.
- Overlap rendering: column-packing (`width: 100/n%`) + red conflict styling; currently
  conflicting events paint on top of each other at the same z-index.
- RTL sweep: physical `left/right` CSS → logical `inline-start/end` properties.
**Effort:** M. **Done when:** two overlapping events are both visible and flagged;
each course has one color everywhere.

### 2.3 Per-basket degree-progress dashboard (depends on 1.1)
Apply a bundle → basket progress bars animate showing this semester's contribution vs.
degree remainder. The "degree GPS" story for the class demo. **Effort:** M.

### 2.4 Conflict feedback with names, not ids
Analysis sidebar shows "חפיפה: 57114 & 10131". Use course names + day/time:
"חפיפה ביום ג': מיקרו א' ↔ חשבון דיפרנציאלי (10:00–12:00)". **Effort:** S.

### 2.5 Hebrew copy fixes
- Broken plural: `התנגשות{…'ות'}` renders **התנגשותות** — write both forms explicitly.
- Masculine address ("שאתה", "נעל") for a female single user — switch to feminine or
  neutral infinitives.
- Data provenance badge in header from catalog meta: "נתוני השנתון הרשמי, תשפ"ו".
**Effort:** S.

### 2.6 Demo moments (pick by remaining time, ranked effort-to-impact)
1. **Animated schedule build-in** — staggered drop-in of calendar events + brief
   "בונה מערכת…" beat on generate (~1h, pure CSS).
2. **Live what-if day toggling** on the result calendar — toggle a day off, watch the
   week morph (~half day).
3. **Schedule image export** — "שתפי מערכת" → PNG download of the week (~1 day).

---

## Phase 3 — Stretch (only after P1+P2 rehearsed)

| Item | Value | Effort |
|---|---|---|
| Semester picker as labeled segmented control in the top bar + anchor warnings on switch | Discoverability of the most consequential setting | S |
| Mobile breakpoint (stack two-col, scrollable calendar, page scroll) | "Look, on my phone" demo moment; currently clips unusably | M |
| Truthful wizard ✓ states derived from store data | Progress UI stops lying | S |
| Confirm dialog on header איפוס (currently nukes localStorage in one click) | Data-loss guardrail | S |
| Prereq chain mini-graph per course | Visual flex | M |
| Read-only semester-B glance after planning A | Multi-semester story | L |
| ICS export to Google Calendar | Demo closer | S |
| Campus-travel warning (Safra↔Scopus back-to-back) | Data already present | S |

---

## Sequencing

1.1 → 1.2 → 1.3 + 1.4 + 1.5 → 2.1 + 2.5 (an afternoon, huge perceived gain) →
2.2 → 2.3 → 2.4 → 2.6 → rehearse demo → Phase 3 if time remains.
