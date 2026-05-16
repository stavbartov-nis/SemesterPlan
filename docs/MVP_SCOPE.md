# MVP Scope: HUJI Schedule Planner

## 1. Included in MVP

### 1.1 Core Engine
- Schedule conflict detection (Overlap check).
- Prerequisite validation for planned courses.
- Credit accounting per degree basket.
- Hybrid "Anchor + Suggest" suggestion algorithm.

### 1.2 User Interface
- **Roadmap View**: Drag-and-drop course catalog organized by year/semester.
- **Semester Builder**: 3-column dashboard (Input | Sandbox | Analysis).
- **Interactive Calendar**: Visual density map of the planned week.
- **Validation Panel**: List of errors (Conflicts) and warnings (Missing prereqs).

### 1.3 Data & Configuration
- Support for **English UI** with **Hebrew course names**.
- Mock data for 30–50 HUJI courses.
- Support for **Joint Degree** logic (Business + Economics).

---

## 2. Excluded from MVP (Post-MVP)
- **GPA Simulation**: Calculating how potential grades affect the average.
- **Multi-Semester Auto-Solver**: Generating a 3-year plan in one click.
- **Exam Schedule Integration**: Checking for exam clustering.
- **Personal Calendar Sync**: Exporting to Google/Outlook.
- **User Accounts**: Syncing data between devices (Local Storage only in MVP).
- **Official Registrar Integration**: No direct login to university systems.

---

## 3. Testing Strategy
- **Unit Tests (Vitest)**: Exhaustive testing of the Planner Engine (Validation, Accounting, Suggestions).
- **Mock Scenarios**: Pre-defined test cases for CS, Economics, and Business tracks.
- **UI Acceptance**: Manual verification of the 3-column dashboard flow.
