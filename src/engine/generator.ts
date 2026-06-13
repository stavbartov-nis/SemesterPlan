import { 
  PlannedCourse, 
  Course, 
  CourseOffering, 
  RequirementBasket, 
  UserPreferences,
  DegreeTrack,
  MeetingGroup
} from '../types';

export interface SuggestedBundle {
  id: string;
  name: string;
  courses: PlannedCourse[];
  rationale: string;
  totalCredits: number;
}

/**
 * Generates alternative course bundles based on user anchors and requirements.
 */
export function suggestBundles(
  anchors: PlannedCourse[],
  catalog: Course[],
  offerings: CourseOffering[],
  track: DegreeTrack,
  prefs: UserPreferences,
  historyIds: string[],
  excludedIds: string[] = [],
  freePickIds: string[] = []
): SuggestedBundle[] {
  const bundles: SuggestedBundle[] = [];

  // 1. Fastest Path: Prioritize Mandatory/Core and high credits
  bundles.push(generateBundle(
    "fastest-path",
    "המסלול המהיר",
    "נותן עדיפות לנקודות זכות ולקורסי חובה וליבה כדי להאיץ את סיום התואר.",
    anchors, catalog, offerings, track, prefs, historyIds, excludedIds, freePickIds,
    (a, b) => {
      const typePriority = { 'Mandatory': 0, 'Core': 1, 'Elective': 2 };
      if (typePriority[a.type] !== typePriority[b.type]) {
        return typePriority[a.type] - typePriority[b.type];
      }
      return b.course.credits - a.course.credits;
    }
  ));

  // 2. Compact Schedule: Group courses on fewest possible days
  bundles.push(generateBundle(
    "compact-schedule",
    "מערכת מרוכזת",
    "מרכז את הקורסים במספר הימים הקטן ביותר כדי לפנות לך זמן חופשי.",
    anchors, catalog, offerings, track, prefs, historyIds, excludedIds, freePickIds,
    (a, b) => {
      const typePriority = { 'Mandatory': 0, 'Core': 1, 'Elective': 2 };
      return typePriority[a.type] - typePriority[b.type];
    },
    // Prefer groups whose slots land on days the bundle already uses
    (bundleCourses) => {
      const occupiedDays = new Set<number>();
      bundleCourses.forEach(bc => {
        const off = offerings.find(o => o.courseId === bc.courseId);
        bc.selectedGroupIds.forEach(gid => {
          const g = off?.groups.find(group => group.id === gid);
          g?.slots.forEach(s => occupiedDays.add(s.day));
        });
      });
      return (a, b) => {
        const daysA = a.slots.filter(s => !occupiedDays.has(s.day)).length;
        const daysB = b.slots.filter(s => !occupiedDays.has(s.day)).length;
        return daysA - daysB;
      };
    }
  ));

  // 3. No Early Mornings: avoids slots before 10:00 and leans toward
  // afternoon groups, so its schedule visibly differs from the others.
  const noEarlyPrefs = {
    ...prefs,
    timeWindow: {
      ...prefs.timeWindow,
      start: prefs.timeWindow.start < "10:00" ? "10:00" : prefs.timeWindow.start
    }
  };
  bundles.push(generateBundle(
    "no-early-mornings",
    "בלי בקרים מוקדמים",
    "נמנע משיעורים שמתחילים לפני 10:00 ומעדיף קבוצות מאוחרות יותר ביום.",
    anchors, catalog, offerings, track, noEarlyPrefs, historyIds, excludedIds, freePickIds,
    (a, b) => {
      const typePriority = { 'Mandatory': 0, 'Core': 1, 'Elective': 2 };
      return typePriority[a.type] - typePriority[b.type];
    },
    // Prefer groups whose earliest slot starts latest in the day
    () => (a, b) => {
      const earliest = (g: MeetingGroup) =>
        g.slots.reduce((min, s) => (s.start < min ? s.start : min), '23:59');
      return earliest(b).localeCompare(earliest(a));
    }
  ));

  return bundles;
}

interface Candidate {
  course: Course;
  componentId: string;
  type: 'Mandatory' | 'Core' | 'Elective';
}

/** Builds a group comparator from the current bundle state, re-evaluated per course. */
type GroupRankFactory = (bundleCourses: PlannedCourse[]) => (a: MeetingGroup, b: MeetingGroup) => number;

