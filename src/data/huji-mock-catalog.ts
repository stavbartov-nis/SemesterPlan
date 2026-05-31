import { Course, CourseOffering, DegreeTrack } from '../types';
import catalogData from './huji-catalog-2026.json';

/**
 * Real HUJI catalog (year 2026) — Economics + Business Administration.
 * Scraped via scripts/scrape-shnaton.js. The file name `huji-mock-catalog`
 * is preserved for backwards compatibility with existing imports; the
 * data inside is no longer mock.
 */

interface CatalogJson {
  meta: { year: number; generated: string; courseCount: number; offeringCount: number };
  courses: Course[];
  offerings: CourseOffering[];
}

const catalog = catalogData as CatalogJson;

export const MOCK_COURSES: Course[] = catalog.courses;
export const MOCK_OFFERINGS: CourseOffering[] = catalog.offerings;

const offeredIds = new Set(MOCK_OFFERINGS.map(o => o.courseId));
const has = (id: string) => offeredIds.has(id);
const onlyScheduled = (ids: string[]) => ids.filter(has);

/**
 * Real degree tracks built from the scraped catalog. Course IDs are
 * filtered to those actually offered in the current snapshot so the
 * planner only suggests courses it can place on the calendar.
 */
export const MOCK_TRACKS: DegreeTrack[] = [
  {
    id: 'econ-2026',
    name: 'Economics (B.A. 2026)',
    components: [
      {
        name: 'Economics',
        baskets: [
          {
            id: 'econ_mand',
            name: 'Mandatory Intro',
            type: 'Mandatory',
            minCredits: 20,
            courseIds: onlyScheduled([
              '57107', // Intro to Economics A (Micro)
              '57108', // Intro to Economics B (Macro)
              '57121', // Math for Economists A
              '57122', // Math for Economists B
              '57340', // Statistics for Economists A
            ]),
          },
          {
            id: 'econ_core',
            name: 'Core Theory',
            type: 'Core',
            minCredits: 16,
            courseIds: onlyScheduled([
              '57307', // Price Theory A
              '57308', // Price Theory B
              '57305', // Macroeconomics
              '57322', // Intro to Econometrics
              '57509', // Linear Algebra for Economists
              '57556', // Advanced Math for Economists
            ]),
          },
          {
            id: 'econ_elec',
            name: 'Economics Electives',
            type: 'Elective',
            minCredits: 12,
            courseIds: onlyScheduled([
              '57010', // Economics of Israel
              '57133', // Public Economics
              '57467', // Behavioural Economics
              '57554', // Game Theory
              '57654', // International Trade
              '57012', // Health Economics
              '57020', // Middle East Economy
              '57807', // Political Economy
              '57495', // Labor Economics
              '57496', // Issues in the Economics of the Firm
              '57400', // Issues in Israeli Economy
            ]),
          },
        ],
      },
    ],
  },
  {
    id: 'biz-2026',
    name: 'Business Administration (B.A. 2026)',
    components: [
      {
        name: 'Business',
        baskets: [
          {
            id: 'biz_mand',
            name: 'Mandatory Intro',
            type: 'Mandatory',
            minCredits: 10,
            courseIds: onlyScheduled([
              '55701', // Intro to Economics A (Micro) — Business version
              '55120', // Intro to Statistics A
            ]),
          },
          {
            id: 'biz_core',
            name: 'Core Topics',
            type: 'Core',
            minCredits: 10,
            courseIds: onlyScheduled([
              '55807', // Machine Learning and AI
              '55793', // Intro to Data Science
              '55939', // Operations Research 2
              '55650', // Intro to Financial Innovation and Fintech
              '55425', // Econometrics for Financial Econ
            ]),
          },
          {
            id: 'biz_elec',
            name: 'Business Electives',
            type: 'Elective',
            minCredits: 12,
            courseIds: onlyScheduled([
              '55543', // Human-AI Interactions for Managers
              '55971', // International Strategy
              '55899', // Innovative Investment Strategies
              '55696', // Impact Investments
              '55721', // Financial Innovations for Economic Development
              '55708', // Tools for Innovation and Entrepreneurship Development
              '55983', // Responsible AI
              '55982', // AI for the Public Good
              '55921', // New Product Policy
              '55809', // Auctions and Public Sales
            ]),
          },
        ],
      },
    ],
  },
];
