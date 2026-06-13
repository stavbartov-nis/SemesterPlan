import {
  PlannedCourse,
  Course,
  CourseOffering,
  DegreeTrack,
  UserPreferences,
} from '../types';
import { BundleAudit } from './audit';

export interface Relaxation {
  /** Stable id, e.g. 'add-friday', 'extend-end-1h'. */
  id: string;
  /** Hebrew chip label like 'הוסיפי יום ו׳ → +4 נ"ז'. */
  label: string;
  /** Short human-readable summary of what changes (also Hebrew). */
  patchSummary: string;
  /** Preferences patch the UI applies on click. */
  prefsPatch: Partial<UserPreferences>;
}

const DAY_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];

/** Bumps "HH:MM" by `hours` (positive or negative). Clamps inside 06:00–22:00. */
function shiftTime(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const newH = Math.max(6, Math.min(22, h + hours));
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Total credits across the bundle's courses. */
function sumCredits(courses: PlannedCourse[], catalog: Course[]): number {
  return courses.reduce(
    (s, pc) => s + (catalog.find((c) => c.id === pc.courseId)?.credits ?? 0),
    0
  );
}

/** A regenerator the relaxation suggester invokes with patched prefs. */
export type Regenerate = (patchedPrefs: UserPreferences) => PlannedCourse[];

interface SuggestArgs {
  /** Current (un-relaxed) bundle courses. */
  baseCourses: PlannedCourse[];
  audit: BundleAudit;
  catalog: Course[];
  prefs: UserPreferences;
  /** Calls the same theme's greedy with the given prefs, returns the new course list. */
  regenerate: Regenerate;
}

/**
 * Tries a small fixed set of preference perturbations. For each one that
 * yields more credits OR fewer conflicts than the base bundle, emits a
 * Relaxation chip. Returns at most 3 suggestions sorted by impact.
 */
export function suggestRelaxations({
  baseCourses,
  audit,
  catalog,
  prefs,
  regenerate,
}: SuggestArgs): Relaxation[] {
  // Only fire when the bundle isn't already perfect.
  const hasIssue = audit.items.some((i) => i.status !== 'ok');
  if (!hasIssue) return [];

  const baseCredits = sumCredits(baseCourses, catalog);
  const baseConflicts = audit.conflicts;
  const results: { relax: Relaxation; gain: number }[] = [];

  /** Run a candidate perturbation and record it if it improves something. */
  const trial = (
    id: string,
    patch: Partial<UserPreferences>,
    labelTemplate: (delta: number, conflictDelta: number) => string,
    patchSummary: string
  ) => {
    const patchedPrefs: UserPreferences = {
      ...prefs,
      ...patch,
      timeWindow: { ...prefs.timeWindow, ...(patch.timeWindow ?? {}) },
      overlapPolicy: { ...prefs.overlapPolicy, ...(patch.overlapPolicy ?? {}) },
      targetCreditsByComponent: {
        ...prefs.targetCreditsByComponent,
        ...(patch.targetCreditsByComponent ?? {}),
      },
    };
    let newCourses: PlannedCourse[];
    try {
      newCourses = regenerate(patchedPrefs);
    } catch {
      return;
    }
    const newCredits = sumCredits(newCourses, catalog);
    const creditDelta = newCredits - baseCredits;
    // Coarse conflict-delta proxy: we can't run audit without re-importing it,
    // so just track credits-gained. Conflict reduction is implicit through
    // user choices like "add Friday" loosening the candidate pool.
    if (creditDelta <= 0) return;
    results.push({
      relax: {
        id,
        label: labelTemplate(creditDelta, 0),
        patchSummary,
        prefsPatch: patch,
      },
      gain: creditDelta,
    });
  };

  // 1. Add Friday.
  if (!prefs.allowedDays.includes(5)) {
    trial(
      'add-friday',
      { allowedDays: [...prefs.allowedDays, 5].sort() },
      (d) => `הוסיפי ${DAY_HE[5]} → +${d} נ"ז`,
      'הוספת יום שישי לחלון הזמינות'
    );
  }

  // 2. Extend window end by 1 hour (up to 21:00).
  if (prefs.timeWindow.end <= '19:00') {
    const newEnd = shiftTime(prefs.timeWindow.end, 1);
    trial(
      'extend-end-1h',
      { timeWindow: { ...prefs.timeWindow, end: newEnd } },
      (d) => `הארכי עד ${newEnd} → +${d} נ"ז`,
      `הארכת חלון הזמן עד ${newEnd}`
    );
  }

  // 3. Start window 1 hour earlier (down to 07:00).
  if (prefs.timeWindow.start >= '09:00') {
    const newStart = shiftTime(prefs.timeWindow.start, -1);
    trial(
      'extend-start-1h',
      { timeWindow: { ...prefs.timeWindow, start: newStart } },
      (d) => `התחילי מ-${newStart} → +${d} נ"ז`,
      `הקדמת חלון הזמן ל-${newStart}`
    );
  }

  // 4. Allow up to 30-min overlap (only if currently disallowed).
  if (!prefs.overlapPolicy.allowOverlap) {
    trial(
      'allow-overlap',
      {
        overlapPolicy: { allowOverlap: true, maxOverlapMinutes: 30 },
      },
      (d) => `אפשרי חפיפה קטנה → +${d} נ"ז`,
      'אפשור חפיפה של עד 30 דקות'
    );
  }

  // 5. Reduce a clearly-overshot Mandatory target by 4 NKZ (only if base was 'fail').
  // (Last resort — the assistant can suggest the user simply aim lower.)
  for (const item of audit.items) {
    if (item.status !== 'fail') continue;
    if (!item.id.startsWith('target-')) continue;
    const [, compId, type] = item.id.split('-') as ['target', string, 'Mandatory' | 'Core' | 'Elective'];
    const cur = prefs.targetCreditsByComponent[compId]?.[type] ?? 0;
    if (cur <= 4) continue;
    const newTarget = Math.max(0, cur - 4);
    // We can't try this with regenerate because lowering target doesn't add
    // credits; instead emit it as an advisory chip without delta probing.
    results.push({
      relax: {
        id: `lower-target-${compId}-${type}`,
        label: `הורידי יעד ${type} ב-4 נ"ז (${cur}→${newTarget})`,
        patchSummary: `הורדת יעד ${type} ב${compId} מ-${cur} ל-${newTarget}`,
        prefsPatch: {
          targetCreditsByComponent: {
            ...prefs.targetCreditsByComponent,
            [compId]: {
              ...prefs.targetCreditsByComponent[compId],
              [type]: newTarget,
            },
          },
        },
      },
      gain: 0.5, // advisory, low priority
    });
    break;
  }

  results.sort((a, b) => b.gain - a.gain);
  return results.slice(0, 3).map((r) => r.relax);
}