/**
 * Registering for a course means taking one group of EACH meeting type it
 * offers (lecture + exercise/lab where they exist) — a lecture without its
 * tirgul is not a valid registration. Picks one mutually-compatible group
 * per type, or null if the set cannot be completed.
 *
 * `rank` optionally orders the candidates within each type (used by the
 * compact bundle to prefer already-occupied days).
 */
function findBestGroupSet(
  groups: MeetingGroup[],
  currentBundle: PlannedCourse[],
  offerings: CourseOffering[],
  prefs: UserPreferences,
  rank?: (a: MeetingGroup, b: MeetingGroup) => number
): MeetingGroup[] | null {
  // Lecture chosen first — it usually has the most alternatives and anchors
  // the rest of the set.
  const types = [...new Set(groups.map(g => g.type))]
    .sort((a, b) => (a === 'Lecture' ? -1 : b === 'Lecture' ? 1 : 0));

  const chosen: MeetingGroup[] = [];
  for (const type of types) {
    const candidates = groups.filter(g => g.type === type);
    if (rank) candidates.sort(rank);
    const valid = candidates.find(g =>
      isGroupValid(g, currentBundle, offerings, prefs) &&
      !chosen.some(c => groupsOverlap(g, c))
    );
    if (!valid) return null;
    chosen.push(valid);
  }
  return chosen.length ? chosen : null;
}

/**
 * Anchors arrive from the store with empty selectedGroupIds; without groups
 * they render no calendar events and are invisible to conflict checks.
 * Assign each group-less anchor a full valid group set up front.
 */
function scheduleAnchors(
  anchors: PlannedCourse[],
  offerings: CourseOffering[],
  prefs: UserPreferences
): PlannedCourse[] {
  const scheduled: PlannedCourse[] = [];
  for (const anchor of anchors) {
    if (anchor.selectedGroupIds.length > 0) {
      scheduled.push({ ...anchor });
      continue;
    }
    const offering = offerings.find(o => o.courseId === anchor.courseId);
    const set = offering && findBestGroupSet(offering.groups, scheduled, offerings, prefs);
    scheduled.push(set
      ? { ...anchor, selectedGroupIds: set.map(g => g.id) }
      : { ...anchor });
  }
  return scheduled;
}

function generateBundle(
  id: string,
  name: string,
  rationale: string,
  anchors: PlannedCourse[],
  catalog: Course[],
  offerings: CourseOffering[],
  track: DegreeTrack,
  prefs: UserPreferences,
  historyIds: string[],
  excludedIds: string[],
  freePickIds: string[],
  sortFn: (a: Candidate, b: Candidate) => number,
  groupRankFactory?: GroupRankFactory
): SuggestedBundle {
  let bundleCourses = scheduleAnchors(anchors, offerings, prefs);
  const candidates = getCandidates(catalog, track, historyIds, bundleCourses, excludedIds, freePickIds);
  candidates.sort(sortFn);

  // Credits tracked per (component, basket type) so each degree column has
  // its own semester target (e.g. כלכלה חובה vs מנהל עסקים חובה).
  const currentCredits: Record<string, number> = {};
  const creditKey = (componentId: string, type: string) => `${componentId}:${type}`;
  const targetFor = (componentId: string, type: Candidate['type']) =>
    prefs.targetCreditsByComponent[componentId]?.[type] ?? 0;

  bundleCourses.forEach(pc => {
    const course = catalog.find(c => c.id === pc.courseId);
    if (!course) return;
    const basket = getCourseBasket(course.id, track);
    if (basket) {
      const key = creditKey(basket.componentId, basket.type);
      currentCredits[key] = (currentCredits[key] ?? 0) + course.credits;
    }
  });

  for (const candidate of candidates) {
    // Guard against duplicates (e.g. a free pick appearing under multiple components)
    if (bundleCourses.some(bc => bc.courseId === candidate.course.id)) continue;

    const key = creditKey(candidate.componentId, candidate.type);
    if ((currentCredits[key] ?? 0) >= targetFor(candidate.componentId, candidate.type)) continue;

    const offering = offerings.find(o => o.courseId === candidate.course.id);
    if (!offering) continue;

    const rank = groupRankFactory?.(bundleCourses);
    const groupSet = findBestGroupSet(offering.groups, bundleCourses, offerings, prefs, rank);
    if (groupSet) {
      bundleCourses.push({
        courseId: candidate.course.id,
        isAnchor: false,
        selectedGroupIds: groupSet.map(g => g.id)
      });
      currentCredits[key] = (currentCredits[key] ?? 0) + candidate.course.credits;
    }

    // Limit bundle size for readability (cap at 8 instead of 6 to allow more credits)
    if (bundleCourses.length >= 8) break;
  }

  return {
    id,
    name,
    courses: bundleCourses,
    rationale,
    totalCredits: calculateTotalCredits(bundleCourses, catalog)
  };
}

