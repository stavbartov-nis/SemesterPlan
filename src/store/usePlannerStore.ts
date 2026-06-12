import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  PlannedCourse, 
  DegreeTrack, 
  UserPreferences, 
  Semester,
  OverlapPolicy
} from '../types';

interface PlannerState {
  // Data
  plannedCourses: PlannedCourse[];
  historyCourseIds: string[];
  selectedTrack: DegreeTrack | null;
  preferences: UserPreferences;
  /** Semester being planned. Annual courses are available in both. */
  targetSemester: 'A' | 'B';

  // Actions
  setTrack: (track: DegreeTrack) => void;
  setTargetSemester: (semester: 'A' | 'B') => void;
  setPlannedCourses: (courses: PlannedCourse[]) => void;
  addPlannedCourse: (courseId: string) => void;
  removePlannedCourse: (courseId: string) => void;
  toggleAnchor: (courseId: string) => void;
  addAnchor: (courseId: string) => void;
  updateSelectedGroups: (courseId: string, groupIds: string[]) => void;
  setPreferences: (prefs: UserPreferences) => void;
  addToHistory: (courseId: string) => void;
  removeFromHistory: (courseId: string) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  allowedDays: [0, 1, 2, 3, 4], // Sun-Thu
  timeWindow: {
    start: '08:00',
    end: '20:00',
  },
  overlapPolicy: {
    allowOverlap: false,
    maxOverlapMinutes: 0,
  },
  targetCreditsByType: {
    Mandatory: 12,
    Core: 8,
    Elective: 4,
  },
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      plannedCourses: [],
      historyCourseIds: [],
      selectedTrack: null,
      preferences: DEFAULT_PREFERENCES,
      targetSemester: 'A',

      setTrack: (track) => set({ selectedTrack: track }),

      // Selected group IDs belong to the previous semester's offerings, so
      // switching semesters clears the plan (keeping anchors isn't safe
      // either — their group IDs differ per semester). History and
      // preferences survive.
      setTargetSemester: (targetSemester) => set((state) => ({
        targetSemester,
        plannedCourses: state.targetSemester === targetSemester ? state.plannedCourses : []
      })),

      setPlannedCourses: (plannedCourses) => set({ plannedCourses }),

      addPlannedCourse: (courseId) => set((state) => {
        if (state.plannedCourses.some(c => c.courseId === courseId)) return state;
        return {
          plannedCourses: [
            ...state.plannedCourses,
            { courseId, isAnchor: false, selectedGroupIds: [] }
          ]
        };
      }),

      removePlannedCourse: (courseId) => set((state) => ({
        plannedCourses: state.plannedCourses.filter(c => c.courseId !== courseId)
      })),

      toggleAnchor: (courseId) => set((state) => ({
        plannedCourses: state.plannedCourses.map(c =>
          c.courseId === courseId ? { ...c, isAnchor: !c.isAnchor } : c
        )
      })),

      addAnchor: (courseId) => set((state) => {
        const existing = state.plannedCourses.find(c => c.courseId === courseId);
        if (existing) {
          return {
            plannedCourses: state.plannedCourses.map(c =>
              c.courseId === courseId ? { ...c, isAnchor: true } : c
            )
          };
        }
        return {
          plannedCourses: [
            ...state.plannedCourses,
            { courseId, isAnchor: true, selectedGroupIds: [] }
          ]
        };
      }),

      updateSelectedGroups: (courseId, groupIds) => set((state) => ({
        plannedCourses: state.plannedCourses.map(c => 
          c.courseId === courseId ? { ...c, selectedGroupIds: groupIds } : c
        )
      })),

      setPreferences: (preferences) => set({ preferences }),

      addToHistory: (courseId) => set((state) => {
        if (state.historyCourseIds.includes(courseId)) return state;
        return { historyCourseIds: [...state.historyCourseIds, courseId] };
      }),

      removeFromHistory: (courseId) => set((state) => ({
        historyCourseIds: state.historyCourseIds.filter(id => id !== courseId)
      })),
    }),
    {
      name: 'huji-planner-storage',
      version: 4,
      // selectedTrack is NOT persisted: track definitions (baskets, credit
      // minimums, exclusions) live in code and must always come from the
      // current build — a persisted copy kept serving stale requirements
      // after deploys. App re-selects the track on load.
      partialize: (state) => ({
        plannedCourses: state.plannedCourses,
        historyCourseIds: state.historyCourseIds,
        preferences: state.preferences,
        targetSemester: state.targetSemester,
      }),
      // Migrations chain: a v0 state must pass through every later step,
      // otherwise old states skip newer resets.
      migrate: (persistedState: any, version: number) => {
        let state = persistedState;
        if (version <= 0) {
          state = {
            ...state,
            preferences: {
              ...state.preferences,
              targetCreditsByType: DEFAULT_PREFERENCES.targetCreditsByType
            }
          };
        }
        if (version <= 1) {
          // Reset selectedTrack so the new combined track is picked up
          state = { ...state, selectedTrack: null };
        }
        if (version <= 2) {
          // Catalog regenerated with per-semester offerings: old selected
          // group IDs and track baskets may no longer exist. Reset plan and
          // track, keep history and preferences.
          state = {
            ...state,
            targetSemester: 'A',
            plannedCourses: [],
            selectedTrack: null
          };
        }
        if (version <= 3) {
          // selectedTrack is no longer persisted (see partialize); drop any
          // stale copy so the current build's track always loads.
          const { selectedTrack: _dropped, ...rest } = state;
          state = rest;
        }
        return state;
      }
    }
  )
);
