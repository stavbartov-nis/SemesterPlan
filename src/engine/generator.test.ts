import { describe, it, expect } from 'vitest';
import { suggestBundles } from './generator';
import { MOCK_COURSES, MOCK_OFFERINGS, MOCK_TRACKS } from '../data/huji-mock-catalog';
import { UserPreferences } from '../types';

describe('suggestBundles', () => {
  const track = MOCK_TRACKS.find(t => t.id === 'be')!;
  const prefs: UserPreferences = {
    allowedDays: [0, 1, 2, 3, 4],
    timeWindow: { start: '08:00', end: '20:00' },
    overlapPolicy: { allowOverlap: false, maxOverlapMinutes: 0 },
    targetCreditsByType: { Mandatory: 12, Core: 8, Elective: 4 }
  };

  it('should suggest bundles starting from empty state', () => {
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, []);
    expect(bundles).toHaveLength(3);
    expect(bundles[0].name).toBe('Fastest Path');
    expect(bundles[1].name).toBe('Compact Schedule');
    expect(bundles[2].name).toBe('No Early Mornings');
    
    // Fastest Path should have some mandatory courses
    const fastestCourses = bundles[0].courses.map(c => c.courseId);
    expect(fastestCourses).toContain('57107'); // Micro I
    expect(fastestCourses).toContain('57121'); // Calc A
    expect(fastestCourses).toContain('123');   // Business Law (picked because it fits with Calc A)
  });

  it('should respect prerequisites', () => {
    // 57108 (Macro II) requires 57107 (Micro I)
    // If 57107 is not in history or anchors, 57108 should not be suggested
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, []);
    const suggestedIds = bundles[0].courses.map(c => c.courseId);
    expect(suggestedIds).not.toContain('57108');
  });

  it('should include prerequisites if they are in history', () => {
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, ['57107']);
    const suggestedIds = bundles[0].courses.map(c => c.courseId);
    expect(suggestedIds).toContain('57108');
  });

  it('should respect No Early Mornings preference', () => {
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, []);
    const noEarlyBundle = bundles.find(b => b.name === 'No Early Mornings')!;
    
    noEarlyBundle.courses.forEach(pc => {
      const offering = MOCK_OFFERINGS.find(o => o.courseId === pc.courseId)!;
      const group = offering.groups.find(g => g.id === pc.selectedGroupIds[0])!;
      group.slots.forEach(slot => {
        expect(slot.start >= '10:00').toBe(true);
      });
    });
  });
});
