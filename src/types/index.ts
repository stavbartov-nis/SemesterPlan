/** 
 * Course metadata (Abstract) 
 */
export interface Course {
  id: string;        // 5-digit Shnaton code
  name: string;      // Official Hebrew name from the Shnaton API
  nameEn?: string;   // English name from the Shnaton API
  credits: number;   // NKZ
  department: string;
  prerequisites: string[]; // List of Course IDs
}

/** 
 * A course as it appears in a specific semester 
 */
export interface CourseOffering {
  courseId: string;
  semester: Semester;
  campus: Campus;
  groups: MeetingGroup[]; // e.g. "Lecture Group 1", "Lecture Group 2"
}

export type Semester = 'A' | 'B' | 'Annual' | 'Summer';
export type Campus = 'Safra' | 'MtScopus' | 'EinKerem' | 'Rehovot';

export interface MeetingGroup {
  id: string;
  /** Shnaton group code like "1-01"; first number ties exercise sections to their lecture section. */
  code?: string | null;
  type: MeetingType;
  slots: ScheduleSlot[];
}

export type MeetingType = 'Lecture' | 'Exercise' | 'Lab' | 'Seminar';

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
  type: 'Mandatory' | 'Core' | 'Elective';
  minCredits: number;
  courseIds: string[]; // Valid courses for this basket
}

export interface DegreeTrack {
  id: string;
  name: string;
  components: RequirementComponent[];
}

export interface RequirementComponent {
  name: string;     // e.g., "Economics Component"
  baskets: RequirementBasket[];
}

/**
 * User state for a planned semester
 */
export interface PlannedCourse {
  courseId: string;
  isAnchor: boolean;   // User-pinned; Planner cannot remove
  selectedGroupIds: string[]; // User-selected MeetingGroup IDs
}

export interface UserPreferences {
  allowedDays: number[]; // 0-5
  timeWindow: {
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
  };
  overlapPolicy: OverlapPolicy;
  targetCreditsByType: {
    Mandatory: number;
    Core: number;
    Elective: number;
  };
}

export type OverlapPolicy = {
  allowOverlap: boolean;
  maxOverlapMinutes: number;
};
