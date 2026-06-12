import { describe, it, expect } from 'vitest';
import { validateScheduleConflicts } from './validation';
import { getOfferingsForSemester } from '../data/huji-mock-catalog';
import { PlannedCourse } from '../types';

describe('validateScheduleConflicts', () => {
  // The app always validates against one semester's offerings.
  const MOCK_OFFERINGS = getOfferingsForSemester('A');
  it('should detect no conflicts for an empty plan', () => {
    const report = validateScheduleConflicts([], MOCK_OFFERINGS);
    expect(report.conflicts).toHaveLength(0);
  });

  it('should detect a conflict between Econometrics (7411) and Math A (10321) on Sunday 14:30-16:00', () => {
    // 57322 group 7411 lecture: Sun 14:30-16:00, Thu 12:30-14:00
    // 57121 group 10321 exercise: Sun 14:30-16:00 — overlaps Sunday
    const planned: PlannedCourse[] = [
      { courseId: '57322', isAnchor: true,  selectedGroupIds: ['7411'] },
      { courseId: '57121', isAnchor: false, selectedGroupIds: ['10321'] },
    ];

    const report = validateScheduleConflicts(planned, MOCK_OFFERINGS);
    expect(report.conflicts.length).toBeGreaterThan(0);
    const conflict = report.conflicts.find(c => c.day === 0);
    expect(conflict).toBeDefined();
  });

  it('should detect no conflict between non-overlapping groups', () => {
    // 57107 group 4440 exercise: Sun 10:30-12:00, Wed 12:30-14:00
    // 57121 group 8568 lecture:  Wed 14:30-16:00, Tue 14:30-16:00
    // No overlap on any shared day.
    const planned: PlannedCourse[] = [
      { courseId: '57107', isAnchor: true,  selectedGroupIds: ['4440'] },
      { courseId: '57121', isAnchor: false, selectedGroupIds: ['8568'] },
    ];

    const report = validateScheduleConflicts(planned, MOCK_OFFERINGS);
    expect(report.conflicts).toHaveLength(0);
  });
});
