# GEMINI.md: HUJI Degree-Aware Schedule Planner

This document provides foundational instructions, architectural patterns, and development workflows for the HUJI Schedule Planner project.

## Project Identity & Vision
The HUJI Schedule Planner is a client-side decision-support tool for Hebrew University students. It reconciles complex degree requirements (Legal) with personal availability (Realistic).

- **Core Goal**: Generate valid academic plans that satisfy degree credits while respecting user constraints.
- **Authoritative Source**: All data must align with the official [HUJI Shnaton](https://shnaton.huji.ac.il/).

## Architectural Principles

### Modular Monolith (Frontend)
The project is organized into distinct layers to ensure separation of concerns:
1.  **UI Layer (React)**: Interactive components (`src/components`).
2.  **State Layer (Zustand)**: Application state orchestration (`src/store`).
3.  **Engine Layer (Pure Logic)**: Stateless "Service" functions for validation, accounting, and generation (`src/engine`). **CRITICAL: Keep this layer pure and side-effect free.**
4.  **Data Layer**: Static definitions for courses and degree tracks (`src/data`).

### Logic Separation
- **Validation**: Hard constraints (Conflicts, Prerequisites).
- **Accounting**: Credit and basket progress tracking.
- **Generator**: Suggestion algorithms using the "Anchor + Suggest" pattern.

## Engineering Standards & Conventions

### 1. Language & Localization
- **Interface**: The UI (buttons, labels, navigation) is **English-only**.
- **Data**: Course names and descriptions are in **Hebrew** (Unicode). Ensure all components handle RTL text correctly within the LTR English shell.

### 2. Implementation Guidelines
- **Pure Functions**: Business logic in `src/engine` must be pure. They take data as input and return reports/suggestions without modifying state or making API calls.
- **Surgical Updates**: When modifying existing logic, prioritize precision. Do not refactor unrelated code.
- **Type Safety**: Use the central TypeScript interfaces defined in `src/types`. Avoid `any` or loose typing.
- **Persistence**: User state is stored in **Local Storage** for the MVP. No backend or user accounts.

### 3. Testing Strategy
- **Engine Testing**: All logic in `src/engine` MUST be covered by unit tests (Vitest).
- **Mock Scenarios**: Use `huji-mock-catalog.ts` for consistent testing across CS, Economics, and Business scenarios.
- **Validation**: Run `npm run test` (or equivalent) after any change to the engine or data structures.

## Domain Model Key Concepts
- **Course**: Abstract academic unit.
- **Offering**: Course instance in a specific semester.
- **Meeting**: Physical slot (Lecture/Exercise).
- **DegreeTrack**: Container for requirements, supporting joint programs (e.g., Business + Economics).
- **RequirementBasket**: Specific credit bucket (Core, Elective, Mandatory).

## Development Workflow
1.  **Research**: Validate against `docs/DOMAIN_MODEL.md` and `docs/TECHNICAL_DESIGN.md`.
2.  **Strategy**: Ensure changes fit the "Anchor + Suggest" engine philosophy.
3.  **Execution**: Implement with tests. Update `src/data` if new mock scenarios are needed.
4.  **Validation**: Verify joint-degree logic (double-counting) remains intact.

## Key Files
- `docs/MVP_SCOPE.md`: Current feature set.
- `docs/PLANNER_ENGINE_DESIGN.md`: Deep dive into logic.
- `src/types/index.ts`: Source of truth for domain entities.
