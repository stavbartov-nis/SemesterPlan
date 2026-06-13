import { describe, it, expect } from 'vitest';
import { suggestRelaxations } from './relaxation';
import { BundleAudit } from './audit';
import { Course, PlannedCourse, UserPreferences } from '../types';

const CATALOG: Course[] = [
  { id: 'M1', name: 'M1', credits: 4, department: 'X', prerequisites: [] },
  { id: 'F1', name: 'F1', credits: 4, department: 'X', prerequisites: [] }, // friday-only
];

const PREFS: UserPreferences = {
  allowedDays: [0, 1, 2, 3, 4], // no Friday
  timeWindow: { start: '08:00', end: '18:00' },
  overlapPolicy: { allowOverlap: false, maxOverlapMinutes: 0 },
  targetCreditsByComponent: { econ: { Mandatory: 8, Core: 0, Elective: 0 } },
};

const base: PlannedCourse[] = [
  { courseId: 'M1', isAnchor: false, selectedGroupIds: ['m1-L'] },
];

const failingAudit: BundleAudit = {
  conflicts: 0,
  items: [
    { id: 'target-econ-Mandatory', label: 'fail', status: 'fail' },
    { id: 'conflicts', label: 'ok', status: 'ok' },
  ],
};

describe('suggestRelaxations', () => {
  it('returns nothing when audit is all ok', () => {
    const noop: BundleAudit = { conflicts: 0, items: [{ id: 'x', label: 'ok', status: 'ok' }] };
    const out = suggestRelaxations({
      baseCourses: base, audit: noop, catalog: CATALOG, prefs: PREFS,
      regenerate: () => base,
    });
    expect(out).toHaveLength(0);
  });

  it('emits an "add Friday" suggestion when relaxing it raises credits', () => {
    const out = suggestRelaxations({
      baseCourses: base, audit: failingAudit, catalog: CATALOG, prefs: PREFS,
      // Pretend that allowing Friday lets us pick up F1.
      regenerate: (patched) => {
        if (patched.allowedDays.includes(5)) {
          return [...base, { courseId: 'F1', isAnchor: false, selectedGroupIds: ['f1-L'] }];
        }
        return base;
      },
    });
    const fridayItem = out.find(r => r.id === 'add-friday');
    expect(fridayItem).toBeDefined();
    expect(fridayItem!.label).toMatch(/\+4 נ"ז/);
  });

  it('caps at 3 results', () => {
    const out = suggestRelaxations({
      baseCourses: base, audit: failingAudit, catalog: CATALOG, prefs: PREFS,
      // Any patch yields +4 NKZ → all perturbations should "succeed".
      regenerate: () => [...base, { courseId: 'F1', isAnchor: false, selectedGroupIds: [] }],
    });
    expect(out.length).toBeLessThanOrEqual(3);
  });
});
