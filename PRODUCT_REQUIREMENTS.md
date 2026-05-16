# Product Requirements: HUJI Degree-Aware Schedule Planner

Companion doc: [considerations, task breakdown, and open questions](PRODUCT_CONSIDERATIONS_AND_TASKS.md).

---

## 1. Vision and summary

Students at the Hebrew University of Jerusalem (HUJI) must satisfy **mandatory**, **core**, and **elective** credit rules that differ by degree (for example, Business and Economics). They also need schedules that fit **real availability**: preferred days, time windows, and tolerable overlap between courses.

This product is a **planning assistant** that:

1. Ingests or references the **official course catalog** (and related metadata).
2. Accepts the user’s **degree profile** (required credit totals or rules per credit type) and **schedule preferences**.
3. Produces **one or more suggested academic plans** (course sets with timing) that respect degree credit needs and scheduling constraints, so the user can compare and choose.

The tool supports decision-making; it does not replace university registration systems or formal degree audits unless explicitly integrated and authorized later.

---

## 2. Goals and non-goals

### 2.1 Goals

- Let users express **credit-type targets** tied to a **degree** (or track).
- Let users express **schedule preferences** (days, hours, overlap policy).
- **Validate** combinations against catalog data (existence of courses, typical credit values, meeting times when available).
- Generate **multiple distinct candidate plans** when possible, ranked or grouped for easy comparison.
- Make assumptions, data sources, and limitations **transparent** (e.g. “plan assumes current catalog snapshot”).

### 2.2 Non-goals (initial scope)

- Guaranteed official approval of any plan by the faculty (unless a future phase adds advisor workflows).
- Automatic enrollment or write-back to HUJI systems (unless a future phase defines secure integration).
- Solving every edge case of cross-faculty rules, exemptions, and individual transcripts without structured input.

---

## 3. Users and primary scenarios

### 3.1 Primary user

- HUJI undergraduate or graduate student (or prospective student) who needs a **coherent multi-semester or single-semester** course set that fits degree credit buckets and personal calendar constraints.

### 3.2 Representative scenarios

- **S1 — First plan:** User selects degree, enters or confirms credit targets, sets “no classes before 10:00” and “not Friday,” requests three alternative plans for next semester.
- **S2 — Tight calendar:** User allows **limited overlap** (e.g. back-to-back on same campus only) or **zero overlap**; system only returns schedules that satisfy that policy.
- **S3 — Progress check:** User has already completed some courses; system subtracts fulfilled credits per type and suggests remainder.
- **S4 — Compare degrees or tracks:** User duplicates profiles to compare Business vs. Economics emphasis (if modeled as separate rule sets).

---

## 4. Domain model: credits and degrees

### 4.1 Credit types (functional)