function getCourseBasket(
  courseId: string,
  track: DegreeTrack
): { componentId: string; type: 'Mandatory' | 'Core' | 'Elective' } | undefined {
  for (const comp of track.components) {
    for (const basket of comp.baskets) {
      if (basket.courseIds.includes(courseId)) {
        return { componentId: comp.id, type: basket.type };
      }
    }
  }
  return undefined;
}

function getCandidates(
  catalog: Course[],
  track: DegreeTrack,
  historyIds: string[],
  currentBundle: PlannedCourse[],
  excludedIds: string[] = [],
  freePickIds: string[] = []
): Candidate[] {
  const candidates: Candidate[] = [];
  const currentIds = currentBundle.map(c => c.courseId);
  const trackCourseIds = new Set(
    track.components.flatMap(c => c.baskets.flatMap(b => b.courseIds))
  );

  track.components.forEach(comp => {
    comp.baskets.forEach(basket => {
      basket.courseIds.forEach(courseId => {
        if (historyIds.includes(courseId) || currentIds.includes(courseId)) return;
        if (excludedIds.includes(courseId)) return;

        const course = catalog.find(c => c.id === courseId);
        if (!course) return;

        const prereqsMet = course.prerequisites.every(p =>
          historyIds.includes(p) || currentIds.includes(p)
        );
        if (!prereqsMet) return;

        candidates.push({ course, componentId: comp.id, type: basket.type });
      });
    });
  });

  // Free picks: courses outside the track, added as Elective under each component.
  // OR-semantics for prereqs (user explicitly requested them).
  freePickIds.forEach(courseId => {
    if (historyIds.includes(courseId) || currentIds.includes(courseId)) return;
    if (excludedIds.includes(courseId)) return;
    if (trackCourseIds.has(courseId)) return; // already represented above
    const course = catalog.find(c => c.id === courseId);
    if (!course) return;
    const prereqsMet =
      course.prerequisites.length === 0 ||
      course.prerequisites.some(p => historyIds.includes(p) || currentIds.includes(p));
    if (!prereqsMet) return;
    track.components.forEach(comp => {
      candidates.push({ course, componentId: comp.id, type: 'Elective' });
    });
  });

  return candidates;
}

function isGroupValid(
  group: MeetingGroup,
  currentBundle: PlannedCourse[],
  offerings: CourseOffering[],
  prefs: UserPreferences
): boolean {
  // Rule 3: Preferences (Days and Time Window)
  const prefsOk = group.slots.every(slot => {
    const dayOk = prefs.allowedDays.includes(slot.day);
    const startOk = slot.start >= prefs.timeWindow.start;
    const endOk = slot.end <= prefs.timeWindow.end;
    return dayOk && startOk && endOk;
  });
  if (!prefsOk) return false;

  // Rule 4: Overlap
  if (!prefs.overlapPolicy.allowOverlap) {
    const hasConflict = currentBundle.some(bc => {
      const off = offerings.find(o => o.courseId === bc.courseId);
      return bc.selectedGroupIds.some(gid => {
        const otherGroup = off?.groups.find(g => g.id === gid);
        if (!otherGroup) return false;
        return groupsOverlap(group, otherGroup);
      });
    });
    if (hasConflict) return false;
  } else {
    // If overlap allowed, we could check maxOverlapMinutes, but for now we'll just allow it
    // (Simplification for this task, can be expanded if needed)
  }

  return true;
}

function groupsOverlap(g1: MeetingGroup, g2: MeetingGroup): boolean {
  return g1.slots.some(s1 => 
    g2.slots.some(s2 => {
      if (s1.day !== s2.day) return false;
      return s1.start < s2.end && s2.start < s1.end;
    })
  );
}

function calculateTotalCredits(planned: PlannedCourse[], catalog: Course[]): number {
  return planned.reduce((sum, pc) => {
    const course = catalog.find(c => c.id === pc.courseId);
    return sum + (course?.credits || 0);
  }, 0);
}
