import { describe, it, expect } from 'vitest';
import { validateScheduleConflicts } from './validation';
import { MOCK_OFFERINGS } from '../data/huji-mock-catalog';
import { PlannedCourse } from '../types';

describe('validateScheduleConflicts', () => {
  it('should detect no conflicts for an empty plan', () => {
    const report = validateScheduleConflicts([], MOCK_OFFERINGS);
    expect(report.conflicts).toHaveLength(0);
  });

  it('should detect a conflict between Intro to CS and Marketing', () => {
    const planned: PlannedCourse[] = [
      {
        courseId: '67101',
        isAnchor: true,
        selectedGroupIds: ['L1'], // Mon 10:00-13:00
      },
      {
        courseId: '112',
        isAnchor: false,
        selectedGroupIds: ['L1'], // Mon 10:00-13:00
      },
    ];

    const report = validateScheduleConflicts(planned, MOCK_OFFERINGS);
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].courseIdA).toBe('67101');
    expect(report.conflicts[0].courseIdB).toBe('112');
    expect(report.conflicts[0].day).toBe(1);
  });

  it('should detect no conflict between Intro to CS and Micro I (L1)', () => {
    const planned: PlannedCourse[] = [
      {
        courseId: '67101',
        isAnchor: true,
        selectedGroupIds: ['L1'], // Mon 10:00-13:00
      },
      {
        courseId: '57107',
        isAnchor: false,
        selectedGroupIds: ['L1'], // Sun/Tue 10:00-12:00
      },
    ];

    const report = validateScheduleConflicts(planned, MOCK_OFFERINGS);
    expect(report.conflicts).toHaveLength(0);
  });
});
