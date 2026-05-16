import { Course, CourseOffering, DegreeTrack } from '../types';

export const MOCK_COURSES: Course[] = [
  // Economics - Mandatory
  { id: '57107', name: 'Intro to Economics I (Micro)', credits: 4, department: 'Economics', prerequisites: [] },
  { id: '57108', name: 'Intro to Economics II (Macro)', credits: 4, department: 'Economics', prerequisites: ['57107'] },
  { id: '57121', name: 'Calculus for Economists A', credits: 6, department: 'Economics', prerequisites: [] },
  { id: '57122', name: 'Calculus for Economists B', credits: 6, department: 'Economics', prerequisites: ['57121'] },
  { id: '57127', name: 'Probability for Economists', credits: 4, department: 'Economics', prerequisites: ['57121'] },
  { id: '57128', name: 'Statistics for Economists', credits: 4, department: 'Economics', prerequisites: ['57127'] },

  // Economics - Core
  { id: '57111', name: 'Intermediate Macroeconomics I', credits: 4, department: 'Economics', prerequisites: ['57108'] },
  { id: '57112', name: 'Intermediate Macroeconomics II', credits: 4, department: 'Economics', prerequisites: ['57111'] },
  { id: '57307', name: 'Price Theory A (Micro I)', credits: 4, department: 'Economics', prerequisites: ['57107', '57122'] },
  { id: '57308', name: 'Price Theory B (Micro II)', credits: 4, department: 'Economics', prerequisites: ['57307'] },
  { id: '57322', name: 'Introduction to Econometrics', credits: 5, department: 'Economics', prerequisites: ['57307', '57128'] },
  { id: '57323', name: 'Econometrics Lab', credits: 1, department: 'Economics', prerequisites: ['57322'] },

  // Economics - Electives
  { id: '57401', name: 'Public Finance', credits: 4, department: 'Economics', prerequisites: ['57307'] },
  { id: '57405', name: 'Game Theory', credits: 4, department: 'Economics', prerequisites: ['57307'] },
  { id: '57555', name: 'Macroeconomics of the Middle East', credits: 2, department: 'Economics', prerequisites: ['57108'] },
  { id: '57521', name: 'Experimental Economics', credits: 4, department: 'Economics', prerequisites: ['57307'] },
  { id: '57601', name: 'Labor Economics', credits: 4, department: 'Economics', prerequisites: ['57307'] },
  { id: '57700', name: 'International Trade', credits: 4, department: 'Economics', prerequisites: ['57307'] },

  // Business - Mandatory
  { id: '304', name: 'Introduction to Management', credits: 4, department: 'Business', prerequisites: [] },
  
  // Business - Core
  { id: '113', name: 'Principles of Accounting', credits: 4, department: 'Business', prerequisites: [] },
  { id: '112', name: 'Principles of Marketing', credits: 4, department: 'Business', prerequisites: [] },
  { id: '114', name: 'Organizational Behavior', credits: 3, department: 'Business', prerequisites: [] },
  { id: '55600', name: 'Fundamentals of Finance', credits: 4, department: 'Business', prerequisites: ['57121', '57127'] },

  // Business - Electives
  { id: '123', name: 'Business Law', credits: 2, department: 'Business', prerequisites: [] },
  { id: '55800', name: 'Entrepreneurship and Innovation', credits: 3, department: 'Business', prerequisites: ['304'] },
  { id: '55900', name: 'Digital Marketing Strategy', credits: 3, department: 'Business', prerequisites: ['112'] },
  { id: '55100', name: 'Business Ethics', credits: 2, department: 'Business', prerequisites: [] },
  { id: '55200', name: 'Supply Chain Management', credits: 3, department: 'Business', prerequisites: ['304'] },
  { id: '55300', name: 'Investment Theory', credits: 4, department: 'Business', prerequisites: ['55600'] },
  { id: '55400', name: 'Consumer Behavior', credits: 3, department: 'Business', prerequisites: ['112'] },

  // CS (Existing)
  { id: '67101', name: 'Intro to CS', credits: 7, department: 'Computer Science', prerequisites: [] },
  { id: '67109', name: 'Data Structures', credits: 4, department: 'Computer Science', prerequisites: ['67101'] },
];

