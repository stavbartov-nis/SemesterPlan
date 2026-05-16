import { describe, it, expect } from 'vitest';
import { calculateRequirementProgress } from './accounting';
import { MOCK_COURSES, MOCK_TRACKS } from '../data/huji-mock-catalog';

describe('calculateRequirementProgress', () => {
  const econBusTrack = MOCK_TRACKS.find(t => t.id === 'be')!;

  it('should calculate zero progress for an empty plan', () => {
    const report = calculateRequirementProgress([], [], econBusTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(0);
    expect(report.components[0].baskets[0].isMet).toBe(false);
  });

  it('should calculate progress correctly for Econ Micro I', () => {
    const report = calculateRequirementProgress(['57107'], [], econBusTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(4);
    expect(report.components[0].name).toBe('Economics Component');
    expect(report.components[0].baskets[0].currentCredits).toBe(4);
    expect(report.components[0].baskets[0].isMet).toBe(false); // Target is 28
  });

  it('should mark requirement as met when target is reached', () => {
    // Business Mandatory only needs 4 credits (304)
    const report = calculateRequirementProgress(['304'], [], econBusTrack, MOCK_COURSES);
    const busComp = report.components.find(c => c.name === 'Business Component')!;
    expect(busComp.baskets[0].isMet).toBe(true);
  });

  it('should handle joint progress (Economics and Business)', () => {
    const report = calculateRequirementProgress(['57107', '304'], [], econBusTrack, MOCK_COURSES);
    expect(report.totalCredits).toBe(8); // 4 (Econ) + 4 (Bus)
    
    const econComp = report.components.find(c => c.name === 'Economics Component')!;
    const busComp = report.components.find(c => c.name === 'Business Component')!;
    
    expect(econComp.baskets[0].currentCredits).toBe(4);
    expect(busComp.baskets[0].currentCredits).toBe(4);
    expect(busComp.baskets[0].isMet).toBe(true); // Target is 4
  });
});
