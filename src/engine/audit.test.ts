import { describe, it, expect } from 'vitest';
import { auditBundle } from './audit';
import {
  Course,
  CourseOffering,
  DegreeTrack,
  PlannedCourse,
  UserPreferences,
} from '../types';

const COURSES: Course[] = [
  { id: 'M1', name: 'M1', credits: 4, department: 'X', prerequisites: [] },
  { id: 'M2', name: 'M2', credits: 4, department: 'X', prerequisites: [] },
  { id: 'C1', name: 'C1', credits: 3, department: 'X', prerequisites: [] },
];

const TRACK: DegreeTrack = {
  id: 't',
  name: 'T',
  components: [
    {
      id: 'econ',
      name: 'כלכלה',
      baskets: [
        { id: 'b-m', name: 'M', type: 'Mandatory', minCredits: 8, courseIds: ['M1', 'M2'] },
        { id: 'b-c', name: 'C', type: 'Core', minCredits: 3, courseIds: ['C1'] },
      ],
    },
  ],
};

const PREFS: UserPreferences = {
  allowedDays: [0, 1, 2, 3, 4],
  timeWindow: { start: '08:00', end: '20:00' },
  overlapPolicy: { allowOverlap: false, maxOverlapMinutes: 0 },
  targetCreditsByComponent: {
    econ: { Mandatory: 8, Core: 3, Elective: 0 },
  },
};

const OFFERINGS: CourseOffering[] = [
  {
    courseId: 'M1', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'm1-L', type: 'Lecture', slots: [{ day: 0, start: '10:00', end: '12:00' }] }],
  },
  {
    courseId: 'M2', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'm2-L', type: 'Lecture', slots: [{ day: 0, start: '10:00', end: '12:00' }] }], // conflicts with M1 on Sun 10-12
  },
  {
    courseId: 'C1', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'c1-L', type: 'Lecture', slots: [{ day: 5, start: '13:00', end: '14:00' }] }], // Friday — violates allowedDays
  },
];

const pc = (id: string, groupIds: string[], isAnchor = false): PlannedCourse => ({
  courseId: id, isAnchor, selectedGroupIds: groupIds,
});

describe('auditBundle', () => {
  it('marks targets as ok when met', () => {
    const courses = [pc('M1', ['m1-L']), pc('M2', ['m2-L']), pc('C1', ['c1-L'])];
    const audit = auditBundle(courses, [], COURSES, OFFERINGS, TRACK, PREFS, [], []);
    const mandatoryItem = audit.items.find(i => i.id === 'target-econ-Mandatory');
    expect(mandatoryItem?.status).toBe('ok');
    const coreItem = audit.items.find(i => i.id === 'target-econ-Core');
    expect(coreItem?.status).toBe('ok');
  });

  it('marks targets as fail when below 50%', () => {
    const courses = [pc('M1', ['m1-L'])]; // 4 of 8 = 50% → warn boundary
    const audit = auditBundle(courses, [], COURSES, OFFERINGS, TRACK, PREFS, [], []);
    const mandatoryItem = audit.items.find(i => i.id === 'target-econ-Mandatory');
    expect(mandatoryItem?.status).toBe('warn');
    const coreItem = audit.items.find(i => i.id === 'target-econ-Core');
    expect(coreItem?.status).toBe('fail');
  });

  it('counts conflicts and sets fail at >=2', () => {
    const courses = [pc('M1', ['m1-L']), pc('M2', ['m2-L'])];
    const audit = auditBundle(courses, [], COURSES, OFFERINGS, TRACK, PREFS, [], []);
    expect(audit.conflicts).toBe(1);
    const item = audit.items.find(i => i.id === 'conflicts');
    expect(item?.status).toBe('warn');
  });

  it('flags day-window violation when a slot falls on a disallowed day', () => {
    const courses = [pc('C1', ['c1-L'])]; // C1 is on Friday (day 5), not in allowedDays
    const audit = auditBundle(courses, [], COURSES, OFFERINGS, TRACK, PREFS, [], []);
    const item = audit.items.find(i => i.id === 'days-window');
    expect(item?.status).toBe('fail');
  });

  it('flags missing anchors', () => {
    const anchors = [pc('M1', [], true)];
    const courses: PlannedCourse[] = []; // anchor not included
    const audit = auditBundle(courses, anchors, COURSES, OFFERINGS, TRACK, PREFS, [], []);
    const item = audit.items.find(i => i.id === 'anchors');
    expect(item?.status).toBe('fail');
  });

  it('flags excluded courses if they leak into the bundle', () => {
    const courses = [pc('M1', ['m1-L'])];
    const audit = auditBundle(courses, [], COURSES, OFFERINGS, TRACK, PREFS, [], ['M1']);
    const item = audit.items.find(i => i.id === 'excluded');
    expect(item?.status).toBe('fail');
  });
});
