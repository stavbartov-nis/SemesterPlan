import { describe, it, expect } from 'vitest';
import { calculateRequirementProgress } from './accounting';
import { MOCK_COURSES, MOCK_TRACKS } from '../data/huji-mock-catalog';

describe('calculateRequirementProgress', () => {
  const econTrack = MOCK_TRACKS.find((t) => t.id === 'econ-2026')!;
  const coreBasketId = 'econ-2026_core';

  it('should calculate zero progress for an empty plan', () => {
    const report = calculateRequirementProgress([], [], econTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(0);
    expect(report.components[0].baskets[0].isMet).toBe(false);
  });

  it('should count credits for a single core course (57107 Intro Micro = 4 credits)', () => {
    const report = calculateRequirementProgress(['57107'], [], econTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(4);
    const core = report.components[0].baskets.find((b) => b.basketId === coreBasketId)!;
    expect(core.currentCredits).toBe(4);
    expect(core.isMet).toBe(false);
  });

  it('should add up multiple core courses', () => {
    const ids = ['57107', '57108', '57121', '57122', '57340'];
    const report = calculateRequirementProgress(ids, [], econTrack, MOCK_COURSES);
    const core = report.components[0].baskets.find((b) => b.basketId === coreBasketId)!;
    expect(core.currentCredits).toBe(20); // 5 × 4cr
  });

  it('should count history credits toward progress', () => {
    const report = calculateRequirementProgress([], ['57107'], econTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(4);
  });
});
