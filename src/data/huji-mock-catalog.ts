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

/**
 * Courses that belong to other programs (מכפיל etc.) — excluded from the
 * track AND stripped from prerequisite lists: the Shnaton requirement tree
 * is flattened OR→AND by the scraper, so an alternative-path course like
 * 57130 would otherwise permanently block its OR-siblings (e.g. תורת
 * המחירים lists "מתמטיקה רגילה או 57130" — flattened to both).
 */
const PROGRAM_EXCLUDED = ['57130']; // מתמטיקה לתלמידי מכפיל
const programExcluded = new Set(PROGRAM_EXCLUDED);

export const MOCK_COURSES: Course[] = catalog.courses.map((c) => ({
  ...c,
  prerequisites: c.prerequisites.filter((p) => !programExcluded.has(p)),
}));

/**
 * Prerequisite equivalence groups for the dual-major (Econ + BizAdmin) track.
 * The Shnaton scraper flattens OR-groups into AND, so courses like 55803
 * (Fundamentals of Finance) list BOTH the BizAdmin version AND the Econ
 * version of the same subject as prerequisites. For this joint degree a
 * student who completed the Econ variant satisfies the BizAdmin prereq and
 * vice versa.
 */
const PREREQ_EQUIV_GROUPS: string[][] = [
  ['55701', '57107'],          // מיקרו: BizAdmin ↔ Econ
  ['55120', '57340'],          // סטטיסטיקה א׳: BizAdmin ↔ Econ
  ['55321', '57121', '57122'], // מתמטיקה א׳: BizAdmin ↔ Econ A1/A2
];

const _prereqEquivMap = new Map<string, string[]>();
PREREQ_EQUIV_GROUPS.forEach(group => {
  group.forEach(id => {
    _prereqEquivMap.set(id, group.filter(other => other !== id));
  });
});

/** Returns true if prereqId is in completedIds OR any of its tracked equivalents is. */
export function satisfiesPrereq(prereqId: string, completedIds: readonly string[]): boolean {
  if (completedIds.includes(prereqId)) return true;
  return (_prereqEquivMap.get(prereqId) ?? []).some(e => completedIds.includes(e));
}
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
const econExcluded = programExcluded;
const bizExcluded  = new Set(BIZ_EXCLUDED);

/**
 * Recommended program year per חובה course (1=שנה א', 2=שנה ב', 3=שנה ג').
 * Not exposed by the Shnaton API — entered from the standard dual-major
 * program layout; verify against the official degree sheet.
 * ליבה/בחירה/חקר courses are taken across years 2-3 and stay unmapped.
 */
export const COURSE_YEAR: Record<string, 1 | 2 | 3> = {
  // כלכלה
  '57107': 1, '57108': 1, '57121': 1, '57122': 1, '57340': 1, '57341': 1,
  '57305': 2, '57307': 2, '57308': 2, '57322': 2,
  // מינהל עסקים
  '55102': 1, '55802': 1, '55312': 1,
  '55803': 2, '55804': 2, '55687': 2, '55945': 2, '55506': 2,
  '55510': 3, '55507': 3, '55529': 3,
};

const econBaskets: RequirementBasket[] = [
  {
    id: 'econ_mandatory',
    name: 'קורסי חובה',
    type: 'Mandatory',
    minCredits: 40,
    courseIds: deptIds('Economics', (c) =>
      c.statusCourseCode === 1 && !econCore.has(c.id) && !econResearch.has(c.id) &&
      !econExcluded.has(c.id)),
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
      c.statusCourseCode !== 1 && !econCore.has(c.id) && !econResearch.has(c.id) &&
      !econExcluded.has(c.id)),
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
      { id: 'econ', name: 'כלכלה', baskets: econBaskets },
      { id: 'biz', name: 'מינהל עסקים', baskets: bizBaskets },
      {
        // אבני פינה are university-wide courses outside this catalog; the
        // empty list keeps the 4-credit requirement visible in progress UI.
        id: 'cornerstones',
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
