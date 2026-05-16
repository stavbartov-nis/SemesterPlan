# Data and Rules Design: HUJI Schedule Planner

## 1. Data Source Assumptions
Initially, the system assumes a **Static JSON Catalog**.
- **Format**: Courses are keyed by their 5-digit Shnaton code.
- **Updates**: Data is updated once per semester (snapshot-based).
- **Incompleteness**: If a course has no schedule data ("TBA"), the system flags it as "Schedule Unknown" but still counts it toward credit targets.

## 2. Mock Data Strategy
To verify the engine, we will create a `huji-mock-catalog.ts` containing 30–50 courses across Computer Science, Economics, and Business.

### 2.1 Mock Scenarios
- **Scenario A (CS)**: Includes deep prerequisite chains (Intro -> Data Structures -> Algorithms).
- **Scenario B (Joint Degree)**: Includes courses that appear in both Economics and Business baskets to test double-counting logic.
- **Scenario C (Conflict)**: Includes two mandatory courses with overlapping time slots to test the conflict detector.

## 3. Modeling Joint Degrees (Business & Economics)
The most complex part of HUJI degree planning is the joint program.

- **Component Modeling**: The system models Business and Economics as two separate `RequirementComponent` objects under one `DegreeTrack`.
- **Double Counting Rule**: 
    - If Course X is in `Econ_Basket_A` and `Bus_Basket_B`, its credits contribute to the `shortfall` calculation of BOTH components simultaneously.
    - **Implementation**: The Accounting Engine checks every basket in every component for a course ID.
- **Global Constraints**: The engine ensures that despite double-counting for *requirements*, the total credits toward the *degree* are calculated correctly (not double-counting for the absolute total).

## 4. Constraint Modeling

### 4.1 Hard Constraints (Validation Errors)
- **Time Overlap**: Two courses at the same time.
- **Prerequisite Missing**: Trying to take Course B without having taken Course A.
- **Duplicate Course**: Taking the same course code twice.

### 4.2 Soft Constraints (User Preferences)
- **Preferred Days**: "I don't want to study on Tuesdays."
- **Time Windows**: "No classes after 16:00."
- **Overlap Tolerance**: "I'm okay with 1 hour of overlap."

## 5. Storage
All user data (completed courses, anchors, preferences) is stored in **Local Storage** to ensure privacy and persistence without a backend in MVP.