export const MOCK_OFFERINGS: CourseOffering[] = [
  // Economics Semester A
  {
    courseId: '57107', semester: 'A', campus: 'MtScopus',
    groups: [
      { id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '10:00', end: '12:00' }, { day: 2, start: '10:00', end: '12:00' }] },
      { id: 'L2', type: 'Lecture', slots: [{ day: 1, start: '14:00', end: '16:00' }, { day: 3, start: '14:00', end: '16:00' }] }
    ]
  },
  {
    courseId: '57121', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 1, start: '12:00', end: '14:00' }, { day: 3, start: '12:00', end: '14:00' }, { day: 4, start: '12:00', end: '14:00' }] }]
  },
  {
    courseId: '57127', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '12:00', end: '14:00' }, { day: 2, start: '12:00', end: '14:00' }] }]
  },
  {
    courseId: '57111', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '14:00', end: '16:00' }, { day: 2, start: '14:00', end: '16:00' }] }]
  },
  {
    courseId: '57307', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 1, start: '08:00', end: '10:00' }, { day: 3, start: '08:00', end: '10:00' }] }]
  },
  {
    courseId: '57322', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '16:00', end: '18:00' }, { day: 2, start: '16:00', end: '18:00' }] }]
  },
  {
    courseId: '57323', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'Lab', type: 'Lab', slots: [{ day: 4, start: '14:00', end: '16:00' }] }]
  },

  // Business Semester A
  {
    courseId: '304', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 4, start: '10:00', end: '13:00' }] }]
  },
  {
    courseId: '113', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '08:00', end: '11:00' }] }]
  },
  {
    courseId: '112', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 1, start: '10:00', end: '13:00' }] }]
  },
  {
    courseId: '55600', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 2, start: '15:00', end: '18:00' }] }]
  },
  {
    courseId: '55800', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 3, start: '16:00', end: '19:00' }] }]
  },

  // Electives Semester A
  {
    courseId: '57405', semester: 'A', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 4, start: '08:00', end: '11:00' }] }]
  },

  // CS Semester A
  {
    courseId: '67101', semester: 'A', campus: 'Safra',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 1, start: '10:00', end: '13:00' }] }]
  },

  // Semester B
  {
    courseId: '57108', semester: 'B', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '10:00', end: '12:00' }, { day: 2, start: '10:00', end: '12:00' }] }]
  },
  {
    courseId: '57122', semester: 'B', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 1, start: '12:00', end: '14:00' }, { day: 3, start: '12:00', end: '14:00' }, { day: 4, start: '12:00', end: '14:00' }] }]
  },
  {
    courseId: '57128', semester: 'B', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '12:00', end: '14:00' }, { day: 2, start: '12:00', end: '14:00' }] }]
  },
  {
    courseId: '57112', semester: 'B', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 0, start: '14:00', end: '16:00' }, { day: 2, start: '14:00', end: '16:00' }] }]
  },
  {
    courseId: '114', semester: 'B', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 1, start: '10:00', end: '13:00' }] }]
  },
  {
    courseId: '123', semester: 'B', campus: 'MtScopus',
    groups: [{ id: 'L1', type: 'Lecture', slots: [{ day: 3, start: '14:00', end: '16:00' }] }]
  }
];

export const MOCK_TRACKS: DegreeTrack[] = [
  {
    id: 'be',
    name: 'Business & Economics (Joint Plan)',
    components: [
      {
        name: 'Economics Component',
        baskets: [
          { 
            id: 'econ_mand', 
            name: 'Econ Mandatory', 
            type: 'Mandatory',
            minCredits: 28, 
            courseIds: ['57107', '57108', '57121', '57122', '57127', '57128'] 
          },
          { 
            id: 'econ_core', 
            name: 'Econ Core', 
            type: 'Core',
            minCredits: 22, 
            courseIds: ['57111', '57112', '57307', '57308', '57322', '57323'] 
          },
          { 
            id: 'econ_elec', 
            name: 'Econ Electives', 
            type: 'Elective',
            minCredits: 12, 
            courseIds: ['57401', '57405', '57555', '57521', '57601', '57700'] 
          },
        ]
      },
      {
        name: 'Business Component',
        baskets: [
          { 
            id: 'bus_mand', 
            name: 'Business Mandatory', 
            type: 'Mandatory',
            minCredits: 4, 
            courseIds: ['304'] 
          },
          { 
            id: 'bus_core', 
            name: 'Business Core', 
            type: 'Core',
            minCredits: 15, 
            courseIds: ['113', '112', '114', '55600'] 
          },
          { 
            id: 'bus_elec', 
            name: 'Business Electives', 
            type: 'Elective',
            minCredits: 10, 
            courseIds: ['123', '55800', '55900', '55100', '55200', '55300', '55400'] 
          },
        ]
      }
    ]
  },
  {
    id: 'cs',
    name: 'Computer Science (B.Sc.)',
    components: [
      {
        name: 'CS Core',
        baskets: [
          { 
            id: 'cs_mand', 
            name: 'Mandatory', 
            type: 'Mandatory',
            minCredits: 11, 
            courseIds: ['67101', '67109'] 
          },
        ]
      }
    ]
  }
];
