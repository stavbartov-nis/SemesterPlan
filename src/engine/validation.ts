import { PlannedCourse, CourseOffering, ScheduleSlot } from '../types';

export interface Conflict {
  courseIdA: string;
  courseIdB: string;
  day: number;
  timeRange: string;
}

export interface ConflictReport {
  conflicts: Conflict[];
}

/**
 * Validates schedule conflicts between planned courses.
 */
export function validateScheduleConflicts(
  plannedCourses: PlannedCourse[],
  offerings: CourseOffering[]
): ConflictReport {
  const conflicts: Conflict[] = [];
  const slots: { courseId: string; slot: ScheduleSlot }[] = [];

  // Flatten all selected meeting group slots
  for (const planned of plannedCourses) {
    const offering = offerings.find((o) => o.courseId === planned.courseId);
    if (!offering) continue;

    for (const groupId of planned.selectedGroupIds) {
      const group = offering.groups.find((g) => g.id === groupId);
      if (!group) continue;

      for (const slot of group.slots) {
        slots.push({ courseId: planned.courseId, slot });
      }
    }
  }

  // Compare every pair of slots
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      if (a.courseId === b.courseId) continue; // Same course, same slot? (Shouldn't happen with unique group IDs but safety first)
      if (a.slot.day !== b.slot.day) continue;

      if (isOverlapping(a.slot, b.slot)) {
        conflicts.push({
          courseIdA: a.courseId,
          courseIdB: b.courseId,
          day: a.slot.day,
          timeRange: `${a.slot.start}-${a.slot.end} vs ${b.slot.start}-${b.slot.end}`,
        });
      }
    }
  }

  return { conflicts };
}

function isOverlapping(slotA: ScheduleSlot, slotB: ScheduleSlot): boolean {
  const startA = parseTime(slotA.start);
  const endA = parseTime(slotA.end);
  const startB = parseTime(slotB.start);
  const endB = parseTime(slotB.end);

  return startA < endB && startB < endA;
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
