# HUJI Schedule Planner — Considerations, Tasks, and Open Questions

This document complements **[PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md)** (vision, functional requirements, catalog, UI, NFR, success metrics).

---

## 1. Things to consider

### 1.1 Academic and institutional

- **Double-counting:** Some courses may count toward core and another category; rules differ by degree.
- **Prerequisites and sequencing:** A plan that is schedule-valid may still be degree-invalid if prereqs are ignored.
- **Corequisites and overlapping degree components** (majors, minors, certificates).
- **Exam schedule (מועדים):** Not in basic timetable; high impact on feasibility — consider as future data source.
- **Waitlists, enrollment caps, and priority groups:** Not knowable from catalog alone.
- **Hebrew vs English sections, linked lectures/labs:** Section-level modeling complexity.
- **Changes mid-semester:** Catalog updates, strikes, room changes.

### 1.2 Technical and data

- **Source of truth:** Where catalog data lives; update frequency; legal permission to use/scrape.
- **Incomplete schedules:** Courses with “TBA” time break strict window constraints — need policy (exclude, or place tentatively with warning).
- **Solver complexity:** Core + electives + discrete sections is combinatorial; may need heuristics, integer programming, or constraint solvers.
- **Multi-semester planning:** State space grows quickly; clarify MVP (single semester vs multi-semester roadmap).
- **Localization:** RTL, Hebrew course names, mixed Hebrew/English codes.

### 1.3 UX and trust

- Students may **over-trust** automated plans; disclaimers and “verify with advisor” messaging matter.
- **Transparency:** Show why a course was picked and what remains unsatisfied if no solution exists.
- **No solution cases:** Explain minimally conflicting constraints (“no plan without overlap given only these electives”).

### 1.4 Product and operations

- Who **maintains** degree rule JSON (or equivalent) when curricula change?
- **Versioning** degree rules with academic year.
- **MVP scope:** One degree, one semester, no prereqs — vs broader launch.

---

## 2. Task breakdown

### Phase A — Discovery and specification

- [ ] Confirm MVP: single semester vs multi-semester; prereqs in or out of MVP.
- [ ] Map **one degree** (e.g. Business and Economics) to a **machine-readable rule file** with stakeholders or public documents.
- [ ] Identify **catalog data source**, format, update cadence, and legal constraints.
- [ ] Define **overlap policies** formally (with examples and edge cases).

### Phase B — Data layer

- [ ] Design **course schema** (IDs, credits, tags, schedule, semester).
- [ ] Design **degree schema** (mandatory lists, baskets, min credits, exclusions).
- [ ] Build **import pipeline** (parser, validation, versioning, “last updated” display).
- [ ] Seed **test fixtures** (small synthetic catalog + rules) for development.

### Phase C — Constraint engine

- [ ] Implement **credit accounting** per type (including double-count rules if applicable).
- [ ] Implement **calendar constraints** (days, windows, overlap policy).
- [ ] Implement **solver** (MVP: exhaustive/brute force on small sets; scale-up: OR-Tools / similar or custom heuristics).
- [ ] Implement **diversity** logic for multiple alternative plans.

### Phase D — Application UI

- [ ] Flow: degree → requirements → preferences → generate.
- [ ] **Plan comparison** view (calendar + credit summary side by side).
- [ ] **Warnings and explanations** surfaced per plan and per course.

### Phase E — Quality and launch prep

- [ ] Unit tests for rules engine and overlap detection.
- [ ] Integration tests on anonymized or public catalog samples.
- [ ] Performance profiling on realistic catalog size.
- [ ] Copy: **disclaimers**, help text, advisor recommendation.
- [ ] Optional: export (PDF/ICS), save/load user profile (local storage or account).

### Phase F — Post-MVP roadmap (backlog)

- [ ] Prerequisites and multi-semester roadmaps.
- [ ] Exam period load estimation.
- [ ] Workload tags (assignments intensity) if data exists.
- [ ] Advisor review workflow or official integration (if ever feasible).

---

## 3. Open questions

- Exact **HUJI catalog** access method for production.
- Whether **section choice** is in MVP or courses are abstracted to “one representative time.”
- Whether users model **minors** and **double degrees** in v1.
- Target platform: **web app**, desktop, or mobile-first.

---

*Delivery / planning doc version: 1.1 — split from original combined spec.*
