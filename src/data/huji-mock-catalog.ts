import { Course, CourseOffering, DegreeTrack, RequirementBasket } from '../types';
import catalogData from './huji-catalog-2026.json';

/**
 * Real HUJI catalog (year 2026) — Bachelor's degree only.
 * Scraped via scripts/scrape-shnaton.js with sugToar='001' filter.
 *
 * The file name `huji-mock-catalog` is preserved for backwards
 * compatibility with existing imports; the data inside is real,
 * English-first, and limited to undergraduate-level courses.
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

// ─── Track builder ─────────────────────────────────────────────────────────

const offeredIds = new Set(MOCK_OFFERINGS.map((o) => o.courseId));

/** Sum of credits across the given course IDs (only those with offerings). */
function totalCredits(ids: string[]): number {
  return ids.reduce((sum, id) => {
    const c = catalog.courses.find((x) => x.id === id);
    return sum + (c && offeredIds.has(id) ? c.credits : 0);
  }, 0);
}

/** All offered courses in a department filtered by statusCourseCode. */
function deptCoursesByStatus(department: string, status: number): string[] {
  return catalog.courses
    .filter(
      (c) =>
        c.department === department &&
        c.statusCourseCode === status &&
        offeredIds.has(c.id)
    )
    .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
    .map((c) => c.id);
}

/**
 * Build a single-component degree track for one department, split into
 * two baskets by statusCourseCode (1 = Core, 2 = Elective).
 */
function buildTrack(
  id: string,
  name: string,
  department: string,
  coreMinFraction = 0.5,
  electiveMinFraction = 0.3
): DegreeTrack {
  const coreIds = deptCoursesByStatus(department, 1);
  const electiveIds = deptCoursesByStatus(department, 2);

  const coreTotal = totalCredits(coreIds);
  const electiveTotal = totalCredits(electiveIds);

  const baskets: RequirementBasket[] = [
    {
      id: `${id}_core`,
      name: 'Core Courses',
      type: 'Core',
      minCredits: Math.round(coreTotal * coreMinFraction),
      courseIds: coreIds,
    },
    {
      id: `${id}_elec`,
      name: 'Electives',
      type: 'Elective',
      minCredits: Math.round(electiveTotal * electiveMinFraction),
      courseIds: electiveIds,
    },
  ];

  return {
    id,
    name,
    components: [{ name: department, baskets }],
  };
}

export const MOCK_TRACKS: DegreeTrack[] = [
  buildTrack('econ-2026', 'Economics (B.A. 2026)', 'Economics'),
  buildTrack(
    'biz-2026',
    'Business Administration (B.A. 2026)',
    'Business Administration'
  ),
];
