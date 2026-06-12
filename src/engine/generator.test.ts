import { describe, it, expect } from 'vitest';
import { suggestBundles } from './generator';
import { MOCK_COURSES, MOCK_TRACKS, getOfferingsForSemester } from '../data/huji-mock-catalog';
import { UserPreferences } from '../types';

describe('suggestBundles', () => {
  const track = MOCK_TRACKS[0];
  // The app always plans one semester at a time; mirror that here.
  const MOCK_OFFERINGS = getOfferingsForSemester('A');
  const prefs: UserPreferences = {
    allowedDays: [0, 1, 2, 3, 4],
    timeWindow: { start: '08:00', end: '20:00' },
    overlapPolicy: { allowOverlap: false, maxOverlapMinutes: 0 },
    targetCreditsByType: { Mandatory: 12, Core: 8, Elective: 4 }
  };

  it('should return three named bundles', () => {
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, []);
    expect(bundles).toHaveLength(3);
    expect(bundles[0].name).toBe('המסלול המהיר');
    expect(bundles[1].name).toBe('מערכת מרוכזת');
    expect(bundles[2].name).toBe('בלי בקרים מוקדמים');
    // Bundle ids are slugs used as keys and must stay stable.
    expect(bundles.map(b => b.id)).toEqual(['fastest-path', 'compact-schedule', 'no-early-mornings']);
  });

  it('should include some mandatory Economics courses in Fastest Path', () => {
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, []);
    const fastestIds = bundles[0].courses.map(c => c.courseId);
    // Track lists 57107, 57108, 57121, 57122, 57340 as mandatory; at least one should be picked.
    const mandatoryIds = ['57107', '57108', '57121', '57122', '57340'];
    const picked = fastestIds.filter(id => mandatoryIds.includes(id));
    expect(picked.length).toBeGreaterThan(0);
  });

  it('should not suggest a course whose prerequisites are unmet', () => {
    // 57108 (Intro Macro B) requires 57107 (Intro Micro A). Without 57107 in
    // history or anchors, 57108 should not appear in Fastest Path.
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, []);
    const fastestIds = bundles[0].courses.map(c => c.courseId);
    expect(fastestIds).not.toContain('57108');
  });

  it('should respect No Early Mornings preference (no slots before 10:00)', () => {
    const bundles = suggestBundles([], MOCK_COURSES, MOCK_OFFERINGS, track, prefs, []);
    const noEarly = bundles.find(b => b.id === 'no-early-mornings')!;

    for (const pc of noEarly.courses) {
      const offering = MOCK_OFFERINGS.find(o => o.courseId === pc.courseId);
      if (!offering) continue;
      for (const gid of pc.selectedGroupIds) {
        const group = offering.groups.find(g => g.id === gid);
        if (!group) continue;
        for (const slot of group.slots) {
          expect(slot.start >= '10:00').toBe(true);
        }
      }
    }
  });
});

describe('anchor scheduling', () => {
  const track = MOCK_TRACKS[0];
  const offerings = getOfferingsForSemester('A');
  const prefs: UserPreferences = {
    allowedDays: [0, 1, 2, 3, 4],
    timeWindow: { start: '08:00', end: '20:00' },
    overlapPolicy: { allowOverlap: false, maxOverlapMinutes: 0 },
    targetCreditsByType: { Mandatory: 12, Core: 8, Elective: 4 }
  };

  it('assigns a meeting group to anchors that arrive without one', () => {
    // Store creates anchors with empty selectedGroupIds; without a group the
    // course renders no calendar events and is invisible to conflict checks.
    const anchors = [{ courseId: '57107', isAnchor: true, selectedGroupIds: [] }];
    const bundles = suggestBundles(anchors, MOCK_COURSES, offerings, track, prefs, []);
    for (const bundle of bundles) {
      const anchor = bundle.courses.find(c => c.courseId === '57107')!;
      expect(anchor.isAnchor).toBe(true);
      expect(anchor.selectedGroupIds.length).toBeGreaterThan(0);
    }
  });
});
