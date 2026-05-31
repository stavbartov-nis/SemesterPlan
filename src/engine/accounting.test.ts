import { describe, it, expect } from 'vitest';
import { calculateRequirementProgress } from './accounting';
import { MOCK_COURSES, MOCK_TRACKS } from '../data/huji-mock-catalog';

describe('calculateRequirementProgress', () => {
  const econTrack = MOCK_TRACKS.find(t => t.id === 'econ-2026')!;

  it('should calculate zero progress for an empty plan', () => {
    const report = calculateRequirementProgress([], [], econTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(0);
    expect(report.components[0].baskets[0].isMet).toBe(false);
  });

  it('should count credits for a single mandatory course (57107 Intro Micro = 4 credits)', () => {
    const report = calculateRequirementProgress(['57107'], [], econTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(4);
    const mand = report.components[0].baskets.find(b => b.basketId === 'econ_mand')!;
    expect(mand.currentCredits).toBe(4);
    expect(mand.isMet).toBe(false); // target is 20
  });

  it('should mark a basket as met when target credits are reached', () => {
    // Mandatory basket needs 20 credits total. Add 5 four-credit mandatory courses:
    // 57107, 57108, 57121, 57122, 57340 → 5 × 4 = 20.
    const ids = ['57107', '57108', '57121', '57122', '57340'];
    const report = calculateRequirementProgress(ids, [], econTrack, MOCK_COURSES);
    const mand = report.components[0].baskets.find(b => b.basketId === 'econ_mand')!;
    expect(mand.currentCredits).toBe(20);
    expect(mand.isMet).toBe(true);
  });

  it('should count history credits toward progress', () => {
    const report = calculateRequirementProgress([], ['57107'], econTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(4);
  });
});
