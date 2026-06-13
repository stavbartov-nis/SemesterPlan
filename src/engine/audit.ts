import {
  PlannedCourse,
  Course,
  CourseOffering,
  DegreeTrack,
  UserPreferences,
} from '../types';
import { calculateRequirementProgress } from './accounting';
import { validateScheduleConflicts } from './validation';

export type ReportStatus = 'ok' | 'warn' | 'fail';

export interface BundleReportItem {
  /** Stable id, e.g. 'target-econ-Mandatory', 'conflicts', 'days-window', 'anchors', 'excluded'. */
  id: string;
  /** Hebrew label shown on the chip. */
  label: string;
  status: ReportStatus;
  /** Tooltip detail, also Hebrew. */
  detail?: string;
}

export interface BundleAudit {
  items: BundleReportItem[];
  conflicts: number;
}

const TYPE_HE: Record<string, string> = {
  Mandatory: 'חובה',
  Core: 'ליבה',
  Elective: 'בחירה',
};

const COMPONENT_HE: Record<string, string> = {
  econ: 'כלכלה',
  biz: 'מנע"ס',
  cornerstones: 'אבני פינה',
};

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];

/**
 * Pure audit: given a bundle's courses, evaluate every rule the user set
 * (credit targets per component/type, schedule conflicts, day/time window,
 * anchor coverage, excluded courses) and return one chip per rule.
 */
export function auditBundle(
  courses: PlannedCourse[],
  anchors: PlannedCourse[],
  catalog: Course[],
  offerings: CourseOffering[],
  track: DegreeTrack,
  prefs: UserPreferences,
  historyIds: string[],
  excludedIds: string[]
): BundleAudit {
  const items: BundleReportItem[] = [];

  // ─── 1. Credit targets per (component, type) ─────────────────────────────
  const progress = calculateRequirementProgress(
    courses.map((c) => c.courseId),
    historyIds,
    track,
    catalog
  );
  // Build per-(component, type) totals from the bundle alone (not history).
  const bundleCredits: Record<string, number> = {};
  for (const pc of courses) {
    const course = catalog.find((c) => c.id === pc.courseId);
    if (!course) continue;
    for (const comp of track.components) {
      for (const basket of comp.baskets) {
        if (basket.courseIds.includes(course.id)) {
          const key = `${comp.id}:${basket.type}`;
          bundleCredits[key] = (bundleCredits[key] ?? 0) + course.credits;
        }
      }
    }
  }
  for (const [compId, byType] of Object.entries(prefs.targetCreditsByComponent)) {
    for (const [type, target] of Object.entries(byType) as [
      'Mandatory' | 'Core' | 'Elective',
      number
    ][]) {
      if (target <= 0) continue;
      const current = bundleCredits[`${compId}:${type}`] ?? 0;
      const ratio = target === 0 ? 1 : current / target;
      const status: ReportStatus = ratio >= 1 ? 'ok' : ratio >= 0.5 ? 'warn' : 'fail';
      const compName = COMPONENT_HE[compId] ?? compId;
      const typeName = TYPE_HE[type] ?? type;
      items.push({
        id: `target-${compId}-${type}`,
        label: `${compName} ${typeName} ${current}/${target}`,
        status,
        detail:
          status === 'ok'
            ? `יעד הושג: ${current} נ"ז ${typeName} ב${compName}`
            : `חסר ${target - current} נ"ז ${typeName} ב${compName}`,
      });
    }
  }

  // ─── 2. Schedule conflicts ───────────────────────────────────────────────
  const conflictReport = validateScheduleConflicts(courses, offerings);
  const conflictCount = conflictReport.conflicts.length;
  const conflictStatus: ReportStatus =
    conflictCount === 0 ? 'ok' : conflictCount === 1 ? 'warn' : 'fail';
  items.push({
    id: 'conflicts',
    label:
      conflictCount === 0
        ? 'אין התנגשויות'
        : conflictCount === 1
        ? 'התנגשות אחת'
        : `${conflictCount} התנגשויות`,
    status: conflictStatus,
    detail:
      conflictCount === 0
        ? 'לא נמצאו חפיפות בלוח'
        : conflictReport.conflicts
            .map(
              (c) =>
                `יום ${DAY_NAMES[c.day]}: ${c.courseIdA} ↔ ${c.courseIdB} (${c.start}–${c.end})`
            )
            .join(' · '),
  });

  // ─── 3. Days & time window adherence ─────────────────────────────────────
  const allowed = new Set(prefs.allowedDays);
  const winStart = prefs.timeWindow.start;
  const winEnd = prefs.timeWindow.end;
  const violations: string[] = [];
  for (const pc of courses) {
    const offering = offerings.find((o) => o.courseId === pc.courseId);
    if (!offering) continue;
    for (const gid of pc.selectedGroupIds) {
      const group = offering.groups.find((g) => g.id === gid);
      if (!group) continue;
      for (const slot of group.slots) {
        if (!allowed.has(slot.day)) {
          violations.push(`${pc.courseId} ב${DAY_NAMES[slot.day]} (יום לא פנוי)`);
        } else if (slot.start < winStart || slot.end > winEnd) {
          violations.push(`${pc.courseId} ${slot.start}–${slot.end} (מחוץ לחלון)`);
        }
      }
    }
  }
  const dayItem: BundleReportItem =
    violations.length === 0
      ? {
          id: 'days-window',
          label: 'בתוך חלון הזמן והימים',
          status: 'ok',
          detail: `${prefs.allowedDays.map((d) => DAY_NAMES[d]).join(', ')} · ${winStart}–${winEnd}`,
        }
      : {
          id: 'days-window',
          label: `${violations.length} חריגות מחלון`,
          status: 'fail',
          detail: violations.join(' · '),
        };
  items.push(dayItem);

  // ─── 4. Anchor coverage ──────────────────────────────────────────────────
  const courseIds = new Set(courses.map((c) => c.courseId));
  const missingAnchors = anchors
    .filter((a) => !courseIds.has(a.courseId))
    .map((a) => a.courseId);
  if (anchors.length > 0) {
    items.push(
      missingAnchors.length === 0
        ? {
            id: 'anchors',
            label: `כל ${anchors.length} הקורסים הנעולים מוכלים`,
            status: 'ok',
          }
        : {
            id: 'anchors',
            label: `${missingAnchors.length} נעולים חסרים`,
            status: 'fail',
            detail: `קורסים נעולים שלא שובצו: ${missingAnchors.join(', ')}`,
          }
    );
  }

  // ─── 5. Excluded courses leaked in ───────────────────────────────────────
  const leakedExcluded = courses.filter((c) => excludedIds.includes(c.courseId));
  if (leakedExcluded.length > 0) {
    items.push({
      id: 'excluded',
      label: `${leakedExcluded.length} קורסים מוחרגים בתוכנית`,
      status: 'fail',
      detail: `בודק שגיאה: ${leakedExcluded.map((c) => c.courseId).join(', ')}`,
    });
  }

  return { items, conflicts: conflictCount };
}
