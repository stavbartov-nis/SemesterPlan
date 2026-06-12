import { Course, CourseOffering, DegreeTrack, RequirementBasket } from '../types';
import catalogData from './huji-catalog-2026.json';

/**
 * Real HUJI catalog (year 2026) — Bachelor's degree only.
 * Scraped via scripts/scrape-shnaton.js with sugToar='001' filter.
 *
 * The file name `huji-mock-catalog` is preserved for backwards
 * compatibility with existing imports; the data inside is real,
 * Hebrew-first (English in `nameEn`), and limited to undergraduate
 * courses, with one offering per semester a course runs in.
 */

interface CatalogCourse extends Course {
  /** From the Shnaton API. 1 = core/required-track, 2 = elective. */
  statusCourseCode: number | null;
}

interface CatalogJson {
  meta: {
    year: number;
    generated: string;
    filter: { degree: string };
    departments: string[];
    courseCount: number;
    offeringCount: number;
  };
  courses: CatalogCourse[];
  offerings: CourseOffering[];
}

const catalog = catalogData as CatalogJson;

export const MOCK_COURSES: Course[] = catalog.courses;
export const MOCK_OFFERINGS: CourseOffering[] = catalog.offerings;

/**
 * Offerings relevant to one planned semester. Annual courses meet in both
 * semesters, so they are always included. Guarantees at most one offering
 * per course for the engine's `offerings.find(...)` lookups.
 */
export function getOfferingsForSemester(semester: 'A' | 'B'): CourseOffering[] {
  const seen = new Set<string>();
  return catalog.offerings.filter((o) => {
    if (o.semester !== semester && o.semester !== 'Annual') return false;
    if (seen.has(o.courseId)) return false;
    seen.add(o.courseId);
    return true;
  });
}

// ─── Track: dual-major Economics + Business Administration ─────────────────
//
// Real requirements (faculty pages, June 2026):
//   Economics (דו-חוגי): 60 נ"ז = mandatory (40) + 8 ליבה + 8 בחירה + 4 חקר.
//   Business:            60 נ"ז = 31 חובה + 25 בחירה + 4 אבני פינה.
//   אבני פינה courses live outside both departments (not in this catalog).
//
// Classification: ליבה/חקר course lists below were derived from the Shnaton
// API `remark` field ("קורס ליבה…" / "קורס חקר…") and cross-checked against
// the department page; חובה vs בחירה falls back to statusCourseCode (1/2).

const offeredIds = new Set(MOCK_OFFERINGS.map((o) => o.courseId));

/** Economics ליבה courses (remark tagged "קורס ליבה"). */
const ECON_CORE = [
  '57002', '57010', '57020', '57104', '57133', '57253', '57311', '57466',
  '57467', '57495', '57506', '57510', '57552', '57554', '57654', '57807',
  '57893',
];

/** Economics קורסי חקר (remark tagged "קורס חקר"). */
const ECON_RESEARCH = [
  '57117', '57128', '57469', '57493', '57533', '57638', '57667', '57736',
];

/**
 * Business courses NOT taken in this dual-major combination (covered by the
 * Economics side): intro econ, math, intro statistics, research methods —
 * plus the zero-credit prep/participation courses.
 */
const BIZ_EXCLUDED = [
  '55701', '55702', // מבוא לכלכלה א'+ב'
  '55321', '55322', // מתמטיקה א'+ב'
  '55120', '55125', // מבוא לסטטיסטיקה א'+ב'
  '55518',          // שיטות מחקר במינהל עסקים
  '55005', '55117', // zero-credit prep / participation
];

function deptIds(department: string, filter: (c: CatalogCourse) => boolean): string[] {
  return catalog.courses
    .filter((c) => c.department === department && offeredIds.has(c.id) && filter(c))
    .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
    .map((c) => c.id);
}

const econCore     = new Set(ECON_CORE);
const econResearch = new Set(ECON_RESEARCH);
const bizExcluded  = new Set(BIZ_EXCLUDED);

const econBaskets: RequirementBasket[] = [
  {
    id: 'econ_mandatory',
    name: 'קורסי חובה',
    type: 'Mandatory',
    minCredits: 40,
    courseIds: deptIds('Economics', (c) =>
      c.statusCourseCode === 1 && !econCore.has(c.id) && !econResearch.has(c.id)),
  },
  {
    id: 'econ_core',
    name: 'קורסי ליבה',
    type: 'Core',
    minCredits: 8,
    courseIds: deptIds('Economics', (c) => econCore.has(c.id)),
  },
  {
    id: 'econ_research',
    name: 'קורס חקר',
    type: 'Core',
    minCredits: 4,
    courseIds: deptIds('Economics', (c) => econResearch.has(c.id)),
  },
  {
    id: 'econ_elective',
    name: 'קורסי בחירה',
    type: 'Elective',
    minCredits: 8,
    courseIds: deptIds('Economics', (c) =>
      c.statusCourseCode !== 1 && !econCore.has(c.id) && !econResearch.has(c.id)),
  },
];

const bizBaskets: RequirementBasket[] = [
  {
    id: 'biz_mandatory',
    name: 'קורסי חובה',
    type: 'Mandatory',
    minCredits: 31,
    courseIds: deptIds('Business Administration', (c) =>
      c.statusCourseCode === 1 && !bizExcluded.has(c.id)),
  },
  {
    id: 'biz_elective',
    name: 'קורסי בחירה',
    type: 'Elective',
    minCredits: 25,
    courseIds: deptIds('Business Administration', (c) =>
      c.statusCourseCode !== 1 && !bizExcluded.has(c.id)),
  },
];

export const MOCK_TRACKS: DegreeTrack[] = [
  {
    id: 'huji-ba-2026',
    name: 'כלכלה ומינהל עסקים (תואר ראשון 2026)',
    components: [
      { name: 'כלכלה', baskets: econBaskets },
      { name: 'מינהל עסקים', baskets: bizBaskets },
      {
        // אבני פינה are university-wide courses outside this catalog; the
        // empty list keeps the 4-credit requirement visible in progress UI.
        name: 'אבני פינה',
        baskets: [{
          id: 'cornerstones',
          name: 'אבני פינה (מחוץ לקטלוג)',
          type: 'Elective',
          minCredits: 4,
          courseIds: [],
        }],
      },
    ],
  },
];
