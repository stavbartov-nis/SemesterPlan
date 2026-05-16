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

  // Actions
  setTrack: (track: DegreeTrack) => void;
  setPlannedCourses: (courses: PlannedCourse[]) => void;
  addPlannedCourse: (courseId: string) => void;
  removePlannedCourse: (courseId: string) => void;
  toggleAnchor: (courseId: string) => void;
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
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      plannedCourses: [],
      historyCourseIds: [],
      selectedTrack: null,
      preferences: DEFAULT_PREFERENCES,

      setTrack: (track) => set({ selectedTrack: track }),

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
    }
  )
);