| Type        | Description (product sense) |
|------------|-----------------------------|
| **Mandatory** | Courses or credits the student **must** complete (all required items from this set, or a fixed list defined by the degree). |
| **Core**      | Student must accumulate **at least N credits** (or complete M of K modules) from a **defined basket** of options. |
| **Elective** | Student must accumulate **at least N credits** from a **broader basket** (possibly overlapping with core rules — see [considerations](PRODUCT_CONSIDERATIONS_AND_TASKS.md#1-things-to-consider)). |

### 4.2 Degree configuration

- Each **degree** (or program + track) defines:
  - Targets or rules per credit type (e.g. minimum core credits, minimum elective credits, mandatory course IDs).
  - Optional: prerequisites chains, recommended semester ordering, caps, exclusions.
- The system must support **at least one** reference configuration (e.g. Business and Economics) and be **extensible** to additional degrees via data, not hard-coded logic only.

### 4.3 User state (progress)

- Optional: **completed courses** or **credits already earned** per type, to compute **remaining** requirements.
- Optional: **courses in progress** this semester.

### 4.4 Joint combined programs (example: Business and Economics)

Some programs bundle **two rule sets** (e.g. Economics and Business) under one degree. The product must model them as **separate requirement objects**, while still producing **one integrated semester plan** (a single course set and timetable that satisfies every component at once).

- **Economics (example shape):** mandatory courses (all required), minimum **core** credits from an Economics core basket, minimum **elective** credits from an Economics elective basket.
- **Business (example shape):** mandatory courses (all required), minimum **elective** credits from a Business elective basket — with no separate Business “core” bucket *if* that matches the official rules (otherwise the schema must allow a core bucket too).
- A **course** may contribute credits to one side, to both, or to neither, according to official mappings (double-count rules are **data-driven**; see [considerations](PRODUCT_CONSIDERATIONS_AND_TASKS.md#1-things-to-consider)).
- The UI must make clear that each suggested plan is a **joint** solution covering **both** components, not two unrelated schedules.

---

## 5. Catalog and data requirements

### 5.1 Catalog content (minimum useful set)

For each **course** (or section where relevant):

- Stable **identifier** (catalog code; section ID if schedule is section-specific).
- **Title**, **credit points** (נקז), **faculty/department**.
- **Classification** for degree rules: mandatory / core basket / elective basket (or tags that map to rules).
- **Schedule** when available: **day(s)**, **start/end time**, **location** or campus (if used for travel/overlap logic).
- **Semester** availability (fall / spring / annual / irregular).
- **Prerequisites and corequisites** (if the product phase includes sequencing).

### 5.2 Catalog sourcing

- **Preferred:** Structured import from an **official or regularly updated** source (API, export file, or licensed scrape policy — subject to HUJI terms of use).
- **Fallback:** Manual or community-maintained dataset with **versioning** and **last updated** metadata.

### 5.3 Data quality and versioning

- Catalog is **time-stamped**; plans cite **which snapshot** they used.
- Conflicts or missing schedule data must surface as **warnings**, not silent failure, where possible.

---

## 6. User inputs: schedule preferences

The user must be able to configure (at minimum):

- **Allowed days** (subset of Sun–Thu or institutional week).
- **Allowed time windows** per day or global (e.g. 08:00–14:00).
- **Overlap policy**, for example:
  - **No overlap:** no two courses may share overlapping minutes on the same day.
  - **Limited overlap:** allow at most X minutes overlap, or overlap only if same building/campus (if data supports it).
  - **Back-to-back buffer:** minimum gap between end of one class and start of next.
- Optional: **maximum courses per day**, **maximum daily hours**, **avoid night classes**.

Preferences should be **validated** (e.g. empty allowed window → error or warning).

---

## 7. Core system behavior: plan generation

### 7.1 Constraints (hard vs soft)

- **Hard constraints (must satisfy):** degree credit-type rules as modeled, mandatory inclusion, no disallowed overlap (per user policy), course within allowed days/hours, course offered in chosen semester(s), no duplicate course in same plan.
- **Soft constraints (nice to have):** compact days, preferred lunch break, minimize gaps, prefer certain instructors or campuses — optional future phase.

### 7.2 Multiple plans

- System returns **N alternative plans** (N configurable, with a sensible default, e.g. 3–5).
- Alternatives should be **meaningfully different** where possible (different elective choices or different day packing), not trivial permutations.
- Each plan includes a **short rationale summary**: e.g. credits satisfied per type, total weekly hours, compactness score.

### 7.3 Explainability

- For each suggested course, show **which requirement** it satisfies (mandatory / core / elective).
- Flag **risks**: missing exam data, uncertain section assignment, prerequisite not yet taken, etc.

---

## 8. User interface and experience (high level)

- **Onboarding:** select degree → confirm/edit credit targets → set semester(s) → set schedule preferences.
- **Results:** tabbed or listed **plans** with calendar-style week view and a **credit ledger** per type.
- **Export:** PDF or ICS (if schedules are fixed enough) or copy-friendly list — phase-dependent.
- **Language:** Hebrew UI strongly preferred; English optional depending on audience.

---

## 9. Non-functional requirements

- **Accuracy:** Clear disclaimer that the university’s systems are authoritative; tool output is advisory.
- **Performance:** Plan generation for typical catalog subsets completes within interactive tolerances (e.g. seconds to low minutes) or shows progress.
- **Privacy:** Minimal personal data; if accounts exist later, comply with applicable privacy law and university policy.
- **Accessibility:** Keyboard navigation, readable contrast, support for RTL layout.
- **Maintainability:** Rule sets and catalog separated from solver logic; configurable degrees.

---

## 10. Success metrics (product)

- Users can produce **at least one valid plan** without manual catalog cross-check for standard cases.
- Reduction in self-reported **schedule conflicts** and **confusion about credit buckets** (user surveys or interviews).
- **Catalog freshness** within an agreed SLA once a data pipeline exists.

---

*Requirements doc version: 1.1 — split from original combined spec. Aligned with student planning problem context in this repository. Full delivery planning: [PRODUCT_CONSIDERATIONS_AND_TASKS.md](PRODUCT_CONSIDERATIONS_AND_TASKS.md).*
