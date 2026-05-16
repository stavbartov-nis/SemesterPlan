# Technical Design: HUJI Schedule Planner

## 1. System Overview
The HUJI Schedule Planner is a client-side decision-support tool designed to help Hebrew University students build realistic semester schedules that satisfy complex degree requirements. The system reconciles "Legal" requirements (Degree Tracks) with "Realistic" constraints (Personal Availability).

## 2. Architecture
The application follows a **Modular Monolith** architecture on the frontend, separating state management, business logic (The Engine), and UI components.

### 2.1 Core Layers
1.  **UI Layer (React)**: Handles user interaction, drag-and-drop, and visualization of schedules/progress.
2.  **State Layer (Zustand)**: Orchestrates application state (User preferences, selected anchors, loaded catalog).
3.  **Engine Layer (Pure Logic)**: Stateless "Service" functions that perform heavy lifting: validation, accounting, and suggestion generation.
4.  **Data Layer (Mock/JSON)**: Provides static definitions for courses and degree tracks.

## 3. Implementation Folder Structure
```text
docs/                     # Project documentation
src/
├── api/                  # Types for data fetching
├── components/           # Functional React components
│   ├── builder/          # Sidebar inputs, Bundle cards
│   ├── layout/           # App shell and navigation
│   ├── roadmap/          # Visual degree flowchart
│   └── shared/           # Common UI elements
├── data/                 # Static JSON/TS catalog and tracks
├── engine/               # PURE business logic (No React/State)
│   ├── accounting.ts     # Credit and basket progress
│   ├── generator.ts      # Suggestion algorithms
│   └── validation.ts     # Schedule and prerequisite checks
├── store/                # Zustand store definitions
├── types/                # Central TypeScript interfaces
└── utils/                # Date/Time formatting and helpers
```

## 4. Component Responsibility Matrix

| Module | Responsibility | Primary Input | Primary Output |
| :--- | :--- | :--- | :--- |
| **Validation Engine** | Detect conflicts/prereq issues | `Course[]`, `History[]` | `Warning[]`, `ConflictReport` |
| **Accounting Engine** | Calculate credits per basket | `Course[]`, `DegreeTrack` | `ProgressReport` |
| **Generator Engine** | Suggest completion bundles | `Anchors[]`, `Catalog`, `Prefs` | `SuggestedBundle[]` |
| **Planner Store** | Maintain UI/User state | User Actions | `PlannerState` |

## 6. Language & Data Sourcing

### 6.1 UI Language Support
- **Constraint**: The application interface (buttons, labels, warnings, navigation) is **English-only**.
- **Data Support**: While the UI is English, the system must support Unicode in data fields to display official Hebrew course names (e.g., "אינפי 1") as provided by the university.

### 6.2 Data Sourcing (Shnaton Aligned)
The system's data architecture is specifically designed to consume data fields available at [https://shnaton.huji.ac.il/](https://shnaton.huji.ac.il/). 
- **Mapping**: The `DOMAIN_MODEL.md` mappings (Credits, Semesters, Meeting Groups, etc.) directly correspond to the tables and fields found in the Shnaton catalog.
