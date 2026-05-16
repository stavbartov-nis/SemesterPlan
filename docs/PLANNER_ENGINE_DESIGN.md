# Planner Engine Design: HUJI Schedule Planner

## 1. Engine Philosophy
The Planner Engine consists of stateless, pure functions. It does not modify data but returns reports and suggestions based on inputs. It strictly separates **Validation** (Hard Constraints) from **Scoring/Suggestions** (Soft Constraints).

## 2. Validation Logic (Hard Constraints)

### 2.1 Schedule Conflicts
**Function**: `validateScheduleConflicts(courses: PlannedCourse[], catalog: CourseOffering[]): ConflictReport`
- **Input**: A list of planned courses and their full schedule data.
- **Responsibility**: Identify any two `ScheduleSlot` objects where `day` is identical and `[start, end]` intervals overlap.
- **Output**: An array of `Conflict` objects detailing the courses, meeting types, and overlapping time range.

### 2.2 Prerequisite Validation
**Function**: `validatePrerequisites(plannedIds: string[], historyIds: string[], catalog: Course[]): PrereqReport`
- **Input**: IDs of planned courses, IDs of completed courses, and course metadata.
- **Responsibility**: For each planned course, check if its `prerequisites` exist in `historyIds`.
- **Output**: Array of missing prerequisite IDs per planned course.

## 3. Requirement Accounting
**Function**: `calculateRequirementProgress(history: string[], planned: string[], track: DegreeTrack): ProgressReport`
- **Input**: Completed course IDs, planned course IDs, and the degree structure.
- **Responsibility**: Map each course ID to its corresponding `RequirementBasket`. Sum the `credits`.
- **Output**:
    - Credits per basket (Completed vs. Planned vs. Target).
    - Boolean: `isMet` for each basket.
    - List of `unfulfilledBaskets`.

## 4. Suggestion Algorithm (Pseudocode)

### 4.1 Hybrid "Anchor + Suggest" Flow
The engine builds suggestions *around* user-defined "Anchors."

```text
ALGORITHM SuggestBundles:
  INPUT: 
    anchors: PlannedCourse[], 
    catalog: CourseOffering[], 
    requirements: RequirementBasket[], 
    prefs: UserPreferences
    
  1. BASE_SET = anchors
  2. REMAINING_CREDITS = Calculate shortfall for each requirement basket
  3. CANDIDATES = Filter catalog by:
     - Course belongs to an unfulfilled basket
     - Course semester matches
     - Course slots fit within UserPreferences.timeWindow
     - Course slots do not overlap with BASE_SET (unless OverlapAllowed=true)
     
  4. BUNDLES = []
  5. REPEAT 3 TIMES (to generate alternatives):
     a. TEMP_SET = copy(BASE_SET)
     b. FOR EACH basket in shortfall:
        i.  PICK highest-priority candidate for this basket
        ii. IF candidate doesn't conflict with TEMP_SET:
            ADD candidate to TEMP_SET
     c. ADD TEMP_SET to BUNDLES
     
  6. RETURN BUNDLES
```

## 5. Explanation Model
Every suggested course must include a `Reason` field:
- **Mandatory**: "Required by your degree core."
- **Basket Filler**: "Completes your remaining [X] credits for [Basket Name]."
- **Schedule Fit**: "Fits your preference for no classes on [Day]."

## 6. Edge Cases & No-Solution Handling
- **No Solution**: If no combination of courses can meet the target without violating hard constraints, the engine returns the "Best Effort" plan and a `Reason`: "No plan found without schedule overlaps in the remaining core electives."
- **Empty Catalog**: Graceful return of empty bundle.
