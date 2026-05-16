# Domain Model: HUJI Schedule Planner

> **Data Source Alignment**: This model is derived from the official data structure of the [HUJI Shnaton](https://shnaton.huji.ac.il/). Every interface below is mapped to specific fields available in the university's course catalog.

## 1. Core Entities

### 1.1 Course vs. Offering vs. Meeting
To handle HUJI's complex scheduling (where a course might have multiple lecture groups and exercise sections), we distinguish between the abstract course and its physical schedule.

- **Course**: The academic unit (e.g., "67101 - Intro to CS"). Contains metadata, credits, and rules.
- **Offering**: A specific instance of a course in a semester (e.g., "Intro to CS in Semester A").
- **Meeting**: A specific time/location slot (e.g., "Lecture Group 01" or "Exercise Section 05").

### 1.2 Degree Track & Requirements
Designed to support joint programs (e.g., Business + Economics).

- **DegreeTrack**: A container for multiple Requirement Components (e.g., "Business & Economics B.A.").
- **RequirementComponent**: A set of rules for a specific field (e.g., "Economics Major Requirements").
- **RequirementBasket**: A specific bucket of courses (e.g., "Economics Core" or "Business Electives").

---

## 2. Interface Sketches (TypeScript)

```typescript
/** 
 * Course metadata (Abstract) 
 */
export interface Course {
  id: string;        // 5-digit Shnaton code
  name: string;      // Supports Unicode (Hebrew names)
  credits: number;   // NKZ
  department: string;
  prerequisites: string[]; // List of Course IDs
}

/** 
 * A course as it appears in a specific semester 
 */
export interface CourseOffering {
  courseId: string;
  semester: 'A' | 'B' | 'Annual' | 'Summer';
  campus: 'Safra' | 'MtScopus' | 'EinKerem' | 'Rehovot';
  groups: MeetingGroup[]; // e.g. "Lecture Group 1", "Lecture Group 2"
}

export interface MeetingGroup {
  id: string;
  type: 'Lecture' | 'Exercise' | 'Lab' | 'Seminar';
  slots: ScheduleSlot[];
}

export interface ScheduleSlot {
  day: 0 | 1 | 2 | 3 | 4 | 5; // Sun-Fri
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

/**
 * Degree Structure
 */
export interface RequirementBasket {
  id: string;
  name: string;       // e.g., "Core Mandatory"
  minCredits: number;
  courseIds: string[]; // Valid courses for this basket
}

export interface DegreeTrack {
  id: string;
  name: string;
  components: {
    name: string;     // e.g., "Economics Component"
    baskets: RequirementBasket[];
  }[];
}

/**
 * User state for a planned semester
 */
export interface PlannedCourse {
  courseId: string;
  isAnchor: boolean;   // User-pinned; Planner cannot remove
  selectedGroupIds: string[]; // User-selected MeetingGroup IDs
}
```

## 3. Example Data
```json
{
  "id": "67101",
  "name": "Introduction to Computer Science",
  "credits": 7,
  "prerequisites": [],
  "offering": {
    "semester": "A",
    "groups": [
      {
        "id": "L1",
        "type": "Lecture",
        "slots": [{"day": 1, "start": "10:00", "end": "13:00"}]
      },
      {
        "id": "E1",
        "type": "Exercise",
        "slots": [{"day": 3, "start": "10:00", "end": "12:00"}]
      }
    ]
  }
}
```
